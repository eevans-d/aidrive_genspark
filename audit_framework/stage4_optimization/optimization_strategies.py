#!/usr/bin/env python3
"""
ETAPA 4: Optimization Strategies - Estrategias de Optimización
Genera estrategias de optimización priorizadas basadas en impacto y esfuerzo
"""

import json
from typing import Dict, Any, List
from pathlib import Path
from datetime import datetime


class OptimizationStrategist:
    """
    Genera estrategias de optimización priorizadas
    """
    
    def __init__(self, risks: List[Dict[str, Any]], verification_results: Dict[str, Any]):
        self.risks = risks
        self.verification_results = verification_results
    
    def generate_optimization_strategies(self) -> Dict[str, Any]:
        """Genera estrategias de optimización completas"""
        
        strategies = {
            "timestamp": datetime.now().isoformat(),
            "total_strategies": 7,
            "optimization_phases": [],
            "implementation_roadmap": self._generate_roadmap(),
            "quick_wins": self._identify_quick_wins(),
            "long_term_improvements": self._identify_long_term(),
            "total_estimated_effort_hours": 0,
            "expected_roi_improvement": 0
        }
        
        # Generate strategies for each failed/warning property
        for prop in self.verification_results.get("properties_verified", []):
            if prop["status"] in ["FAIL", "WARNING"]:
                strategy = self._create_strategy_for_property(prop)
                strategies["optimization_phases"].append(strategy)
        
        # Calculate totals
        strategies["total_estimated_effort_hours"] = sum(
            s["estimated_effort_hours"] for s in strategies["optimization_phases"]
        )
        strategies["expected_roi_improvement"] = sum(
            s["expected_roi"] for s in strategies["optimization_phases"]
        )
        
        return strategies
    
    def _create_strategy_for_property(self, prop: Dict[str, Any]) -> Dict[str, Any]:
        """Crea estrategia de optimización para una propiedad"""
        
        # Find corresponding risk
        risk = next((r for r in self.risks if r["id"] == prop["risk_id"]), None)
        
        strategy = {
            "property_id": prop["id"],
            "risk_id": prop["risk_id"],
            "current_status": prop["status"],
            "optimization_goal": f"Implementar {prop['description']}",
            "implementation_steps": [],
            "estimated_effort_hours": risk.get("estimated_effort_hours", 4.0) if risk else 4.0,
            "expected_roi": risk.get("roi", 0.0) if risk else 0.0,
            "priority": self._calculate_priority(prop, risk),
            "dependencies": [],
            "validation_criteria": []
        }
        
        # Generate specific implementation steps based on property
        if prop["id"] == "P1":
            strategy["implementation_steps"] = [
                "1. Crear usuarios no-root en cada Dockerfile",
                "2. Agregar directiva USER antes de CMD/ENTRYPOINT",
                "3. Ajustar permisos de archivos/directorios",
                "4. Actualizar docker-compose con security_opt",
                "5. Ejecutar smoke test verificando UID > 0"
            ]
            strategy["validation_criteria"] = [
                "docker exec <container> id -u retorna valor > 0",
                "Container logs no muestran warnings de permisos",
                "Aplicación funciona correctamente con usuario no-root"
            ]
        
        elif prop["id"] == "P2":
            strategy["implementation_steps"] = [
                "1. Generar JWT secrets únicos por servicio",
                "2. Actualizar docker-compose.production.yml",
                "3. Modificar validación JWT en cada agente",
                "4. Implementar rotación automática de secrets",
                "5. Ejecutar test de cross-service authentication"
            ]
            strategy["validation_criteria"] = [
                "JWT de agente_deposito no válido en agente_negocio",
                "Cada servicio valida solo su propio JWT",
                "Rotación automática funciona sin downtime"
            ]
            strategy["dependencies"] = ["Secret management system (Vault/AWS Secrets)"]
        
        elif prop["id"] == "P3":
            strategy["implementation_steps"] = [
                "1. Configurar timeouts explícitos para cada motor OCR",
                "2. Implementar circuit breaker pattern",
                "3. Agregar fallback a resultados parciales",
                "4. Configurar retry logic con backoff",
                "5. Load test con facturas malformadas"
            ]
            strategy["validation_criteria"] = [
                "Operación OCR nunca excede 30s",
                "Circuit breaker se activa tras 3 fallos",
                "Resultados parciales disponibles en timeout"
            ]
        
        elif prop["id"] == "P4":
            strategy["implementation_steps"] = [
                "1. Externalizar INFLATION_RATE_MONTHLY a .env",
                "2. Crear endpoint /config/inflation para actualización",
                "3. Implementar validación de rango (0-100%)",
                "4. Agregar hot-reload sin reiniciar servicio",
                "5. Test de cambio de inflación en runtime"
            ]
            strategy["validation_criteria"] = [
                "Inflación no está hardcoded en código",
                "Cambio de config se refleja sin redeploy",
                "Validación previene valores fuera de rango"
            ]
        
        elif prop["id"] == "P5":
            strategy["implementation_steps"] = [
                "1. Diseñar schema de checkpoints en DB/Redis",
                "2. Implementar checkpoint al finalizar cada fase",
                "3. Agregar mecanismo de recovery desde checkpoint",
                "4. Crear endpoint /audit/resume/{audit_id}",
                "5. Test de fallo en fase 3 con recovery exitoso"
            ]
            strategy["validation_criteria"] = [
                "Checkpoints persisten en DB tras cada fase",
                "Recovery restaura estado exacto de fase completada",
                "Audit puede continuarse tras fallo"
            ]
        
        elif prop["id"] == "P6":
            strategy["implementation_steps"] = [
                "1. Agregar safety check a .github/workflows/ci.yml",
                "2. Configurar fail-on-vulnerability: true",
                "3. Implementar dependabot.yml para actualizaciones",
                "4. Crear workflow mensual de security scan",
                "5. Integrar badges de security en README"
            ]
            strategy["validation_criteria"] = [
                "CI falla si encuentra vulnerabilidades HIGH/CRITICAL",
                "Dependabot crea PRs para actualizaciones",
                "Security badge muestra estado actual"
            ]
        
        elif prop["id"] == "P7":
            strategy["implementation_steps"] = [
                "1. Implementar @socketio.on('disconnect') handler",
                "2. Agregar cleanup de recursos en disconnect",
                "3. Configurar connection timeout y max connections",
                "4. Implementar connection pooling",
                "5. Load test con 1000 conexiones concurrentes"
            ]
            strategy["validation_criteria"] = [
                "Memoria se libera tras disconnect",
                "Max connections limit funciona correctamente",
                "No memory leaks tras load test"
            ]
        
        return strategy
    
    def _calculate_priority(self, prop: Dict[str, Any], risk: Dict[str, Any]) -> str:
        """Calcula prioridad basada en ROI y severidad"""
        if not risk:
            return "MEDIUM"
        
        roi = risk.get("roi", 0)
        severity = risk.get("severity", 0)
        
        if roi >= 20 or severity >= 9:
            return "CRITICAL"
        elif roi >= 10 or severity >= 7:
            return "HIGH"
        elif roi >= 5 or severity >= 5:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _generate_roadmap(self) -> Dict[str, Any]:
        """Genera roadmap de implementación"""
        return {
            "phase_1_week_1": {
                "duration": "1 semana",
                "focus": "Quick wins (ROI ≥ 20)",
                "optimizations": ["P1_Container_Security", "P6_Dependency_Scanning"],
                "total_effort_hours": 5,
                "expected_impact": "Reducción inmediata de superficie de ataque"
            },
            "phase_2_weeks_2_3": {
                "duration": "2 semanas",
                "focus": "High-priority improvements (ROI ≥ 10)",
                "optimizations": ["P3_OCR_Timeouts", "P7_WebSocket_Cleanup"],
                "total_effort_hours": 7,
                "expected_impact": "Mejora de resiliencia y performance"
            },
            "phase_3_month_2": {
                "duration": "1 mes",
                "focus": "Structural improvements",
                "optimizations": ["P4_ML_Configuration", "P5_Forensic_Checkpointing", "P2_JWT_Per_Service"],
                "total_effort_hours": 19,
                "expected_impact": "Arquitectura más robusta y mantenible"
            }
        }
    
    def _identify_quick_wins(self) -> List[Dict[str, Any]]:
        """Identifica optimizaciones de quick win (ROI ≥ 20)"""
        quick_wins = []
        
        for risk in self.risks:
            if risk.get("roi", 0) >= 20:
                quick_wins.append({
                    "risk_id": risk["id"],
                    "title": risk["title"],
                    "roi": risk["roi"],
                    "effort_hours": risk["estimated_effort_hours"],
                    "impact": "Immediate security/performance improvement"
                })
        
        return sorted(quick_wins, key=lambda x: x["roi"], reverse=True)
    
    def _identify_long_term(self) -> List[Dict[str, Any]]:
        """Identifica mejoras de largo plazo (esfuerzo > 6h)"""
        long_term = []
        
        for risk in self.risks:
            if risk.get("estimated_effort_hours", 0) >= 6:
                long_term.append({
                    "risk_id": risk["id"],
                    "title": risk["title"],
                    "effort_hours": risk["estimated_effort_hours"],
                    "strategic_value": "Architectural improvement",
                    "dependencies": self._identify_dependencies(risk["id"])
                })
        
        return sorted(long_term, key=lambda x: x["effort_hours"])
    
    def _identify_dependencies(self, risk_id: str) -> List[str]:
        """Identifica dependencias para implementación"""
        dependencies_map = {
            "R2_JWT_SINGLE_SECRET": ["Secret management system", "Service mesh (optional)"],
            "R4_ML_HARDCODED_INFLATION": ["Configuration service", "Hot reload mechanism"],
            "R5_FORENSIC_CASCADE_FAILURE": ["State persistence layer", "Recovery orchestrator"]
        }
        
        return dependencies_map.get(risk_id, [])
    
    def generate_report(self, strategies: Dict[str, Any]) -> str:
        """Genera reporte legible de estrategias"""
        lines = [
            "╔═══════════════════════════════════════════════════════════════",
            "║ OPTIMIZATION STRATEGIES - Stage 4",
            "╠═══════════════════════════════════════════════════════════════",
            f"║ Total Strategies: {strategies['total_strategies']}",
            f"║ Total Effort: {strategies['total_estimated_effort_hours']}h",
            f"║ Expected ROI Improvement: {strategies['expected_roi_improvement']:.2f}",
            "╠═══════════════════════════════════════════════════════════════",
            "║ QUICK WINS (ROI ≥ 20)",
        ]
        
        for qw in strategies["quick_wins"]:
            lines.append(f"║ • {qw['risk_id']}: ROI={qw['roi']:.2f}, Effort={qw['effort_hours']}h")
        
        lines.append("╠═══════════════════════════════════════════════════════════════")
        lines.append("║ IMPLEMENTATION ROADMAP")
        
        for phase_name, phase_data in strategies["implementation_roadmap"].items():
            lines.append(f"║ {phase_name}: {phase_data['duration']}")
            lines.append(f"║   Focus: {phase_data['focus']}")
            lines.append(f"║   Effort: {phase_data['total_effort_hours']}h")
        
        lines.append("╚═══════════════════════════════════════════════════════════════")
        
        return "\n".join(lines)


if __name__ == "__main__":
    # Test con resultados de stages 2 y 3
    reports_dir = Path(__file__).parent.parent / "reports"
    risks_file = reports_dir / "stage2_risks_prioritized.json"
    verification_file = reports_dir / "stage3_verification.json"
    
    if risks_file.exists() and verification_file.exists():
        with open(risks_file) as f:
            risks_data = json.load(f)
            risks = risks_data.get("risks", [])
        
        with open(verification_file) as f:
            verification = json.load(f)
        
        strategist = OptimizationStrategist(risks, verification)
        strategies = strategist.generate_optimization_strategies()
        
        print(strategist.generate_report(strategies))
        
        # Save results
        output_file = reports_dir / "stage4_optimization.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(strategies, f, indent=2, ensure_ascii=False)
        
        print(f"\nOptimization strategies saved to: {output_file}")
    else:
        print("Required files not found. Run stages 0-3 first.")
