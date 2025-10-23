#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Notification API Endpoints - SEMANA 3 Backend Implementation
============================================================

Implementa los 6 endpoints requeridos para el sistema de notificaciones:
1. GET /api/notifications - Listar notificaciones con filtrado y paginación
2. PUT /api/notifications/{id}/mark-as-read - Marcar como leída
3. DELETE /api/notifications/{id} - Eliminar notificación
4. GET /api/notification-preferences - Obtener preferencias
5. PUT /api/notification-preferences - Actualizar preferencias
6. DELETE /api/notifications - Eliminar todas

Integración: Copiar endpoints a dashboard_app.py o usar FastAPI router
"""

import os
import sys
import logging
import time
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Request, HTTPException, Header, Query, WebSocket
from pydantic import BaseModel, Field

# Add parent directory to path for importing repositories
_web_dashboard_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _web_dashboard_dir not in sys.path:
    sys.path.insert(0, _web_dashboard_dir)

# Import repositories
from repositories.notification_repository import (
    NotificationRepository,
    PreferencesRepository,
    init_db
)

logger = logging.getLogger(__name__)

# Initialize database
init_db()

# Create router
router = APIRouter(prefix="/api", tags=["notifications"])

# ============================================================================
# PYDANTIC MODELS FOR REQUESTS/RESPONSES
# ============================================================================

class NotificationResponse(BaseModel):
    """Response model para una notificación"""
    id: str
    user_id: int
    title: str
    message: str
    type: str
    priority: str
    status: str
    created_at: str
    read_at: Optional[str] = None


class NotificationsListResponse(BaseModel):
    """Response model para lista de notificaciones"""
    notifications: List[NotificationResponse]
    pagination: dict = Field(default_factory=dict)
    total: int = 0


class PreferencesRequest(BaseModel):
    """Request model para actualizar preferencias"""
    channels: Optional[List[str]] = None
    types: Optional[List[str]] = None
    priority_filter: Optional[str] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    frequency: Optional[str] = None


class PreferencesResponse(BaseModel):
    """Response model para preferencias"""
    id: str
    user_id: int
    channels: List[str]
    types: List[str]
    priority_filter: str
    quiet_hours_enabled: bool
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    frequency: str


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def validate_api_key(x_api_key: Optional[str] = Header(None)) -> bool:
    """Valida el API key desde header"""
    if not x_api_key or x_api_key != os.getenv("DASHBOARD_API_KEY", "dev"):
        return False
    return True


def get_user_id_from_request(request: Request) -> int:
    """Extrae user_id del contexto de request"""
    # Intenta obtener de query params, headers, o session
    user_id = request.query_params.get("user_id")
    if not user_id:
        # Fallback: obtener del contexto de WebSocket o session
        user_id = getattr(request.state, "user_id", 1)
    return int(user_id) if user_id else 1


# ============================================================================
# ENDPOINT 1: GET /api/notifications
# ============================================================================

@router.get("/notifications", response_model=NotificationsListResponse)
async def get_notifications(
    request: Request,
    user_id: int = Query(None, description="ID del usuario"),
    status: str = Query("all", enum=["all", "read", "unread"], description="Filtro por estado"),
    page: int = Query(1, ge=1, description="Número de página"),
    per_page: int = Query(20, ge=1, le=100, description="Registros por página"),
    x_api_key: str = Header(None)
):
    """
    Obtiene notificaciones del usuario con filtrado y paginación
    
    **Parámetros:**
    - `user_id`: ID del usuario (requerido)
    - `status`: "all", "read", o "unread" (default: all)
    - `page`: Número de página (default: 1)
    - `per_page`: Items por página (default: 20, max: 100)
    
    **Headers:**
    - `X-API-Key`: Token de autenticación
    
    **Response:**
    ```json
    {
      "notifications": [...],
      "pagination": {
        "current_page": 1,
        "total_pages": 3,
        "total_items": 50,
        "per_page": 20
      },
      "total": 50
    }
    ```
    """
    start_time = time.time()
    
    # Validar API key
    if not validate_api_key(x_api_key):
        logger.warning(f"❌ Unauthorized request to GET /api/notifications")
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Usar user_id del parámetro o del request
        if user_id is None:
            user_id = get_user_id_from_request(request)
        
        # Calcular offset
        offset = (page - 1) * per_page
        
        # Obtener notificaciones
        notifications, total = NotificationRepository.get_user_notifications(
            user_id=user_id,
            status=status,
            limit=per_page,
            offset=offset
        )
        
        # Convertir a datetime strings
        for notif in notifications:
            if isinstance(notif.get("created_at"), str):
                notif["created_at"] = notif["created_at"]
            if notif.get("read_at"):
                notif["read_at"] = notif["read_at"]
        
        # Calcular páginas totales
        total_pages = (total + per_page - 1) // per_page
        
        duration_ms = (time.time() - start_time) * 1000
        
        logger.info(
            f"✅ GET /api/notifications",
            extra={
                "user_id": user_id,
                "status": status,
                "count": len(notifications),
                "total": total,
                "duration_ms": round(duration_ms, 2)
            }
        )
        
        return NotificationsListResponse(
            notifications=[NotificationResponse(**n) for n in notifications],
            pagination={
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total,
                "per_page": per_page
            },
            total=total
        )
    
    except Exception as e:
        logger.error(f"❌ Error in GET /api/notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINT 2: PUT /api/notifications/{id}/mark-as-read
# ============================================================================

@router.put("/notifications/{notification_id}/mark-as-read")
async def mark_notification_as_read(
    notification_id: str,
    request: Request,
    read: bool = Query(True, description="true=marcar como leída, false=marcar como no leída"),
    x_api_key: str = Header(None)
):
    """
    Marca una notificación como leída o no leída
    
    **Parámetros:**
    - `notification_id`: ID de la notificación
    - `read`: true para marcar como leída, false para desmarcar
    
    **Headers:**
    - `X-API-Key`: Token de autenticación
    
    **Response:**
    ```json
    {
      "success": true,
      "message": "Notification marked as read"
    }
    ```
    """
    start_time = time.time()
    
    # Validar API key
    if not validate_api_key(x_api_key):
        logger.warning(f"❌ Unauthorized request to PUT /api/notifications/{notification_id}/mark-as-read")
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Marcar como leída o no leída
        if read:
            success = NotificationRepository.mark_as_read(notification_id)
            message = "Notification marked as read"
        else:
            success = NotificationRepository.mark_as_unread(notification_id)
            message = "Notification marked as unread"
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        duration_ms = (time.time() - start_time) * 1000
        
        logger.info(
            f"✅ PUT /api/notifications/{notification_id}/mark-as-read",
            extra={
                "notification_id": notification_id,
                "read": read,
                "duration_ms": round(duration_ms, 2)
            }
        )
        
        return {
            "success": True,
            "message": message,
            "notification_id": notification_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in PUT /api/notifications/{notification_id}/mark-as-read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINT 3: DELETE /api/notifications/{id}
# ============================================================================

@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    request: Request,
    x_api_key: str = Header(None)
):
    """
    Elimina una notificación específica
    
    **Parámetros:**
    - `notification_id`: ID de la notificación a eliminar
    
    **Headers:**
    - `X-API-Key`: Token de autenticación
    
    **Response:**
    ```json
    {
      "success": true,
      "message": "Notification deleted"
    }
    ```
    """
    start_time = time.time()
    
    # Validar API key
    if not validate_api_key(x_api_key):
        logger.warning(f"❌ Unauthorized request to DELETE /api/notifications/{notification_id}")
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        success = NotificationRepository.delete(notification_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        duration_ms = (time.time() - start_time) * 1000
        
        logger.info(
            f"✅ DELETE /api/notifications/{notification_id}",
            extra={
                "notification_id": notification_id,
                "duration_ms": round(duration_ms, 2)
            }
        )
        
        return {
            "success": True,
            "message": "Notification deleted",
            "notification_id": notification_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in DELETE /api/notifications/{notification_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINT 4: GET /api/notification-preferences
# ============================================================================

@router.get("/notification-preferences", response_model=PreferencesResponse)
async def get_notification_preferences(
    request: Request,
    user_id: int = Query(None, description="ID del usuario"),
    x_api_key: str = Header(None)
):
    """
    Obtiene las preferencias de notificación del usuario
    
    **Parámetros:**
    - `user_id`: ID del usuario (requerido)
    
    **Headers:**
    - `X-API-Key`: Token de autenticación
    
    **Response:**
    ```json
    {
      "id": "uuid",
      "user_id": 1,
      "channels": ["email", "websocket"],
      "types": ["inventory", "sales"],
      "priority_filter": "all",
      "quiet_hours_enabled": true,
      "quiet_hours_start": "22:00",
      "quiet_hours_end": "08:00",
      "frequency": "instant"
    }
    ```
    """
    start_time = time.time()
    
    # Validar API key
    if not validate_api_key(x_api_key):
        logger.warning(f"❌ Unauthorized request to GET /api/notification-preferences")
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Usar user_id del parámetro o del request
        if user_id is None:
            user_id = get_user_id_from_request(request)
        
        # Obtener preferencias
        prefs = PreferencesRepository.get_by_user(user_id)
        
        if not prefs:
            # Retornar preferencias por defecto
            prefs = {
                "id": "",
                "user_id": user_id,
                "channels": ["websocket"],
                "types": ["inventory", "sales", "alerts"],
                "priority_filter": "all",
                "quiet_hours_enabled": False,
                "quiet_hours_start": None,
                "quiet_hours_end": None,
                "frequency": "instant"
            }
        
        duration_ms = (time.time() - start_time) * 1000
        
        logger.info(
            f"✅ GET /api/notification-preferences",
            extra={
                "user_id": user_id,
                "duration_ms": round(duration_ms, 2)
            }
        )
        
        return PreferencesResponse(**prefs)
    
    except Exception as e:
        logger.error(f"❌ Error in GET /api/notification-preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINT 5: PUT /api/notification-preferences
# ============================================================================

@router.put("/notification-preferences", response_model=PreferencesResponse)
async def update_notification_preferences(
    request: Request,
    user_id: int = Query(None, description="ID del usuario"),
    body: PreferencesRequest = None,
    x_api_key: str = Header(None)
):
    """
    Actualiza las preferencias de notificación del usuario
    
    **Parámetros:**
    - `user_id`: ID del usuario (requerido)
    
    **Headers:**
    - `X-API-Key`: Token de autenticación
    
    **Body:**
    ```json
    {
      "channels": ["email", "websocket"],
      "types": ["inventory", "sales"],
      "priority_filter": "all",
      "quiet_hours_enabled": true,
      "quiet_hours_start": "22:00",
      "quiet_hours_end": "08:00",
      "frequency": "instant"
    }
    ```
    
    **Response:**
    Mismo formato que GET /api/notification-preferences
    """
    start_time = time.time()
    
    # Validar API key
    if not validate_api_key(x_api_key):
        logger.warning(f"❌ Unauthorized request to PUT /api/notification-preferences")
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Usar user_id del parámetro o del request
        if user_id is None:
            user_id = get_user_id_from_request(request)
        
        # Intentar obtener el body desde request.json() si no está en los query params
        if body is None:
            try:
                body_dict = await request.json()
                body = PreferencesRequest(**body_dict)
            except:
                body = PreferencesRequest()
        
        # Verificar si existen preferencias
        existing = PreferencesRepository.get_by_user(user_id)
        
        if not existing:
            # Crear nuevas preferencias
            prefs = PreferencesRepository.create(
                user_id=user_id,
                channels=body.channels or ["websocket"],
                notification_types=body.types or ["inventory", "sales", "alerts"],
                priority_filter=body.priority_filter or "all",
                quiet_hours_enabled=body.quiet_hours_enabled or False,
                quiet_hours_start=body.quiet_hours_start,
                quiet_hours_end=body.quiet_hours_end,
                frequency=body.frequency or "instant"
            )
        else:
            # Actualizar preferencias existentes
            success = PreferencesRepository.update(
                user_id=user_id,
                channels=body.channels,
                notification_types=body.types,
                priority_filter=body.priority_filter,
                quiet_hours_enabled=body.quiet_hours_enabled,
                quiet_hours_start=body.quiet_hours_start,
                quiet_hours_end=body.quiet_hours_end,
                frequency=body.frequency
            )
            
            if not success:
                raise HTTPException(status_code=500, detail="Failed to update preferences")
            
            prefs = PreferencesRepository.get_by_user(user_id)
        
        duration_ms = (time.time() - start_time) * 1000
        
        logger.info(
            f"✅ PUT /api/notification-preferences",
            extra={
                "user_id": user_id,
                "duration_ms": round(duration_ms, 2)
            }
        )
        
        return PreferencesResponse(**prefs)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in PUT /api/notification-preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINT 6: DELETE /api/notifications (Clear All)
# ============================================================================

@router.delete("/notifications")
async def delete_all_notifications(
    request: Request,
    user_id: int = Query(None, description="ID del usuario"),
    x_api_key: str = Header(None)
):
    """
    Elimina TODAS las notificaciones del usuario (operación destructiva)
    
    **Parámetros:**
    - `user_id`: ID del usuario (requerido)
    
    **Headers:**
    - `X-API-Key`: Token de autenticación
    
    **Response:**
    ```json
    {
      "success": true,
      "message": "All notifications deleted",
      "deleted_count": 42
    }
    ```
    """
    start_time = time.time()
    
    # Validar API key
    if not validate_api_key(x_api_key):
        logger.warning(f"❌ Unauthorized request to DELETE /api/notifications (clear all)")
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Usar user_id del parámetro o del request
        if user_id is None:
            user_id = get_user_id_from_request(request)
        
        # Eliminar todas las notificaciones
        deleted_count = NotificationRepository.delete_all_user_notifications(user_id)
        
        duration_ms = (time.time() - start_time) * 1000
        
        logger.warning(
            f"⚠️  DELETE /api/notifications (CLEAR ALL)",
            extra={
                "user_id": user_id,
                "deleted_count": deleted_count,
                "duration_ms": round(duration_ms, 2)
            }
        )
        
        return {
            "success": True,
            "message": "All notifications deleted",
            "deleted_count": deleted_count
        }
    
    except Exception as e:
        logger.error(f"❌ Error in DELETE /api/notifications (clear all): {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ROUTER SUMMARY
# ============================================================================

"""
ENDPOINTS IMPLEMENTADOS:

