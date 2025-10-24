#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests para Phase 4: Performance Metrics Analysis

Cubre:
- Cálculo de throughput
- Análisis de latencia
- Tasa de error
- KPIs de negocio
- Identificación de bottlenecks
"""

import sys
import os
import pytest
from typing import Dict, Any
from importlib import import_module

# Path-based imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

_phase4_mod = import_module('inventario-retail.forensic_analysis.phases.phase_4_performance_metrics')
Phase4PerformanceMetrics = _phase4_mod.Phase4PerformanceMetrics


class TestPhase4PerformanceMetrics:
    """Test suite para Phase 4"""
    
    @pytest.fixture
    def phase4(self):
        """Fixture: instancia de Phase 4"""
        return Phase4PerformanceMetrics()
    
    def test_phase4_initialization(self, phase4):
        """Test: Phase 4 se inicializa correctamente"""
        assert phase4 is not None
        assert phase4.phase_number == 4
        assert phase4.phase_name == "Performance Metrics Analysis"
        assert phase4.metrics == []
        assert phase4.kpis == []
        assert phase4.bottlenecks == []
    
    def test_phase4_validate_input_succeeds(self, phase4):
        """Test: validate_input retorna True"""
        assert phase4.validate_input() is True
    
    def test_phase4_execute_returns_dict(self, phase4):
        """Test: execute() retorna estructura correcta"""
        result = phase4.execute()
        
        assert isinstance(result, dict)
        assert "phase" in result
        assert "timestamp" in result
        assert "metrics" in result
        assert "kpis" in result
        assert "bottlenecks" in result
        assert "optimization_recommendations" in result
        assert "summary" in result
    
    def test_phase4_execute_creates_all_metrics(self, phase4):
        """Test: execute() crea 3 métricas"""
        result = phase4.execute()
        
        assert len(result["metrics"]) == 3
        metric_names = [m["name"] for m in result["metrics"]]
        
        assert "Transaction Throughput" in metric_names
        assert "Average Latency" in metric_names
        assert "Error Rate" in metric_names
    
    def test_phase4_execute_creates_all_kpis(self, phase4):
        """Test: execute() crea 3 KPIs"""
        result = phase4.execute()
        
        assert len(result["kpis"]) == 3
        kpi_names = [k["name"] for k in result["kpis"]]
        
        assert "System Availability" in kpi_names
        assert "Inventory Efficiency" in kpi_names
        assert "Average Transaction Value" in kpi_names
    
    def test_phase4_execute_summary_structure(self, phase4):
        """Test: summary tiene estructura correcta"""
        result = phase4.execute()
        summary = result["summary"]
        
        assert "total_metrics" in summary
        assert "total_kpis" in summary
        assert "bottlenecks_identified" in summary
        assert "recommendations_count" in summary
        assert "overall_health_score" in summary
        assert "status" in summary
        
        # Validaciones
        assert summary["total_metrics"] == 3
        assert summary["total_kpis"] == 3
        assert isinstance(summary["overall_health_score"], (int, float))
        assert summary["status"] in ["HEALTHY", "DEGRADED", "CRITICAL"]
    
    def test_phase4_throughput_metric(self, phase4):
        """Test: métrica de throughput"""
        result = phase4.execute()
        
        throughput = next(
            (m for m in result["metrics"] if m["name"] == "Transaction Throughput"),
            None
        )
        
        assert throughput is not None
        assert "value" in throughput
        assert "peak" in throughput
        assert "off_peak" in throughput
        assert "status" in throughput
        assert throughput["unit"] == "transactions/hour"
    
    def test_phase4_latency_metric(self, phase4):
        """Test: métrica de latencia"""
        result = phase4.execute()
        
        latency = next(
            (m for m in result["metrics"] if m["name"] == "Average Latency"),
            None
        )
        
        assert latency is not None
        assert "value" in latency
        assert "p95" in latency
        assert "p99" in latency
        assert "sla_threshold" in latency
        assert latency["unit"] == "milliseconds"
    
    def test_phase4_error_rate_metric(self, phase4):
        """Test: métrica de tasa de error"""
        result = phase4.execute()
        
        error_rate = next(
            (m for m in result["metrics"] if m["name"] == "Error Rate"),
            None
        )
        
        assert error_rate is not None
        assert "value" in error_rate
        assert "total_transactions" in error_rate
        assert "failed_transactions" in error_rate
        assert error_rate["unit"] == "percentage"
    
    def test_phase4_availability_kpi(self, phase4):
        """Test: KPI de disponibilidad"""
        result = phase4.execute()
        
        availability = next(
            (k for k in result["kpis"] if k["name"] == "System Availability"),
            None
        )
        
        assert availability is not None
        assert "value" in availability
        assert "sla_target" in availability
        assert "status" in availability
        assert availability["unit"] == "percentage"
    
    def test_phase4_inventory_efficiency_kpi(self, phase4):
        """Test: KPI de eficiencia de inventario"""
        result = phase4.execute()
        
        efficiency = next(
            (k for k in result["kpis"] if k["name"] == "Inventory Efficiency"),
            None
        )
        
        assert efficiency is not None
        assert "value" in efficiency
        assert "inventory_turnover" in efficiency
        assert "target" in efficiency
        assert efficiency["unit"] == "percentage"
    
    def test_phase4_transaction_value_kpi(self, phase4):
        """Test: KPI de valor promedio de transacción"""
        result = phase4.execute()
        
        tx_value = next(
            (k for k in result["kpis"] if k["name"] == "Average Transaction Value"),
            None
        )
        
        assert tx_value is not None
        assert "value" in tx_value
        assert "total_revenue" in tx_value
        assert "total_transactions" in tx_value
        assert tx_value["unit"] == "currency"
    
    def test_phase4_bottlenecks_identified(self, phase4):
        """Test: bottlenecks contiene cuellos de botella"""
        result = phase4.execute()
        
        # En v1.0, hay bottlenecks identificados
        assert len(result["bottlenecks"]) >= 2
        
        for bottleneck in result["bottlenecks"]:
            assert "name" in bottleneck
            assert "severity" in bottleneck
            assert "current_duration_ms" in bottleneck
            assert "target_duration_ms" in bottleneck
    
    def test_phase4_recommendations_present(self, phase4):
        """Test: recommendations contiene sugerencias"""
        result = phase4.execute()
        
        assert len(result["optimization_recommendations"]) >= 3
        
        for rec in result["optimization_recommendations"]:
            assert "priority" in rec
            assert "category" in rec
            assert "description" in rec
            assert "expected_improvement" in rec
    
    def test_phase4_health_score_valid_range(self, phase4):
        """Test: health score está en rango [0-100]"""
        result = phase4.execute()
        
        health_score = result["summary"]["overall_health_score"]
        assert 0 <= health_score <= 100


class TestPhase4Integration:
    """Integration tests para Phase 4"""
    
    def test_phase4_execute_is_deterministic(self):
        """Test: execute() retorna resultados consistentes"""
        phase1 = Phase4PerformanceMetrics()
        result1 = phase1.execute()
        
        phase2 = Phase4PerformanceMetrics()
        result2 = phase2.execute()
        
        assert result1["summary"]["total_metrics"] == result2["summary"]["total_metrics"]
        assert result1["summary"]["total_kpis"] == result2["summary"]["total_kpis"]
    
    def test_phase4_phase_number_correct(self):
        """Test: phase_number es 4"""
        phase = Phase4PerformanceMetrics()
        assert phase.phase_number == 4
    
    def test_phase4_phase_name_correct(self):
        """Test: phase_name es correcto"""
        phase = Phase4PerformanceMetrics()
        assert phase.phase_name == "Performance Metrics Analysis"
    
    def test_phase4_with_prior_phase_outputs(self):
        """Test: Phase 4 puede aceptar outputs de fases previas"""
        phase1_output = {"quality_score": 99.8}
        phase3_output = {"anomalies_detected": 2}
        
        phase4 = Phase4PerformanceMetrics(
            phase1_output=phase1_output,
            phase3_output=phase3_output
        )
        result = phase4.execute()
        
        assert result is not None
        assert result["summary"]["total_metrics"] == 3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
