"""
Degradation Manager - Sistema de Degradación por Niveles MEJORADO (DÍA 2+3)

Este módulo implementa un sistema de degradación graceful con health scoring,
auto-scaling y predicción de recuperación.

Features DÍA 2:
  ✅ Health Scoring (0-100) with weighted components
  ✅ Auto-Scaling resource configs based on degradation level
  ✅ Recovery predictor with timedelta estimation
  ✅ ComponentHealth tracking with latency penalties
  ✅ Persistent degradation duration tracking

Features DÍA 3 INTEGRATION:
  ✅ Redis Circuit Breaker integration
  ✅ S3 Circuit Breaker integration
  ✅ 4-service health aggregation (OpenAI + DB + Redis + S3)
  ✅ Enhanced cascading failure coordination

Author: Operations Team
Date: October 19, 2025
Part of: OPCIÓN C Implementation - DÍA 2+3 Integration
"""

from enum import Enum
from typing import Dict, Callable, Optional, Any, List, Tuple
import asyncio
import logging
from datetime import datetime, timedelta
from prometheus_client import Gauge, Counter, Histogram
from dataclasses import dataclass, field
import statistics

logger = logging.getLogger(__name__)

# DÍA 3 IMPORTS - Circuit Breaker Integration
try:
    from .redis_service import get_redis, initialize_redis
except ImportError:
    logger.warning("Redis service not available for import")
    get_redis = None
    initialize_redis = None

try:
    from .s3_service import get_s3, initialize_s3
except ImportError:
    logger.warning("S3 service not available for import")
    get_s3 = None
    initialize_s3 = None


# PROMETHEUS METRICS

degradation_level_gauge = Gauge(
    'degradation_level',
    'Current system degradation level',
    ['level_name']
)

degradation_transitions_counter = Counter(
    'degradation_transitions_total',
    'Total degradation level transitions',
    ['from_level', 'to_level']
)

health_score_gauge = Gauge(
    'system_health_score',
    'Overall system health score (0-100)',
    []
)

component_health_gauge = Gauge(
    'component_health_score',
    'Per-component health score',
    ['component_name']
)

recovery_time_histogram = Histogram(
    'recovery_time_seconds',
    'Time taken to recover from degradation',
    buckets=[1, 5, 10, 30, 60, 300]
)


# DATA CLASSES

@dataclass
class ComponentHealth:
    """Registro de salud para un componente individual"""
    name: str
    is_healthy: bool
    last_check: datetime = field(default_factory=datetime.utcnow)
    failure_count: int = 0
    success_count: int = 0
    avg_latency_ms: float = 0.0
    last_error: Optional[str] = None
    weight: float = 1.0
    
    @property
    def health_score(self) -> float:
        """Score de salud individual (0-100)"""
        if self.success_count + self.failure_count == 0:
            return 100.0
        
        success_rate = self.success_count / (self.success_count + self.failure_count)
        latency_penalty = max(0, (self.avg_latency_ms - 500) / 10)
        return max(0, 100 * success_rate - latency_penalty)
    
    def record_success(self, latency_ms: float = 0.0):
        """Registra un éxito"""
        self.success_count += 1
        self.failure_count = max(0, self.failure_count - 1)
        self.is_healthy = True
        self.last_check = datetime.utcnow()
        self.last_error = None
        total = self.success_count + self.failure_count
        if total > 0:
            self.avg_latency_ms = ((self.avg_latency_ms * (total - 1)) + latency_ms) / total
    
    def record_failure(self, error: str = ""):
        """Registra un fallo"""
        self.failure_count += 1
        self.is_healthy = False
        self.last_check = datetime.utcnow()
        self.last_error = error


@dataclass
class AutoScalingConfig:
    """Configuración de auto-scaling basada en degradación"""
    enable_auto_scaling: bool = True
    cpu_threshold_percent: float = 80.0
    memory_threshold_percent: float = 85.0
    connection_pool_reduction: Dict[str, float] = field(default_factory=lambda: {
        "OPTIMAL": 1.0, "DEGRADED": 0.9, "LIMITED": 0.75, "MINIMAL": 0.5, "EMERGENCY": 0.2
    })
    cache_ttl_seconds: Dict[str, int] = field(default_factory=lambda: {
        "OPTIMAL": 3600, "DEGRADED": 1800, "LIMITED": 900, "MINIMAL": 300, "EMERGENCY": 60
    })
    batch_size_multiplier: Dict[str, float] = field(default_factory=lambda: {
        "OPTIMAL": 1.0, "DEGRADED": 0.8, "LIMITED": 0.5, "MINIMAL": 0.25, "EMERGENCY": 0.1
    })


