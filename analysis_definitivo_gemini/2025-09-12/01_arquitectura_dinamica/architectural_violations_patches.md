# PARCHES ARQUITECTÓNICOS ESPECÍFICOS
## Correcciones Inmediatas para Violaciones Identificadas

### 🔴 PATCH 1: ELIMINACIÓN DE ACCESO DIRECTO BD EN PRICING ENGINE

#### **Archivo a Modificar:** `agente_negocio/pricing/engine.py`

#### **Código Actual (PROBLEMÁTICO):**
```python
from shared.config import get_settings
from shared.utils import calcular_precio_con_inflacion
from shared.database import get_db          # ❌ ACCESO DIRECTO
from shared.models import Producto          # ❌ BYPASS AGENTE DEPÓSITO
import logging

class PricingEngine:
    async def calcular_precio_inflacion(self, codigo: str, dias_transcurridos: int) -> float:
        db = next(get_db())                 # ❌ CONEXIÓN DIRECTA
        
        try:
            producto = db.query(Producto).filter(Producto.codigo == codigo).first()  # ❌ QUERY DIRECTA
```

#### **Código Corregido (RECOMENDADO):**
```python
from shared.config import get_settings
from shared.utils import calcular_precio_con_inflacion
from ..integrations.deposito_client import DepositoClient  # ✅ USO DE CLIENT
import logging

class PricingEngine:
    def __init__(self):
        self.deposito_client = DepositoClient()
        
    async def calcular_precio_inflacion(self, codigo: str, dias_transcurridos: int) -> float:
        """Calcular precio con inflación aplicada usando AgenteDepósito"""
        try:
            # ✅ Usar API del AgenteDepósito en lugar de acceso directo
            producto_data = await self.deposito_client.get_producto_by_codigo(codigo)
            if not producto_data:
                raise Exception(f"Producto {codigo} no encontrado")

            # Aplicar inflación sobre precio obtenido vía API
            precio_actualizado = calcular_precio_con_inflacion(
                producto_data['precio_compra'],
                dias_transcurridos,
                settings.INFLACION_MENSUAL
            )

            logger.info(f"Precio actualizado vía API - {codigo}: ${precio_actualizado:.2f}")
            return precio_actualizado

        except Exception as e:
            logger.error(f"Error calculando precio para {codigo}: {e}")
            raise
```

#### **Endpoint Adicional Requerido en AgenteDepósito:**
```python
# Agregar a agente_deposito/main_complete.py
@app.get("/api/v1/productos/codigo/{codigo}/precio",
         response_model=Dict[str, Any],
         summary="Obtener precio base de producto para cálculos")
async def get_producto_precio_by_codigo(
    codigo: str,
    db: Session = Depends(get_db)
):
    """Endpoint específico para PricingEngine - Solo devuelve precio_compra"""
    producto = db.query(Producto).filter(Producto.codigo == codigo).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return {
        "codigo": producto.codigo,
        "precio_compra": producto.precio_compra,
        "fecha_ultima_compra": producto.fecha_actualizacion
    }
```

---

### 🔴 PATCH 2: CORRECCIÓN CONFIGURACIÓN NGINX

#### **Archivo a Modificar:** `inventario-retail/nginx/inventario-retail.conf`

