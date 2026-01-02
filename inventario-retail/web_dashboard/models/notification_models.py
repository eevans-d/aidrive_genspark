#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Notification Models - Modelos para el sistema de notificaciones
==============================================================

Define los modelos Pydantic para validación de datos de notificaciones
y preferencias de notificación en el dashboard.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime
from enum import Enum

# ============================================================================
# ENUMS
# ============================================================================

class NotificationType(str, Enum):
    """Tipos de notificaciones disponibles"""
    INVENTORY = "inventory"
    SALES = "sales"
    ALERTS = "alerts"
    SYSTEM = "system"


class NotificationPriority(str, Enum):
    """Niveles de prioridad"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationStatus(str, Enum):
    """Estado de la notificación"""
    UNREAD = "unread"
    READ = "read"


class NotificationChannel(str, Enum):
    """Canales de entrega"""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WEBSOCKET = "websocket"


class NotificationFrequency(str, Enum):
    """Frecuencia de entrega"""
    INSTANT = "instant"
    DAILY = "daily"
    WEEKLY = "weekly"


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class NotificationCreate(BaseModel):
    """Modelo para crear una notificación"""
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    type: NotificationType = NotificationType.ALERTS
    priority: NotificationPriority = NotificationPriority.MEDIUM
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Low Stock Alert",
                "message": "Product ABC123 is running low on stock",
                "type": "inventory",
                "priority": "high"
            }
        }


class NotificationResponse(BaseModel):
    """Modelo de respuesta para una notificación"""
    id: str = Field(..., description="UUID of notification")
    user_id: int = Field(..., description="User ID")
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority
    status: NotificationStatus
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": 1,
                "title": "Low Stock Alert",
                "message": "Product ABC123 is running low",
                "type": "inventory",
                "priority": "high",
                "status": "unread",
                "created_at": "2025-10-23T10:30:00Z",
                "read_at": None
            }
        }


class NotificationListResponse(BaseModel):
    """Modelo para lista paginada de notificaciones"""
    notifications: List[NotificationResponse]
    pagination: dict = Field(
        ...,
        description="Pagination info: current_page, total_pages, total_items, per_page"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "notifications": [],
                "pagination": {
                    "current_page": 1,
                    "total_pages": 5,
                    "total_items": 100,
                    "per_page": 20
                }
            }
        }


class PreferenceChannels(BaseModel):
    """Validador para canales"""
    channels: List[NotificationChannel] = Field(
        default=[NotificationChannel.WEBSOCKET],
        description="List of notification channels"
    )
    
    @field_validator('channels', mode='before')
    @classmethod
    def validate_channels(cls, v):
        if not v:
            return [NotificationChannel.WEBSOCKET]
        return v


class PreferenceTypes(BaseModel):
    """Validador para tipos"""
    types: List[NotificationType] = Field(
        default=[
            NotificationType.INVENTORY,
            NotificationType.SALES,
            NotificationType.ALERTS
        ],
        description="List of notification types to receive"
    )
    
    @field_validator('types', mode='before')
    @classmethod
    def validate_types(cls, v):
        if not v:
            return [
                NotificationType.INVENTORY,
                NotificationType.SALES,
                NotificationType.ALERTS
            ]
        return v


class NotificationPreferenceCreate(BaseModel):
    """Modelo para crear/actualizar preferencias de notificación"""
    channels: List[NotificationChannel] = Field(
        default=[NotificationChannel.WEBSOCKET]
    )
    types: List[NotificationType] = Field(
        default=[
            NotificationType.INVENTORY,
            NotificationType.SALES,
            NotificationType.ALERTS
        ]
    )
    priority: str = Field(
        default="all",
        description="Priority filter: all, high_or_critical, critical_only"
    )
    quiet_hours_enabled: bool = False
    quiet_hours_start: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    quiet_hours_end: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    frequency: NotificationFrequency = NotificationFrequency.INSTANT
    
    class Config:
        json_schema_extra = {
            "example": {
                "channels": ["email", "websocket"],
                "types": ["inventory", "sales", "alerts"],
                "priority": "all",
                "quiet_hours_enabled": True,
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "08:00",
                "frequency": "instant"
            }
        }


class NotificationPreferenceResponse(BaseModel):
    """Modelo de respuesta para preferencias"""
    user_id: int
    channels: List[NotificationChannel]
    types: List[NotificationType]
    priority: str
    quiet_hours_enabled: bool
    quiet_hours_start: Optional[str]
    quiet_hours_end: Optional[str]
    frequency: NotificationFrequency
    updated_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "channels": ["email", "websocket"],
                "types": ["inventory", "sales", "alerts"],
                "priority": "all",
                "quiet_hours_enabled": True,
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "08:00",
                "frequency": "instant",
                "updated_at": "2025-10-23T10:30:00Z"
            }
        }


class StatusResponse(BaseModel):
    """Modelo genérico de respuesta de estado"""
    status: str = Field(..., description="Status: success, error")
    message: Optional[str] = None
    data: Optional[dict] = None


class DeleteResponse(BaseModel):
    """Modelo para respuestas de eliminación"""
    status: str = "success"
    deleted_count: int = 0
    message: Optional[str] = None
