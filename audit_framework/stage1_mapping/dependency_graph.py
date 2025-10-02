#!/usr/bin/env python3
"""
ETAPA 1: Dependency Graph - Grafo de Dependencias Multi-Agente
Analiza y visualiza dependencias entre los 7 servicios del sistema
"""

import json
from typing import Dict, Any, List, Tuple, Set
from pathlib import Path
from collections import defaultdict


class DependencyGraphAnalyzer:
    """
    Construye y analiza el grafo de dependencias entre servicios
    """
    
    def __init__(self, profile: Dict[str, Any]):
        self.profile = profile
        self.graph = {}  # adjacency list
        self.reverse_graph = {}  # reverse dependencies
        self.components = profile.get("architecture", {}).get("components", [])
        self._build_graph()
    
    def _build_graph(self):
        """Construye grafo de dependencias"""
        # Inicializar grafo
        for component in self.components:
            name = component["name"]
            self.graph[name] = []
            self.reverse_graph[name] = []
        
        # Agregar aristas basadas en dependencias
        for component in self.components:
            name = component["name"]
            deps = component.get("dependencies", [])
            
            for dep in deps:
                if dep == "all_agents":
                    # Dashboard depende de todos los agentes
                    for other in self.components:
                        if other.get("type") == "agent" and other["name"] != name:
                            self.graph[name].append(other["name"])
                            self.reverse_graph[other["name"]].append(name)
                elif dep in self.graph:
                    self.graph[name].append(dep)
                    self.reverse_graph[dep].append(name)
    
    def analyze_dependencies(self) -> Dict[str, Any]:
        """Analiza el grafo de dependencias"""
        analysis = {
            "services_count": len(self.graph),
            "edges_count": sum(len(deps) for deps in self.graph.values()),
            "nodes": list(self.graph.keys()),
            "edges": self._get_edges(),
            "cycles": self.detect_cycles(),
            "critical_points": self.identify_critical_points(),
            "agent_metrics": self.calculate_agent_metrics(),
            "dependency_chains": self.find_dependency_chains()
        }
        
        return analysis
    
    def _get_edges(self) -> List[Tuple[str, str]]:
        """Obtiene lista de aristas"""
        edges = []
        for source, targets in self.graph.items():
            for target in targets:
                edges.append((source, target))
        return edges
    
    def detect_cycles(self) -> List[List[str]]:
        """Detecta ciclos en el grafo (problemas de dependencia circular)"""
        def dfs(node, visited, rec_stack, path):
            visited.add(node)
            rec_stack.add(node)
            path.append(node)
            
            for neighbor in self.graph.get(node, []):
                if neighbor not in visited:
                    cycle = dfs(neighbor, visited, rec_stack, path[:])
                    if cycle:
                        return cycle
                elif neighbor in rec_stack:
                    # Ciclo detectado
                    cycle_start = path.index(neighbor)
                    return path[cycle_start:] + [neighbor]
            
            rec_stack.remove(node)
            return None
        
        cycles = []
        visited = set()
        
        for node in self.graph:
            if node not in visited:
                cycle = dfs(node, visited, set(), [])
                if cycle and cycle not in cycles:
                    cycles.append(cycle)
        
        return cycles
    
    def identify_critical_points(self) -> Dict[str, Any]:
        """Identifica puntos críticos (single points of failure)"""
        critical = {
            "single_points_of_failure": [],
            "high_dependency_services": [],
            "orphan_services": []
        }
        
        # Servicios sin los cuales otros fallan
        for service in self.graph:
            dependents = len(self.reverse_graph.get(service, []))
            if dependents >= 3:  # 3+ servicios dependen de este
                critical["single_points_of_failure"].append({
                    "service": service,
                    "dependent_count": dependents,
                    "dependents": self.reverse_graph[service]
                })
        
        # Servicios con muchas dependencias
        for service, deps in self.graph.items():
            if len(deps) >= 3:
                critical["high_dependency_services"].append({
                    "service": service,
                    "dependency_count": len(deps),
                    "dependencies": deps
                })
        
        # Servicios aislados (sin dependencias ni dependientes)
        for service in self.graph:
            if not self.graph[service] and not self.reverse_graph[service]:
                critical["orphan_services"].append(service)
        
        return critical
    
    def calculate_agent_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Calcula métricas específicas para agentes"""
        metrics = {}
        
        for component in self.components:
            if component.get("type") != "agent":
                continue
            
            name = component["name"]
            metrics[name] = {
                "fan_in": len(self.reverse_graph.get(name, [])),  # Cuántos dependen de él
                "fan_out": len(self.graph.get(name, [])),         # De cuántos depende
                "betweenness": self._calculate_betweenness(name),
                "is_orchestrator": name == "web_dashboard",
                "communication_complexity": len(self.reverse_graph.get(name, [])) + len(self.graph.get(name, [])),
                "port": component.get("port", 0),
                "criticality": component.get("criticality", "unknown")
            }
        
        return metrics
    
    def _calculate_betweenness(self, node: str) -> float:
        """
        Calcula betweenness centrality simplificada
        Mide cuánto un nodo actúa como puente entre otros
        """
        # Contar caminos que pasan por este nodo
        paths_through = 0
        total_paths = 0
        
        for source in self.graph:
            if source == node:
                continue
            for target in self.graph:
                if target == node or target == source:
                    continue
                
                # BFS simple para encontrar si hay camino
                visited = set()
                queue = [(source, [source])]
                paths = []
                
                while queue:
                    current, path = queue.pop(0)
                    if current == target:
                        paths.append(path)
                        continue
                    
                    if current in visited:
                        continue
                    visited.add(current)
                    
                    for neighbor in self.graph.get(current, []):
                        if neighbor not in path:
                            queue.append((neighbor, path + [neighbor]))
                
                total_paths += len(paths)
                for path in paths:
                    if node in path:
                        paths_through += 1
        
        return paths_through / total_paths if total_paths > 0 else 0.0
    
    def find_dependency_chains(self) -> List[List[str]]:
        """Encuentra cadenas de dependencias largas"""
        def dfs_chains(node, visited, chain):
            chains = []
            
            for neighbor in self.graph.get(node, []):
                if neighbor not in visited:
                    new_chain = chain + [neighbor]
                    chains.append(new_chain)
                    chains.extend(dfs_chains(neighbor, visited | {neighbor}, new_chain))
            
            return chains
        
        all_chains = []
        for node in self.graph:
            chains = dfs_chains(node, {node}, [node])
            all_chains.extend(chains)
        
        # Filtrar cadenas largas (≥3 nodos)
        long_chains = [chain for chain in all_chains if len(chain) >= 3]
        
        # Eliminar duplicados y ordenar por longitud
        unique_chains = []
        for chain in long_chains:
            if chain not in unique_chains:
                unique_chains.append(chain)
        
        return sorted(unique_chains, key=len, reverse=True)[:10]  # Top 10
    
    def generate_report(self) -> str:
        """Genera reporte legible del análisis"""
        analysis = self.analyze_dependencies()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════════",
            "║ DEPENDENCY GRAPH ANALYSIS - Multi-Agent System",
            "╠═══════════════════════════════════════════════════════════════",
            f"║ Services: {analysis['services_count']}",
            f"║ Dependencies: {analysis['edges_count']}",
            f"║ Cycles Detected: {len(analysis['cycles'])}",
            "╠═══════════════════════════════════════════════════════════════",
            "║ CRITICAL POINTS",
        ]
        
        # Single points of failure
        spofs = analysis['critical_points']['single_points_of_failure']
        if spofs:
            lines.append("║ Single Points of Failure:")
            for spof in spofs:
                lines.append(f"║   • {spof['service']}: {spof['dependent_count']} dependents")
        
        # Agent metrics
        lines.append("╠═══════════════════════════════════════════════════════════════")
        lines.append("║ AGENT METRICS")
        for agent, metrics in analysis['agent_metrics'].items():
            lines.append(f"║ {agent}:")
            lines.append(f"║   Fan-in: {metrics['fan_in']}, Fan-out: {metrics['fan_out']}")
            lines.append(f"║   Betweenness: {metrics['betweenness']:.3f}")
            if metrics['is_orchestrator']:
                lines.append(f"║   ⭐ ORCHESTRATOR")
        
        # Dependency chains
        lines.append("╠═══════════════════════════════════════════════════════════════")
        lines.append("║ LONGEST DEPENDENCY CHAINS")
        for i, chain in enumerate(analysis['dependency_chains'][:5], 1):
            chain_str = " → ".join(chain)
            lines.append(f"║ {i}. {chain_str}")
        
        lines.append("╚═══════════════════════════════════════════════════════════════")
        
        return "\n".join(lines)


if __name__ == "__main__":
    # Test con profile generado
    from pathlib import Path
    
    reports_dir = Path(__file__).parent.parent / "reports"
    profile_file = reports_dir / "stage0_profile.json"
    
    if profile_file.exists():
        with open(profile_file, 'r', encoding='utf-8') as f:
            profile = json.load(f)
        
        analyzer = DependencyGraphAnalyzer(profile)
        analysis = analyzer.analyze_dependencies()
        
        print(analyzer.generate_report())
        
        # Guardar análisis
        output_file = reports_dir / "stage1_dependencies.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)
        
        print(f"\nDependency analysis saved to: {output_file}")
    else:
        print(f"Profile file not found: {profile_file}")
        print("Run stage0_ingestion/project_profile.py first")