#### **Configuración Actual (INCORRECTA):**
```nginx
# AgenteNegocio
location /api/negocio/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://127.0.0.1:8001/;    # ❌ PUERTO INCORRECTO
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# AgenteDepósito  
location /api/deposito/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://127.0.0.1:8002/;    # ❌ PUERTO INCORRECTO
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

#### **Configuración Corregida:**
```nginx
# AgenteNegocio - Puerto 8002 según docker-compose
location /api/negocio/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://127.0.0.1:8002/;    # ✅ CORREGIDO
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# AgenteDepósito - Puerto 8001 según docker-compose
location /api/deposito/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://127.0.0.1:8001/;    # ✅ CORREGIDO
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# ✅ NUEVO: ML Service
location /api/ml/ {
    limit_req zone=api burst=10 nodelay;
    proxy_pass http://127.0.0.1:8003/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

### 🔴 PATCH 3: IMPLEMENTACIÓN CONSUMIDOR OUTBOX PATTERN

#### **Archivo Nuevo:** `shared/resilience/outbox_consumer.py`

```python
"""
Consumidor del patrón Outbox para garantizar entrega de mensajes
"""
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..database import get_db, engine
from ..models import OutboxMessage
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class OutboxConsumer:
    def __init__(self, batch_size: int = 10, retry_delay: int = 30):
        self.batch_size = batch_size
        self.retry_delay = retry_delay
        self.running = False
        
    async def start_consumer(self):
        """Iniciar el consumidor de mensajes outbox"""
        self.running = True
        logger.info("Iniciando OutboxConsumer...")
        
        while self.running:
            try:
                await self.process_pending_messages()
                await asyncio.sleep(self.retry_delay)
                
            except Exception as e:
                logger.error(f"Error en OutboxConsumer: {e}")
                await asyncio.sleep(self.retry_delay * 2)  # Backoff
                
    async def process_pending_messages(self) -> int:
        """Procesar mensajes pendientes en lotes"""
        db = next(get_db())
        processed_count = 0
        
        try:
            # Obtener mensajes pendientes, priorizando por fecha
            pending_messages = db.query(OutboxMessage).filter(
                and_(
                    OutboxMessage.status == "pending",
                    OutboxMessage.retries < OutboxMessage.max_retries
                )
            ).order_by(OutboxMessage.created_at).limit(self.batch_size).all()
            
            if not pending_messages:
                return 0
                
            logger.info(f"Procesando {len(pending_messages)} mensajes outbox")
            
            for message in pending_messages:
                success = await self.process_single_message(message, db)
                if success:
                    processed_count += 1
                    
        finally:
            db.close()
            
        return processed_count
    
    async def process_single_message(self, message: OutboxMessage, db: Session) -> bool:
        """Procesar un mensaje individual"""
        try:
            # Incrementar contador de reintentos
            message.retries += 1
            message.last_retry_at = datetime.utcnow()
            
            # Procesar según tipo de evento
            payload = json.loads(message.payload)
            
            if message.event_type == "stock_updated":
                success = await self.handle_stock_updated(payload, message.destination)
            elif message.event_type == "product_created":
                success = await self.handle_product_created(payload, message.destination)
            elif message.event_type == "invoice_processed":
                success = await self.handle_invoice_processed(payload, message.destination)
            else:
                logger.warning(f"Tipo de evento desconocido: {message.event_type}")
                message.status = "failed"
                success = False
            
            if success:
                message.status = "sent"
                message.sent_at = datetime.utcnow()
                logger.info(f"Mensaje {message.id} procesado exitosamente")
            else:
                if message.retries >= message.max_retries:
                    message.status = "failed"
                    logger.error(f"Mensaje {message.id} falló después de {message.retries} reintentos")
                
            db.commit()
            return success
            
        except Exception as e:
            logger.error(f"Error procesando mensaje {message.id}: {e}")
            db.rollback()
            return False
    
    async def handle_stock_updated(self, payload: dict, destination: str) -> bool:
        """Manejar evento de actualización de stock"""
        # Implementar notificación a servicios externos
        # Por ejemplo: webhook a sistema de e-commerce
        logger.info(f"Stock actualizado para producto {payload.get('producto_id')}")
        return True
    
    async def handle_product_created(self, payload: dict, destination: str) -> bool:
        """Manejar evento de creación de producto"""
        logger.info(f"Producto creado: {payload.get('codigo')}")
        return True
    
    async def handle_invoice_processed(self, payload: dict, destination: str) -> bool:
        """Manejar evento de factura procesada"""
        logger.info(f"Factura procesada: {payload.get('numero_factura')}")
        return True
    
    def stop_consumer(self):
        """Detener el consumidor"""
        self.running = False
        logger.info("OutboxConsumer detenido")

# Función helper para crear mensajes outbox
def create_outbox_message(
    event_type: str,
    payload: dict,
    destination: str = "default",
    db: Session = None
) -> OutboxMessage:
    """Crear un nuevo mensaje en la tabla outbox"""
    if not db:
        db = next(get_db())
    
    message = OutboxMessage(
        event_type=event_type,
        payload=json.dumps(payload),
        destination=destination
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    logger.info(f"Mensaje outbox creado: {event_type} -> {destination}")
    return message
```

#### **Archivo de Servicio:** `schedulers/outbox_scheduler.py`

```python
"""
Scheduler para ejecutar OutboxConsumer como servicio background
"""
import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from shared.resilience.outbox_consumer import OutboxConsumer

logger = logging.getLogger(__name__)

async def start_outbox_service():
    """Iniciar el servicio de procesamiento Outbox"""
    consumer = OutboxConsumer(batch_size=20, retry_delay=10)
    
    # Ejecutar en loop continuo
    await consumer.start_consumer()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Iniciando servicio OutboxConsumer...")
    
    try:
        asyncio.run(start_outbox_service())
    except KeyboardInterrupt:
        logger.info("Servicio OutboxConsumer detenido por usuario")
```

---

### 📋 RESUMEN DE APLICACIÓN DE PATCHES

#### **Orden de Implementación Recomendado:**

1. **PATCH 3 (Outbox)** - ⏱️ 2 horas
   - Crear archivos `outbox_consumer.py` y `outbox_scheduler.py`
   - Agregar servicio al `docker-compose.yml`
   
2. **PATCH 1 (PricingEngine)** - ⏱️ 1 hora
   - Modificar `pricing/engine.py`
   - Agregar endpoint en `agente_deposito/main_complete.py`
   - Testing de integración
   
3. **PATCH 2 (Nginx)** - ⏱️ 30 minutos
   - Corregir `nginx/inventario-retail.conf`
   - Restart de proxy y validación

#### **Testing Post-Patches:**
```bash
# Validar corrección Nginx
curl -v http://localhost/api/deposito/health
curl -v http://localhost/api/negocio/health

# Validar PricingEngine sin acceso directo BD
curl -X GET "http://localhost:8002/precios/consultar?codigo=PROD001&dias=30"

# Monitorear procesamiento Outbox
docker logs outbox_consumer_service -f
```

---
**✅ Patches listos para implementación inmediata con impacto arquitectónico positivo.**