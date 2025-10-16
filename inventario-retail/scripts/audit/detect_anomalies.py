#!/usr/bin/env python3
"""
Detección de patrones de anomalía en logs de auditoría usando algoritmos estadísticos

Usage:
    python detect_anomalies.py --sensitivity high
    python detect_anomalies.py --method isolation_forest
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass, asdict
from collections import defaultdict
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import math
from scipy import stats
import numpy as np

@dataclass
class Anomaly:
    """Representación de una anomalía detectada"""
    detection_time: str
    anomaly_type: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    confidence: float  # 0.0-1.0
    affected_users: List[str]
    affected_ips: List[str]
    event_count: int
    baseline_expectation: str
    actual_observation: str
    recommendation: str
    detection_method: str


class AnomalyDetector:
    def __init__(self, db_connection_string: str, sensitivity: str = "medium"):
        """
        Inicializa detector de anomalías
        
        sensitivity: low, medium, high, critical
        """
        self.conn = psycopg2.connect(db_connection_string)
        self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        
        # Mapear sensibilidad a thresholds
        self.sensitivity = sensitivity
        self.thresholds = {
            "low": {"zscore": 2.0, "iqr_multiplier": 1.5},
            "medium": {"zscore": 2.5, "iqr_multiplier": 1.0},
            "high": {"zscore": 2.8, "iqr_multiplier": 0.75},
            "critical": {"zscore": 3.0, "iqr_multiplier": 0.5}
        }
        self.current_threshold = self.thresholds.get(sensitivity, self.thresholds["medium"])
        self.anomalies: List[Anomaly] = []
    
    def detect_brute_force_attempts(self, time_window_minutes: int = 60) -> List[Anomaly]:
        """Detecta intentos de ataque de fuerza bruta"""
        anomalies = []
        
        query = """
        SELECT
            ip_address,
            user_id,
            COUNT(*) as failed_count,
            COUNT(DISTINCT endpoint) as endpoint_count,
            MIN(event_timestamp) as first_attempt,
            MAX(event_timestamp) as last_attempt,
            json_agg(DISTINCT status_code) as status_codes
        FROM audit_log
        WHERE status = 'FAILED'
            AND event_timestamp > NOW() - INTERVAL '%s minutes'
        GROUP BY ip_address, user_id
        HAVING COUNT(*) >= 5
        """
        
        self.cursor.execute(query, (time_window_minutes,))
        results = self.cursor.fetchall()
        
        # Baseline: esperar máximo 2 intentos fallidos en 60min
        baseline_attempts = 2
        
        for record in results:
            if record['failed_count'] >= baseline_attempts * 3:
                severity = "CRITICAL" if record['failed_count'] >= 20 else "HIGH"
                confidence = min(1.0, record['failed_count'] / 30.0)
                
                anomalies.append(Anomaly(
                    detection_time=datetime.utcnow().isoformat() + "Z",
                    anomaly_type="BRUTE_FORCE_ATTACK",
                    severity=severity,
                    confidence=confidence,
                    affected_users=[record['user_id']] if record['user_id'] else [],
                    affected_ips=[record['ip_address']],
                    event_count=record['failed_count'],
                    baseline_expectation=f"{baseline_attempts} failed attempts",
                    actual_observation=f"{record['failed_count']} failed attempts",
                    recommendation="Block IP, review password policy, enable MFA",
                    detection_method="FREQUENCY_ANALYSIS"
                ))
        
        return anomalies
    
    def detect_unusual_access_times(self) -> List[Anomaly]:
        """Detecta accesos a horas inusuales (fuera de 09:00-17:00)"""
        anomalies = []
        
        # Buenos Aires timezone
        query = """
        WITH off_hours_access AS (
            SELECT
                user_id,
                COUNT(*) as access_count,
                COUNT(DISTINCT DATE(event_timestamp)) as days_accessed,
                json_agg(DISTINCT TO_CHAR(event_timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires', 'HH24:00')) as hours_accessed
            FROM audit_log
            WHERE (
                EXTRACT(HOUR FROM event_timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires') < 9
                OR EXTRACT(HOUR FROM event_timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires') > 17
            )
            OR EXTRACT(DOW FROM event_timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires') IN (0, 6)
            AND resource_table IN ('system_config', 'encrypted_data_access_log')
            AND event_timestamp > NOW() - INTERVAL '7 days'
            GROUP BY user_id
        ),
        normal_hours_access AS (
            SELECT
                user_id,
                COUNT(*) as normal_access_count
            FROM audit_log
            WHERE EXTRACT(HOUR FROM event_timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN 9 AND 17
            AND EXTRACT(DOW FROM event_timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires') NOT IN (0, 6)
            AND resource_table IN ('system_config', 'encrypted_data_access_log')
            AND event_timestamp > NOW() - INTERVAL '7 days'
            GROUP BY user_id
        )
        SELECT
            o.user_id,
            o.access_count,
            o.days_accessed,
            COALESCE(n.normal_access_count, 0) as normal_access_count,
            CASE 
                WHEN COALESCE(n.normal_access_count, 0) = 0 THEN 100
                ELSE ROUND(o.access_count::numeric / (o.access_count + COALESCE(n.normal_access_count, 0)) * 100, 2)
            END as off_hours_percentage
        FROM off_hours_access o
        LEFT JOIN normal_hours_access n ON o.user_id = n.user_id
        WHERE (COALESCE(n.normal_access_count, 0) = 0 OR o.access_count > COALESCE(n.normal_access_count, 0))
        """
        
        self.cursor.execute(query)
        results = self.cursor.fetchall()
        
        for record in results:
            if record['off_hours_percentage'] > 50:
                severity = "HIGH" if record['off_hours_percentage'] > 80 else "MEDIUM"
                confidence = record['off_hours_percentage'] / 100.0
                
                anomalies.append(Anomaly(
                    detection_time=datetime.utcnow().isoformat() + "Z",
                    anomaly_type="UNUSUAL_ACCESS_TIME",
                    severity=severity,
                    confidence=confidence,
                    affected_users=[record['user_id']],
                    affected_ips=[],
                    event_count=record['access_count'],
                    baseline_expectation="Access during 09:00-17:00 weekdays",
                    actual_observation=f"{record['off_hours_percentage']}% access outside normal hours",
                    recommendation="Review if access is authorized, verify user schedule",
                    detection_method="TIME_PATTERN_ANALYSIS"
                ))
        
        return anomalies
    
    def detect_data_exfiltration(self) -> List[Anomaly]:
        """Detecta posible exfiltración de datos (acceso masivo)"""
        anomalies = []
        
        query = """
        WITH user_export_stats AS (
            SELECT
                user_id,
                COUNT(*) as export_count,
                SUM(rows_affected) as total_rows_exported,
                COUNT(DISTINCT endpoint) as endpoints_used,
                json_agg(DISTINCT ip_address) as ip_addresses
            FROM audit_log
            WHERE event_type IN ('DATA_EXPORT', 'SENSITIVE_DATA_READ')
            AND event_timestamp > NOW() - INTERVAL '24 hours'
            GROUP BY user_id
        ),
        user_baselines AS (
            SELECT
                user_id,
                AVG(export_count) as avg_daily_exports,
                PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY export_count) as q3_exports
            FROM (
                SELECT
                    user_id,
                    DATE(event_timestamp) as export_date,
                    COUNT(*) as export_count
                FROM audit_log
                WHERE event_type IN ('DATA_EXPORT', 'SENSITIVE_DATA_READ')
                AND event_timestamp > NOW() - INTERVAL '30 days'
                GROUP BY user_id, DATE(event_timestamp)
            ) daily_exports
            GROUP BY user_id
        )
        SELECT
            s.user_id,
            s.export_count,
            s.total_rows_exported,
            s.endpoints_used,
            COALESCE(b.avg_daily_exports, 0) as baseline_daily,
            COALESCE(b.q3_exports, 0) as q3_baseline
        FROM user_export_stats s
        LEFT JOIN user_baselines b ON s.user_id = b.user_id
        WHERE s.export_count > COALESCE(b.q3_exports, 0) * 3
           OR s.total_rows_exported > 10000
        ORDER BY s.total_rows_exported DESC
        """
        
        self.cursor.execute(query)
        results = self.cursor.fetchall()
        
        for record in results:
            severity = "CRITICAL" if record['total_rows_exported'] > 50000 else "HIGH"
            confidence = min(1.0, (record['export_count'] / max(record['q3_baseline'], 1)) / 5.0)
            
            anomalies.append(Anomaly(
                detection_time=datetime.utcnow().isoformat() + "Z",
                anomaly_type="POSSIBLE_DATA_EXFILTRATION",
                severity=severity,
                confidence=min(confidence, 1.0),
                affected_users=[record['user_id']],
                affected_ips=[],
                event_count=record['export_count'],
                baseline_expectation=f"{record['q3_baseline']:.0f} daily exports",
                actual_observation=f"{record['total_rows_exported']:,} rows exported in 24h",
                recommendation="Immediate investigation required, suspend account access",
                detection_method="VOLUME_ANOMALY_DETECTION"
            ))
        
        return anomalies
    
    def detect_privilege_escalation(self) -> List[Anomaly]:
        """Detecta intentos de escalación de privilegios"""
        anomalies = []
        
        query = """
        SELECT
            user_id,
            COUNT(*) as escalation_attempts,
            COUNT(DISTINCT role) as roles_accessed,
            json_agg(DISTINCT role) as roles,
            MIN(event_timestamp) as first_attempt
        FROM audit_log_permissions
        WHERE action = 'GRANT_ROLE'
            AND event_timestamp > NOW() - INTERVAL '7 days'
        GROUP BY user_id
        HAVING COUNT(*) >= 3
        """
        
        self.cursor.execute(query)
        results = self.cursor.fetchall()
        
        restricted_roles = ['admin', 'root', 'dba', 'system_admin']
        
        for record in results:
            if record['roles_accessed'] >= 2:
                severity = "CRITICAL" if any(r in record['roles'] for r in restricted_roles) else "HIGH"
                confidence = 0.9
                
                anomalies.append(Anomaly(
                    detection_time=datetime.utcnow().isoformat() + "Z",
                    anomaly_type="PRIVILEGE_ESCALATION_ATTEMPT",
                    severity=severity,
                    confidence=confidence,
                    affected_users=[record['user_id']],
                    affected_ips=[],
                    event_count=record['escalation_attempts'],
                    baseline_expectation="Users maintain assigned roles",
                    actual_observation=f"Attempted access to {record['roles_accessed']} roles",
                    recommendation="Investigate user account, disable if unauthorized",
                    detection_method="PERMISSION_PATTERN_ANALYSIS"
                ))
        
        return anomalies
    
    def detect_encryption_anomalies(self) -> List[Anomaly]:
        """Detecta anomalías en operaciones de encriptación"""
        anomalies = []
        
        # Detectar fallos de encriptación
        query = """
        SELECT
            COUNT(*) as failure_count,
            COUNT(DISTINCT user_id) as affected_users,
            json_agg(DISTINCT user_id) as user_ids,
            json_agg(DISTINCT error_type) as error_types
        FROM audit_log_errors
        WHERE error_type LIKE 'ENCRYPTION%'
            AND occurred_at > NOW() - INTERVAL '24 hours'
        """
        
        self.cursor.execute(query)
        results = self.cursor.fetchall()
        
        if results and results[0]['failure_count'] and results[0]['failure_count'] > 3:
            record = results[0]
            anomalies.append(Anomaly(
                detection_time=datetime.utcnow().isoformat() + "Z",
                anomaly_type="ENCRYPTION_FAILURES",
                severity="CRITICAL",
                confidence=0.95,
                affected_users=record['user_ids'] or [],
                affected_ips=[],
                event_count=record['failure_count'],
                baseline_expectation="0 encryption failures",
                actual_observation=f"{record['failure_count']} encryption failures",
                recommendation="Check encryption service health, review logs, notify security team",
                detection_method="ERROR_PATTERN_ANALYSIS"
            ))
        
        return anomalies
    
    def detect_geo_anomalies(self) -> List[Anomaly]:
        """Detecta accesos desde ubicaciones geográficamente imposibles"""
        anomalies = []
        
        # Nota: Requiere integración con servicio de geolocalización
        # Este es un stub que puede implementarse con MaxMind GeoIP o similar
        
        query = """
        WITH user_locations AS (
            SELECT
                user_id,
                ip_address,
                COUNT(*) as access_count,
                MAX(event_timestamp) as last_access
            FROM audit_log
            WHERE event_timestamp > NOW() - INTERVAL '24 hours'
            GROUP BY user_id, ip_address
        )
        SELECT
            user_id,
            COUNT(DISTINCT ip_address) as ip_count,
            json_agg(DISTINCT ip_address) as ip_addresses
        FROM user_locations
        GROUP BY user_id
        HAVING COUNT(DISTINCT ip_address) > 5
        """
        
        self.cursor.execute(query)
        results = self.cursor.fetchall()
        
        for record in results:
            if record['ip_count'] > 10:
                anomalies.append(Anomaly(
                    detection_time=datetime.utcnow().isoformat() + "Z",
                    anomaly_type="UNUSUAL_GEO_LOCATION",
                    severity="MEDIUM",
                    confidence=0.7,
                    affected_users=[record['user_id']],
                    affected_ips=record['ip_addresses'],
                    event_count=record['ip_count'],
                    baseline_expectation="Access from 1-2 IP addresses",
                    actual_observation=f"Access from {record['ip_count']} different IPs",
                    recommendation="Verify if user changed location or if account is compromised",
                    detection_method="GEO_LOCATION_ANALYSIS"
                ))
        
        return anomalies
    
    def run_all_detections(self) -> List[Anomaly]:
        """Ejecuta todos los detectores de anomalía"""
        all_anomalies = []
        
        print("🔍 Running anomaly detection suite...")
        print("  ├─ Brute force attempts...")
        all_anomalies.extend(self.detect_brute_force_attempts())
        
        print("  ├─ Unusual access times...")
        all_anomalies.extend(self.detect_unusual_access_times())
        
        print("  ├─ Data exfiltration...")
        all_anomalies.extend(self.detect_data_exfiltration())
        
        print("  ├─ Privilege escalation...")
        all_anomalies.extend(self.detect_privilege_escalation())
        
        print("  ├─ Encryption anomalies...")
        all_anomalies.extend(self.detect_encryption_anomalies())
        
        print("  └─ Geographic anomalies...")
        all_anomalies.extend(self.detect_geo_anomalies())
        
        self.anomalies = all_anomalies
        return all_anomalies
    
    def generate_alert_file(self, filename: str = "audit_alerts.json") -> str:
        """Genera archivo de alertas para ser consumido por Prometheus/Grafana"""
        alerts_dir = Path("./audit_alerts")
        alerts_dir.mkdir(exist_ok=True)
        
        alert_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "total_anomalies": len(self.anomalies),
            "by_severity": {
                "CRITICAL": len([a for a in self.anomalies if a.severity == "CRITICAL"]),
                "HIGH": len([a for a in self.anomalies if a.severity == "HIGH"]),
                "MEDIUM": len([a for a in self.anomalies if a.severity == "MEDIUM"]),
                "LOW": len([a for a in self.anomalies if a.severity == "LOW"])
            },
            "alerts": [asdict(a) for a in self.anomalies]
        }
        
        filepath = alerts_dir / filename
        with open(filepath, 'w') as f:
            json.dump(alert_data, f, indent=2, default=str)
        
        print(f"✅ Alerts saved to: {filepath}")
        return str(filepath)
    
    def close(self):
        """Cierra conexión a BD"""
        self.cursor.close()
        self.conn.close()


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Detect anomalies in audit logs"
    )
    parser.add_argument(
        "--sensitivity",
        type=str,
        choices=["low", "medium", "high", "critical"],
        default="medium",
        help="Detection sensitivity (default: medium)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="audit_alerts.json",
        help="Output filename"
    )
    
    args = parser.parse_args()
    
    db_conn = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/minimarket"
    )
    
    detector = AnomalyDetector(db_conn, sensitivity=args.sensitivity)
    
    try:
        anomalies = detector.run_all_detections()
        
        print(f"\n📊 Detection Results:")
        print(f"   Total anomalies found: {len(anomalies)}")
        
        severity_counts = defaultdict(int)
        for anomaly in anomalies:
            severity_counts[anomaly.severity] += 1
        
        for severity in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
            count = severity_counts.get(severity, 0)
            if count > 0:
                emoji = "🔴" if severity == "CRITICAL" else "🟠" if severity == "HIGH" else "🟡"
                print(f"   {emoji} {severity}: {count}")
        
        filepath = detector.generate_alert_file(args.output)
        print(f"\n✅ Anomaly detection complete")
        print(f"   Alerts saved to: {filepath}")
        
    finally:
        detector.close()


if __name__ == "__main__":
    main()
