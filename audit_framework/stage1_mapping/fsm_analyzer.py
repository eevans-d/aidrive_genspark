#!/usr/bin/env python3
"""
ETAPA 1: FSM Analyzer - Análisis de Máquinas de Estado Finito
Extrae y analiza FSMs de cada agente del sistema multi-agente
"""

import json
from typing import Dict, Any, List, Set, Tuple
from pathlib import Path


class FSMAnalyzer:
    """
    Analiza Finite State Machines (FSM) de cada agente
    Basado en especificación del problema statement
    """
    
    def __init__(self):
        self.fsms = self._define_agent_fsms()
    
    def _define_agent_fsms(self) -> Dict[str, Dict[str, Any]]:
        """
        Define FSMs específicas para cada agente según especificación
        """
        return {
            "agente_deposito": {
                "description": "Gestión de inventario con transacciones ACID",
                "states": [
                    "idle",
                    "processing_inventory_query",
                    "database_access",
                    "response_ready",
                    "error"
                ],
                "transitions": [
                    ("idle", "processing_inventory_query", "inventory_request"),
                    ("processing_inventory_query", "database_access", "query_validated"),
                    ("database_access", "response_ready", "data_retrieved"),
                    ("database_access", "error", "database_timeout"),
                    ("response_ready", "idle", "response_sent"),
                    ("error", "idle", "error_logged")
                ],
                "critical_paths": [
                    ["idle", "processing_inventory_query", "database_access", "response_ready", "idle"]
                ],
                "timeout_states": ["database_access"],
                "error_recovery": True
            },
            
            "agente_negocio": {
                "description": "OCR Multi-Engine + Validación AFIP",
                "states": [
                    "idle",
                    "ocr_preprocessing",
                    "easyocr_processing",
                    "tesseract_processing",
                    "paddleocr_processing",
                    "voting_consensus",
                    "afip_validation",
                    "result_ready",
                    "error"
                ],
                "transitions": [
                    ("idle", "ocr_preprocessing", "factura_afip_received"),
                    ("ocr_preprocessing", "easyocr_processing", "image_preprocessed"),
                    ("easyocr_processing", "tesseract_processing", "easyocr_complete"),
                    ("tesseract_processing", "paddleocr_processing", "tesseract_complete"),
                    ("paddleocr_processing", "voting_consensus", "paddleocr_complete"),
                    ("voting_consensus", "afip_validation", "consensus_reached"),
                    ("afip_validation", "result_ready", "cuit_cuil_validated"),
                    ("afip_validation", "error", "validation_failed"),
                    ("result_ready", "idle", "factura_processed"),
                    ("*", "error", "timeout_15s")
                ],
                "critical_paths": [
                    ["idle", "ocr_preprocessing", "easyocr_processing", "tesseract_processing", 
                     "paddleocr_processing", "voting_consensus", "afip_validation", "result_ready", "idle"]
                ],
                "timeout_states": ["easyocr_processing", "tesseract_processing", "paddleocr_processing"],
                "timeout_config": "15000ms (not explicitly configured - RISK)",
                "ocr_engines": ["EasyOCR", "Tesseract", "PaddleOCR"],
                "error_recovery": False  # RISK: No partial recovery
            },
            
            "ml_service": {
                "description": "Predicción de demanda con ajuste inflación 4.5%",
                "states": [
                    "idle",
                    "data_collection",
                    "preprocessing",
                    "model_inference",
                    "inflation_adjustment_4_5",
                    "recommendation_ready",
                    "error"
                ],
                "transitions": [
                    ("idle", "data_collection", "demand_prediction_request"),
                    ("data_collection", "preprocessing", "historical_data_loaded"),
                    ("preprocessing", "model_inference", "data_normalized"),
                    ("model_inference", "inflation_adjustment_4_5", "prediction_generated"),
                    ("inflation_adjustment_4_5", "recommendation_ready", "inflation_applied"),
                    ("recommendation_ready", "idle", "recommendation_delivered"),
                    ("*", "error", "model_failure")
                ],
                "critical_paths": [
                    ["idle", "data_collection", "preprocessing", "model_inference",
                     "inflation_adjustment_4_5", "recommendation_ready", "idle"]
                ],
                "business_logic": {
                    "inflation_rate": 4.5,
                    "inflation_hardcoded": True,  # RISK
                    "currency": "ARS"
                },
                "error_recovery": True
            },
            
            "web_dashboard": {
                "description": "Orquestador con JWT y WebSockets",
                "states": [
                    "idle",
                    "jwt_validation",
                    "agent_orchestration",
                    "websocket_broadcast",
                    "metrics_update",
                    "response_ready",
                    "error"
                ],
                "transitions": [
                    ("idle", "jwt_validation", "api_request"),
                    ("jwt_validation", "agent_orchestration", "jwt_valid"),
                    ("jwt_validation", "error", "jwt_invalid"),
                    ("agent_orchestration", "websocket_broadcast", "agents_responded"),
                    ("websocket_broadcast", "metrics_update", "clients_notified"),
                    ("metrics_update", "response_ready", "prometheus_updated"),
                    ("response_ready", "idle", "response_sent"),
                    ("*", "error", "agent_timeout")
                ],
                "critical_paths": [
                    ["idle", "jwt_validation", "agent_orchestration", "websocket_broadcast",
                     "metrics_update", "response_ready", "idle"]
                ],
                "orchestration_targets": ["agente_deposito", "agente_negocio", "ml_service"],
                "jwt_config": {
                    "secret": "JWT_SECRET_KEY",
                    "single_secret": True,  # RISK
                    "shared_across_agents": True  # RISK
                },
                "websocket_config": {
                    "cleanup_explicit": False  # RISK: Memory leak potential
                },
                "error_recovery": True
            },
            
            "forensic_audit": {
                "description": "Auditoría forense en 5 fases secuenciales",
                "states": [
                    "idle",
                    "phase_1_inventory_analysis",
                    "phase_2_ocr_validation",
                    "phase_3_ml_predictions",
                    "phase_4_dashboard_metrics",
                    "phase_5_comprehensive_report",
                    "report_ready",
                    "error"
                ],
                "transitions": [
                    ("idle", "phase_1_inventory_analysis", "forensic_audit_triggered"),
                    ("phase_1_inventory_analysis", "phase_2_ocr_validation", "inventory_analyzed"),
                    ("phase_2_ocr_validation", "phase_3_ml_predictions", "ocr_validated"),
                    ("phase_3_ml_predictions", "phase_4_dashboard_metrics", "predictions_analyzed"),
                    ("phase_4_dashboard_metrics", "phase_5_comprehensive_report", "metrics_analyzed"),
                    ("phase_5_comprehensive_report", "report_ready", "report_compiled"),
                    ("report_ready", "idle", "audit_complete"),
                    ("*", "error", "phase_failure")
                ],
                "critical_paths": [
                    ["idle", "phase_1_inventory_analysis", "phase_2_ocr_validation",
                     "phase_3_ml_predictions", "phase_4_dashboard_metrics",
                     "phase_5_comprehensive_report", "report_ready", "idle"]
                ],
                "phase_dependencies": {
                    "phase_1": ["agente_deposito"],
                    "phase_2": ["agente_negocio"],
                    "phase_3": ["ml_service"],
                    "phase_4": ["web_dashboard"],
                    "phase_5": ["all_agents"]
                },
                "cascade_failure_risk": True,  # RISK: No partial recovery
                "error_recovery": False
            }
        }
    
    def analyze_all_fsms(self) -> Dict[str, Any]:
        """Analiza todas las FSMs del sistema"""
        analysis = {
            "fsm_count": len(self.fsms),
            "agents": {},
            "critical_findings": [],
            "timeout_configurations": [],
            "error_recovery_analysis": {},
            "critical_paths_summary": []
        }
        
        for agent_name, fsm in self.fsms.items():
            agent_analysis = self._analyze_single_fsm(agent_name, fsm)
            analysis["agents"][agent_name] = agent_analysis
            
            # Recolectar hallazgos críticos
            if "timeout_config" in fsm and "not explicitly configured" in fsm["timeout_config"]:
                analysis["critical_findings"].append({
                    "agent": agent_name,
                    "type": "timeout_not_configured",
                    "severity": "HIGH",
                    "description": f"{agent_name} has timeout states without explicit configuration"
                })
            
            if not fsm.get("error_recovery", False):
                analysis["critical_findings"].append({
                    "agent": agent_name,
                    "type": "no_error_recovery",
                    "severity": "MEDIUM",
                    "description": f"{agent_name} lacks error recovery mechanisms"
                })
            
            # Configuraciones de timeout
            if "timeout_states" in fsm:
                analysis["timeout_configurations"].append({
                    "agent": agent_name,
                    "timeout_states": fsm["timeout_states"],
                    "configured": "timeout_config" in fsm
                })
            
            # Análisis de recuperación de errores
            analysis["error_recovery_analysis"][agent_name] = {
                "has_recovery": fsm.get("error_recovery", False),
                "error_states": [s for s in fsm["states"] if "error" in s.lower()]
            }
        
        return analysis
    
    def _analyze_single_fsm(self, agent_name: str, fsm: Dict[str, Any]) -> Dict[str, Any]:
        """Analiza una FSM individual"""
        states = set(fsm["states"])
        transitions = fsm["transitions"]
        
        # Calcular métricas
        transition_count = len(transitions)
        state_count = len(states)
        
        # Identificar estados terminales
        target_states = {t[1] for t in transitions if t[1] != "*"}
        source_states = {t[0] for t in transitions if t[0] != "*"}
        terminal_states = target_states - source_states
        
        # Identificar estados muertos (sin salida)
        dead_states = states - source_states
        
        # Verificar alcanzabilidad desde idle
        reachable = self._find_reachable_states("idle", transitions)
        unreachable = states - reachable
        
        return {
            "description": fsm.get("description", ""),
            "state_count": state_count,
            "transition_count": transition_count,
            "terminal_states": list(terminal_states),
            "dead_states": list(dead_states),
            "unreachable_states": list(unreachable),
            "critical_path_length": len(fsm.get("critical_paths", [[]])[0]),
            "has_timeout_states": len(fsm.get("timeout_states", [])) > 0,
            "has_error_recovery": fsm.get("error_recovery", False),
            "complexity": self._calculate_complexity(state_count, transition_count)
        }
    
    def _find_reachable_states(self, start: str, transitions: List[Tuple]) -> Set[str]:
        """Encuentra estados alcanzables desde un estado inicial"""
        reachable = {start}
        queue = [start]
        
        while queue:
            current = queue.pop(0)
            for source, target, _ in transitions:
                if (source == current or source == "*") and target not in reachable:
                    reachable.add(target)
                    queue.append(target)
        
        return reachable
    
    def _calculate_complexity(self, states: int, transitions: int) -> str:
        """Calcula complejidad de la FSM"""
        score = states + (transitions * 0.5)
        if score < 10:
            return "LOW"
        elif score < 20:
            return "MEDIUM"
        else:
            return "HIGH"
    
    def generate_report(self) -> str:
        """Genera reporte legible del análisis FSM"""
        analysis = self.analyze_all_fsms()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════════",
            "║ FSM ANALYSIS - Multi-Agent State Machines",
            "╠═══════════════════════════════════════════════════════════════",
            f"║ Total FSMs: {analysis['fsm_count']}",
            f"║ Critical Findings: {len(analysis['critical_findings'])}",
            "╠═══════════════════════════════════════════════════════════════",
        ]
        
        for agent_name, agent_data in analysis["agents"].items():
            lines.append(f"║ {agent_name.upper()}")
            lines.append(f"║   States: {agent_data['state_count']}, Transitions: {agent_data['transition_count']}")
            lines.append(f"║   Complexity: {agent_data['complexity']}")
            lines.append(f"║   Critical Path Length: {agent_data['critical_path_length']}")
            lines.append(f"║   Error Recovery: {'✓' if agent_data['has_error_recovery'] else '✗'}")
            
            if agent_data['unreachable_states']:
                lines.append(f"║   ⚠ Unreachable States: {', '.join(agent_data['unreachable_states'])}")
        
        lines.append("╠═══════════════════════════════════════════════════════════════")
        lines.append("║ CRITICAL FINDINGS")
        for finding in analysis["critical_findings"]:
            lines.append(f"║ • [{finding['severity']}] {finding['agent']}: {finding['type']}")
        
        lines.append("╚═══════════════════════════════════════════════════════════════")
        
        return "\n".join(lines)


if __name__ == "__main__":
    analyzer = FSMAnalyzer()
    analysis = analyzer.analyze_all_fsms()
    
    print(analyzer.generate_report())
    
    # Guardar análisis
    output_dir = Path(__file__).parent.parent / "reports"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "stage1_fsm_analysis.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        # Convertir sets a lists para JSON
        import copy
        analysis_json = copy.deepcopy(analysis)
        json.dump(analysis_json, f, indent=2, ensure_ascii=False)
    
    print(f"\nFSM analysis saved to: {output_file}")
