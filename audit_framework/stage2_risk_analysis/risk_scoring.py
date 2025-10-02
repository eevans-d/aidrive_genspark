#!/usr/bin/env python3
"""
ETAPA 2: Risk Scoring - Priorización con Scoring Contextual
Calcula scores y prioriza riesgos según fórmulas específicas
"""

import json
from typing import Dict, Any, List
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent.parent))
from lib.scoring import (
    calculate_risk_score, calculate_roi, is_roi_acceptable,
    classify_risk_severity, prioritize_risks, RiskType, get_effort_estimate
)


class RiskScorer:
    """
    Calcula scores contextuales y prioriza riesgos
    """
    
    def __init__(self, risks: List[Dict[str, Any]]):
        self.risks = risks
    
    def score_and_prioritize(self) -> Dict[str, Any]:
        """Score todos los riesgos y prioriza"""
        scored_risks = []
        
        for risk in self.risks:
            scored_risk = self._score_risk(risk)
            scored_risks.append(scored_risk)
        
        # Priorizar usando función de lib/scoring.py
        prioritized = prioritize_risks(scored_risks)
        
        # Análisis de scoring
        analysis = {
            "total_risks": len(prioritized),
            "risks": prioritized,
            "scoring_summary": self._generate_scoring_summary(prioritized),
            "top_7_risks": prioritized[:7],  # Top-7 según especificación
            "roi_analysis": self._analyze_roi(prioritized)
        }
        
        return analysis
    
    def _score_risk(self, risk: Dict[str, Any]) -> Dict[str, Any]:
        """Calcula score de un riesgo individual"""
        # Convertir tipo a enum
        risk_type_str = risk.get('type', 'security')
        try:
            risk_type = RiskType[risk_type_str.upper().replace('-', '_')]
        except KeyError:
            risk_type = RiskType.SECURITY
        
        # Calcular score usando función de lib/scoring.py
        score = calculate_risk_score(
            severity=risk['severity'],
            impact=risk['impact_score'],
            probability=risk['probability'],
            risk_type=risk_type
        )
        
        # Obtener estimación de esfuerzo
        effort_hours = get_effort_estimate(risk['id'])
        
        # Calcular ROI
        roi = calculate_roi(
            severity=risk['severity'],
            probability=risk['probability'],
            effort_hours=effort_hours
        )
        
        # Clasificar severidad
        severity_class = classify_risk_severity(score)
        
        # Agregar datos calculados
        risk['score'] = score
        risk['estimated_effort_hours'] = effort_hours
        risk['roi'] = roi
        risk['severity_class'] = severity_class
        risk['roi_acceptable'] = is_roi_acceptable(
            roi=roi,
            benefit_percentage=risk['severity'] * 10,  # Aproximación
            effort_hours=effort_hours
        )
        
        return risk
    
    def _generate_scoring_summary(self, risks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Genera resumen de scoring"""
        by_severity_class = {}
        by_type = {}
        
        for risk in risks:
            # Agrupar por clase de severidad
            sev_class = risk['severity_class']
            if sev_class not in by_severity_class:
                by_severity_class[sev_class] = []
            by_severity_class[sev_class].append(risk['id'])
            
            # Agrupar por tipo
            risk_type = risk['type']
            if risk_type not in by_type:
                by_type[risk_type] = []
            by_type[risk_type].append(risk['id'])
        
        return {
            "by_severity_class": by_severity_class,
            "by_type": by_type,
            "average_score": sum(r['score'] for r in risks) / len(risks) if risks else 0,
            "highest_score": max(r['score'] for r in risks) if risks else 0,
            "lowest_score": min(r['score'] for r in risks) if risks else 0
        }
    
    def _analyze_roi(self, risks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analiza ROI de mitigaciones"""
        acceptable_roi = [r for r in risks if r.get('roi_acceptable', False)]
        high_roi = [r for r in risks if r.get('roi', 0) >= 1.6]
        
        return {
            "acceptable_count": len(acceptable_roi),
            "high_roi_count": len(high_roi),
            "average_roi": sum(r['roi'] for r in risks) / len(risks) if risks else 0,
            "total_effort_hours": sum(r['estimated_effort_hours'] for r in risks),
            "recommended_priorities": [r['id'] for r in acceptable_roi]
        }
    
    def generate_report(self, analysis: Dict[str, Any]) -> str:
        """Genera reporte legible de scoring"""
        lines = [
            "╔═══════════════════════════════════════════════════════════════",
            "║ RISK SCORING & PRIORITIZATION",
            "╠═══════════════════════════════════════════════════════════════",
            f"║ Total Risks: {analysis['total_risks']}",
            f"║ Average Score: {analysis['scoring_summary']['average_score']:.2f}",
            f"║ Highest Score: {analysis['scoring_summary']['highest_score']:.2f}",
            "╠═══════════════════════════════════════════════════════════════",
            "║ TOP-7 PRIORITIZED RISKS",
        ]
        
        for i, risk in enumerate(analysis['top_7_risks'], 1):
            lines.append(f"║ {i}. {risk['id']}")
            lines.append(f"║    Score: {risk['score']:.2f} ({risk['severity_class']})")
            lines.append(f"║    ROI: {risk['roi']:.2f} (Effort: {risk['estimated_effort_hours']}h)")
            lines.append(f"║    Type: {risk['type']}")
            lines.append("║")
        
        lines.append("╠═══════════════════════════════════════════════════════════════")
        lines.append("║ ROI ANALYSIS")
        roi_analysis = analysis['roi_analysis']
        lines.append(f"║ High ROI Mitigations: {roi_analysis['high_roi_count']}/{analysis['total_risks']}")
        lines.append(f"║ Average ROI: {roi_analysis['average_roi']:.2f}")
        lines.append(f"║ Total Effort Required: {roi_analysis['total_effort_hours']}h")
        
        lines.append("╠═══════════════════════════════════════════════════════════════")
        lines.append("║ SEVERITY DISTRIBUTION")
        for sev_class, risk_ids in analysis['scoring_summary']['by_severity_class'].items():
            lines.append(f"║ {sev_class}: {len(risk_ids)} risks")
        
        lines.append("╚═══════════════════════════════════════════════════════════════")
        
        return "\n".join(lines)


if __name__ == "__main__":
    # Test con riesgos detectados
    reports_dir = Path(__file__).parent.parent / "reports"
    risks_file = reports_dir / "stage2_risks_detected.json"
    
    if risks_file.exists():
        with open(risks_file) as f:
            risks = json.load(f)
        
        scorer = RiskScorer(risks)
        analysis = scorer.score_and_prioritize()
        
        print(scorer.generate_report(analysis))
        
        # Guardar análisis
        output_file = reports_dir / "stage2_risks_prioritized.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)
        
        print(f"\nScoring analysis saved to: {output_file}")
        
        # Mostrar Top-3 con detalles
        print("\n" + "="*60)
        print("TOP-3 CRITICAL RISKS WITH DETAILS")
        print("="*60)
        for i, risk in enumerate(analysis['top_7_risks'][:3], 1):
            print(f"\n{i}. {risk['id']} (Score: {risk['score']:.2f})")
            print(f"   Title: {risk['title']}")
            print(f"   Business Impact: {risk['business_impact']}")
            print(f"   Effort: {risk['estimated_effort_hours']}h, ROI: {risk['roi']:.2f}")
    else:
        print(f"Risks file not found: {risks_file}")
        print("Run risk_detector.py first")
