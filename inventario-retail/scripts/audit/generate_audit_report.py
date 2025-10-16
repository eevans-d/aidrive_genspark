#!/usr/bin/env python3
"""
Generate comprehensive audit reports from PostgreSQL audit tables

Usage:
    python generate_audit_report.py --period 24h --format html
    python generate_audit_report.py --period 7d --format json --output report.json
"""

import json
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import os

class AuditReportGenerator:
    def __init__(self, db_connection_string: str):
        self.conn = psycopg2.connect(db_connection_string)
        self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        self.report_data = {}
    
    def generate_summary_stats(self, period_hours: int) -> Dict[str, Any]:
        """Genera estadísticas resumidas del período"""
        query = """
        SELECT
            COUNT(*) as total_events,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_events,
            COUNT(DISTINCT DATE(event_timestamp)) as active_days,
            event_type,
            COUNT(*) as event_count
        FROM audit_log
        WHERE event_timestamp > NOW() - INTERVAL '%s hours'
        GROUP BY event_type
        ORDER BY event_count DESC;
        """
        
        self.cursor.execute(query, (period_hours,))
        results = self.cursor.fetchall()
        
        summary = {
            "period_hours": period_hours,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "total_events": sum(r['event_count'] for r in results) if results else 0,
            "unique_users": results[0]['unique_users'] if results else 0,
            "failed_events": results[0]['failed_events'] if results else 0,
            "event_breakdown": [
                {
                    "event_type": r["event_type"],
                    "count": r["event_count"]
                }
                for r in results
            ]
        }
        
        return summary
    
    def detect_anomalies(self, period_hours: int) -> List[Dict[str, Any]]:
        """Detecta anomalías en acceso a datos"""
        anomalies = []
        
        # Anomalía 1: Intentos de acceso fallidos repetidos
        query1 = """
        SELECT
            ip_address,
            user_id,
            COUNT(*) as failed_attempts,
            MIN(event_timestamp) as first_attempt,
            MAX(event_timestamp) as last_attempt
        FROM audit_log
        WHERE status = 'FAILED'
            AND event_timestamp > NOW() - INTERVAL '%s hours'
        GROUP BY ip_address, user_id
        HAVING COUNT(*) >= 5
        ORDER BY failed_attempts DESC
        LIMIT 20;
        """
        
        self.cursor.execute(query1, (period_hours,))
        failed_access = self.cursor.fetchall()
        
        for record in failed_access:
            anomalies.append({
                "type": "REPEATED_FAILED_ACCESS",
                "severity": "HIGH",
                "ip_address": record['ip_address'],
                "user_id": record['user_id'],
                "attempts": record['failed_attempts'],
                "first_attempt": record['first_attempt'].isoformat() + "Z",
                "last_attempt": record['last_attempt'].isoformat() + "Z",
                "recommendation": "Review for potential brute force attack"
            })
        
        # Anomalía 2: Acceso inusual a datos sensibles
        query2 = """
        WITH baseline AS (
            SELECT
                user_id,
                COUNT(*) as normal_count
            FROM audit_log
            WHERE event_timestamp > NOW() - INTERVAL '%s hours'
                AND event_timestamp < NOW() - INTERVAL '%s hours'
                AND resource_table IN ('system_config', 'encrypted_data_access_log')
            GROUP BY user_id
        ),
        recent AS (
            SELECT
                user_id,
                COUNT(*) as recent_count
            FROM audit_log
            WHERE event_timestamp > NOW() - INTERVAL '%s hours'
                AND resource_table IN ('system_config', 'encrypted_data_access_log')
            GROUP BY user_id
        )
        SELECT
            r.user_id,
            r.recent_count,
            COALESCE(b.normal_count, 0) as baseline_count,
            CASE 
                WHEN COALESCE(b.normal_count, 0) = 0 THEN 999
                ELSE ROUND((r.recent_count - COALESCE(b.normal_count, 0))::numeric / 
                          GREATEST(COALESCE(b.normal_count, 1), 1) * 100, 2)
            END as percent_increase
        FROM recent r
        LEFT JOIN baseline b ON r.user_id = b.user_id
        WHERE r.recent_count > COALESCE(b.normal_count, 0) * 2
        ORDER BY percent_increase DESC;
        """
        
        self.cursor.execute(query2, (period_hours*2, period_hours, period_hours))
        unusual_access = self.cursor.fetchall()
        
        for record in unusual_access:
            anomalies.append({
                "type": "UNUSUAL_SENSITIVE_DATA_ACCESS",
                "severity": "MEDIUM",
                "user_id": record['user_id'],
                "recent_accesses": record['recent_count'],
                "baseline_accesses": record['baseline_count'],
                "increase_percent": float(record['percent_increase']),
                "recommendation": "Verify if access is authorized"
            })
        
        return anomalies
    
    def generate_top_events(self, period_hours: int) -> List[Dict[str, Any]]:
        """Genera ranking de eventos más frecuentes"""
        query = """
        SELECT
            event_type,
            COUNT(*) as count,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failures
        FROM audit_log
        WHERE event_timestamp > NOW() - INTERVAL '%s hours'
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 10;
        """
        
        self.cursor.execute(query, (period_hours,))
        results = self.cursor.fetchall()
        
        return [
            {
                "rank": idx + 1,
                "event_type": r['event_type'],
                "total_count": r['count'],
                "unique_users": r['unique_users'],
                "failures": r['failures'],
                "failure_rate": round(r['failures'] / r['count'] * 100, 2) if r['count'] > 0 else 0
            }
            for idx, r in enumerate(results)
        ]
    
    def generate_user_activity(self, period_hours: int) -> List[Dict[str, Any]]:
        """Genera resumen de actividad por usuario"""
        query = """
        SELECT
            user_id,
            COUNT(*) as total_actions,
            COUNT(DISTINCT DATE(event_timestamp)) as active_days,
            COUNT(DISTINCT ip_address) as ip_addresses,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_actions,
            COUNT(DISTINCT event_type) as event_types,
            MAX(event_timestamp) as last_activity
        FROM audit_log
        WHERE event_timestamp > NOW() - INTERVAL '%s hours'
        GROUP BY user_id
        ORDER BY total_actions DESC
        LIMIT 20;
        """
        
        self.cursor.execute(query, (period_hours,))
        results = self.cursor.fetchall()
        
        return [
            {
                "user_id": r['user_id'],
                "total_actions": r['total_actions'],
                "active_days": r['active_days'],
                "ip_addresses": r['ip_addresses'],
                "failed_actions": r['failed_actions'],
                "event_types": r['event_types'],
                "last_activity": r['last_activity'].isoformat() + "Z" if r['last_activity'] else None
            }
            for r in results
        ]
    
    def generate_json_report(self, period_hours: int) -> Dict[str, Any]:
        """Genera reporte completo en formato JSON"""
        return {
            "metadata": {
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "period_hours": period_hours,
                "report_version": "1.0"
            },
            "summary": self.generate_summary_stats(period_hours),
            "top_events": self.generate_top_events(period_hours),
            "user_activity": self.generate_user_activity(period_hours),
            "anomalies": self.detect_anomalies(period_hours)
        }
    
    def generate_html_report(self, period_hours: int) -> str:
        """Genera reporte en formato HTML"""
        data = self.generate_json_report(period_hours)
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Audit Trail Report - {data['metadata']['generated_at']}</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 20px;
                    background-color: #f5f5f5;
                }}
                .header {{
                    background-color: #2c3e50;
                    color: white;
                    padding: 20px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }}
                .section {{
                    background-color: white;
                    padding: 20px;
                    margin-bottom: 20px;
                    border-radius: 5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                h2 {{
                    color: #2c3e50;
                    border-bottom: 3px solid #3498db;
                    padding-bottom: 10px;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }}
                th {{
                    background-color: #3498db;
                    color: white;
                    padding: 12px;
                    text-align: left;
                }}
                td {{
                    padding: 10px;
                    border-bottom: 1px solid #ddd;
                }}
                tr:hover {{
                    background-color: #f9f9f9;
                }}
                .critical {{
                    color: #e74c3c;
                    font-weight: bold;
                }}
                .warning {{
                    color: #f39c12;
                    font-weight: bold;
                }}
                .success {{
                    color: #27ae60;
                }}
                .stat-box {{
                    display: inline-block;
                    background-color: #ecf0f1;
                    padding: 15px 25px;
                    margin: 5px;
                    border-radius: 5px;
                    text-align: center;
                }}
                .stat-value {{
                    font-size: 24px;
                    font-weight: bold;
                    color: #2c3e50;
                }}
                .stat-label {{
                    font-size: 12px;
                    color: #7f8c8d;
                    margin-top: 5px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Audit Trail Report</h1>
                <p>Generated: {data['metadata']['generated_at']}</p>
                <p>Period: Last {period_hours} hours</p>
            </div>
            
            <div class="section">
                <h2>📈 Summary Statistics</h2>
                <div class="stat-box">
                    <div class="stat-value">{data['summary']['total_events']}</div>
                    <div class="stat-label">Total Events</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">{data['summary']['unique_users']}</div>
                    <div class="stat-label">Unique Users</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value class='critical'">{data['summary']['failed_events']}</div>
                    <div class="stat-label">Failed Events</div>
                </div>
            </div>
            
            <div class="section">
                <h2>🔝 Top Event Types</h2>
                <table>
                    <tr>
                        <th>Event Type</th>
                        <th>Count</th>
                        <th>Unique Users</th>
                        <th>Failures</th>
                        <th>Failure Rate</th>
                    </tr>
        """
        
        for event in data['top_events']:
            html += f"""
                    <tr>
                        <td>{event['event_type']}</td>
                        <td>{event['total_count']}</td>
                        <td>{event['unique_users']}</td>
                        <td class="critical">{event['failures']}</td>
                        <td>{event['failure_rate']}%</td>
                    </tr>
            """
        
        html += """
                </table>
            </div>
            
            <div class="section">
                <h2>👥 Top User Activity</h2>
                <table>
                    <tr>
                        <th>User ID</th>
                        <th>Total Actions</th>
                        <th>Active Days</th>
                        <th>IP Addresses</th>
                        <th>Failed Actions</th>
                    </tr>
        """
        
        for user in data['user_activity']:
            html += f"""
                    <tr>
                        <td>{user['user_id']}</td>
                        <td>{user['total_actions']}</td>
                        <td>{user['active_days']}</td>
                        <td>{user['ip_addresses']}</td>
                        <td class="warning">{user['failed_actions']}</td>
                    </tr>
            """
        
        html += """
                </table>
            </div>
        """
        
        if data['anomalies']:
            html += """
            <div class="section">
                <h2>⚠️ Detected Anomalies</h2>
                <table>
                    <tr>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Details</th>
                        <th>Recommendation</th>
                    </tr>
            """
            
            for anomaly in data['anomalies']:
                severity_class = "critical" if anomaly['severity'] == 'HIGH' else "warning"
                html += f"""
                    <tr>
                        <td>{anomaly['type']}</td>
                        <td class="{severity_class}">{anomaly['severity']}</td>
                        <td>{json.dumps(anomaly['user_id'] or anomaly['ip_address'], indent=2)}</td>
                        <td>{anomaly['recommendation']}</td>
                    </tr>
                """
            
            html += """
                </table>
            </div>
            """
        
        html += """
        </body>
        </html>
        """
        
        return html
    
    def save_report(self, report_content: str, filename: str, format_type: str) -> str:
        """Guarda el reporte en archivo"""
        reports_dir = Path("./audit_reports")
        reports_dir.mkdir(exist_ok=True)
        
        filepath = reports_dir / filename
        filepath.write_text(report_content)
        
        print(f"✅ Report saved: {filepath}")
        return str(filepath)
    
    def close(self):
        """Cierra conexión a BD"""
        self.cursor.close()
        self.conn.close()


def main():
    parser = argparse.ArgumentParser(
        description="Generate comprehensive audit reports"
    )
    parser.add_argument(
        "--period",
        type=str,
        default="24h",
        help="Period: 1h, 24h, 7d, 30d (default: 24h)"
    )
    parser.add_argument(
        "--format",
        type=str,
        choices=["json", "html"],
        default="html",
        help="Output format (default: html)"
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Output filename"
    )
    
    args = parser.parse_args()
    
    # Parsear período
    period_map = {"1h": 1, "24h": 24, "7d": 168, "30d": 720}
    period_hours = period_map.get(args.period, 24)
    
    # Conexión a BD
    db_conn = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/minimarket"
    )
    
    generator = AuditReportGenerator(db_conn)
    
    try:
        if args.format == "json":
            report_data = generator.generate_json_report(period_hours)
            content = json.dumps(report_data, indent=2, default=str)
            filename = args.output or f"audit_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        else:
            content = generator.generate_html_report(period_hours)
            filename = args.output or f"audit_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        
        filepath = generator.save_report(content, filename, args.format)
        print(f"Report format: {args.format}")
        print(f"Period: {args.period}")
        
    finally:
        generator.close()


if __name__ == "__main__":
    main()
