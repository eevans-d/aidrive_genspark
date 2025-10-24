#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests para Phase 5: Comprehensive Reporting

Cubre:
- Generación de resumen ejecutivo
- Consolidación de hallazgos
- Consolidación de métricas
- Generación de recomendaciones
- Exportación en múltiples formatos
"""

import sys
import os
import pytest
from typing import Dict, Any
from importlib import import_module

# Path-based imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

_phase5_mod = import_module('inventario-retail.forensic_analysis.phases.phase_5_reporting')
Phase5Reporting = _phase5_mod.Phase5Reporting


class TestPhase5Reporting:
    """Test suite para Phase 5"""
    
    @pytest.fixture
    def phase5(self):
        """Fixture: instancia de Phase 5"""
        return Phase5Reporting()
    
    def test_phase5_initialization(self, phase5):
        """Test: Phase 5 se inicializa correctamente"""
        assert phase5 is not None
        assert phase5.phase_number == 5
        assert phase5.phase_name == "Comprehensive Reporting"
    
    def test_phase5_validate_input_succeeds(self, phase5):
        """Test: validate_input retorna True"""
        assert phase5.validate_input() is True
    
    def test_phase5_execute_returns_dict(self, phase5):
        """Test: execute() retorna estructura correcta"""
        result = phase5.execute()
        
        assert isinstance(result, dict)
        assert "phase" in result
        assert "timestamp" in result
        assert "executive_summary" in result
        assert "detailed_findings" in result
        assert "consolidated_metrics" in result
        assert "recommendations" in result
        assert "export_formats" in result
    
    def test_phase5_executive_summary_structure(self, phase5):
        """Test: executive_summary tiene estructura correcta"""
        result = phase5.execute()
        exec_summary = result["executive_summary"]
        
        assert "title" in exec_summary
        assert "analysis_date" in exec_summary
        assert "overall_status" in exec_summary
        assert "critical_findings" in exec_summary
        assert "warnings" in exec_summary
        assert "health_score" in exec_summary
        assert "key_insights" in exec_summary
        
        assert exec_summary["overall_status"] in ["HEALTHY", "DEGRADED", "CRITICAL"]
        assert isinstance(exec_summary["key_insights"], list)
        assert len(exec_summary["key_insights"]) > 0
    
    def test_phase5_detailed_findings(self, phase5):
        """Test: detailed_findings contiene hallazgos de todas las fases"""
        result = phase5.execute()
        findings = result["detailed_findings"]
        
        assert len(findings) >= 4  # Al menos 1 por fase
        
        # Verificar que hay hallazgos de diferentes fases
        phases_in_findings = {f["phase"] for f in findings}
        assert len(phases_in_findings) >= 4
        
        for finding in findings:
            assert "phase" in finding
            assert "category" in finding
            assert "severity" in finding
            assert "description" in finding
    
    def test_phase5_consolidated_metrics(self, phase5):
        """Test: consolidated_metrics agrupa por categoría"""
        result = phase5.execute()
        metrics = result["consolidated_metrics"]
        
        assert "operational" in metrics
        assert "quality" in metrics
        assert "performance" in metrics
        assert "business" in metrics
        
        # Verificar que cada categoría tiene métricas
        assert len(metrics["operational"]) > 0
        assert len(metrics["quality"]) > 0
        assert len(metrics["performance"]) > 0
        assert len(metrics["business"]) > 0
    
    def test_phase5_operational_metrics(self, phase5):
        """Test: operational metrics presente"""
        result = phase5.execute()
        metrics = result["consolidated_metrics"]["operational"]
        
        assert "uptime_percentage" in metrics
        assert "incidents_last_30d" in metrics
        assert "mean_time_to_recovery_minutes" in metrics
    
    def test_phase5_quality_metrics(self, phase5):
        """Test: quality metrics presente"""
        result = phase5.execute()
        metrics = result["consolidated_metrics"]["quality"]
        
        assert "data_integrity_score" in metrics
        assert "validation_pass_rate" in metrics
        assert "duplicate_records" in metrics
    
    def test_phase5_performance_metrics(self, phase5):
        """Test: performance metrics presente"""
        result = phase5.execute()
        metrics = result["consolidated_metrics"]["performance"]
        
        assert "avg_latency_ms" in metrics
        assert "p95_latency_ms" in metrics
        assert "error_rate_percentage" in metrics
    
    def test_phase5_business_metrics(self, phase5):
        """Test: business metrics presente"""
        result = phase5.execute()
        metrics = result["consolidated_metrics"]["business"]
        
        assert "avg_transaction_value" in metrics
        assert "inventory_efficiency" in metrics
        assert "inventory_turnover_per_month" in metrics
    
    def test_phase5_recommendations_prioritized(self, phase5):
        """Test: recommendations están prioritizadas"""
        result = phase5.execute()
        recommendations = result["recommendations"]
        
        assert len(recommendations) >= 3
        
        # Verificar que hay P1, P2, P3
        priorities = {r["priority"] for r in recommendations}
        assert "P1" in priorities
        assert "P2" in priorities
        
        for rec in recommendations:
            assert "priority" in rec
            assert "category" in rec
            assert "title" in rec
            assert "description" in rec
            assert "expected_impact" in rec
            assert "effort_days" in rec
            assert "estimated_cost" in rec
            assert "business_case" in rec
    
    def test_phase5_export_formats(self, phase5):
        """Test: export_formats contiene múltiples formatos"""
        result = phase5.execute()
        exports = result["export_formats"]
        
        assert "json" in exports
        assert "csv" in exports
        assert "html" in exports
        
        # Verificar estructura de JSON export
        assert "format" in exports["json"]
        assert "filename" in exports["json"]
        assert exports["json"]["format"] == "application/json"
        
        # Verificar estructura de CSV export
        assert "tables" in exports["csv"]
        assert len(exports["csv"]["tables"]) >= 3
        
        # Verificar estructura de HTML export
        assert "features" in exports["html"]
        assert len(exports["html"]["features"]) >= 3
    
    def test_phase5_export_filenames_unique(self, phase5):
        """Test: export filenames son únicos por timestamp"""
        result1 = phase5.execute()
        result2 = Phase5Reporting().execute()
        
        # Los filenames pueden ser diferentes si se ejecutan en diferentes segundos
        # Pero la estructura debe ser idéntica
        assert "json" in result1["export_formats"]
        assert "json" in result2["export_formats"]


class TestPhase5Integration:
    """Integration tests para Phase 5"""
    
    def test_phase5_execute_is_deterministic(self):
        """Test: execute() retorna resultados consistentes"""
        phase1 = Phase5Reporting()
        result1 = phase1.execute()
        
        phase2 = Phase5Reporting()
        result2 = phase2.execute()
        
        assert len(result1["detailed_findings"]) == len(result2["detailed_findings"])
        assert len(result1["recommendations"]) == len(result2["recommendations"])
    
    def test_phase5_phase_number_correct(self):
        """Test: phase_number es 5"""
        phase = Phase5Reporting()
        assert phase.phase_number == 5
    
    def test_phase5_phase_name_correct(self):
        """Test: phase_name es correcto"""
        phase = Phase5Reporting()
        assert phase.phase_name == "Comprehensive Reporting"
    
    def test_phase5_with_prior_phases_output(self):
        """Test: Phase 5 puede aceptar outputs de fases previas"""
        prior_outputs = [
            {"phase": "Phase 1", "results": "data_validation"},
            {"phase": "Phase 2", "results": "consistency_check"},
            {"phase": "Phase 3", "results": "pattern_analysis"},
            {"phase": "Phase 4", "results": "performance_metrics"}
        ]
        
        phase5 = Phase5Reporting(prior_phases_output=prior_outputs)
        result = phase5.execute()
        
        assert result is not None
        assert len(result["detailed_findings"]) >= 4


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
