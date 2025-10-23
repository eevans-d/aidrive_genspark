# Instrucciones para Próxima Sesión - SEMANA 2.2

**Estado Actual:** ✅ SEMANA 2.1 Completada  
**Próxima Fase:** 🔄 SEMANA 2.2 WebSocket Real-time  
**Fecha Última Actualización:** 2025-10-23

---

## 🎯 Objetivo SEMANA 2.2

Implementar la capa de entrega real-time de notificaciones mediante WebSocket.

**ETA:** 3.5-4 horas

---

## 📋 Tareas Específicas

### 1. WebSocket Endpoint (/ws/notifications)

**Archivo:** `inventario-retail/web_dashboard/dashboard_app.py`

**Implementar:**
```python
from fastapi import WebSocket
from starlette.websockets import WebSocketState

@app.websocket("/ws/notifications")
async def websocket_notifications_endpoint(websocket: WebSocket, user_id: int = None):
    """WebSocket endpoint for real-time notifications"""
    # Validación de user_id desde query params
    # Autenticación vía token/API key
    # Connection management
    # Message routing
    # Broadcasting
```

**Requisitos:**
- [ ] Autenticación en handshake (X-API-Key o JWT)
- [ ] User ID extraction desde query params
- [ ] Connection state management
- [ ] Ping/pong keep-alive (30s interval)
- [ ] Graceful disconnect handling
- [ ] Message types: auth, notification, mark_read, unread_count

**Tests planeados:** 8 tests
- [ ] test_websocket_connect
- [ ] test_websocket_auth_required
- [ ] test_websocket_send_notification
- [ ] test_websocket_mark_read
- [ ] test_websocket_unread_count
- [ ] test_websocket_multiple_connections
- [ ] test_websocket_reconnect
- [ ] test_websocket_performance

### 2. Real-time Delivery Integration

**Integración NotificationService ↔ WebSocket**

```python
# En dashboard_app.py o nuevo archivo services/websocket_manager.py

class WebSocketManager:
    """Manages WebSocket connections and broadcasting"""
    
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, user_id: int, websocket: WebSocket):
        # Register connection
        # Send initial state (unread count)
    
    async def broadcast_notification(self, user_id: int, notification: Dict):
        # Send to specific user's WebSocket connections
        # Handle disconnected clients
    
    async def broadcast_to_all(self, notification: Dict, users: List[int]):
        # Send to multiple users
```

**Requisitos:**
- [ ] Global WebSocketManager instance
- [ ] Connection pooling per user
- [ ] Async message broadcasting
- [ ] Error handling (disconnected clients)
- [ ] Retry logic para failed sends

**Tests planeados:** 6 tests
- [ ] test_broadcast_single_user
- [ ] test_broadcast_multiple_users
- [ ] test_broadcast_disconnected_client
- [ ] test_unread_count_sync
- [ ] test_notification_delivery_confirmation
- [ ] test_websocket_manager_performance

### 3. Trigger Notifications desde NotificationService

**Modificar:** `inventario-retail/web_dashboard/services/notification_service.py`

```python
# En el método send_notification, después de guardar en DB:

async def send_notification(...):
    # ... existing code ...
    
    # NEW: Trigger WebSocket broadcast
    websocket_manager = get_websocket_manager()
    await websocket_manager.broadcast_notification(
        user_id=user_id,
        notification={
            'type': 'notification',
            'notification_id': notification_id,
            'subject': subject,
            'message': message,
            'priority': priority.value,
            'timestamp': datetime.now().isoformat()
        }
    )
```

### 4. Frontend Integration (websocket-notifications.js)

**Ya creado pero necesita:**
- [ ] Conectar a endpoint real `/ws/notifications`
- [ ] Enviar autenticación en handshake
- [ ] Manejo de mensajes de servidor
- [ ] Sincronización de contador
- [ ] Persistencia en localStorage

**Verificar:**
```javascript
// En dashboard templates (base.html o dashboard.html)
<script src="/static/js/websocket-notifications.js"></script>
<script>
    // Inicializar WebSocket
    document.addEventListener('DOMContentLoaded', () => {
        const manager = initializeWebSocketNotifications({
            userId: {{ user_id }},  // Del contexto Flask/FastAPI
            apiKey: '{{ api_key }}',
            onNotification: (notif) => {
                // Display toast
                console.log('New notification:', notif);
            }
        });
    });
</script>
```

---

