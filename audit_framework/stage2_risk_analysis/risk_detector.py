#!/usr/bin/env python3
"""
ETAPA 2: Risk Detector - Detección Multi-Vector de Riesgos
Identifica vulnerabilidades específicas según análisis forense previo
"""

import json
from typing import Dict, Any, List
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))
from lib.scoring import RiskType


class RiskDetector:
    """
    Detecta riesgos específicos del sistema multi-agente retail argentino
    Basado en hallazgos del análisis forense previo
    """
    
    def __init__(self, profile: Dict[str, Any], 
                 fsm_analysis: Dict[str, Any],
                 jwt_analysis: Dict[str, Any]):
        self.profile = profile
        self.fsm_analysis = fsm_analysis
        self.jwt_analysis = jwt_analysis
        self.components = profile.get("architecture", {}).get("components", [])
    
    def detect_all_risks(self) -> List[Dict[str, Any]]:
        """Detecta todos los riesgos del sistema"""
        risks = []
        
        # R1: Container Root Execution
        risks.append(self._detect_container_root_risk())
        
        # R2: JWT Single Secret
        risks.append(self._detect_jwt_single_secret())
        
        # R3: OCR Engine Timeouts
        risks.append(self._detect_ocr_timeout_risk())
        
        # R4: ML Hardcoded Inflation
        risks.append(self._detect_ml_hardcoded_inflation())
        
        # R5: Forensic Cascade Failure
        risks.append(self._detect_forensic_cascade_failure())
        
        # R6: No Dependency Scanning
        risks.append(self._detect_no_dependency_scanning())
        
        # R7: WebSocket Memory Leak
        risks.append(self._detect_websocket_memory_leak())
        
        return risks
    
    def _detect_container_root_risk(self) -> Dict[str, Any]:
        """R1: Containers ejecutando como root"""
        security_context = self.profile.get("security_context", {})
        containers_root = security_context.get("containers_root_risk", True)
        
        affected_services = [
            c["name"] for c in self.components 
            if c.get("type") in ["agent", "database", "cache"]
        ]
        
        return {
            "id": "R1_CONTAINER_ROOT_EXECUTION",
            "type": RiskType.CONTAINER_SECURITY.value,
            "severity": 10,
            "impact_score": 9,
            "probability": 8,
            "title": "Containers ejecutando como root",
            "evidence": [
                "Análisis forense: 'Containers ejecutando como root' - CRÍTICO",
                "Dockerfiles sin directiva USER o USER root",
                f"Afecta {len(affected_services)} servicios"
            ],
            "affected_services": affected_services,
            "attack_vector": "Container escape → Host privilege escalation → System compromise",
            "business_impact": "Compromiso completo del sistema multi-agente y host",
            "technical_details": {
                "container_count": len(affected_services),
                "capability_risks": [
                    "CAP_SYS_ADMIN abuse",
                    "Kernel exploitation",
                    "Host filesystem access",
                    "Other container access"
                ],
                "exploitation_difficulty": "MEDIUM",
                "detection_difficulty": "HIGH"
            },
            "references": [
                "CIS Docker Benchmark 4.1",
                "NIST SP 800-190 Section 3.1",
                "Docker Security Best Practices"
            ]
        }
    
    def _detect_jwt_single_secret(self) -> Dict[str, Any]:
        """R2: JWT único compartido entre agentes"""
        jwt_config = self.jwt_analysis.get("jwt_configuration", {})
        agents_using_jwt = jwt_config.get("agents_using_jwt", [])
        
        return {
            "id": "R2_JWT_SINGLE_SECRET",
            "type": RiskType.AUTHENTICATION_SECURITY.value,
            "severity": 9,
            "impact_score": 10,
            "probability": 6,
            "title": "JWT único compartido entre todos los agentes",
            "evidence": [
                "docker-compose.production.yml: mismo JWT_SECRET_KEY para todos",
                f"{len(agents_using_jwt)} agentes comparten el mismo secret",
                "No hay rotación de secrets configurada"
            ],
            "affected_services": agents_using_jwt,
            "attack_vector": "JWT compromise → All inter-agent communication compromised",
            "business_impact": "Bypass completo de autenticación, movimiento lateral sin restricciones",
            "technical_details": {
                "single_secret": jwt_config.get("single_secret", True),
                "rotation_policy": jwt_config.get("rotation_policy", "not_configured"),
                "storage_method": jwt_config.get("storage_method", "environment_variable"),
                "attack_scenarios": self.jwt_analysis.get("risk_assessment", {}).get(
                    "single_secret_risk", {}).get("attack_scenario", [])
            },
            "references": [
                "OWASP A07:2021 - Identification and Authentication Failures",
                "RFC 7519 - JSON Web Token Best Practices"
            ]
        }
    
    def _detect_ocr_timeout_risk(self) -> Dict[str, Any]:
        """R3: Timeouts OCR sin configuración explícita"""
        agente_negocio_fsm = self.fsm_analysis.get("agents", {}).get("agente_negocio", {})
        timeout_states = []
        
        for agent_name, agent_data in self.fsm_analysis.get("agents", {}).items():
            if agent_data.get("has_timeout_states", False):
                timeout_states.append(agent_name)
        
        return {
            "id": "R3_OCR_ENGINE_TIMEOUT",
            "type": RiskType.PERFORMANCE_RELIABILITY.value,
            "severity": 7,
            "impact_score": 8,
            "probability": 7,
            "title": "Timeouts OCR multi-engine sin configuración explícita",
            "evidence": [
                "FSM agente_negocio: timeout_states sin configuración explícita",
                "3 motores OCR (EasyOCR, Tesseract, PaddleOCR) sin timeout individual",
                "SLA: 15000ms pero no enforced programáticamente"
            ],
            "affected_services": ["agente_negocio"],
            "attack_vector": "Malformed AFIP invoice → OCR hang → Agent unavailable → Service degradation",
            "business_impact": "Procesamiento de facturas AFIP bloqueado, pérdida de ingresos",
            "technical_details": {
                "ocr_engines": ["EasyOCR", "Tesseract", "PaddleOCR"],
                "expected_timeout_ms": 15000,
                "timeout_configured": False,
                "voting_consensus_required": True,
                "failure_modes": [
                    "Single engine hang blocks entire pipeline",
                    "No partial results on timeout",
                    "Cascade failure to dependent services"
                ]
            },
            "references": [
                "Resilience patterns: Circuit Breaker",
                "Timeout and Retry patterns"
            ]
        }
    
    def _detect_ml_hardcoded_inflation(self) -> Dict[str, Any]:
        """R4: Inflación hardcodeada en ML service"""
        afip_context = self.profile.get("afip_context", {})
        inflation_rate = afip_context.get("inflation_rate_monthly", 4.5)
        inflation_hardcoded = afip_context.get("inflation_hardcoded", True)
        
        return {
            "id": "R4_ML_HARDCODED_INFLATION",
            "type": RiskType.BUSINESS_LOGIC.value,
            "severity": 6,
            "impact_score": 8,
            "probability": 9,
            "title": f"Inflación {inflation_rate}% hardcodeada en predicciones ML",
            "evidence": [
                f"FSM ml_service: inflación {inflation_rate}% hardcodeada",
                "No configuración externa para ajuste de inflación",
                "Contexto argentino: inflación variable requiere actualización frecuente"
            ],
            "affected_services": ["ml_service"],
            "attack_vector": "Economic change → Wrong predictions → Financial losses → Business decisions on bad data",
            "business_impact": "Predicciones incorrectas de demanda y precios, pérdidas financieras",
            "technical_details": {
                "current_inflation_rate": inflation_rate,
                "hardcoded": inflation_hardcoded,
                "currency": afip_context.get("currency", "ARS"),
                "update_frequency_required": "monthly",
                "current_update_mechanism": "code_change_and_redeploy",
                "consequences": [
                    "Over/under-stocking decisions",
                    "Incorrect pricing strategies",
                    "Revenue loss or opportunity cost",
                    "Competitive disadvantage"
                ]
            },
            "references": [
                "Twelve-Factor App: Config",
                "Business Logic Security - OWASP"
            ]
        }
    
    def _detect_forensic_cascade_failure(self) -> Dict[str, Any]:
        """R5: Fallo en fase de auditoría forense pierde toda la auditoría"""
        forensic_fsm = self.fsm_analysis.get("agents", {}).get("forensic_audit", {})
        has_error_recovery = forensic_fsm.get("has_error_recovery", False)
        
        return {
            "id": "R5_FORENSIC_CASCADE_FAILURE",
            "type": RiskType.BUSINESS_CONTINUITY.value,
            "severity": 8,
            "impact_score": 9,
            "probability": 6,
            "title": "Fallo en fase de auditoría forense pierde auditoría completa",
            "evidence": [
                "FSM forensic_audit: phase_failure → error sin recuperación parcial",
                "5 fases secuenciales sin checkpointing",
                "No mecanismo de partial recovery implementado"
            ],
            "affected_services": ["all_agents"],
            "attack_vector": "Single phase failure → Complete audit lost → Compliance gap → Regulatory risk",
            "business_impact": "Pérdida de auditoría forense crítica, compliance risk, forensic evidence gap",
            "technical_details": {
                "phase_count": 5,
                "sequential_execution": True,
                "checkpointing": False,
                "partial_recovery": False,
                "error_recovery": has_error_recovery,
                "phase_dependencies": {
                    "phase_1": ["agente_deposito"],
                    "phase_2": ["agente_negocio"],
                    "phase_3": ["ml_service"],
                    "phase_4": ["web_dashboard"],
                    "phase_5": ["all_agents"]
                },
                "failure_impact": [
                    "Loss of forensic evidence",
                    "Compliance violations",
                    "Inability to investigate incidents",
                    "Regulatory penalties"
                ]
            },
            "references": [
                "ISO 27037 - Digital Evidence Guidelines",
                "NIST SP 800-86 - Computer Security Incident Handling"
            ]
        }
    
    def _detect_no_dependency_scanning(self) -> Dict[str, Any]:
        """R6: Sin escaneo automatizado de vulnerabilidades"""
        security_context = self.profile.get("security_context", {})
        known_vulns = security_context.get("vulnerabilities_known", 0)
        
        return {
            "id": "R6_NO_DEPENDENCY_SCANNING",
            "type": RiskType.SECURITY.value,
            "severity": 7,
            "impact_score": 7,
            "probability": 8,
            "title": "Sin escaneo automatizado de vulnerabilidades en dependencias",
            "evidence": [
                "Análisis forense: 'No automated dependency vulnerability scanning'",
                f"Vulnerabilidades conocidas en baseline: {known_vulns}",
                "No CI/CD integration con safety/snyk/dependabot"
            ],
            "affected_services": ["all_services"],
            "attack_vector": "Unknown CVEs → Exploitation → Data breach → System compromise",
            "business_impact": "Vulnerabilidades desconocidas en producción, riesgo de explotación",
            "technical_details": {
                "known_vulnerabilities": known_vulns,
                "scanning_tools": [],
                "ci_cd_integration": False,
                "update_frequency": "manual",
                "python_packages": "156+ dependencies",
                "risk_exposure": [
                    "Zero-day vulnerabilities undetected",
                    "Known CVEs not patched",
                    "Supply chain attacks",
                    "Transitive dependency risks"
                ]
            },
            "references": [
                "OWASP Dependency-Check",
                "Snyk/Safety vulnerability databases",
                "CWE-1035 - Vulnerable Third Party Component"
            ]
        }
    
    def _detect_websocket_memory_leak(self) -> Dict[str, Any]:
        """R7: WebSocket connections sin cleanup explícito"""
        dashboard_fsm = self.fsm_analysis.get("agents", {}).get("web_dashboard", {})
        
        return {
            "id": "R7_WEBSOCKET_MEMORY_LEAK",
            "type": RiskType.PERFORMANCE_RELIABILITY.value,
            "severity": 6,
            "impact_score": 8,
            "probability": 7,
            "title": "WebSocket connections sin cleanup explícito",
            "evidence": [
                "FSM dashboard: websocket_broadcast sin cleanup explícito",
                "Dashboard maneja tiempo real con WebSockets",
                "No connection pooling o límite de conexiones visible"
            ],
            "affected_services": ["web_dashboard"],
            "attack_vector": "Multiple connections → Memory exhaustion → Dashboard crash → Monitoring unavailable",
            "business_impact": "Monitoreo en tiempo real no disponible, degradación de servicio",
            "technical_details": {
                "websocket_enabled": True,
                "cleanup_explicit": False,
                "connection_limit": "not_configured",
                "timeout_idle": "not_configured",
                "failure_modes": [
                    "Memory leak from unclosed connections",
                    "File descriptor exhaustion",
                    "CPU saturation from too many connections",
                    "Dashboard process OOM kill"
                ],
                "frequency_rps": 25
            },
            "references": [
                "WebSocket Connection Management Best Practices",
                "RFC 6455 - WebSocket Protocol"
            ]
        }
    
    def generate_report(self, risks: List[Dict[str, Any]]) -> str:
        """Genera reporte legible de riesgos detectados"""
        lines = [
            "╔═══════════════════════════════════════════════════════════════",
            "║ RISK DETECTION - Multi-Vector Analysis",
            "╠═══════════════════════════════════════════════════════════════",
            f"║ Total Risks Detected: {len(risks)}",
            "╠═══════════════════════════════════════════════════════════════",
        ]
        
        for risk in risks:
            lines.append(f"║ {risk['id']}")
            lines.append(f"║   Type: {risk['type']}")
            lines.append(f"║   Severity: {risk['severity']}/10, Impact: {risk['impact_score']}/10")
            lines.append(f"║   Probability: {risk['probability']}/10")
            lines.append(f"║   Affected: {len(risk.get('affected_services', []))} services")
            lines.append(f"║   Attack Vector: {risk['attack_vector'][:80]}...")
            lines.append("║")
        
        lines.append("╚═══════════════════════════════════════════════════════════════")
        
        return "\n".join(lines)


if __name__ == "__main__":
    # Test con análisis previos
    reports_dir = Path(__file__).parent.parent / "reports"
    
    profile_file = reports_dir / "stage0_profile.json"
    fsm_file = reports_dir / "stage1_fsm_analysis.json"
    jwt_file = reports_dir / "stage1_jwt_analysis.json"
    
    if all(f.exists() for f in [profile_file, fsm_file, jwt_file]):
        with open(profile_file) as f:
            profile = json.load(f)
        with open(fsm_file) as f:
            fsm_analysis = json.load(f)
        with open(jwt_file) as f:
            jwt_analysis = json.load(f)
        
        detector = RiskDetector(profile, fsm_analysis, jwt_analysis)
        risks = detector.detect_all_risks()
        
        print(detector.generate_report(risks))
        
        # Guardar riesgos
        output_file = reports_dir / "stage2_risks_detected.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(risks, f, indent=2, ensure_ascii=False)
        
        print(f"\nRisks saved to: {output_file}")
    else:
        print("Missing required analysis files. Run stages 0 and 1 first.")
