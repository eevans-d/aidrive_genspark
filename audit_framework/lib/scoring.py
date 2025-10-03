#!/usr/bin/env python3
"""
Funciones de Scoring para Análisis de Riesgos
Implementa fórmulas específicas según especificación MEGA PLANIFICACIÓN
"""

from typing import Dict, Any, List
from enum import Enum


class RiskType(Enum):
    """Tipos de riesgo con multiplicadores contextuales"""
    CONTAINER_SECURITY = "container_security"
    AUTHENTICATION_SECURITY = "authentication_security"
    BUSINESS_LOGIC = "business_logic"
    PERFORMANCE_RELIABILITY = "performance_reliability"
    BUSINESS_CONTINUITY = "business_continuity"
    SECURITY = "security"


# Multiplicadores contextuales según especificación
CONTEXT_MULTIPLIERS = {
    RiskType.CONTAINER_SECURITY: 1.3,         # Crítico identificado
    RiskType.AUTHENTICATION_SECURITY: 1.25,   # JWT único crítico
    RiskType.BUSINESS_LOGIC: 1.2,             # Contexto argentino
    RiskType.PERFORMANCE_RELIABILITY: 1.15,   # Tiempo real importante
    RiskType.BUSINESS_CONTINUITY: 1.4,        # Auditoría forense crítica
    RiskType.SECURITY: 1.1                    # Seguridad general
}


def calculate_risk_score(severity: float, impact: float, probability: float, 
                        risk_type: RiskType) -> float:
    """
    Calcula el score de un riesgo según la fórmula:
    Score = (Severidad × 0.4) + (Impacto × 0.35) + (Probabilidad × 0.25)
    
    Luego aplica multiplicador contextual según tipo de riesgo.
    
    Args:
        severity: Severidad del riesgo (1-10)
        impact: Impacto del riesgo (1-10)
        probability: Probabilidad del riesgo (1-10)
        risk_type: Tipo de riesgo para aplicar multiplicador
    
    Returns:
        Score final con multiplicador aplicado
    """
    # Fórmula base según especificación
    base_score = (severity * 0.4) + (impact * 0.35) + (probability * 0.25)
    
    # Aplicar multiplicador contextual
    multiplier = CONTEXT_MULTIPLIERS.get(risk_type, 1.0)
    final_score = base_score * multiplier
    
    return round(final_score, 2)


def calculate_roi(severity: float, probability: float, effort_hours: float,
                 benefit_percentage: float = 0.0, context_multiplier: float = 1.0) -> float:
    """
    Calcula el ROI de una mitigación según la fórmula:
    ROI = (Beneficio Cuantificable × Multiplicador Contexto) / Esfuerzo (horas)
    
    Args:
        severity: Severidad del riesgo (1-10)
        probability: Probabilidad del riesgo (1-10)
        effort_hours: Esfuerzo estimado en horas
        benefit_percentage: Beneficio cuantificable (0-100)
        context_multiplier: Multiplicador contextual adicional
    
    Returns:
        ROI calculado
    """
    if effort_hours == 0:
        return 0.0
    
    # Si no hay beneficio explícito, usar severidad × probabilidad
    if benefit_percentage == 0.0:
        quantifiable_benefit = severity * probability
    else:
        quantifiable_benefit = benefit_percentage / 10.0  # Normalizar a escala 1-10
    
    roi = (quantifiable_benefit * context_multiplier) / effort_hours
    
    return round(roi, 2)


def is_roi_acceptable(roi: float, benefit_percentage: float, effort_hours: float) -> bool:
    """
    Verifica si un ROI es aceptable según criterios:
    - ROI ≥ 1.6
    - Beneficio > 18%
    - Esfuerzo < 7 horas
    
    Args:
        roi: ROI calculado
        benefit_percentage: Porcentaje de beneficio
        effort_hours: Horas de esfuerzo
    
    Returns:
        True si cumple todos los criterios
    """
    return roi >= 1.6 and benefit_percentage > 18 and effort_hours < 7


def classify_risk_severity(score: float) -> str:
    """
    Clasifica un riesgo según su score
    
    Args:
        score: Score calculado del riesgo
    
    Returns:
        Clasificación: CRÍTICO, ALTO, MEDIO-ALTO, MEDIO, BAJO
    """
    if score >= 9.0:
        return "CRÍTICO"
    elif score >= 7.5:
        return "ALTO"
    elif score >= 6.5:
        return "MEDIO-ALTO"
    elif score >= 5.0:
        return "MEDIO"
    else:
        return "BAJO"


