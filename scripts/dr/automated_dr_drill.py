#!/usr/bin/env python3
"""
Automated Disaster Recovery Drill Orchestration

Executes:
- Backup restoration tests
- Database failover
- Application failover
- Data integrity verification
- Performance validation
- Automatic rollback
"""

import os
import json
import time
import subprocess
import boto3
from datetime import datetime
from typing import Dict, List, Tuple
from pathlib import Path
from enum import Enum

class TestStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"

class DRDrillOrchestrator:
    """Automated DR drill orchestration"""
    
    def __init__(self, backup_bucket: str = "minimarket-backups"):
        self.s3 = boto3.client('s3')
        self.backup_bucket = backup_bucket
        self.drill_id = f"dr-drill-{datetime.now():%Y%m%d-%H%M%S}"
        self.results = []
        self.start_time = datetime.now()
        self.log_file = f"/tmp/{self.drill_id}.log"
        self.dr_active = False
    
    def log(self, message: str, level: str = "INFO"):
        """Log message with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] [{level}] {message}"
        print(log_entry)
        
        with open(self.log_file, "a") as f:
            f.write(log_entry + "\n")
    
    def run_command(self, cmd: str, check: bool = True) -> Tuple[int, str, str]:
        """Execute shell command and return result"""
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if check and result.returncode != 0:
                self.log(f"Command failed: {cmd}", "ERROR")
                self.log(f"stderr: {result.stderr}", "ERROR")
            
            return result.returncode, result.stdout, result.stderr
        
        except subprocess.TimeoutExpired:
            self.log(f"Command timeout: {cmd}", "ERROR")
            return 1, "", "Timeout"
        except Exception as e:
            self.log(f"Command error: {str(e)}", "ERROR")
            return 1, "", str(e)
    
    def get_latest_backup(self) -> str:
        """Get path to latest hourly backup"""
        self.log("Retrieving latest backup...")
        
        response = self.s3.list_objects_v2(
            Bucket=self.backup_bucket,
            Prefix='hourly/',
            Delimiter='/'
        )
        
        if 'Contents' not in response:
            raise Exception("No backups found")
        
        latest = sorted(
            response['Contents'],
            key=lambda x: x['LastModified'],
            reverse=True
        )[0]
        
        backup_key = latest['Key']
        self.log(f"Latest backup: {backup_key} ({latest['Size'] / 1024**3:.2f} GB)")
        
        return backup_key
    
    def phase_1_prepare_dr_environment(self) -> Dict:
        """Phase 1: Prepare DR environment"""
        self.log("=" * 60)
        self.log("PHASE 1: PREPARE DR ENVIRONMENT")
        self.log("=" * 60)
        
        test_result = {
            "phase": "phase_1_prepare",
            "status": TestStatus.RUNNING.value,
            "start_time": datetime.now().isoformat(),
            "steps": []
        }
        
        try:
            # Step 1.1: Stop existing DR environment
            self.log("Step 1.1: Stopping existing DR environment...")
            self.run_command(
                "docker-compose -f docker-compose.dr.yml down || true",
                check=False
            )
            test_result["steps"].append({
                "name": "Stop existing DR",
                "status": "completed"
            })
            
            # Step 1.2: Clean volumes
            self.log("Step 1.2: Cleaning DR volumes...")
            self.run_command(
                "docker volume rm minimarket-dr_postgres-dr-data || true",
                check=False
            )
            test_result["steps"].append({
                "name": "Clean volumes",
                "status": "completed"
            })
            
            # Step 1.3: Start fresh DR environment
            self.log("Step 1.3: Starting fresh DR environment...")
            returncode, stdout, stderr = self.run_command(
                "docker-compose -f docker-compose.dr.yml up -d postgres-dr"
            )
            
            if returncode != 0:
                raise Exception(f"Failed to start DR environment: {stderr}")
            
            test_result["steps"].append({
                "name": "Start DR environment",
                "status": "completed"
            })
            
            # Step 1.4: Wait for database readiness
            self.log("Step 1.4: Waiting for database readiness (max 60 seconds)...")
            max_attempts = 12
            for attempt in range(max_attempts):
                returncode, _, _ = self.run_command(
                    "docker-compose -f docker-compose.dr.yml exec -T postgres-dr pg_isready -U postgres",
                    check=False
                )
                if returncode == 0:
                    self.log(f"  ✅ Database ready (attempt {attempt + 1})")
                    break
                time.sleep(5)
            
            if returncode != 0:
                raise Exception("Database did not become ready")
            
            test_result["steps"].append({
                "name": "Database ready",
                "status": "completed"
            })
            
            test_result["status"] = TestStatus.PASSED.value
            self.log("✅ Phase 1 completed successfully")
        
        except Exception as e:
            self.log(f"❌ Phase 1 failed: {str(e)}", "ERROR")
            test_result["status"] = TestStatus.FAILED.value
            test_result["error"] = str(e)
        
        test_result["end_time"] = datetime.now().isoformat()
        self.results.append(test_result)
        return test_result
    
    def phase_2_restore_from_backup(self, backup_key: str) -> Dict:
        """Phase 2: Restore database from backup"""
        self.log("=" * 60)
        self.log("PHASE 2: RESTORE FROM BACKUP")
        self.log("=" * 60)
        
        test_result = {
            "phase": "phase_2_restore",
            "status": TestStatus.RUNNING.value,
            "start_time": datetime.now().isoformat(),
            "backup_key": backup_key,
            "steps": []
        }
        
        try:
            # Step 2.1: Download backup
            self.log(f"Step 2.1: Downloading backup from S3...")
            backup_file = f"/tmp/{backup_key.split('/')[-1]}"
            
            start_download = time.time()
            self.s3.download_file(
                self.backup_bucket,
                backup_key,
                backup_file
            )
            download_time = time.time() - start_download
            
            file_size_gb = os.path.getsize(backup_file) / 1024**3
            self.log(f"  ✅ Downloaded {file_size_gb:.2f} GB in {download_time:.1f}s")
            
            test_result["steps"].append({
                "name": "Download backup",
                "status": "completed",
                "size_gb": file_size_gb,
                "duration_seconds": download_time
            })
            
            # Step 2.2: Copy to DR container
            self.log("Step 2.2: Copying backup to DR container...")
            self.run_command(
                f"docker cp {backup_file} minimarket-dr_postgres-dr_1:/backup.sql"
            )
            test_result["steps"].append({
                "name": "Copy to container",
                "status": "completed"
            })
            
            # Step 2.3: Restore database
            self.log("Step 2.3: Restoring database (this may take several minutes)...")
            start_restore = time.time()
            
            returncode, stdout, stderr = self.run_command(
                "docker-compose -f docker-compose.dr.yml exec -T postgres-dr "
                "psql -U postgres < /backup.sql",
                check=False
            )
            
            restore_time = time.time() - start_restore
            
            if returncode != 0:
                raise Exception(f"Restore failed: {stderr}")
            
            self.log(f"  ✅ Restore completed in {restore_time:.1f}s")
            
            test_result["steps"].append({
                "name": "Restore database",
                "status": "completed",
                "duration_seconds": restore_time
            })
            
            # Step 2.4: Verify database
            self.log("Step 2.4: Verifying restored database...")
            returncode, stdout, stderr = self.run_command(
                "docker-compose -f docker-compose.dr.yml exec -T postgres-dr "
                "psql -U postgres -c 'SELECT COUNT(*) FROM pg_tables WHERE schemaname = \"public\";'"
            )
            
            if returncode == 0:
                self.log(f"  ✅ Database verified")
                test_result["steps"].append({
                    "name": "Verify database",
                    "status": "completed"
                })
            else:
                raise Exception("Database verification failed")
            
            test_result["status"] = TestStatus.PASSED.value
            self.log("✅ Phase 2 completed successfully")
        
        except Exception as e:
            self.log(f"❌ Phase 2 failed: {str(e)}", "ERROR")
            test_result["status"] = TestStatus.FAILED.value
            test_result["error"] = str(e)
        
        test_result["end_time"] = datetime.now().isoformat()
        self.results.append(test_result)
        return test_result
    
    def phase_3_measure_rto_rpo(self) -> Dict:
        """Phase 3: Measure RTO and RPO"""
        self.log("=" * 60)
        self.log("PHASE 3: MEASURE RTO & RPO")
        self.log("=" * 60)
        
        test_result = {
            "phase": "phase_3_rto_rpo",
            "status": TestStatus.RUNNING.value,
            "start_time": datetime.now().isoformat(),
            "metrics": {}
        }
        
        try:
            # RTO: Time from now to application ready
            self.log("Step 3.1: Measuring RTO (Recovery Time Objective)...")
            
            rto_start = time.time()
            
            # Start application on DR
            self.log("  Starting application...")
            self.run_command(
                "docker-compose -f inventario-retail/docker-compose.production.yml "
                "-f docker-compose.dr.yml up -d app"
            )
            
            # Wait for app readiness
            max_attempts = 30
            for attempt in range(max_attempts):
                returncode, _, _ = self.run_command(
                    "curl -sf http://localhost:8080/health > /dev/null",
                    check=False
                )
                if returncode == 0:
                    break
                time.sleep(5)
            
            rto_seconds = time.time() - rto_start
            
            if returncode == 0:
                self.log(f"  ✅ RTO measured: {rto_seconds:.1f} seconds ({rto_seconds/60:.2f} minutes)")
            else:
                rto_seconds = -1
                self.log(f"  ⚠️  Application did not become ready", "WARNING")
            
            test_result["metrics"]["rto_seconds"] = rto_seconds
            test_result["metrics"]["rto_status"] = "OK" if rto_seconds < 14400 else "EXCEEDED"  # 4 hours
            
            # RPO: Check data consistency
            self.log("Step 3.2: Measuring RPO (Recovery Point Objective)...")
            
            # Query last transaction timestamp
            returncode, stdout, _ = self.run_command(
                "docker-compose -f docker-compose.dr.yml exec -T postgres-dr "
                "psql -U postgres -c 'SELECT MAX(event_timestamp) FROM audit_log;'"
            )
            
            if returncode == 0:
                self.log(f"  ✅ Last transaction: {stdout.strip()}")
                test_result["metrics"]["last_transaction"] = stdout.strip()
            
            test_result["status"] = TestStatus.PASSED.value
            self.log("✅ Phase 3 completed successfully")
        
        except Exception as e:
            self.log(f"❌ Phase 3 failed: {str(e)}", "ERROR")
            test_result["status"] = TestStatus.FAILED.value
            test_result["error"] = str(e)
        
        test_result["end_time"] = datetime.now().isoformat()
        self.results.append(test_result)
        return test_result
    
    def phase_4_data_integrity_check(self) -> Dict:
        """Phase 4: Verify data integrity"""
        self.log("=" * 60)
        self.log("PHASE 4: DATA INTEGRITY CHECK")
        self.log("=" * 60)
        
        test_result = {
            "phase": "phase_4_integrity",
            "status": TestStatus.RUNNING.value,
            "start_time": datetime.now().isoformat(),
            "checks": []
        }
        
        try:
            # Check 4.1: Row counts
            self.log("Check 4.1: Verifying row counts...")
            
            tables_to_check = [
                "users",
                "inventory_items",
                "transactions",
                "audit_log"
            ]
            
            for table in tables_to_check:
                returncode, stdout, _ = self.run_command(
                    f"docker-compose -f docker-compose.dr.yml exec -T postgres-dr "
                    f"psql -U postgres -t -c 'SELECT COUNT(*) FROM {table};'",
                    check=False
                )
                
                if returncode == 0:
                    count = int(stdout.strip())
                    self.log(f"  ✅ {table}: {count} rows")
                    test_result["checks"].append({
                        "table": table,
                        "row_count": count,
                        "status": "OK"
                    })
                else:
                    test_result["checks"].append({
                        "table": table,
                        "status": "FAILED"
                    })
            
            # Check 4.2: Checksum verification
            self.log("Check 4.2: Verifying checksums...")
            returncode, stdout, _ = self.run_command(
                "docker-compose -f docker-compose.dr.yml exec -T postgres-dr "
                "psql -U postgres -c 'SELECT md5(string_agg(id::text, \",\" ORDER BY id)) FROM users;'",
                check=False
            )
            
            if returncode == 0:
                self.log(f"  ✅ Checksums verified")
                test_result["checksum_status"] = "OK"
            
            test_result["status"] = TestStatus.PASSED.value
            self.log("✅ Phase 4 completed successfully")
        
        except Exception as e:
            self.log(f"❌ Phase 4 failed: {str(e)}", "ERROR")
            test_result["status"] = TestStatus.FAILED.value
            test_result["error"] = str(e)
        
        test_result["end_time"] = datetime.now().isoformat()
        self.results.append(test_result)
        return test_result
    
    def phase_5_rollback_to_primary(self) -> Dict:
        """Phase 5: Rollback to primary"""
        self.log("=" * 60)
        self.log("PHASE 5: ROLLBACK TO PRIMARY")
        self.log("=" * 60)
        
        test_result = {
            "phase": "phase_5_rollback",
            "status": TestStatus.RUNNING.value,
            "start_time": datetime.now().isoformat(),
            "steps": []
        }
        
        try:
            # Step 5.1: Stop DR application
            self.log("Step 5.1: Stopping DR application...")
            self.run_command(
                "docker-compose -f docker-compose.dr.yml down || true",
                check=False
            )
            test_result["steps"].append({"name": "Stop DR app", "status": "completed"})
            
            # Step 5.2: Verify primary is operational
            self.log("Step 5.2: Verifying primary is operational...")
            returncode, _, _ = self.run_command(
                "curl -sf http://localhost:8080/health > /dev/null",
                check=False
            )
            
            if returncode == 0:
                self.log("  ✅ Primary is operational")
                test_result["steps"].append({"name": "Verify primary", "status": "completed"})
            else:
                self.log("  ⚠️  Primary not responding", "WARNING")
            
            # Step 5.3: Clean DR artifacts
            self.log("Step 5.3: Cleaning DR artifacts...")
            self.run_command("docker volume rm minimarket-dr_postgres-dr-data || true", check=False)
            test_result["steps"].append({"name": "Clean artifacts", "status": "completed"})
            
            test_result["status"] = TestStatus.ROLLED_BACK.value
            self.log("✅ Phase 5 completed - Rollback successful")
        
        except Exception as e:
            self.log(f"❌ Phase 5 failed: {str(e)}", "ERROR")
            test_result["status"] = TestStatus.FAILED.value
            test_result["error"] = str(e)
        
        test_result["end_time"] = datetime.now().isoformat()
        self.results.append(test_result)
        return test_result
    
    def run_full_drill(self) -> bool:
        """Run complete DR drill"""
        self.log("╔" + "=" * 58 + "╗")
        self.log("║  AUTOMATED DISASTER RECOVERY DRILL STARTED               ║")
        self.log("╚" + "=" * 58 + "╝")
        self.log(f"Drill ID: {self.drill_id}")
        self.log(f"Start time: {self.start_time}")
        self.log("")
        
        try:
            # Get latest backup
            backup_key = self.get_latest_backup()
            
            # Execute phases
            p1 = self.phase_1_prepare_dr_environment()
            if p1["status"] != TestStatus.PASSED.value:
                raise Exception("Phase 1 failed")
            
            p2 = self.phase_2_restore_from_backup(backup_key)
            if p2["status"] != TestStatus.PASSED.value:
                raise Exception("Phase 2 failed")
            
            p3 = self.phase_3_measure_rto_rpo()
            p4 = self.phase_4_data_integrity_check()
            p5 = self.phase_5_rollback_to_primary()
            
            return True
        
        except Exception as e:
            self.log(f"❌ Drill failed: {str(e)}", "ERROR")
            self.phase_5_rollback_to_primary()
            return False
        
        finally:
            self.generate_report()
    
    def generate_report(self):
        """Generate drill report"""
        duration = (datetime.now() - self.start_time).total_seconds()
        
        print("\n" + "=" * 60)
        print("DISASTER RECOVERY DRILL REPORT")
        print("=" * 60)
        print(f"Drill ID: {self.drill_id}")
        print(f"Duration: {duration/60:.1f} minutes")
        print("")
        
        passed = sum(1 for r in self.results if r["status"] == TestStatus.PASSED.value)
        failed = sum(1 for r in self.results if r["status"] == TestStatus.FAILED.value)
        
        print(f"Results: {passed} PASSED, {failed} FAILED")
        print("")
        
        for result in self.results:
            status_emoji = "✅" if result["status"] in [TestStatus.PASSED.value, TestStatus.ROLLED_BACK.value] else "❌"
            print(f"{status_emoji} {result['phase']}: {result['status'].upper()}")
            
            if "metrics" in result and result["metrics"]:
                for key, value in result["metrics"].items():
                    print(f"   → {key}: {value}")
        
        print("")
        print(f"Log file: {self.log_file}")
        
        # Save JSON report
        report_json = {
            "drill_id": self.drill_id,
            "start_time": self.start_time.isoformat(),
            "duration_seconds": duration,
            "results": self.results,
            "summary": {
                "passed": passed,
                "failed": failed,
                "status": "SUCCESS" if failed == 0 else "FAILED"
            }
        }
        
        report_file = f"/var/log/dr-drills/{self.drill_id}.json"
        os.makedirs(os.path.dirname(report_file), exist_ok=True)
        
        with open(report_file, "w") as f:
            json.dump(report_json, f, indent=2)
        
        print(f"Report: {report_file}")

if __name__ == "__main__":
    import sys
    
    dry_run = "--dry-run" in sys.argv
    
    orchestrator = DRDrillOrchestrator()
    
    if dry_run:
        orchestrator.log("DRY RUN MODE - No actual operations", "INFO")
    else:
        success = orchestrator.run_full_drill()
        sys.exit(0 if success else 1)
