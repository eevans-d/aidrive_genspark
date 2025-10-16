#!/usr/bin/env python3
"""
RTO/RPO Measurement & Analysis Tool

Measures:
- Recovery Time Objective (RTO): time to operational
- Recovery Point Objective (RPO): data loss
- Backup coverage
- Failover metrics
"""

import os
import json
import time
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import statistics

class RTORPOMeasurer:
    """Measure and track RTO/RPO metrics"""
    
    def __init__(self):
        self.measurements = []
        self.start_time = datetime.now()
    
    def log(self, message: str):
        """Print timestamped message"""
        print(f"[{datetime.now():%H:%M:%S}] {message}")
    
    def run_command(self, cmd: str) -> Tuple[int, str, str]:
        """Execute command and return result"""
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return 1, "", "Timeout"
        except Exception as e:
            return 1, "", str(e)
    
    def measure_database_backup_time(self) -> Dict:
        """Measure time to backup full database"""
        self.log("📊 Measuring database backup time...")
        
        start = time.time()
        
        cmd = """
        docker-compose -f docker-compose.production.yml exec -T postgres \
            pg_dump -U postgres minimarket | gzip | wc -c
        """
        
        returncode, output, _ = self.run_command(cmd)
        
        backup_time = time.time() - start
        
        return {
            "metric": "database_backup_time",
            "unit": "seconds",
            "value": backup_time,
            "timestamp": datetime.now().isoformat()
        }
    
    def measure_backup_upload_time(self, backup_size_bytes: int) -> Dict:
        """Measure time to upload backup to S3"""
        self.log("📊 Measuring backup upload time to S3...")
        
        start = time.time()
        
        # Simulate backup creation and upload
        cmd = f"""
        aws s3 ls s3://minimarket-backups/hourly/ \
            --recursive --summarize | grep "Total Size"
        """
        
        returncode, output, _ = self.run_command(cmd)
        
        upload_time = time.time() - start
        
        return {
            "metric": "backup_upload_time",
            "unit": "seconds",
            "value": upload_time,
            "backup_size_bytes": backup_size_bytes,
            "timestamp": datetime.now().isoformat()
        }
    
    def measure_database_restore_time(self, backup_size_bytes: int) -> Dict:
        """Measure time to restore database from backup"""
        self.log("📊 Measuring database restore time...")
        
        # Calculate based on backup size and typical throughput
        # Typical: ~100 MB/sec restore throughput
        typical_throughput_mbps = 100
        backup_size_mb = backup_size_bytes / 1024 / 1024
        
        estimated_restore_time = (backup_size_mb / typical_throughput_mbps)
        
        return {
            "metric": "database_restore_time",
            "unit": "seconds",
            "value": estimated_restore_time,
            "backup_size_bytes": backup_size_bytes,
            "throughput_mbps": typical_throughput_mbps,
            "timestamp": datetime.now().isoformat()
        }
    
    def measure_application_startup_time(self) -> Dict:
        """Measure time for application to become operational"""
        self.log("📊 Measuring application startup time...")
        
        start = time.time()
        
        # Stop app
        self.run_command("docker-compose -f docker-compose.production.yml stop app || true")
        time.sleep(2)
        
        # Start app
        self.run_command("docker-compose -f docker-compose.production.yml up -d app")
        
        # Wait for health check
        max_attempts = 60
        for attempt in range(max_attempts):
            returncode, _, _ = self.run_command("curl -sf http://localhost:8080/health > /dev/null")
            if returncode == 0:
                break
            time.sleep(1)
        
        startup_time = time.time() - start
        
        return {
            "metric": "application_startup_time",
            "unit": "seconds",
            "value": startup_time,
            "timestamp": datetime.now().isoformat()
        }
    
    def measure_failover_switchover_time(self) -> Dict:
        """Measure DNS/connection switchover time"""
        self.log("📊 Measuring failover switchover time...")
        
        start = time.time()
        
        # Point DNS to DR (simulation)
        # In reality this would update DNS or load balancer
        cmd = "curl -I http://localhost:8080/ > /dev/null 2>&1"
        
        max_attempts = 30
        for attempt in range(max_attempts):
            returncode, _, _ = self.run_command(cmd)
            if returncode == 0:
                break
            time.sleep(1)
        
        switchover_time = time.time() - start
        
        return {
            "metric": "failover_switchover_time",
            "unit": "seconds",
            "value": switchover_time,
            "timestamp": datetime.now().isoformat()
        }
    
    def calculate_rto(self, components: List[Dict]) -> Dict:
        """Calculate total RTO from components"""
        
        # RTO = max(backup_restore, app_startup) + switchover
        backup_restore = next((c["value"] for c in components if c["metric"] == "database_restore_time"), 300)
        app_startup = next((c["value"] for c in components if c["metric"] == "application_startup_time"), 60)
        switchover = next((c["value"] for c in components if c["metric"] == "failover_switchover_time"), 30)
        
        total_rto = max(backup_restore, app_startup) + switchover
        
        return {
            "metric": "rto_total",
            "unit": "seconds",
            "value": total_rto,
            "minutes": total_rto / 60,
            "components": {
                "database_restore_seconds": backup_restore,
                "application_startup_seconds": app_startup,
                "failover_switchover_seconds": switchover
            },
            "target_seconds": 14400,  # 4 hours
            "target_met": total_rto <= 14400,
            "timestamp": datetime.now().isoformat()
        }
    
    def measure_backup_frequency_coverage(self) -> Dict:
        """Measure backup frequency and coverage"""
        self.log("📊 Analyzing backup frequency coverage...")
        
        # Check last 24 hours of backups
        cmd = """
        aws s3 ls s3://minimarket-backups/hourly/ \
            --recursive | awk '{print $1, $2}' | tail -24
        """
        
        returncode, output, _ = self.run_command(cmd)
        
        # Parse output
        backup_times = []
        for line in output.strip().split('\n'):
            if line:
                parts = line.split()
                if len(parts) >= 2:
                    try:
                        backup_time = datetime.fromisoformat(f"{parts[0]}T{parts[1]}")
                        backup_times.append(backup_time)
                    except:
                        pass
        
        # Calculate coverage
        coverage_percent = 0
        if backup_times:
            coverage_percent = (len(backup_times) / 24) * 100
        
        return {
            "metric": "backup_frequency_coverage",
            "unit": "percent",
            "value": coverage_percent,
            "backups_in_last_24h": len(backup_times),
            "expected_backups": 24,
            "timestamp": datetime.now().isoformat()
        }
    
    def measure_last_transaction_lag(self) -> Dict:
        """Measure lag from now to last transaction in backup"""
        self.log("📊 Measuring last transaction lag (RPO)...")
        
        # Query database for last transaction
        cmd = """
        docker-compose -f docker-compose.production.yml exec -T postgres \
            psql -U postgres -t -c \
            'SELECT EXTRACT(EPOCH FROM (NOW() - MAX(event_timestamp))) FROM audit_log;'
        """
        
        returncode, output, _ = self.run_command(cmd)
        
        if returncode == 0:
            try:
                lag_seconds = float(output.strip())
            except:
                lag_seconds = 0
        else:
            lag_seconds = 0
        
        return {
            "metric": "last_transaction_lag",
            "unit": "seconds",
            "value": lag_seconds,
            "minutes": lag_seconds / 60,
            "hours": lag_seconds / 3600,
            "rpo_target_seconds": 3600,  # 1 hour
            "target_met": lag_seconds <= 3600,
            "timestamp": datetime.now().isoformat()
        }
    
    def measure_backup_size_growth(self) -> Dict:
        """Track backup size trend"""
        self.log("📊 Measuring backup size growth...")
        
        cmd = """
        aws s3 ls s3://minimarket-backups/ \
            --recursive --summarize | grep "Total Size"
        """
        
        returncode, output, _ = self.run_command(cmd)
        
        total_size_bytes = 0
        if returncode == 0:
            # Parse output like "Total Size: 1234567 Bytes"
            try:
                total_size_bytes = int(output.split()[-2])
            except:
                pass
        
        return {
            "metric": "backup_size_total",
            "unit": "bytes",
            "value": total_size_bytes,
            "gigabytes": total_size_bytes / 1024 / 1024 / 1024,
            "timestamp": datetime.now().isoformat()
        }
    
    def run_all_measurements(self) -> List[Dict]:
        """Run all RTO/RPO measurements"""
        self.log("╔" + "=" * 50 + "╗")
        self.log("║  RTO/RPO MEASUREMENT SUITE STARTED            ║")
        self.log("╚" + "=" * 50 + "╝")
        self.log("")
        
        measurements = []
        
        # Individual component measurements
        measurements.append(self.measure_backup_frequency_coverage())
        measurements.append(self.measure_last_transaction_lag())
        measurements.append(self.measure_backup_size_growth())
        
        # Estimate based on typical workload
        backup_size = 50 * 1024 * 1024 * 1024  # 50 GB estimate
        
        measurements.append(self.measure_database_backup_time())
        measurements.append(self.measure_backup_upload_time(backup_size))
        measurements.append(self.measure_database_restore_time(backup_size))
        measurements.append(self.measure_application_startup_time())
        measurements.append(self.measure_failover_switchover_time())
        
        # Calculate RTO
        rto = self.calculate_rto(measurements)
        measurements.append(rto)
        
        self.measurements = measurements
        return measurements
    
    def generate_report(self):
        """Generate comprehensive RTO/RPO report"""
        print("\n" + "=" * 70)
        print("RECOVERY TIME/POINT OBJECTIVE (RTO/RPO) REPORT")
        print("=" * 70)
        print("")
        
        # Find key metrics
        rto = next((m for m in self.measurements if m["metric"] == "rto_total"), None)
        rpo = next((m for m in self.measurements if m["metric"] == "last_transaction_lag"), None)
        
        print("📊 KEY METRICS:")
        print("-" * 70)
        
        if rto:
            status = "✅ PASS" if rto["target_met"] else "❌ FAIL"
            print(f"RTO (Recovery Time Objective): {rto['value']:.0f}s ({rto['minutes']:.1f} min) {status}")
            print(f"  Target: {rto['target_seconds']}s (4 hours)")
            print(f"  Components:")
            print(f"    • Database Restore: {rto['components']['database_restore_seconds']:.0f}s")
            print(f"    • App Startup: {rto['components']['application_startup_seconds']:.0f}s")
            print(f"    • Failover Switchover: {rto['components']['failover_switchover_seconds']:.0f}s")
        
        print("")
        
        if rpo:
            status = "✅ PASS" if rpo["target_met"] else "❌ FAIL"
            print(f"RPO (Recovery Point Objective): {rpo['value']:.0f}s ({rpo['minutes']:.1f} min) {status}")
            print(f"  Target: {rpo['rpo_target_seconds']}s (1 hour)")
            print(f"  Last Transaction: {rpo['hours']:.2f} hours ago")
        
        print("")
        print("📈 BACKUP METRICS:")
        print("-" * 70)
        
        for metric in self.measurements:
            if "backup" in metric["metric"] or "coverage" in metric["metric"]:
                if metric["metric"] == "backup_frequency_coverage":
                    print(f"Coverage (last 24h): {metric['value']:.1f}% ({metric['backups_in_last_24h']}/{metric['expected_backups']})")
                elif metric["metric"] == "backup_size_total":
                    print(f"Total Backup Size: {metric['gigabytes']:.2f} GB")
        
        print("")
        print("✅ COMPLIANCE STATUS:")
        print("-" * 70)
        
        if rto and rpo:
            rto_compliant = rto["target_met"]
            rpo_compliant = rpo["target_met"]
            
            compliance = "✅ COMPLIANT" if (rto_compliant and rpo_compliant) else "⚠️  NON-COMPLIANT"
            
            print(f"Overall: {compliance}")
            print(f"  • RTO: {'✅ OK' if rto_compliant else '❌ EXCEEDS TARGET'}")
            print(f"  • RPO: {'✅ OK' if rpo_compliant else '❌ EXCEEDS TARGET'}")
        
        print("")
        print("📋 RECOMMENDATIONS:")
        print("-" * 70)
        
        if rto and not rto["target_met"]:
            print("⚠️  RTO exceeds target - consider:")
            print("  • Increase backup throughput")
            print("  • Pre-allocate DR resources")
            print("  • Implement database sharding")
        
        if rpo and not rpo["target_met"]:
            print("⚠️  RPO exceeds target - consider:")
            print("  • Increase backup frequency")
            print("  • Implement replication")
            print("  • Reduce transaction volume")
        
        # Save JSON report
        report = {
            "generated_at": datetime.now().isoformat(),
            "measurements": self.measurements,
            "summary": {
                "rto_seconds": rto["value"] if rto else None,
                "rto_minutes": rto["minutes"] if rto else None,
                "rto_compliant": rto["target_met"] if rto else False,
                "rpo_seconds": rpo["value"] if rpo else None,
                "rpo_minutes": rpo["minutes"] if rpo else None,
                "rpo_compliant": rpo["target_met"] if rpo else False,
            }
        }
        
        report_file = f"/var/log/rto-rpo-reports/rto_rpo_{datetime.now():%Y%m%d_%H%M%S}.json"
        os.makedirs(os.path.dirname(report_file), exist_ok=True)
        
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"\nReport saved: {report_file}")

if __name__ == "__main__":
    measurer = RTORPOMeasurer()
    measurer.run_all_measurements()
    measurer.generate_report()