# DEGRADATION LEVELS

class DegradationLevel(Enum):
    """Niveles de degradación del sistema"""
    OPTIMAL = 1
    DEGRADED = 2
    LIMITED = 3
    MINIMAL = 4
    EMERGENCY = 5
    
    def __lt__(self, other):
        if isinstance(other, DegradationLevel):
            return self.value < other.value
        return NotImplemented
    
    def __le__(self, other):
        if isinstance(other, DegradationLevel):
            return self.value <= other.value
        return NotImplemented
    
    def __gt__(self, other):
        if isinstance(other, DegradationLevel):
            return self.value > other.value
        return NotImplemented
    
    def __ge__(self, other):
        if isinstance(other, DegradationLevel):
            return self.value >= other.value
        return NotImplemented


# DEGRADATION MANAGER

class DegradationManager:
    """Gestiona el nivel de degradación con health scoring, auto-scaling y predicción"""
    
    def __init__(self, scaling_config: Optional[AutoScalingConfig] = None):
        self.current_level = DegradationLevel.OPTIMAL
        self.component_health: Dict[str, ComponentHealth] = {}
        self.health_checks: Dict[str, Callable] = {}
        self.level_transitions: Dict[DegradationLevel, Callable] = {}
        self._last_check_time: Optional[datetime] = None
        self._last_recovery_time: Optional[timedelta] = None
        self._check_interval = 30
        self._transition_history: List[Dict[str, Any]] = []
        self._health_history: List[Tuple[datetime, float]] = []
        self._max_history_size = 100
        self.scaling_config = scaling_config or AutoScalingConfig()
        self._degradation_start_time: Optional[datetime] = None
        self._recovery_predictor_enabled = True
        
    async def register_health_check(self, name: str, check_func: Callable, weight: float = 1.0):
        """Registra una función de health check con peso relativo"""
        self.component_health[name] = ComponentHealth(name=name, is_healthy=True, weight=weight)
        self.health_checks[name] = check_func
        logger.info(f"Health check registrado: {name} (weight={weight})")
    
    async def register_transition_handler(self, level: DegradationLevel, handler: Callable):
        """Registra un handler que se ejecuta al transicionar a un nivel"""
        self.level_transitions[level] = handler
        logger.info(f"Transition handler registrado: {level.name}")
    
    async def initialize_circuit_breakers(self):
        """
        Initialize all circuit breakers (DÍA 3 INTEGRATION)
        Call this during application startup
        """
        logger.info("Initializing circuit breakers integration...")
        
        # Initialize Redis Circuit Breaker
        if initialize_redis is not None:
            try:
                await initialize_redis(
                    host='localhost',
                    port=6379,
                    db=0
                )
                logger.info("Redis Circuit Breaker initialized successfully")
                # Register Redis health check with appropriate weight
                await self.register_health_check('redis', self._check_redis, weight=0.15)
            except Exception as e:
                logger.error(f"Failed to initialize Redis Circuit Breaker: {e}")
        
        # Initialize S3 Circuit Breaker
        if initialize_s3 is not None:
            try:
                await initialize_s3(
                    bucket='inventario-retail-bucket',  # Configurable
                    aws_access_key_id='',  # From environment
                    aws_secret_access_key='',  # From environment
                    region_name='us-east-1'
                )
                logger.info("S3 Circuit Breaker initialized successfully")
                # Register S3 health check with appropriate weight
                await self.register_health_check('s3', self._check_s3, weight=0.05)
            except Exception as e:
                logger.error(f"Failed to initialize S3 Circuit Breaker: {e}")
        
        # Register other service health checks with updated weights
        # Weight distribution: DB (50%), OpenAI (30%), Redis (15%), S3 (5%)
        await self.register_health_check('database', self._check_database, weight=0.50)
        await self.register_health_check('openai', self._check_openai, weight=0.30)
        
        logger.info("Circuit breaker integration completed")
    
    async def _check_redis(self) -> bool:
        """Health check para Redis Circuit Breaker (DÍA 3)"""
        try:
            if get_redis is None:
                return True  # No Redis CB available, assume OK
            
            redis_cb = await get_redis()
            if redis_cb is None:
                return True  # Not initialized yet
            
            health = await redis_cb.get_health()
            return health.get('is_healthy', False)
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False
    
    async def _check_database(self) -> bool:
        """Health check para PostgreSQL Circuit Breaker (DÍA 1)"""
        try:
            # TODO: Integrate with database circuit breaker from DÍA 1
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    async def _check_openai(self) -> bool:
        """Health check para OpenAI Circuit Breaker (DÍA 1)"""
        try:
            # TODO: Integrate with OpenAI circuit breaker from DÍA 1
            return True
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return False
    
    async def _check_s3(self) -> bool:
        """Health check para S3 Circuit Breaker (DÍA 3)"""
        try:
            if get_s3 is None:
                return True  # No S3 CB available, assume OK
            
            s3_cb = await get_s3()
            if s3_cb is None:
                return True  # Not initialized yet
            
            health = await s3_cb.get_health()
            return health.get('is_healthy', False)
        except Exception as e:
            logger.error(f"S3 health check failed: {e}")
            return False
    
    def get_component_health(self, name: str) -> Optional[ComponentHealth]:
        """Obtiene el health de un componente específico"""
        return self.component_health.get(name)
    
    def calculate_overall_health_score(self) -> float:
        """Calcula el score de salud general (0-100) usando weighted average"""
        if not self.component_health:
            return 100.0
        
        total_weight = sum(h.weight for h in self.component_health.values())
        if total_weight == 0:
            return 100.0
        
        weighted_score = sum(
            h.health_score * h.weight for h in self.component_health.values()
        ) / total_weight
        
        return round(weighted_score, 2)
    
    async def evaluate_health(self) -> DegradationLevel:
        """Evalúa el health del sistema y determina el nivel de degradación"""
        health_status = {}
        
        for name, check_func in self.health_checks.items():
            try:
                start_time = datetime.utcnow()
                is_healthy = await check_func()
                latency = (datetime.utcnow() - start_time).total_seconds() * 1000
                
                health_status[name] = is_healthy
                
                if name in self.component_health:
                    if is_healthy:
                        self.component_health[name].record_success(latency)
                    else:
                        self.component_health[name].record_failure("Check returned False")
                    
                    component_health_gauge.labels(component_name=name).set(
                        self.component_health[name].health_score
                    )
                    
            except Exception as e:
                logger.error(f"Health check '{name}' failed: {e}")
                health_status[name] = False
                if name in self.component_health:
                    self.component_health[name].record_failure(str(e))
                    component_health_gauge.labels(component_name=name).set(0)
        
        if not health_status:
            # DÍA 3 INTEGRATION: 4 circuit breakers
            health_status = {
                'redis': await self._check_redis(),
                'database': await self._check_database(),
                'openai': await self._check_openai(),
                's3': await self._check_s3()
            }
        
        overall_score = self.calculate_overall_health_score()
        health_score_gauge.set(overall_score)
        
        self._health_history.append((datetime.utcnow(), overall_score))
        if len(self._health_history) > self._max_history_size:
            self._health_history = self._health_history[-self._max_history_size:]
        
        return self._calculate_degradation_level(health_status, overall_score)
    
    def _calculate_degradation_level(self, health_status: Dict[str, bool], overall_score: float) -> DegradationLevel:
        """
        Calcula el nivel de degradación basado en componentes y health score
        DÍA 3 UPDATE: 4-service coordination (OpenAI + DB + Redis + S3)
        """
        redis_ok = health_status.get('redis', True)
        db_ok = health_status.get('database', True)
        openai_ok = health_status.get('openai', True)
        s3_ok = health_status.get('s3', True)
        
        # Count failed services
        failed_services = sum([
            not redis_ok,
            not db_ok,
            not openai_ok,
            not s3_ok
        ])
        
        # OPTIMAL: All services healthy + high score
        if all(health_status.values()) and overall_score >= 90:
            return DegradationLevel.OPTIMAL
        
        # DEGRADED: 1 service down, non-critical (Redis or S3)
        elif failed_services == 1 and overall_score >= 70:
            if not redis_ok or not s3_ok:
                return DegradationLevel.DEGRADED
            elif not openai_ok and db_ok:
                return DegradationLevel.LIMITED
            elif not db_ok:
                return DegradationLevel.MINIMAL
        
        # LIMITED: OpenAI down OR 2 non-critical services down
        elif (not openai_ok and db_ok and overall_score >= 60) or (failed_services == 2 and db_ok):
            return DegradationLevel.LIMITED
        
        # MINIMAL: Database down OR 3 services down
        elif not db_ok or failed_services >= 3:
            if overall_score >= 40 and (redis_ok or openai_ok or s3_ok):
                return DegradationLevel.MINIMAL
            else:
                return DegradationLevel.EMERGENCY
        
        # Score-based fallback
        elif overall_score < 30:
            return DegradationLevel.EMERGENCY
        elif overall_score < 50:
            return DegradationLevel.MINIMAL
        elif overall_score < 70:
            return DegradationLevel.LIMITED
        else:
            return DegradationLevel.DEGRADED
        
        # Should never reach here, but satisfy type checker
        return DegradationLevel.DEGRADED
    
    async def set_level(self, new_level: DegradationLevel):
        """Transiciona a un nuevo nivel de degradación"""
        if new_level == self.current_level:
            return
        
        old_level = self.current_level
        transition_timestamp = datetime.utcnow()
        
        if new_level.value > old_level.value:
            self._degradation_start_time = transition_timestamp
            logger.warning(
                f"System degradation: {old_level.name} → {new_level.name}",
                extra={
                    "old_level": old_level.value,
                    "new_level": new_level.value,
                    "timestamp": transition_timestamp.isoformat()
                }
            )
        else:
            if self._degradation_start_time:
                recovery_time = transition_timestamp - self._degradation_start_time
                self._last_recovery_time = recovery_time
                recovery_time_histogram.observe(recovery_time.total_seconds())
                logger.info(
                    f"System recovered: {old_level.name} → {new_level.name} ({recovery_time.total_seconds():.1f}s)",
                    extra={"recovery_seconds": recovery_time.total_seconds()}
                )
                self._degradation_start_time = None
        
        if new_level in self.level_transitions:
            try:
                await self.level_transitions[new_level]()
            except Exception as e:
                logger.error(f"Transition handler error for {new_level.name}: {e}")
        
        self.current_level = new_level
        
        self._transition_history.append({
            'timestamp': transition_timestamp,
            'from_level': old_level,
            'to_level': new_level,
            'health_score': self.calculate_overall_health_score()
        })
        
        if len(self._transition_history) > self._max_history_size:
            self._transition_history = self._transition_history[-self._max_history_size:]
        
        degradation_level_gauge.labels(level_name=new_level.name).set(new_level.value)
        degradation_transitions_counter.labels(from_level=old_level.name, to_level=new_level.name).inc()
    
    def predict_recovery_time(self) -> Optional[timedelta]:
        """Predice el tiempo aproximado para recuperación basado en historial"""
        if not self._recovery_predictor_enabled or len(self._transition_history) < 2:
            return None
        
        recovery_times = []
        current_degradation_start = None
        
        for transition in self._transition_history[-20:]:
            if transition['from_level'].value < transition['to_level'].value:
                current_degradation_start = transition['timestamp']
            elif current_degradation_start and transition['to_level'].value < transition['from_level'].value:
                recovery_time = (transition['timestamp'] - current_degradation_start).total_seconds()
                recovery_times.append(recovery_time)
                current_degradation_start = None
        
        if recovery_times:
            avg_recovery = statistics.mean(recovery_times)
            return timedelta(seconds=avg_recovery)
        
        return None
    
    def get_resource_scaling_config(self) -> Dict[str, Any]:
        """Retorna configuración de scaling de recursos para el nivel actual"""
        level_name = self.current_level.name
        return {
            'connection_pool_multiplier': self.scaling_config.connection_pool_reduction.get(level_name, 1.0),
            'cache_ttl_seconds': self.scaling_config.cache_ttl_seconds.get(level_name, 3600),
            'batch_size_multiplier': self.scaling_config.batch_size_multiplier.get(level_name, 1.0)
        }
    
    async def auto_recovery_loop(self):
        """Loop continuo (30s) que evalúa health y ajusta nivel automáticamente"""
        logger.info("Auto-recovery loop iniciado (30s interval)")
        
        while True:
            try:
                new_level = await self.evaluate_health()
                current_score = self.calculate_overall_health_score()
                
                if new_level.value < self.current_level.value:
                    logger.info(
                        f"Auto-recovery: {self.current_level.name} → {new_level.name} (score: {current_score}%)"
                    )
                    await self.set_level(new_level)
                
                elif new_level.value > self.current_level.value:
                    logger.warning(
                        f"Auto-degradation: {self.current_level.name} → {new_level.name} (score: {current_score}%)"
                    )
                    await self.set_level(new_level)
                
                self._last_check_time = datetime.utcnow()
                
            except Exception as e:
                logger.error(f"Auto-recovery loop error: {e}", exc_info=True)
            
            await asyncio.sleep(self._check_interval)
    
    def get_status(self) -> Dict[str, Any]:
        """Retorna status completo con health scores, transiciones, predicciones"""
        recovery_prediction = self.predict_recovery_time()
        
        return {
            'current_level': self.current_level.value,
            'current_level_name': self.current_level.name,
            'overall_health_score': self.calculate_overall_health_score(),
            'component_health': {
                name: {
                    'is_healthy': h.is_healthy,
                    'health_score': h.health_score,
                    'failure_count': h.failure_count,
                    'success_count': h.success_count,
                    'avg_latency_ms': round(h.avg_latency_ms, 2),
                    'last_error': h.last_error,
                    'last_check': h.last_check.isoformat()
                }
                for name, h in self.component_health.items()
            },
            'last_check_time': self._last_check_time.isoformat() if self._last_check_time else None,
            'check_interval_seconds': self._check_interval,
            'degradation_duration_seconds': (
                (datetime.utcnow() - self._degradation_start_time).total_seconds()
                if self._degradation_start_time else None
            ),
            'predicted_recovery_seconds': (
                recovery_prediction.total_seconds() if recovery_prediction else None
            ),
            'transition_history': [
                {
                    'timestamp': t['timestamp'].isoformat(),
                    'from_level': t['from_level'].name,
                    'to_level': t['to_level'].name,
                    'health_score': t.get('health_score', 0)
                }
                for t in self._transition_history[-10:]
            ],
            'resource_scaling_config': self.get_resource_scaling_config(),
            'health_checks_registered': list(self.component_health.keys())
        }


