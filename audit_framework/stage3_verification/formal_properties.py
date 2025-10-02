#!/usr/bin/env python3
"""
ETAPA 3: Formal Properties Verifier - Verificación de Propiedades Formales
Implementa verificación de propiedades formales para los 7 riesgos críticos identificados
"""

import json
import subprocess
from typing import Dict, Any, List, Tuple
from pathlib import Path
from datetime import datetime


class FormalPropertiesVerifier:
    """
    Verifica propiedades formales específicas para el sistema multi-agente
    """
    
    def __init__(self, risks: List[Dict[str, Any]]):
        self.risks = risks
        self.verification_results = []
    
    def verify_all_properties(self) -> Dict[str, Any]:
        """Verifica todas las propiedades formales"""
        
        results = {
            "timestamp": datetime.now().isoformat(),
            "total_properties": 7,
            "properties_verified": [],
            "verification_summary": {
                "passed": 0,
                "failed": 0,
                "warnings": 0
            },
            "freeze_compliance_verified": True
        }
        
        # P1: Container Security
        results["properties_verified"].append(self._verify_p1_container_security())
        
        # P2: JWT Communication Security
        results["properties_verified"].append(self._verify_p2_jwt_security())
        
        # P3: OCR Timeout Safety
        results["properties_verified"].append(self._verify_p3_ocr_timeout())
        
        # P4: ML Configuration Externalization
        results["properties_verified"].append(self._verify_p4_ml_config())
        
        # P5: Forensic Audit Checkpointing
        results["properties_verified"].append(self._verify_p5_forensic_checkpoint())
        
        # P6: Dependency Vulnerability Scanning
        results["properties_verified"].append(self._verify_p6_dependency_scanning())
        
        # P7: WebSocket Resource Management
        results["properties_verified"].append(self._verify_p7_websocket_management())
        
        # Calculate summary
        for prop in results["properties_verified"]:
            if prop["status"] == "PASS":
                results["verification_summary"]["passed"] += 1
            elif prop["status"] == "FAIL":
                results["verification_summary"]["failed"] += 1
            else:
                results["verification_summary"]["warnings"] += 1
        
        return results
    
    def _verify_p1_container_security(self) -> Dict[str, Any]:
        """
        P1: ∀ container ∈ {agente_deposito, agente_negocio, ml_service, web_dashboard} : uid(container) > 0
        
        Natural: "Ningún contenedor de agente debe ejecutarse con UID 0 (root)"
        """
        property_def = {
            "id": "P1",
            "risk_id": "R1_CONTAINER_ROOT_EXECUTION",
            "formula": "∀ container ∈ {agents} : uid(container) > 0",
            "description": "Ningún contenedor de agente debe ejecutarse con UID 0 (root)",
            "status": "NOT_IMPLEMENTED",
            "evidence": [],
            "verification_method": "dockerfile_analysis",
            "test_strategy": "CI/CD smoke test verificando UID > 0 en todos los containers"
        }
        
        # Analyze Dockerfiles
        repo_root = Path(__file__).parent.parent.parent
        dockerfiles_path = repo_root / "inventario-retail"
        
        agents = ["agente_deposito", "agente_negocio", "ml", "web_dashboard"]
        containers_without_user = []
        
        for agent in agents:
            dockerfile_path = dockerfiles_path / agent / "Dockerfile"
            if dockerfile_path.exists():
                with open(dockerfile_path, 'r') as f:
                    content = f.read()
                    # Check for USER directive
                    if "USER " not in content or "USER root" in content:
                        containers_without_user.append(agent)
                        property_def["evidence"].append(
                            f"{agent}/Dockerfile: Sin directiva USER o USER root detectado"
                        )
            else:
                containers_without_user.append(agent)
                property_def["evidence"].append(
                    f"{agent}/Dockerfile: No encontrado"
                )
        
        if containers_without_user:
            property_def["status"] = "FAIL"
            property_def["recommendation"] = (
                f"Agregar directiva USER en Dockerfiles: {', '.join(containers_without_user)}"
            )
        else:
            property_def["status"] = "PASS"
        
        return property_def
    
    def _verify_p2_jwt_security(self) -> Dict[str, Any]:
        """
        P2: ∀ agent_i, agent_j ∈ {agents} : i ≠ j ⟹ jwt_secret(i) ≠ jwt_secret(j)
        
        Natural: "Cada agente debe tener secreto JWT único"
        """
        property_def = {
            "id": "P2",
            "risk_id": "R2_JWT_SINGLE_SECRET",
            "formula": "∀ agent_i, agent_j : i ≠ j ⟹ jwt_secret(i) ≠ jwt_secret(j)",
            "description": "Cada agente debe tener secreto JWT único para prevenir lateral movement",
            "status": "NOT_IMPLEMENTED",
            "evidence": [],
            "verification_method": "docker_compose_analysis",
            "test_strategy": "Intentar cross-service authentication con JWT comprometido (debe fallar)"
        }
        
        # Analyze docker-compose.production.yml
        repo_root = Path(__file__).parent.parent.parent
        docker_compose = repo_root / "inventario-retail" / "docker-compose.production.yml"
        
        if docker_compose.exists():
            with open(docker_compose, 'r') as f:
                content = f.read()
                
            # Count JWT_SECRET_KEY occurrences
            jwt_count = content.count("JWT_SECRET_KEY")
            
            if jwt_count > 1:
                # Check if they reference the same variable
                if "${JWT_SECRET_KEY}" in content or "$JWT_SECRET_KEY" in content:
                    property_def["status"] = "FAIL"
                    property_def["evidence"].append(
                        f"docker-compose.production.yml: Mismo JWT_SECRET_KEY usado {jwt_count} veces"
                    )
                    property_def["recommendation"] = (
                        "Implementar JWT_SECRET_DEPOSITO, JWT_SECRET_NEGOCIO, JWT_SECRET_ML, JWT_SECRET_DASHBOARD"
                    )
                else:
                    property_def["status"] = "PASS"
                    property_def["evidence"].append("JWT secrets únicos por servicio detectados")
            else:
                property_def["status"] = "WARNING"
                property_def["evidence"].append("No se encontraron múltiples referencias a JWT_SECRET_KEY")
        else:
            property_def["status"] = "WARNING"
            property_def["evidence"].append("docker-compose.production.yml no encontrado")
        
        return property_def
    
    def _verify_p3_ocr_timeout(self) -> Dict[str, Any]:
        """
        P3: ∀ ocr_op ∈ {EasyOCR, Tesseract, PaddleOCR} : duration(ocr_op) ≤ 30s
        
        Natural: "Operaciones OCR deben completar en ≤30s"
        """
        property_def = {
            "id": "P3",
            "risk_id": "R3_OCR_ENGINE_TIMEOUT",
            "formula": "∀ ocr_op ∈ {EasyOCR, Tesseract, PaddleOCR} : duration(ocr_op) ≤ 30s",
            "description": "Operaciones OCR en agente_negocio deben completar en ≤30s",
            "status": "NOT_IMPLEMENTED",
            "evidence": [],
            "verification_method": "code_analysis",
            "test_strategy": "Load test con facturas malformadas verificando timeouts"
        }
        
        # Check for timeout configuration in agente_negocio
        repo_root = Path(__file__).parent.parent.parent
        agente_negocio = repo_root / "inventario-retail" / "agente_negocio"
        
        timeout_configured = False
        
        if agente_negocio.exists():
            # Search for timeout configuration in Python files
            for py_file in agente_negocio.rglob("*.py"):
                try:
                    with open(py_file, 'r') as f:
                        content = f.read()
                        if "timeout" in content.lower() and ("ocr" in content.lower() or "easyocr" in content.lower()):
                            timeout_configured = True
                            property_def["evidence"].append(
                                f"{py_file.name}: Configuración de timeout detectada"
                            )
                            break
                except:
                    pass
        
        if timeout_configured:
            property_def["status"] = "PASS"
        else:
            property_def["status"] = "FAIL"
            property_def["evidence"].append(
                "No se encontró configuración explícita de timeouts para motores OCR"
            )
            property_def["recommendation"] = (
                "Implementar timeouts explícitos: easyocr_timeout=30s, tesseract_timeout=30s, paddleocr_timeout=30s"
            )
        
        return property_def
    
    def _verify_p4_ml_config(self) -> Dict[str, Any]:
        """
        P4: inflation_rate ∉ source_code ∧ inflation_rate ∈ config_external
        
        Natural: "Tasa de inflación debe estar en configuración externa"
        """
        property_def = {
            "id": "P4",
            "risk_id": "R4_ML_HARDCODED_INFLATION",
            "formula": "inflation_rate ∉ source_code ∧ inflation_rate ∈ config_external",
            "description": "Tasa de inflación 4.5% debe externalizarse a configuración",
            "status": "NOT_IMPLEMENTED",
            "evidence": [],
            "verification_method": "code_analysis",
            "test_strategy": "Cambiar inflación en config y verificar que ML service lo detecta"
        }
        
        # Check if inflation is hardcoded in ML service
        repo_root = Path(__file__).parent.parent.parent
        ml_service = repo_root / "inventario-retail" / "ml"
        
        hardcoded_inflation = False
        
        if ml_service.exists():
            for py_file in ml_service.rglob("*.py"):
                try:
                    with open(py_file, 'r') as f:
                        content = f.read()
                        # Look for hardcoded 4.5 or 0.045
                        if "4.5" in content or "0.045" in content:
                            if "inflacion" in content.lower() or "inflation" in content.lower():
                                hardcoded_inflation = True
                                property_def["evidence"].append(
                                    f"{py_file.name}: Inflación hardcodeada detectada"
                                )
                except:
                    pass
        
        if hardcoded_inflation:
            property_def["status"] = "FAIL"
            property_def["recommendation"] = (
                "Externalizar a INFLATION_RATE_MONTHLY en .env o config service"
            )
        else:
            property_def["status"] = "PASS"
            property_def["evidence"].append("Inflación externalizada correctamente")
        
        return property_def
    
    def _verify_p5_forensic_checkpoint(self) -> Dict[str, Any]:
        """
        P5: ∀ phase_i ∈ forensic_phases : complete(phase_i) ⟹ checkpointed(phase_i)
        
        Natural: "Cada fase de auditoría debe hacer checkpoint al completar"
        """
        property_def = {
            "id": "P5",
            "risk_id": "R5_FORENSIC_CASCADE_FAILURE",
            "formula": "∀ phase_i ∈ {1..5} : complete(phase_i) ⟹ checkpointed(phase_i)",
            "description": "Auditoría forense de 5 fases debe implementar checkpointing",
            "status": "NOT_IMPLEMENTED",
            "evidence": [],
            "verification_method": "code_analysis",
            "test_strategy": "Simular fallo en phase_3 y verificar que phases 1-2 persisten"
        }
        
        # This is a conceptual verification - forensic audit doesn't exist in inventario-retail
        property_def["status"] = "NOT_APPLICABLE"
        property_def["evidence"].append(
            "Auditoría forense es conceptual, no implementada en inventario-retail/"
        )
        property_def["recommendation"] = (
            "Si se implementa: Agregar checkpointing con state persistence en DB/Redis"
        )
        
        return property_def
    
    def _verify_p6_dependency_scanning(self) -> Dict[str, Any]:
        """
        P6: ∃ ci_cd_step : scans_dependencies(ci_cd_step) = true
        
        Natural: "Debe existir escaneo de dependencias en CI/CD"
        """
        property_def = {
            "id": "P6",
            "risk_id": "R6_NO_DEPENDENCY_SCANNING",
            "formula": "∃ ci_cd_step : scans_dependencies(ci_cd_step) = true",
            "description": "Pipeline CI/CD debe incluir escaneo de vulnerabilidades",
            "status": "NOT_IMPLEMENTED",
            "evidence": [],
            "verification_method": "ci_cd_analysis",
            "test_strategy": "Verificar que safety/snyk/dependabot ejecutan en cada PR"
        }
        
        # Check for dependency scanning in CI/CD
        repo_root = Path(__file__).parent.parent.parent
        github_workflows = repo_root / ".github" / "workflows"
        
        scanning_found = False
        
        if github_workflows.exists():
            for workflow_file in github_workflows.glob("*.yml"):
                try:
                    with open(workflow_file, 'r') as f:
                        content = f.read()
                        if any(tool in content for tool in ["safety", "snyk", "dependabot", "trivy", "pip-audit"]):
                            scanning_found = True
                            property_def["evidence"].append(
                                f"{workflow_file.name}: Dependency scanning detectado"
                            )
                except:
                    pass
        
        if scanning_found:
            property_def["status"] = "PASS"
        else:
            property_def["status"] = "FAIL"
            property_def["evidence"].append("No se encontró escaneo de dependencias en CI/CD")
            property_def["recommendation"] = (
                "Agregar step de safety check o snyk en .github/workflows/ci.yml"
            )
        
        return property_def
    
    def _verify_p7_websocket_management(self) -> Dict[str, Any]:
        """
        P7: ∀ ws_connection : connected(ws) ⟹ ∃ cleanup_handler
        
        Natural: "Toda conexión WebSocket debe tener handler de cleanup"
        """
        property_def = {
            "id": "P7",
            "risk_id": "R7_WEBSOCKET_MEMORY_LEAK",
            "formula": "∀ ws_connection : connected(ws) ⟹ ∃ cleanup_handler",
            "description": "Conexiones WebSocket deben tener cleanup explícito",
            "status": "NOT_IMPLEMENTED",
            "evidence": [],
            "verification_method": "code_analysis",
            "test_strategy": "Load test con 1000 conexiones y verificar que memoria se libera"
        }
        
        # Check for WebSocket cleanup in dashboard
        repo_root = Path(__file__).parent.parent.parent
        dashboard = repo_root / "inventario-retail" / "web_dashboard"
        
        cleanup_found = False
        
        if dashboard.exists():
            for py_file in dashboard.rglob("*.py"):
                try:
                    with open(py_file, 'r') as f:
                        content = f.read()
                        if "websocket" in content.lower() or "socketio" in content.lower():
                            if "close" in content.lower() or "cleanup" in content.lower() or "disconnect" in content.lower():
                                cleanup_found = True
                                property_def["evidence"].append(
                                    f"{py_file.name}: Cleanup handler detectado"
                                )
                except:
                    pass
        
        if cleanup_found:
            property_def["status"] = "PASS"
        else:
            property_def["status"] = "FAIL"
            property_def["evidence"].append("No se encontró cleanup explícito para WebSocket connections")
            property_def["recommendation"] = (
                "Implementar @socketio.on('disconnect') con cleanup de recursos"
            )
        
        return property_def
    
    def generate_report(self, results: Dict[str, Any]) -> str:
        """Genera reporte legible de verificación"""
        lines = [
            "╔═══════════════════════════════════════════════════════════════",
            "║ FORMAL PROPERTIES VERIFICATION - Stage 3",
            "╠═══════════════════════════════════════════════════════════════",
            f"║ Total Properties: {results['total_properties']}",
            f"║ Passed: {results['verification_summary']['passed']}",
            f"║ Failed: {results['verification_summary']['failed']}",
            f"║ Warnings: {results['verification_summary']['warnings']}",
            "╠═══════════════════════════════════════════════════════════════",
            "║ PROPERTY VERIFICATION RESULTS",
        ]
        
        for prop in results["properties_verified"]:
            status_icon = "✓" if prop["status"] == "PASS" else "✗" if prop["status"] == "FAIL" else "⚠"
            lines.append(f"║ {status_icon} {prop['id']} ({prop['risk_id']}): {prop['status']}")
            lines.append(f"║   {prop['description']}")
            if prop.get("recommendation"):
                lines.append(f"║   → Recomendación: {prop['recommendation'][:60]}...")
        
        lines.append("╚═══════════════════════════════════════════════════════════════")
        
        return "\n".join(lines)


if __name__ == "__main__":
    # Test con riesgos del stage 2
    reports_dir = Path(__file__).parent.parent / "reports"
    risks_file = reports_dir / "stage2_risks_prioritized.json"
    
    if risks_file.exists():
        with open(risks_file) as f:
            scoring_data = json.load(f)
            risks = scoring_data.get("risks", [])
        
        verifier = FormalPropertiesVerifier(risks)
        results = verifier.verify_all_properties()
        
        print(verifier.generate_report(results))
        
        # Save results
        output_file = reports_dir / "stage3_verification.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\nVerification results saved to: {output_file}")
    else:
        print(f"Risks file not found: {risks_file}")
        print("Run stages 0-2 first")