def prioritize_risks(risks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Prioriza una lista de riesgos por score y ROI
    
    Args:
        risks: Lista de diccionarios con información de riesgos
    
    Returns:
        Lista ordenada de riesgos (mayor prioridad primero)
    """
    # Calcular scores si no existen
    for risk in risks:
        if 'score' not in risk:
            risk_type = RiskType[risk.get('type', 'SECURITY').upper()]
            risk['score'] = calculate_risk_score(
                risk['severity'],
                risk['impact_score'],
                risk['probability'],
                risk_type
            )
        
        if 'roi' not in risk:
            risk['roi'] = calculate_roi(
                risk['severity'],
                risk['probability'],
                risk.get('estimated_effort_hours', 4.0)
            )
        
        risk['severity_class'] = classify_risk_severity(risk['score'])
    
    # Ordenar por score (descendente), luego por ROI (descendente)
    return sorted(risks, key=lambda x: (-x['score'], -x['roi']))


def calculate_improvement_delta(previous_completeness: float, 
                               current_completeness: float) -> float:
    """
    Calcula el delta de mejora entre dos mediciones
    
    Args:
        previous_completeness: Completitud anterior (0-100)
        current_completeness: Completitud actual (0-100)
    
    Returns:
        Delta de mejora en porcentaje
    """
    if previous_completeness == 0:
        return current_completeness
    
    delta = ((current_completeness - previous_completeness) / previous_completeness) * 100
    return round(delta, 2)


def meets_improvement_threshold(improvement_delta: float, 
                               threshold: float = 12.0) -> bool:
    """
    Verifica si una mejora cumple el umbral mínimo
    
    Args:
        improvement_delta: Delta de mejora en porcentaje
        threshold: Umbral mínimo (default 12% según especificación)
    
    Returns:
        True si cumple el umbral
    """
    return improvement_delta >= threshold


# Estimaciones de esfuerzo predefinidas por tipo de mitigación
EFFORT_ESTIMATES = {
    'R1_CONTAINER_ROOT_EXECUTION': 3.0,      # Dockerfile USER + security scan
    'R2_JWT_SINGLE_SECRET': 8.0,             # Complejo: múltiples JWT o mTLS
    'R3_OCR_ENGINE_TIMEOUT': 4.0,            # Timeout configuration + wrapper
    'R4_ML_HARDCODED_INFLATION': 6.0,        # Config externa + validation
    'R5_FORENSIC_CASCADE_FAILURE': 5.0,      # Partial recovery logic
    'R6_NO_DEPENDENCY_SCANNING': 2.0,        # CI/CD integration
    'R7_WEBSOCKET_MEMORY_LEAK': 3.0          # Connection cleanup
}


def get_effort_estimate(risk_id: str, default: float = 4.0) -> float:
    """
    Obtiene estimación de esfuerzo para un riesgo conocido
    
    Args:
        risk_id: ID del riesgo
        default: Valor por defecto si no se encuentra
    
    Returns:
        Horas estimadas de esfuerzo
    """
    return EFFORT_ESTIMATES.get(risk_id, default)


if __name__ == "__main__":
    # Tests básicos
    print("=== Test de Scoring ===")
    
    # Ejemplo: R2_JWT_SINGLE_SECRET
    score = calculate_risk_score(
        severity=9, 
        impact=10, 
        probability=6,
        risk_type=RiskType.AUTHENTICATION_SECURITY
    )
    print(f"R2_JWT_SINGLE_SECRET Score: {score} (esperado: ~9.69)")
    
    # Ejemplo: R1_CONTAINER_ROOT_EXECUTION
    score = calculate_risk_score(
        severity=10,
        impact=9,
        probability=8,
        risk_type=RiskType.CONTAINER_SECURITY
    )
    print(f"R1_CONTAINER_ROOT_EXECUTION Score: {score} (esperado: ~9.28)")
    
    # Test de ROI
    roi = calculate_roi(severity=9, probability=6, effort_hours=3.0)
    print(f"\nROI para mitigación (9, 6, 3h): {roi}")
    print(f"¿Aceptable? {is_roi_acceptable(roi, 20, 3)}")
    
    # Test de clasificación
    print(f"\nClasificación score 9.69: {classify_risk_severity(9.69)}")
    print(f"Clasificación score 7.48: {classify_risk_severity(7.48)}")
    print(f"Clasificación score 6.84: {classify_risk_severity(6.84)}")