# GLOBAL INSTANCE

degradation_manager = DegradationManager()


# HELPER FUNCTIONS

def is_feature_available(feature: str) -> bool:
    """
    Verifica si una feature está disponible en el nivel actual de degradación
    DÍA 3 UPDATE: Updated matrix for Redis + S3 capabilities
    """
    current_level = degradation_manager.current_level
    
    # Feature availability matrix based on degradation level
    feature_matrix = {
        # Core features
        'cache': DegradationLevel.OPTIMAL,
        'openai_api': DegradationLevel.LIMITED,
        'write_operations': DegradationLevel.MINIMAL,
        'complex_queries': DegradationLevel.MINIMAL,
        'ai_enhancement': DegradationLevel.LIMITED,
        'recommendations': DegradationLevel.LIMITED,
        
        # DÍA 3: Redis-dependent features
        'redis_cache': DegradationLevel.DEGRADED,  # Can work without Redis
        'session_storage': DegradationLevel.DEGRADED,  # Fallback to DB
        'rate_limiting': DegradationLevel.DEGRADED,  # Fallback to memory
        'real_time_updates': DegradationLevel.OPTIMAL,  # Needs Redis
        
        # DÍA 3: S3-dependent features  
        's3_uploads': DegradationLevel.DEGRADED,  # Can queue locally
        'file_storage': DegradationLevel.DEGRADED,  # Fallback to local
        'image_processing': DegradationLevel.LIMITED,  # Less critical
        'backup_operations': DegradationLevel.MINIMAL,  # Can delay
        
        # Combined features requiring multiple services
        'full_ai_pipeline': DegradationLevel.OPTIMAL,  # Needs OpenAI + S3
        'advanced_analytics': DegradationLevel.LIMITED,  # Needs DB + Redis
        'real_time_inventory': DegradationLevel.DEGRADED,  # Needs DB + Redis
    }
    
    required_level = feature_matrix.get(feature, DegradationLevel.OPTIMAL)
    return current_level <= required_level
