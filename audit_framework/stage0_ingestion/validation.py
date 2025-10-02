#!/usr/bin/env python3
"""
ETAPA 0: Validation - Validación de Consistencia del ProjectProfile
"""

import json
from typing import Dict, Any, List, Tuple
from pathlib import Path


class ProfileValidator:
    """
    Valida consistencia y completitud del ProjectProfile
    """
    
    def __init__(self):
        self.validation_errors = []
        self.validation_warnings = []
    
    def validate_profile(self, profile: Dict[str, Any]) -> Tuple[bool, List[str], List[str]]:
        """
        Realiza validación exhaustiva del profile
        
        Returns:
            (is_valid, errors, warnings)
        """
        self.validation_errors = []
        self.validation_warnings = []
        
        # Validaciones estructurales
        self._validate_structure(profile)
        
        # Validaciones de arquitectura multi-agente
        self._validate_architecture(profile)
        
        # Validaciones de dependencias lógicas
        self._validate_dependencies(profile)
        
        # Validaciones de contexto AFIP
        self._validate_afip_context(profile)
        
        # Validaciones de restricciones FREEZE
        self._validate_freeze_constraints(profile)
        
        is_valid = len(self.validation_errors) == 0
        return is_valid, self.validation_errors, self.validation_warnings
    
    def _validate_structure(self, profile: Dict[str, Any]):
        """Valida estructura JSON básica"""
        required_sections = [
            "project_metadata",
            "architecture",
            "critical_flows",
            "security_context",
            "afip_context",
            "freeze_constraints"
        ]
        
        for section in required_sections:
            if section not in profile:
                self.validation_errors.append(f"Missing required section: {section}")
    
    def _validate_architecture(self, profile: Dict[str, Any]):
        """Valida arquitectura multi-agente"""
        arch = profile.get("architecture", {})
        
        # Verificar patrón arquitectónico
        if arch.get("pattern") != "microservices-multi-agent":
            self.validation_errors.append(
                f"Invalid architecture pattern: {arch.get('pattern')}"
            )
        
        # Verificar conteo de servicios
        services_count = arch.get("services_count", 0)
        if services_count != 7:
            self.validation_errors.append(
                f"Expected 7 services, found {services_count}"
            )
        
        # Verificar componentes
        components = arch.get("components", [])
        if len(components) != 7:
            self.validation_errors.append(
                f"Expected 7 components, found {len(components)}"
            )
        
        # Verificar agentes críticos
        agent_names = {c["name"] for c in components if c.get("type") == "agent"}
        expected_agents = {"agente_deposito", "agente_negocio", "ml_service", "web_dashboard"}
        missing_agents = expected_agents - agent_names
        
        if missing_agents:
            self.validation_errors.append(
                f"Missing critical agents: {', '.join(missing_agents)}"
            )
        
        # Verificar puertos únicos
        ports = []
        for component in components:
            if "port" in component:
                ports.append(component["port"])
            elif "ports" in component:
                ports.extend(component["ports"])
        
        if len(ports) != len(set(ports)):
            self.validation_warnings.append("Duplicate ports detected in components")
    
    def _validate_dependencies(self, profile: Dict[str, Any]):
        """Valida lógica de dependencias entre servicios"""
        components = profile.get("architecture", {}).get("components", [])
        component_names = {c["name"] for c in components}
        
        for component in components:
            deps = component.get("dependencies", [])
            for dep in deps:
                if dep != "all_agents" and dep != "models" and dep not in component_names:
                    self.validation_errors.append(
                        f"Component {component['name']} has invalid dependency: {dep}"
                    )
        
        # Verificar dependencia Dashboard → Agentes
        dashboard = next((c for c in components if c["name"] == "web_dashboard"), None)
        if dashboard:
            deps = dashboard.get("dependencies", [])
            if "all_agents" not in deps:
                self.validation_warnings.append(
                    "Dashboard should depend on all_agents for orchestration"
                )
        
        # Verificar agentes → DB/Cache
        for component in components:
            if component.get("type") == "agent" and component["name"] != "nginx":
                deps = component.get("dependencies", [])
                if "postgres" not in deps and component["name"] != "web_dashboard":
                    self.validation_warnings.append(
                        f"Agent {component['name']} should depend on postgres"
                    )
                if "redis" not in deps and component["name"] != "web_dashboard":
                    self.validation_warnings.append(
                        f"Agent {component['name']} should depend on redis"
                    )
    
    def _validate_afip_context(self, profile: Dict[str, Any]):
        """Valida contexto AFIP y argentino"""
        afip = profile.get("afip_context", {})
        
        # Verificar campos obligatorios
        required_fields = {
            "cuit_validation": bool,
            "inflation_rate_monthly": (int, float),
            "timezone": str,
            "currency": str
        }
        
        for field, expected_type in required_fields.items():
            if field not in afip:
                self.validation_errors.append(
                    f"Missing required AFIP field: {field}"
                )
            elif not isinstance(afip[field], expected_type):
                self.validation_errors.append(
                    f"Invalid type for {field}: expected {expected_type}"
                )
        
        # Verificar inflación mensual razonable (0-20%)
        inflation = afip.get("inflation_rate_monthly", 0)
        if not (0 <= inflation <= 20):
            self.validation_warnings.append(
                f"Unusual inflation rate: {inflation}% (expected 0-20%)"
            )
        
        # Verificar timezone argentino
        timezone = afip.get("timezone", "")
        if "Argentina" not in timezone:
            self.validation_warnings.append(
                f"Non-Argentine timezone: {timezone}"
            )
        
        # Verificar moneda
        if afip.get("currency") != "ARS":
            self.validation_warnings.append(
                f"Non-Argentine currency: {afip.get('currency')}"
            )
    
    def _validate_freeze_constraints(self, profile: Dict[str, Any]):
        """Valida restricciones FREEZE"""
        freeze = profile.get("freeze_constraints", {})
        
        # Todas las restricciones deben ser False (no permitidas)
        constraints = {
            "directory_renames": False,
            "heavy_dependencies": False,
            "broad_refactors": False,
            "core_logic_changes": False
        }
        
        for constraint, expected in constraints.items():
            if freeze.get(constraint) != expected:
                self.validation_errors.append(
                    f"FREEZE violation: {constraint} should be {expected}"
                )
        
        # Verificar razón del freeze
        if "reason" not in freeze:
            self.validation_warnings.append(
                "Missing reason for FREEZE constraints"
            )
    
    def get_validation_summary(self) -> str:
        """Genera resumen legible de validación"""
        lines = [
            "╔═══════════════════════════════════════════════════════════════",
            "║ PROFILE VALIDATION SUMMARY",
            "╠═══════════════════════════════════════════════════════════════",
        ]
        
        if not self.validation_errors and not self.validation_warnings:
            lines.append("║ ✓ All validations passed")
        else:
            if self.validation_errors:
                lines.append(f"║ ✗ ERRORS: {len(self.validation_errors)}")
                for error in self.validation_errors:
                    lines.append(f"║   - {error}")
            
            if self.validation_warnings:
                lines.append(f"║ ⚠ WARNINGS: {len(self.validation_warnings)}")
                for warning in self.validation_warnings:
                    lines.append(f"║   - {warning}")
        
        lines.append("╚═══════════════════════════════════════════════════════════════")
        return "\n".join(lines)


def validate_json_schema(profile: Dict[str, Any]) -> bool:
    """Validación básica de schema JSON"""
    try:
        # Verificar que se puede serializar
        json.dumps(profile)
        return True
    except (TypeError, ValueError) as e:
        print(f"JSON Schema validation failed: {e}")
        return False


if __name__ == "__main__":
    # Test con profile de ejemplo
    from pathlib import Path
    
    reports_dir = Path(__file__).parent.parent / "reports"
    profile_file = reports_dir / "stage0_profile.json"
    
    if profile_file.exists():
        with open(profile_file, 'r', encoding='utf-8') as f:
            profile = json.load(f)
        
        validator = ProfileValidator()
        is_valid, errors, warnings = validator.validate_profile(profile)
        
        print(validator.get_validation_summary())
        print(f"\nValidation result: {'PASSED' if is_valid else 'FAILED'}")
        print(f"Schema compliance: {'YES' if validate_json_schema(profile) else 'NO'}")
    else:
        print(f"Profile file not found: {profile_file}")
        print("Run project_profile.py first to generate the profile")
