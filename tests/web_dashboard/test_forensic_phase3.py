#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests para Phase 3: Pattern Analysis

Cubre:
- Análisis de patrones de precios
- Análisis de volumen de transacciones
- Patrones temporales (hora/día/semana)
- Patrones por categoría de producto
- Detección de anomalías estadísticas
"""

import sys
import os
import pytest
from typing import Dict, Any
from importlib import import_module

# Path-based imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

_phase3_mod = import_module('inventario-retail.forensic_analysis.phases.phase_3_pattern_analysis')
Phase3PatternAnalysis = _phase3_mod.Phase3PatternAnalysis


class TestPhase3PatternAnalysis:
    """Test suite para Phase 3"""
    
    @pytest.fixture
    def phase3(self):
        """Fixture: instancia de Phase 3"""
        return Phase3PatternAnalysis()
    
    def test_phase3_initialization(self, phase3):
        """Test: Phase 3 se inicializa correctamente"""
        assert phase3 is not None
        assert phase3.phase_number == 3
        assert phase3.phase_name == "Pattern Analysis"
        assert phase3.patterns_found == []
        assert phase3.anomalies == []
    
    def test_phase3_validate_input_succeeds(self, phase3):
        """Test: validate_input retorna True"""
        assert phase3.validate_input() is True
    
    def test_phase3_execute_returns_dict(self, phase3):
        """Test: execute() retorna estructura correcta"""
        result = phase3.execute()
        
        assert isinstance(result, dict)
        assert "phase" in result
        assert "timestamp" in result
        assert "analyses" in result
        assert "anomalies" in result
        assert "patterns" in result
        assert "summary" in result
    
    def test_phase3_execute_creates_all_analyses(self, phase3):
        """Test: execute() crea 5 análisis"""
        result = phase3.execute()
        
        assert len(result["analyses"]) == 5
        analysis_names = [a["name"] for a in result["analyses"]]
        
        assert "Price Patterns Analysis" in analysis_names
        assert "Volume Patterns Analysis" in analysis_names
        assert "Temporal Patterns Analysis" in analysis_names
        assert "Category Patterns Analysis" in analysis_names
        assert "Statistical Anomalies Detection" in analysis_names
    
    def test_phase3_execute_summary_structure(self, phase3):
        """Test: summary tiene estructura correcta"""
        result = phase3.execute()
        summary = result["summary"]
        
        assert "total_analyses" in summary
        assert "anomalies_detected" in summary
        assert "patterns_identified" in summary
        assert "risk_level" in summary
        assert "recommendation" in summary
        
        # En v1.0 mock, hay anomalías y patrones
        assert summary["total_analyses"] == 5
        assert summary["anomalies_detected"] >= 0
        assert summary["patterns_identified"] >= 0
    
    def test_phase3_price_patterns_analysis(self, phase3):
        """Test: análisis de patrones de precios"""
        result = phase3.execute()
        
        price_analysis = next(
            (a for a in result["analyses"] if a["name"] == "Price Patterns Analysis"),
            None
        )
        
        assert price_analysis is not None
        assert price_analysis["status"] == "COMPLETED"
        assert "details" in price_analysis
        assert "avg_price_change_percent" in price_analysis["details"]
        assert "price_volatility" in price_analysis["details"]
    
    def test_phase3_volume_patterns_analysis(self, phase3):
        """Test: análisis de patrones de volumen"""
        result = phase3.execute()
        
        volume_analysis = next(
            (a for a in result["analyses"] if a["name"] == "Volume Patterns Analysis"),
            None
        )
        
        assert volume_analysis is not None
        assert volume_analysis["status"] == "COMPLETED"
        assert "details" in volume_analysis
        assert "avg_daily_volume" in volume_analysis["details"]
        assert "volume_std_dev" in volume_analysis["details"]
    
    def test_phase3_temporal_patterns_analysis(self, phase3):
        """Test: análisis de patrones temporales"""
        result = phase3.execute()
        
        temporal_analysis = next(
            (a for a in result["analyses"] if a["name"] == "Temporal Patterns Analysis"),
            None
        )
        
        assert temporal_analysis is not None
        assert temporal_analysis["status"] == "COMPLETED"
        assert "details" in temporal_analysis
        assert "peak_hours" in temporal_analysis["details"]
        assert "low_hours" in temporal_analysis["details"]
        assert "busiest_day" in temporal_analysis["details"]
    
    def test_phase3_category_patterns_analysis(self, phase3):
        """Test: análisis de patrones por categoría"""
        result = phase3.execute()
        
        category_analysis = next(
            (a for a in result["analyses"] if a["name"] == "Category Patterns Analysis"),
            None
        )
        
        assert category_analysis is not None
        assert category_analysis["status"] == "COMPLETED"
        assert "details" in category_analysis
        assert "top_categories" in category_analysis["details"]
    
    def test_phase3_statistical_anomalies_detection(self, phase3):
        """Test: detección de anomalías estadísticas"""
        result = phase3.execute()
        
        stats_analysis = next(
            (a for a in result["analyses"] if a["name"] == "Statistical Anomalies Detection"),
            None
        )
        
        assert stats_analysis is not None
        assert stats_analysis["status"] == "COMPLETED"
        assert "details" in stats_analysis
    
    def test_phase3_patterns_identified(self, phase3):
        """Test: patterns_found contiene patrones"""
        result = phase3.execute()
        
        # En v1.0 mock, debe haber al menos 3 patrones
        assert len(result["patterns"]) >= 3
        
        # Verificar estructura de patrón
        for pattern in result["patterns"]:
            assert "type" in pattern
            assert "message" in pattern
    
    def test_phase3_anomalies_identified(self, phase3):
        """Test: anomalies contiene anomalías detectadas"""
        result = phase3.execute()
        
        # En v1.0 mock, puede haber anomalías
        if len(result["anomalies"]) > 0:
            for anomaly in result["anomalies"]:
                assert "type" in anomaly
                assert "severity" in anomaly
                assert "message" in anomaly
    
    def test_phase3_risk_level_correct(self, phase3):
        """Test: risk_level es válido"""
        result = phase3.execute()
        
        risk_level = result["summary"]["risk_level"]
        assert risk_level in ["LOW", "MEDIUM", "HIGH"]
    
    def test_phase3_recommendation_present(self, phase3):
        """Test: recommendation contiene texto útil"""
        result = phase3.execute()
        
        recommendation = result["summary"]["recommendation"]
        assert isinstance(recommendation, str)
        assert len(recommendation) > 0


class TestPhase3Integration:
    """Integration tests para Phase 3"""
    
    def test_phase3_execute_is_deterministic(self):
        """Test: execute() retorna resultados consistentes"""
        phase1 = Phase3PatternAnalysis()
        result1 = phase1.execute()
        
        phase2 = Phase3PatternAnalysis()
        result2 = phase2.execute()
        
        # Same structure
        assert result1["summary"]["total_analyses"] == result2["summary"]["total_analyses"]
        assert len(result1["patterns"]) == len(result2["patterns"])
    
    def test_phase3_phase_number_correct(self):
        """Test: phase_number es 3"""
        phase = Phase3PatternAnalysis()
        assert phase.phase_number == 3
    
    def test_phase3_phase_name_correct(self):
        """Test: phase_name es correcto"""
        phase = Phase3PatternAnalysis()
        assert phase.phase_name == "Pattern Analysis"
    
    def test_phase3_with_prior_phase_output(self):
        """Test: Phase 3 puede aceptar output de Phase 2"""
        prior_output = {
            "phase": "Phase 2",
            "inconsistencies": [],
            "summary": {"integrity_score": 100.0}
        }
        
        phase3 = Phase3PatternAnalysis(phase2_output=prior_output)
        result = phase3.execute()
        
        assert result is not None
        assert result["summary"]["total_analyses"] == 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
