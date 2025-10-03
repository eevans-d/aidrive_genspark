#!/usr/bin/env python3
"""
Control Envelope - Sistema de Control de Iteraciones y Métricas
Para el Framework de Auditoría Pre-Despliegue
"""

import json
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path


class ControlEnvelope:
    """
    Control de ejecución y métricas para el framework de auditoría.
    Implementa anti-bucle y criterios de suficiencia según especificación.
    """
    
    # Constantes según especificación
    MAX_ITERATIONS_GLOBAL = 22
    MAX_ITERATIONS_PER_STAGE = 2
    MIN_IMPROVEMENT_THRESHOLD = 0.12  # 12%
    MIN_COMPLETENESS_CRITICAL = 0.92  # 92%
    STAGNATION_OVERLAP_THRESHOLD = 0.82  # 82%
    
    def __init__(self, project_name: str = "aidrive_genspark_forensic"):
        self.project_name = project_name
        self.execution_id = f"{project_name}_audit_{datetime.now().strftime('%Y-%m-%d')}"
        self.envelope = self._initialize_envelope()
        
    def _initialize_envelope(self) -> Dict[str, Any]:
        """Inicializa el control envelope con valores por defecto"""
        return {
            "execution_id": self.execution_id,
            "project_name": self.project_name,
            "project_criticality": "mission-critical",
            "architecture_type": "microservices_multi_agent",
            "services_count": 7,
            "freeze_constraints": {
                "directory_renames": False,
                "heavy_dependencies": False,
                "broad_refactors": False,
                "core_logic_changes": False
            },
            "context_preservation": {
                "afip_integration": True,
                "inflation_rate_monthly": 4.5,
                "jwt_communication": True,
                "ocr_multiengine": True,
                "forensic_phases": 5
            },
            "stage_id": "stage0",
            "iteration_count": 0,
            "max_iterations": self.MAX_ITERATIONS_GLOBAL,
            "status": "pending",
            "metrics": {
                "completeness_percentage": 0.0,
                "improvement_delta": 0.0,
                "security_score": 0.0,
                "freeze_compliance": True
            },
            "stages_completed": [],
            "stages_data": {
                "stage0": {"iterations": 0, "status": "pending", "completeness": 0.0},
                "stage1": {"iterations": 0, "status": "pending", "completeness": 0.0},
                "stage2": {"iterations": 0, "status": "pending", "completeness": 0.0}
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def start_stage(self, stage_id: str):
        """Inicializa una nueva etapa de auditoría"""
        self.envelope["stage_id"] = stage_id
        self.envelope["status"] = "executing"
        if stage_id not in self.envelope["stages_data"]:
            self.envelope["stages_data"][stage_id] = {
                "iterations": 0,
                "status": "pending",
                "completeness": 0.0
            }
        self.envelope["stages_data"][stage_id]["status"] = "executing"
    
    def increment_iteration(self, stage_id: Optional[str] = None):
        """Incrementa contador de iteraciones"""
        self.envelope["iteration_count"] += 1
        if stage_id:
            self.envelope["stages_data"][stage_id]["iterations"] += 1
    
    def update_metrics(self, completeness: float, improvement: float, 
                      security_score: float = 0.0, stage_id: Optional[str] = None):
        """Actualiza métricas de progreso"""
        self.envelope["metrics"]["completeness_percentage"] = completeness
        self.envelope["metrics"]["improvement_delta"] = improvement
        self.envelope["metrics"]["security_score"] = security_score
        
        if stage_id:
            self.envelope["stages_data"][stage_id]["completeness"] = completeness
    
    def complete_stage(self, stage_id: str, completeness: float):
        """Marca una etapa como completada"""
        self.envelope["stages_data"][stage_id]["status"] = "complete"
        self.envelope["stages_data"][stage_id]["completeness"] = completeness
        if stage_id not in self.envelope["stages_completed"]:
            self.envelope["stages_completed"].append(stage_id)
    
    def should_continue_iteration(self, stage_id: str, improvement: float) -> bool:
        """
        Determina si debe continuar iterando basado en criterios anti-bucle
        
        Returns:
            True si debe continuar, False si debe detenerse
        """
        # Verificar límite global
        if self.envelope["iteration_count"] >= self.MAX_ITERATIONS_GLOBAL:
            return False
        
        # Verificar límite por etapa
        stage_iterations = self.envelope["stages_data"][stage_id]["iterations"]
        if stage_iterations >= self.MAX_ITERATIONS_PER_STAGE:
            return False
        
        # Verificar umbral de mejora
        if improvement < self.MIN_IMPROVEMENT_THRESHOLD:
            return False
        
        return True
    
    def is_complete(self, completeness: float) -> bool:
        """Verifica si se alcanzó suficiencia en componentes críticos"""
        return completeness >= self.MIN_COMPLETENESS_CRITICAL
    
    def check_stagnation(self, current_results: set, previous_results: set) -> bool:
        """
        Detecta estancamiento comparando resultados actuales con anteriores
        
        Returns:
            True si hay estancamiento (>82% solapamiento)
        """
        if not previous_results:
            return False
        
        overlap = len(current_results & previous_results)
        total = len(current_results | previous_results)
        
        if total == 0:
            return False
        
        overlap_ratio = overlap / total
        return overlap_ratio > self.STAGNATION_OVERLAP_THRESHOLD
    
    def set_error(self, error_message: str):
        """Marca el envelope con estado de error"""
        self.envelope["status"] = "error"
        self.envelope["error"] = error_message
        self.envelope["timestamp"] = datetime.now().isoformat()
    
    def set_complete(self):
        """Marca el envelope como completado exitosamente"""
        self.envelope["status"] = "complete"
        self.envelope["timestamp"] = datetime.now().isoformat()
    
    def save(self, output_path: Path):
        """Guarda el control envelope en archivo JSON"""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.envelope, f, indent=2, ensure_ascii=False)
    
    def load(self, input_path: Path) -> Dict[str, Any]:
        """Carga un control envelope desde archivo JSON"""
        with open(input_path, 'r', encoding='utf-8') as f:
            self.envelope = json.load(f)
        return self.envelope
    
    def get_summary(self) -> str:
        """Retorna resumen legible del estado actual"""
        lines = [
            f"╔═══════════════════════════════════════════════════════════════",
            f"║ CONTROL ENVELOPE - {self.project_name}",
            f"╠═══════════════════════════════════════════════════════════════",
            f"║ Execution ID: {self.execution_id}",
            f"║ Status: {self.envelope['status']}",
            f"║ Current Stage: {self.envelope['stage_id']}",
            f"║ Total Iterations: {self.envelope['iteration_count']}/{self.MAX_ITERATIONS_GLOBAL}",
            f"╠═══════════════════════════════════════════════════════════════",
            f"║ METRICS",
            f"║ Completeness: {self.envelope['metrics']['completeness_percentage']:.1f}%",
            f"║ Improvement: {self.envelope['metrics']['improvement_delta']:.1f}%",
            f"║ Security Score: {self.envelope['metrics']['security_score']:.2f}",
            f"║ FREEZE Compliance: {'✓' if self.envelope['metrics']['freeze_compliance'] else '✗'}",
            f"╠═══════════════════════════════════════════════════════════════",
            f"║ STAGES COMPLETED: {len(self.envelope['stages_completed'])}/3",
        ]
        
        for stage_id, stage_data in self.envelope["stages_data"].items():
            status_icon = "✓" if stage_data["status"] == "complete" else "○"
            lines.append(
                f"║ {status_icon} {stage_id}: {stage_data['completeness']:.1f}% "
                f"({stage_data['iterations']} iterations)"
            )
        
        lines.append(f"╚═══════════════════════════════════════════════════════════════")
        
        return "\n".join(lines)
    
    def to_dict(self) -> Dict[str, Any]:
        """Retorna el envelope como diccionario"""
        return self.envelope.copy()


if __name__ == "__main__":
    # Test básico
    envelope = ControlEnvelope()
    print(envelope.get_summary())
    
    # Simular progreso
    envelope.start_stage("stage0")
    envelope.increment_iteration("stage0")
    envelope.update_metrics(completeness=95.0, improvement=15.0, stage_id="stage0")
    envelope.complete_stage("stage0", 95.0)
    
    print("\n" + envelope.get_summary())