## 🏗️ Arquitectura WebSocket

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Browser)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  WebSocketNotificationManager                        │   │
│  │  • connect() - Establece conexión WS                 │   │
│  │  • handleMessage() - Procesa eventos                 │   │
│  │  • showToast() - Muestra notificación                │   │
│  │  • updateUnreadCount() - Actualiza contador          │   │
│  └──────────────────────────────────────────────────────┘   │
│                      ↕ /ws/notifications                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  @app.websocket("/ws/notifications")                 │   │
│  │  ├─ Autenticación (X-API-Key)                        │   │
│  │  ├─ Connection management                            │   │
│  │  ├─ Message routing                                  │   │
│  │  └─ Broadcasting                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                      ↕                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  WebSocketManager                                    │   │
│  │  • active_connections Dict[user_id, [WebSocket]]    │   │
│  │  • broadcast_notification()                          │   │
│  │  • broadcast_to_all()                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                      ↕                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  NotificationService                                │   │
│  │  • send_notification() → triggers broadcast         │   │
│  │  • Database persistence                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 WebSocket Message Protocol

### Client → Server

**Authentication:**
```json
{
    "type": "auth",
    "user_id": 1,
    "api_key": "dev"
}
```

**Mark as read:**
```json
{
    "type": "mark_read",
    "notification_id": 12345
}
```

**Pong (keep-alive):**
```json
{
    "type": "pong"
}
```

### Server → Client

**Authentication Success:**
```json
{
    "type": "auth_success",
    "user_id": 1,
    "message": "Authenticated"
}
```

**Notification:**
```json
{
    "type": "notification",
    "notification_id": 12345,
    "notification_type": "stock_alert",
    "priority": "high",
    "subject": "Stock bajo",
    "message": "Producto A stock es bajo",
    "timestamp": "2025-10-23T12:00:00.000Z"
}
```

**Unread Count Update:**
```json
{
    "type": "unread_count",
    "count": 5
}
```

**Ping (keep-alive):**
```json
{
    "type": "ping"
}
```

---

## 🧪 Testing Strategy

### Unit Tests (test_websocket_notifications.py)

```python
class TestWebSocketEndpoint:
    def test_websocket_connect_requires_auth
    def test_websocket_connect_success
    def test_websocket_send_notification
    def test_websocket_mark_read
    
class TestWebSocketManager:
    def test_broadcast_single_user
    def test_broadcast_multiple_users
    def test_broadcast_disconnected_client
    
class TestIntegration:
    def test_notification_flow_end_to_end
    def test_multiple_concurrent_connections
```

### Manual Testing Checklist

```
□ Abrir dashboard en 2 navegadores (usuarios diferentes)
□ Enviar notificación desde backend a usuario 1
□ Verificar aparece toast en usuario 1 en tiempo real
□ Verificar NO aparece en usuario 2
□ Cerrar navegador de usuario 1, enviar notificación
□ Reabrirlo y verificar notificación almacenada en BD
□ Verificar contador se actualiza en real-time
□ Hacer network throttle en DevTools
□ Verificar reconexión automática después de caída
```

---

## 📊 Performance Targets

| Métrica | Target | Aceptable |
|---------|--------|-----------|
| WebSocket connection latency | <100ms | <200ms |
| Notification delivery latency | <500ms | <1s |
| Concurrent connections | 100+ | 50+ |
| Message throughput | 1000/sec | 500/sec |
| Memory per connection | <1MB | <5MB |

---

## 🔐 Seguridad

- [ ] Validar user_id en cada mensaje
- [ ] Validar X-API-Key en handshake
- [ ] Prevenir cross-user data access
- [ ] Rate limiting en WebSocket sends
- [ ] Timeout para conexiones idle (>5 min)

---

## 📝 Documentación a Generar

- [ ] `SEMANA_2.2_WEBSOCKET_IMPLEMENTATION.md` - Detalles técnicos
- [ ] Swagger/OpenAPI schema para WebSocket
- [ ] README de WebSocket API

---

## 🚀 Deploy Checklist

**Antes de mover a SEMANA 2.3:**
- [ ] Todos 14 tests PASANDO (8 WebSocket + 6 Integration)
- [ ] Performance targets met
- [ ] Manual testing completed
- [ ] Code review
- [ ] Git commit
- [ ] Documentation updated

---

## 📞 Notas Importantes

1. **WebSocket in FastAPI:** Usar `@app.websocket()` decorator
2. **Connection Management:** Mantener en memoria Dict[user_id -> List[WebSocket]]
3. **Error Handling:** Graceful disconnect, auto-cleanup
4. **Scalability:** Setup preparado pero single-server. Multi-server requeriría Redis pub/sub
5. **Browser Support:** WebSocket soportado en todos navegadores modernos

---

## 🎯 Criterios de Aceptación

✅ SEMANA 2.2 se considera COMPLETADA cuando:
1. WebSocket endpoint funcionando y autenticado
2. Notificaciones entregadas en real-time (<500ms)
3. 14/14 tests PASANDO (100%)
4. Frontend conecta y recibe notificaciones
5. Contador de no leídas se sincroniza
6. Todo documentado

---

*Última actualización: 2025-10-23*  
*Próxima sesión: SEMANA 2.2 WebSocket Implementation*