1. GET /api/notifications
   - Listar con status filter (all/read/unread)
   - Paginación (page, per_page)
   - Response: {notifications: [...], pagination: {...}, total: N}

2. PUT /api/notifications/{id}/mark-as-read
   - Marcar como leída/no leída (read=true/false)
   - Response: {success: true, message: "..."}

3. DELETE /api/notifications/{id}
   - Eliminar notificación específica
   - Response: {success: true, message: "..."}

4. GET /api/notification-preferences
   - Obtener preferencias del usuario
   - Response: PreferencesResponse

5. PUT /api/notification-preferences
   - Actualizar preferencias
   - Body: PreferencesRequest (todos los campos opcionales)
   - Response: PreferencesResponse

6. DELETE /api/notifications
   - Eliminar TODAS las notificaciones
   - Response: {success: true, deleted_count: N}

AUTENTICACIÓN:
- Todos los endpoints requieren header X-API-Key
- Valor por defecto: "dev" (configurable vía DASHBOARD_API_KEY env var)

ERRORES:
- 401: Unauthorized (API key inválida o faltante)
- 404: Not found (recurso no existe)
- 500: Server error (error interno)

INTEGRACIÓN:
Para usar estos endpoints, agregar este router a dashboard_app.py:

    from inventario_retail.web_dashboard.api.notification_endpoints import router as notification_router
    app.include_router(notification_router)
"""
