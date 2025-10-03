#!/usr/bin/env python3
"""
ETAPA 1: JWT Analyzer - Análisis de Comunicación JWT Inter-Agente
Analiza riesgos de JWT único compartido entre todos los agentes
"""

import json
from typing import Dict, Any, List
from pathlib import Path


class JWTCommunicationAnalyzer:
    """
    Analiza riesgos de comunicación JWT en el sistema multi-agente
    """
    
    def __init__(self, profile: Dict[str, Any]):
        self.profile = profile
        self.components = profile.get("architecture", {}).get("components", [])
    
    def analyze_jwt_communication(self) -> Dict[str, Any]:
        """Analiza comunicación JWT entre agentes"""
        analysis = {
            "jwt_configuration": self._analyze_jwt_config(),
            "communication_flows": self._map_jwt_flows(),
            "risk_assessment": self._assess_jwt_risks(),
            "attack_vectors": self._identify_attack_vectors(),
            "mitigation_recommendations": self._generate_mitigations()
        }
        
        return analysis
    
    def _analyze_jwt_config(self) -> Dict[str, Any]:
        """Analiza configuración JWT actual"""
        security_context = self.profile.get("security_context", {})
        
        return {
            "single_secret": security_context.get("jwt_secret_single", True),
            "secret_name": "JWT_SECRET_KEY",
            "shared_across_services": True,
            "rotation_policy": "not_configured",  # RISK
            "secret_complexity": "unknown",
            "storage_method": "environment_variable",
            "agents_using_jwt": [
                c["name"] for c in self.components 
                if c.get("type") == "agent"
            ]
        }
    
    def _map_jwt_flows(self) -> List[Dict[str, Any]]:
        """Mapea flujos de comunicación con JWT"""
        flows = []
        
        # Dashboard → Agentes
        dashboard = next((c for c in self.components if c["name"] == "web_dashboard"), None)
        if dashboard:
            for component in self.components:
                if component.get("type") == "agent" and component["name"] != "web_dashboard":
                    flows.append({
                        "from": "web_dashboard",
                        "to": component["name"],
                        "auth_method": "JWT",
                        "secret": "JWT_SECRET_KEY",
                        "port": component.get("port", 0),
                        "protocol": "HTTP",
                        "encrypted": False,  # HTTP dentro de Docker network
                        "criticality": "critical"
                    })
        
        return flows
    
    def _assess_jwt_risks(self) -> Dict[str, Any]:
        """Evalúa riesgos específicos de JWT"""
        return {
            "single_secret_risk": {
                "id": "JWT_SINGLE_SECRET_RISK",
                "severity": 9,
                "impact": 10,
                "probability": 6,
                "description": "Un único JWT_SECRET_KEY compartido entre todos los agentes",
                "consequence": "Compromiso del JWT → Todos los agentes vulnerables",
                "affected_services": [c["name"] for c in self.components if c.get("type") == "agent"],
                "attack_scenario": [
                    "1. Atacante compromete un agente (ej: agente_negocio)",
                    "2. Obtiene JWT_SECRET_KEY del ambiente",
                    "3. Genera JWTs válidos para todos los demás agentes",
                    "4. Bypass completo de autenticación inter-agente",
                    "5. Acceso total al sistema multi-agente"
                ]
            },
            "no_jwt_rotation": {
                "id": "JWT_NO_ROTATION",
                "severity": 6,
                "impact": 7,
                "probability": 8,
                "description": "No hay política de rotación de JWT secret",
                "consequence": "Secret comprometido permanece válido indefinidamente"
            },
            "env_var_storage": {
                "id": "JWT_ENV_VAR_STORAGE",
                "severity": 5,
                "impact": 6,
                "probability": 7,
                "description": "JWT secret almacenado en variable de entorno",
                "consequence": "Vulnerable a process inspection y container escape"
            },
            "http_transmission": {
                "id": "JWT_HTTP_TRANSMISSION",
                "severity": 7,
                "impact": 8,
                "probability": 5,
                "description": "JWT transmitido sobre HTTP (no HTTPS) en red Docker",
                "consequence": "Vulnerable a sniffing en red comprometida"
            }
        }
    
    def _identify_attack_vectors(self) -> List[Dict[str, Any]]:
        """Identifica vectores de ataque específicos"""
        return [
            {
                "vector": "Container Escape → JWT Extraction",
                "steps": [
                    "1. Explotar vulnerabilidad en container (root execution)",
                    "2. Escapar del container",
                    "3. Leer JWT_SECRET_KEY de docker-compose.yml o .env",
                    "4. Generar JWTs válidos para todos los agentes"
                ],
                "likelihood": "HIGH",
                "impact": "CRITICAL",
                "prerequisites": ["Container root execution", "Docker host access"]
            },
            {
                "vector": "Agent Compromise → Lateral Movement",
                "steps": [
                    "1. Comprometer un agente individual (ej: OCR vulnerability)",
                    "2. Extraer JWT_SECRET_KEY del ambiente del agente",
                    "3. Autenticarse como cualquier otro agente",
                    "4. Movimiento lateral sin detección"
                ],
                "likelihood": "MEDIUM",
                "impact": "CRITICAL",
                "prerequisites": ["Agent vulnerability", "Process memory access"]
            },
            {
                "vector": "Network Sniffing → JWT Replay",
                "steps": [
                    "1. Comprometer red Docker interna",
                    "2. Sniff tráfico HTTP entre agentes",
                    "3. Capturar JWT tokens en tránsito",
                    "4. Replay tokens para impersonation"
                ],
                "likelihood": "LOW",
                "impact": "HIGH",
                "prerequisites": ["Docker network access", "HTTP traffic"]
            },
            {
                "vector": "Supply Chain → Secret Exposure",
                "steps": [
                    "1. Secret hardcoded en código o config",
                    "2. Push accidental a repositorio público",
                    "3. Secret expuesto en logs o error messages",
                    "4. Descubrimiento por atacante externo"
                ],
                "likelihood": "MEDIUM",
                "impact": "CRITICAL",
                "prerequisites": ["Developer error", "Insufficient secret scanning"]
            }
        ]
    
    def _generate_mitigations(self) -> List[Dict[str, Any]]:
        """Genera recomendaciones de mitigación"""
        return [
            {
                "id": "MIT-1",
                "priority": "CRITICAL",
                "title": "Implementar JWT per-service",
                "description": "Cada agente debe tener su propio JWT secret",
                "effort_hours": 8.0,
                "benefits": [
                    "Compromiso de un agente no afecta otros",
                    "Granularidad en auditoría y revocación",
                    "Aislamiento de security boundaries"
                ],
                "implementation": [
                    "1. Generar JWT_SECRET_DEPOSITO, JWT_SECRET_NEGOCIO, etc.",
                    "2. Configurar validación específica por agente",
                    "3. Dashboard mantiene múltiples secrets para comunicación",
                    "4. Actualizar docker-compose con secrets individuales"
                ],
                "alternatives": [
                    "Implementar mTLS entre servicios (esfuerzo: 12h)",
                    "Usar service mesh (Istio/Linkerd) (esfuerzo: 20h)"
                ]
            },
            {
                "id": "MIT-2",
                "priority": "HIGH",
                "title": "Implementar JWT rotation policy",
                "description": "Rotación automática de secrets cada 30 días",
                "effort_hours": 4.0,
                "benefits": [
                    "Limita ventana de compromiso",
                    "Compliance con security best practices"
                ],
                "implementation": [
                    "1. Crear script de rotación automática",
                    "2. Almacenar secrets en secret manager (Vault, AWS Secrets)",
                    "3. Configurar reload sin downtime",
                    "4. Alertar si rotación falla"
                ]
            },
            {
                "id": "MIT-3",
                "priority": "HIGH",
                "title": "Migrar a HTTPS/TLS inter-agent",
                "description": "Encriptar comunicación HTTP entre agentes",
                "effort_hours": 6.0,
                "benefits": [
                    "Protección contra sniffing",
                    "Validación de identidad con certificados"
                ],
                "implementation": [
                    "1. Generar certificados TLS internos",
                    "2. Configurar FastAPI con HTTPS",
                    "3. Actualizar clientes HTTP para validar certs",
                    "4. Documentar proceso de renovación"
                ]
            },
            {
                "id": "MIT-4",
                "priority": "MEDIUM",
                "title": "Implementar JWT claims específicos",
                "description": "Agregar claims de scope y expiration",
                "effort_hours": 3.0,
                "benefits": [
                    "Principle of least privilege",
                    "Tokens con tiempo de vida limitado",
                    "Auditoría granular de permisos"
                ],
                "implementation": [
                    "1. Definir scopes: deposito:read, negocio:write, etc.",
                    "2. Agregar exp claim (1 hora)",
                    "3. Validar scopes en cada endpoint",
                    "4. Implementar token refresh mechanism"
                ]
            }
        ]
    
    def generate_report(self) -> str:
        """Genera reporte legible del análisis JWT"""
        analysis = self.analyze_jwt_communication()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════════",
            "║ JWT COMMUNICATION ANALYSIS - Inter-Agent Security",
            "╠═══════════════════════════════════════════════════════════════",
            "║ CURRENT CONFIGURATION",
        ]
        
        config = analysis["jwt_configuration"]
        lines.append(f"║ Single Secret: {'YES ⚠️' if config['single_secret'] else 'NO ✓'}")
        lines.append(f"║ Secret Name: {config['secret_name']}")
        lines.append(f"║ Agents Using JWT: {len(config['agents_using_jwt'])}")
        lines.append(f"║ Rotation Policy: {config['rotation_policy']}")
        
        lines.append("╠═══════════════════════════════════════════════════════════════")
        lines.append("║ COMMUNICATION FLOWS")
        for flow in analysis["communication_flows"]:
            lines.append(f"║ {flow['from']} → {flow['to']} (Port {flow['port']})")
            if not flow['encrypted']:
                lines.append(f"║   ⚠️ Unencrypted HTTP")
        
        lines.append("╠═══════════════════════════════════════════════════════════════")
        lines.append("║ RISK ASSESSMENT")
        for risk_name, risk_data in analysis["risk_assessment"].items():
            lines.append(f"║ [{risk_data['severity']}/10] {risk_data['id']}")
            lines.append(f"║   {risk_data['description']}")
        
        lines.append("╠═══════════════════════════════════════════════════════════════")
        lines.append("║ ATTACK VECTORS")
        for i, vector in enumerate(analysis["attack_vectors"], 1):
            lines.append(f"║ {i}. {vector['vector']}")
            lines.append(f"║    Likelihood: {vector['likelihood']}, Impact: {vector['impact']}")
        
        lines.append("╠═══════════════════════════════════════════════════════════════")
        lines.append("║ MITIGATION RECOMMENDATIONS (Top 3)")
        for mitigation in analysis["mitigation_recommendations"][:3]:
            lines.append(f"║ [{mitigation['priority']}] {mitigation['title']}")
            lines.append(f"║   Effort: {mitigation['effort_hours']}h")
        
        lines.append("╚═══════════════════════════════════════════════════════════════")
        
        return "\n".join(lines)


if __name__ == "__main__":
    # Test con profile generado
    from pathlib import Path
    
    reports_dir = Path(__file__).parent.parent / "reports"
    profile_file = reports_dir / "stage0_profile.json"
    
    if profile_file.exists():
        with open(profile_file, 'r', encoding='utf-8') as f:
            profile = json.load(f)
        
        analyzer = JWTCommunicationAnalyzer(profile)
        analysis = analyzer.analyze_jwt_communication()
        
        print(analyzer.generate_report())
        
        # Guardar análisis
        output_file = reports_dir / "stage1_jwt_analysis.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)
        
        print(f"\nJWT analysis saved to: {output_file}")
    else:
        print(f"Profile file not found: {profile_file}")
        print("Run stage0_ingestion/project_profile.py first")
