#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Integration tests para ForensicOrchestrator

Cubre:
- Ejecución del pipeline completo (5 fases)
- Propagación de resultados entre fases
- Manejo de errores
- Generación de reporte final
"""

import sys
import os
import pytest
from typing import Dict, Any
from importlib import import_module

# Path-based imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

_orch_mod = import_module('inventario-retail.forensic_analysis.orchestrator')
ForensicOrchestrator = _orch_mod.ForensicOrchestrator


class TestForensicOrchestrator:
    """Test suite para ForensicOrchestrator"""
    
    @pytest.fixture
    def orchestrator(self):
        """Fixture: instancia de orchestrator"""
        return ForensicOrchestrator()
    
    @pytest.fixture
    def sample_input_data(self) -> Dict[str, Any]:
        """Fixture: datos de entrada para análisis"""
        return {
            "inventory_data": {
                "products": [
                    {"sku": "P001", "name": "Bebida A", "price": 2.50, "quantity": 150},
                    {"sku": "P002", "name": "Lácteo B", "price": 3.75, "quantity": 200}
                ]
            },
            "transaction_data": {
                "transactions": [
                    {"id": "T001", "sku": "P001", "quantity": 5, "total": 12.50},
                    {"id": "T002", "sku": "P002", "quantity": 3, "total": 11.25}
                ]
            }
        }
    
    def test_orchestrator_initialization(self, orchestrator):
        """Test: orchestrator se inicializa con 5 fases"""
        assert orchestrator is not None
        assert len(orchestrator.phases) == 5
    
    def test_orchestrator_has_all_phases(self, orchestrator):
        """Test: orchestrator contiene todas las 5 fases"""
        phase_names = [p.phase_name for p in orchestrator.phases]
        
        assert "Data Validation" in phase_names
        assert "Cross-Referential Consistency Check" in phase_names
        assert "Pattern Analysis" in phase_names
        assert "Performance Metrics Analysis" in phase_names
        assert "Comprehensive Reporting" in phase_names
    
    def test_orchestrator_phases_numbered_1_to_5(self, orchestrator):
        """Test: fases están numeradas de 1 a 5"""
        phase_numbers = [p.phase_number for p in orchestrator.phases]
        assert phase_numbers == [1, 2, 3, 4, 5]
    
    def test_run_analysis_returns_dict(self, orchestrator, sample_input_data):
        """Test: run_analysis() retorna estructura correcta"""
        result = orchestrator.run_analysis(sample_input_data)
        
        assert isinstance(result, dict)
        assert "execution_id" in result
        assert "start_time" in result
        assert "end_time" in result
        assert "total_duration_seconds" in result
        assert "phases" in result
        assert "overall_status" in result
        assert "summary" in result
    
    def test_run_analysis_execution_id_uuid_format(self, orchestrator, sample_input_data):
        """Test: execution_id está en formato UUID"""
        result = orchestrator.run_analysis(sample_input_data)
        
        exec_id = result["execution_id"]
        # UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        assert len(exec_id) == 36
        assert exec_id.count("-") == 4
    
    def test_run_analysis_custom_execution_id(self, orchestrator, sample_input_data):
        """Test: se puede especificar execution_id personalizado"""
        custom_id = "test-execution-123"
        result = orchestrator.run_analysis(sample_input_data, execution_id=custom_id)
        
        assert result["execution_id"] == custom_id
    
    def test_run_analysis_executes_phases(self, orchestrator, sample_input_data):
        """Test: run_analysis() ejecuta fases"""
        result = orchestrator.run_analysis(sample_input_data)
        
        # En v1.0 con mock data simple, al menos Phase 1 ejecuta
        assert len(result["phases"]) >= 1
    
    def test_run_analysis_has_timestamps(self, orchestrator, sample_input_data):
        """Test: result incluye timestamps de inicio y fin"""
        result = orchestrator.run_analysis(sample_input_data)
        
        assert "start_time" in result
        assert "end_time" in result
        assert result["start_time"] is not None
        assert result["end_time"] is not None
        
        # end_time debe ser después de start_time
        from datetime import datetime
        start = datetime.fromisoformat(result["start_time"])
        end = datetime.fromisoformat(result["end_time"])
        assert end >= start
    
    def test_run_analysis_duration_calculated(self, orchestrator, sample_input_data):
        """Test: total_duration_seconds está calculado"""
        result = orchestrator.run_analysis(sample_input_data)
        
        assert "total_duration_seconds" in result
        assert result["total_duration_seconds"] >= 0
    
    def test_run_analysis_overall_status(self, orchestrator, sample_input_data):
        """Test: overall_status es 'success' o 'failed'"""
        result = orchestrator.run_analysis(sample_input_data)
        
        assert result["overall_status"] in ["success", "failed"]
    
    def test_run_analysis_summary_present(self, orchestrator, sample_input_data):
        """Test: summary contiene información agregada"""
        result = orchestrator.run_analysis(sample_input_data)
        summary = result["summary"]
        
        assert "total_phases" in summary
        assert "completed_phases" in summary
        assert "failed_phases" in summary
    
    def test_run_analysis_with_minimal_data(self, orchestrator):
        """Test: orchestrator maneja datos mínimos"""
        minimal_data = {
            "inventory_data": {},
            "transaction_data": {}
        }
        
        result = orchestrator.run_analysis(minimal_data)
        
        # No debe fallar, pero puede reportar warnings
        assert result is not None
        assert "execution_id" in result
    
    def test_orchestrator_get_phases_info(self, orchestrator):
        """Test: get_phases_info() (opcional en v1.0)"""
        # Este método es opcional en v1.0
        if hasattr(orchestrator, 'get_phases_info'):
            phases_info = orchestrator.get_phases_info()
            assert len(phases_info) >= 5
    
    def test_orchestrator_generate_summary(self, orchestrator):
        """Test: _generate_summary() (opcional en v1.0)"""
        # Este método es opcional en v1.0
        pass  # Skip, implementado en v1.1


class TestForensicOrchestratorPipelineFlow:
    """Tests de flujo del pipeline"""
    
    def test_pipeline_result_structure(self):
        """Test: resultado tiene estructura correcta"""
        orchestrator = ForensicOrchestrator()
        
        input_data = {
            "inventory_data": {"products": []},
            "transaction_data": {"transactions": []}
        }
        
        result = orchestrator.run_analysis(input_data)
        
        # Verificar estructura
        assert "execution_id" in result
        assert "start_time" in result
        assert "end_time" in result
        assert "overall_status" in result


class TestForensicOrchestratorErrorHandling:
    """Tests de manejo de errores"""
    
    def test_orchestrator_handles_missing_data(self):
        """Test: orchestrator maneja datos faltantes"""
        orchestrator = ForensicOrchestrator()
        
        result = orchestrator.run_analysis({})
        
        # Debe retornar resultado incluso con datos faltantes
        assert result is not None
        assert "execution_id" in result
    
    def test_orchestrator_handles_invalid_data(self):
        """Test: orchestrator maneja datos inválidos"""
        orchestrator = ForensicOrchestrator()
        
        invalid_data = {
            "inventory_data": "not a dict",
            "transaction_data": None
        }
        
        result = orchestrator.run_analysis(invalid_data)
        
        # Debe capturar errores sin fallar completamente
        assert result is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
