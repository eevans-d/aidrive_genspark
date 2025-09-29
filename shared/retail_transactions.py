"""
Servicio de transacciones atómicas específicas para operaciones retail
Implementa circuit breakers y manejo de concurrencia para sistemas críticos
"""

import asyncio
import random
import logging
from contextlib import asynccontextmanager
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum


logger = logging.getLogger(__name__)


class CircuitBreakerState(Enum):
    """Estados del circuit breaker"""
    CLOSED = "closed"       # Funcionando normal
    OPEN = "open"          # Fallando, rechazando requests
    HALF_OPEN = "half_open" # Probando si se recuperó


@dataclass
class CircuitBreakerConfig:
    """Configuración del circuit breaker"""
    failure_threshold: int = 5      # Fallos antes de abrir
    recovery_timeout: int = 60      # Segundos antes de probar recovery
    expected_exception: type = Exception  # Tipo de excepción que cuenta como fallo


class CircuitBreaker:
    """
    Circuit breaker para operaciones críticas de retail
    """
    
    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.success_count = 0
        
    async def call(self, func: Callable, *args, **kwargs):
        """
        Ejecutar función con circuit breaker
        """
        if self.state == CircuitBreakerState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitBreakerState.HALF_OPEN
                logger.info(f"Circuit breaker transitioning to HALF_OPEN for {func.__name__}")
            else:
                raise Exception(f"Circuit breaker OPEN for {func.__name__}")
        
        try:
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            self._on_success()
            return result
            
        except self.config.expected_exception as e:
            self._on_failure()
            raise e
            
    def _should_attempt_reset(self) -> bool:
        """Verificar si es tiempo de intentar recovery"""
        if self.last_failure_time is None:
            return True
        return datetime.now() - self.last_failure_time > timedelta(seconds=self.config.recovery_timeout)
    
    def _on_success(self):
        """Manejar éxito de operación"""
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= 2:  # Requiere 2 éxitos consecutivos para cerrar
                self.state = CircuitBreakerState.CLOSED
                self.failure_count = 0
                self.success_count = 0
                logger.info("Circuit breaker transitioned to CLOSED - recovered")
        else:
            self.failure_count = 0
    
    def _on_failure(self):
        """Manejar fallo de operación"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.failure_count >= self.config.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            logger.error(f"Circuit breaker OPENED after {self.failure_count} failures")


class RetailStockService:
    """
    Servicio de transacciones atómicas para stock retail
    """
    
    def __init__(self, db_session_factory, cache_client=None):
        self.db_session_factory = db_session_factory
        self.cache_client = cache_client
        
        # Circuit breakers para operaciones críticas
        self.stock_circuit_breaker = CircuitBreaker(
            CircuitBreakerConfig(failure_threshold=3, recovery_timeout=30)
        )
        self.ocr_circuit_breaker = CircuitBreaker(
            CircuitBreakerConfig(failure_threshold=5, recovery_timeout=60)
        )
        
    @asynccontextmanager
    async def atomic_stock_operation(self, producto_id: int, max_retries: int = 3):
        """
        Context manager para operaciones atómicas de stock con retry y backoff
        """
        for attempt in range(max_retries):
            try:
                async with self.db_session_factory() as session:
                    # Usar SELECT FOR UPDATE para bloquear el producto específico
                    await session.execute(
                        "SELECT id FROM productos WHERE id = :producto_id FOR UPDATE",
                        {"producto_id": producto_id}
                    )
                    
                    # Invalidar cache del producto
                    if self.cache_client:
                        await self._invalidate_product_cache(producto_id)
                    
                    yield session
                    await session.commit()
                    
                    logger.info(f"Stock operation completed successfully for product {producto_id}")
                    break
                    
            except Exception as e:
                if "database is locked" in str(e).lower() and attempt < max_retries - 1:
                    # Backoff exponencial con jitter para SQLite
                    delay = (2 ** attempt) + random.uniform(0.1, 0.5)
                    logger.warning(f"Database locked, retrying in {delay:.2f}s (attempt {attempt + 1})")
                    await asyncio.sleep(delay)
                    continue
                    
                logger.error(f"Stock operation failed for product {producto_id}: {e}")
                raise
                
        else:
            raise Exception(f"Stock operation failed after {max_retries} attempts for product {produto_id}")
    
    async def validar_stock_suficiente(self, producto_id: int, cantidad_requerida: int) -> Dict[str, Any]:
        """
        Validación robusta de stock suficiente con circuit breaker
        """
        async def _validate_stock():
            async with self.db_session_factory() as session:
                result = await session.execute(
                    """
                    SELECT 
                        p.nombre,
                        p.stock_actual,
                        p.stock_minimo,
                        COALESCE(SUM(CASE WHEN m.tipo_movimiento = 'ENTRADA' THEN m.cantidad 
                                         WHEN m.tipo_movimiento = 'SALIDA' THEN -m.cantidad 
                                         ELSE 0 END), 0) as stock_calculado
                    FROM productos p
                    LEFT JOIN movimientos_stock m ON p.id = m.producto_id
                    WHERE p.id = :producto_id AND p.activo = 1
                    GROUP BY p.id, p.nombre, p.stock_actual, p.stock_minimo
                    """,
                    {"producto_id": producto_id}
                )
                
                producto = result.fetchone()
                if not producto:
                    raise ValueError(f"Producto {producto_id} no encontrado o inactivo")
                
                stock_real = producto.stock_calculado or producto.stock_actual
                
                return {
                    "producto_id": producto_id,
                    "nombre": producto.nombre,
                    "stock_actual": stock_real,
                    "stock_minimo": producto.stock_minimo,
                    "cantidad_requerida": cantidad_requerida,
                    "stock_suficiente": stock_real >= cantidad_requerida,
                    "stock_restante": stock_real - cantidad_requerida,
                    "alerta_stock_bajo": (stock_real - cantidad_requerida) <= producto.stock_minimo
                }
        
        return await self.stock_circuit_breaker.call(_validate_stock)
    
    async def procesar_movimiento_stock(self, movimiento_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Procesar movimiento de stock con validaciones y atomicidad completa
        """
        producto_id = movimiento_data["producto_id"]
        cantidad = movimiento_data["cantidad"]
        tipo = movimiento_data["tipo"]
        
        # Validar stock suficiente si es SALIDA
        if tipo in ["SALIDA", "TRANSFERENCIA"]:
            stock_info = await self.validar_stock_suficiente(producto_id, cantidad)
            if not stock_info["stock_suficiente"]:
                raise ValueError(
                    f"Stock insuficiente para {stock_info['nombre']}. "
                    f"Disponible: {stock_info['stock_actual']}, Requerido: {cantidad}"
                )
        
        # Procesar movimiento atómicamente
        async with self.atomic_stock_operation(producto_id) as session:
            # Insertar movimiento
            await session.execute(
                """
                INSERT INTO movimientos_stock 
                (producto_id, cantidad, tipo_movimiento, motivo, usuario_id, created_at)
                VALUES (:producto_id, :cantidad, :tipo, :motivo, :usuario_id, :created_at)
                """,
                {
                    "producto_id": producto_id,
                    "cantidad": cantidad,
                    "tipo": tipo,
                    "motivo": movimiento_data.get("motivo", ""),
                    "usuario_id": movimiento_data.get("usuario_id", 1),
                    "created_at": datetime.now()
                }
            )
            
            # Actualizar stock actual del producto
            factor = 1 if tipo == "ENTRADA" else -1
            await session.execute(
                """
                UPDATE productos 
                SET stock_actual = stock_actual + (:cantidad * :factor),
                    updated_at = :updated_at
                WHERE id = :producto_id
                """,
                {
                    "cantidad": cantidad,
                    "factor": factor,
                    "producto_id": producto_id,
                    "updated_at": datetime.now()
                }
            )
            
            # Verificar que el stock final no sea negativo
            result = await session.execute(
                "SELECT stock_actual FROM productos WHERE id = :producto_id",
                {"producto_id": producto_id}
            )
            stock_final = result.fetchone().stock_actual
            
            if stock_final < 0:
                raise ValueError(f"Operación resultaría en stock negativo: {stock_final}")
        
        # Log de auditoría
        logger.info(
            f"Stock movement processed: Product {producto_id}, "
            f"Type {tipo}, Quantity {cantidad}, Final stock: {stock_final}"
        )
        
        return {
            "success": True,
            "producto_id": producto_id,
            "movimiento_tipo": tipo,
            "cantidad": cantidad,
            "stock_final": stock_final,
            "timestamp": datetime.now().isoformat()
        }
    
    async def transferir_entre_depositos(self, transferencia_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transferencia atómica entre depósitos con rollback automático
        """
        producto_id = transferencia_data["producto_id"]
        cantidad = transferencia_data["cantidad"]
        deposito_origen = transferencia_data["deposito_origen_id"]
        deposito_destino = transferencia_data["deposito_destino_id"]
        
        async with self.atomic_stock_operation(producto_id) as session:
            # Validar stock en origen
            result = await session.execute(
                """
                SELECT stock_actual FROM productos 
                WHERE id = :producto_id AND deposito_id = :deposito_origen
                """,
                {"producto_id": producto_id, "deposito_origen": deposito_origen}
            )
            
            producto_origen = result.fetchone()
            if not producto_origen or producto_origen.stock_actual < cantidad:
                raise ValueError(f"Stock insuficiente en depósito origen {deposito_origen}")
            
            # Crear movimiento SALIDA en origen
            await session.execute(
                """
                INSERT INTO movimientos_stock 
                (producto_id, cantidad, tipo_movimiento, motivo, deposito_id, created_at)
                VALUES (:producto_id, :cantidad, 'TRANSFERENCIA_SALIDA', 
                        :motivo, :deposito_origen, :created_at)
                """,
                {
                    "producto_id": producto_id,
                    "cantidad": cantidad,
                    "motivo": f"Transferencia a depósito {deposito_destino}",
                    "deposito_origen": deposito_origen,
                    "created_at": datetime.now()
                }
            )
            
            # Crear movimiento ENTRADA en destino
            await session.execute(
                """
                INSERT INTO movimientos_stock 
                (producto_id, cantidad, tipo_movimiento, motivo, deposito_id, created_at)
                VALUES (:producto_id, :cantidad, 'TRANSFERENCIA_ENTRADA', 
                        :motivo, :deposito_destino, :created_at)
                """,
                {
                    "producto_id": producto_id,
                    "cantidad": cantidad,
                    "motivo": f"Transferencia desde depósito {deposito_origen}",
                    "deposito_destino": deposito_destino,
                    "created_at": datetime.now()
                }
            )
            
            # Actualizar stocks
            await session.execute(
                """
                UPDATE productos SET stock_actual = stock_actual - :cantidad 
                WHERE id = :producto_id AND deposito_id = :deposito_origen
                """,
                {"cantidad": cantidad, "producto_id": producto_id, "deposito_origen": deposito_origen}
            )
            
            await session.execute(
                """
                UPDATE productos SET stock_actual = stock_actual + :cantidad 
                WHERE id = :producto_id AND deposito_id = :deposito_destino
                """,
                {"cantidad": cantidad, "producto_id": producto_id, "deposito_destino": deposito_destino}
            )
        
        logger.info(f"Transfer completed: Product {producto_id}, {cantidad} units from {deposito_origen} to {deposito_destino}")
        
        return {
            "success": True,
            "transferencia_id": f"{producto_id}_{deposito_origen}_{deposito_destino}_{int(datetime.now().timestamp())}",
            "producto_id": producto_id,
            "cantidad": cantidad,
            "deposito_origen": deposito_origen,
            "deposito_destino": deposito_destino,
            "timestamp": datetime.now().isoformat()
        }
    
    async def procesar_ocr_con_circuit_breaker(self, imagen_path: str, ocr_processor) -> Dict[str, Any]:
        """
        Procesar OCR con circuit breaker para resiliencia
        """
        async def _process_ocr():
            # Simulamos procesamiento OCR
            start_time = datetime.now()
            
            try:
                resultado_ocr = await ocr_processor.process_image(imagen_path)
                processing_time = (datetime.now() - start_time).total_seconds()
                
                if processing_time > 10.0:  # Timeout de 10 segundos
                    raise TimeoutError(f"OCR processing timeout: {processing_time:.2f}s")
                
                return {
                    "success": True,
                    "processing_time": processing_time,
                    "results": resultado_ocr,
                    "image_path": imagen_path
                }
                
            except Exception as e:
                logger.error(f"OCR processing failed for {imagen_path}: {e}")
                raise
        
        return await self.ocr_circuit_breaker.call(_process_ocr)
    
    async def _invalidate_product_cache(self, producto_id: int):
        """Invalidar cache del producto"""
        if self.cache_client:
            try:
                cache_keys = [
                    f"producto:{producto_id}",
                    f"stock:{producto_id}",
                    f"producto_details:{producto_id}"
                ]
                
                for key in cache_keys:
                    await self.cache_client.delete(key)
                    
                logger.debug(f"Cache invalidated for product {producto_id}")
                
            except Exception as e:
                logger.warning(f"Cache invalidation failed for product {producto_id}: {e}")


# Factory function para crear el servicio
def create_retail_stock_service(db_session_factory, cache_client=None) -> RetailStockService:
    """
    Factory para crear instancia del servicio de stock retail
    """
    return RetailStockService(db_session_factory, cache_client)


# Constantes de configuración
STOCK_OPERATION_TIMEOUT = 30  # segundos
MAX_CONCURRENT_STOCK_OPERATIONS = 10
OCR_PROCESSING_TIMEOUT = 15  # segundos
DEFAULT_RETRY_ATTEMPTS = 3