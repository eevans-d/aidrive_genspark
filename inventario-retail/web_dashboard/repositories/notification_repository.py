#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Notification Repository - Capa de persistencia para notificaciones
==================================================================

Gestiona todas las operaciones de base de datos para notificaciones
y preferencias de notificación usando SQLite.
"""

import sqlite3
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path
import uuid
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

DB_PATH = Path(__file__).parent.parent / "data" / "notifications.db"


def get_db_connection():
    """Obtiene conexión a la base de datos SQLite"""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Inicializa las tablas de base de datos"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tabla de notificaciones
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'unread',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # Tabla de preferencias de notificación
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notification_preferences (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL UNIQUE,
            channels TEXT NOT NULL,
            notification_types TEXT NOT NULL,
            priority_filter TEXT NOT NULL DEFAULT 'all',
            quiet_hours_enabled BOOLEAN DEFAULT 0,
            quiet_hours_start TEXT,
            quiet_hours_end TEXT,
            frequency TEXT NOT NULL DEFAULT 'instant',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # Índices para performance
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
        ON notifications(user_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_notifications_status 
        ON notifications(user_id, status)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
        ON notifications(created_at)
    """)
    
    conn.commit()
    conn.close()
    logger.info("✅ Database initialized")


# ============================================================================
# NOTIFICATION REPOSITORY
# ============================================================================

class NotificationRepository:
    """Repository para operaciones de notificaciones"""
    
    @staticmethod
    def create(
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        priority: str
    ) -> Dict[str, Any]:
        """Crea una nueva notificación"""
        notification_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO notifications 
                (id, user_id, title, message, type, priority, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                notification_id, user_id, title, message,
                notification_type, priority, 'unread'
            ))
            conn.commit()
            
            logger.info(f"✅ Notification created: {notification_id}")
            
            return {
                "id": notification_id,
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": notification_type,
                "priority": priority,
                "status": "unread",
                "created_at": datetime.utcnow().isoformat(),
                "read_at": None
            }
        except Exception as e:
            logger.error(f"❌ Error creating notification: {e}")
            raise
        finally:
            conn.close()
    
    @staticmethod
    def get_by_id(notification_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene una notificación por ID"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT id, user_id, title, message, type, priority, status,
                       created_at, read_at
                FROM notifications
                WHERE id = ?
            """, (notification_id,))
            
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
        finally:
            conn.close()
    
    @staticmethod
    def get_user_notifications(
        user_id: int,
        status: str = "all",
        limit: int = 20,
        offset: int = 0
    ) -> tuple[List[Dict[str, Any]], int]:
        """Obtiene notificaciones del usuario con paginación"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Contar total
            if status == "all":
                cursor.execute(
                    "SELECT COUNT(*) as count FROM notifications WHERE user_id = ?",
                    (user_id,)
                )
            else:
                cursor.execute(
                    "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND status = ?",
                    (user_id, status)
                )
            
            total = cursor.fetchone()["count"]
            
            # Obtener registros
            if status == "all":
                cursor.execute("""
                    SELECT id, user_id, title, message, type, priority, status,
                           created_at, read_at
                    FROM notifications
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                """, (user_id, limit, offset))
            else:
                cursor.execute("""
                    SELECT id, user_id, title, message, type, priority, status,
                           created_at, read_at
                    FROM notifications
                    WHERE user_id = ? AND status = ?
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                """, (user_id, status, limit, offset))
            
            rows = cursor.fetchall()
            notifications = [dict(row) for row in rows]
            
            return notifications, total
        finally:
            conn.close()
    
    @staticmethod
    def mark_as_read(notification_id: str) -> bool:
        """Marca una notificación como leída"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                UPDATE notifications
                SET status = 'read', read_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (notification_id,))
            conn.commit()
            
            if cursor.rowcount > 0:
                logger.info(f"✅ Notification marked as read: {notification_id}")
                return True
            return False
        finally:
            conn.close()
    
    @staticmethod
    def mark_as_unread(notification_id: str) -> bool:
        """Marca una notificación como no leída"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                UPDATE notifications
                SET status = 'unread', read_at = NULL
                WHERE id = ?
            """, (notification_id,))
            conn.commit()
            
            if cursor.rowcount > 0:
                logger.info(f"✅ Notification marked as unread: {notification_id}")
                return True
            return False
        finally:
            conn.close()
    
    @staticmethod
    def delete(notification_id: str) -> bool:
        """Elimina una notificación"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                DELETE FROM notifications
                WHERE id = ?
            """, (notification_id,))
            conn.commit()
            
            if cursor.rowcount > 0:
                logger.info(f"✅ Notification deleted: {notification_id}")
                return True
            return False
        finally:
            conn.close()
    
    @staticmethod
    def delete_all_user_notifications(user_id: int) -> int:
        """Elimina todas las notificaciones de un usuario"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                DELETE FROM notifications
                WHERE user_id = ?
            """, (user_id,))
            conn.commit()
            
            deleted = cursor.rowcount
            logger.info(f"✅ {deleted} notifications deleted for user {user_id}")
            return deleted
        finally:
            conn.close()
    
    @staticmethod
    def get_unread_count(user_id: int) -> int:
        """Obtiene el conteo de notificaciones no leídas"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM notifications
                WHERE user_id = ? AND status = 'unread'
            """, (user_id,))
            
            result = cursor.fetchone()
            return result["count"] if result else 0
        finally:
            conn.close()


# ============================================================================
# PREFERENCES REPOSITORY
# ============================================================================

class PreferencesRepository:
    """Repository para operaciones de preferencias de notificación"""
    
    @staticmethod
    def create(
        user_id: int,
        channels: List[str],
        notification_types: List[str],
        priority_filter: str = "all",
        quiet_hours_enabled: bool = False,
        quiet_hours_start: str = None,
        quiet_hours_end: str = None,
        frequency: str = "instant"
    ) -> Dict[str, Any]:
        """Crea preferencias de notificación para un usuario"""
        pref_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            channels_json = json.dumps(channels)
            types_json = json.dumps(notification_types)
            
            cursor.execute("""
                INSERT INTO notification_preferences
                (id, user_id, channels, notification_types, priority_filter,
                 quiet_hours_enabled, quiet_hours_start, quiet_hours_end, frequency)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pref_id, user_id, channels_json, types_json, priority_filter,
                quiet_hours_enabled, quiet_hours_start, quiet_hours_end, frequency
            ))
            conn.commit()
            
            logger.info(f"✅ Preferences created for user {user_id}")
            
            return {
                "id": pref_id,
                "user_id": user_id,
                "channels": channels,
                "types": notification_types,
                "priority_filter": priority_filter,
                "quiet_hours_enabled": quiet_hours_enabled,
                "quiet_hours_start": quiet_hours_start,
                "quiet_hours_end": quiet_hours_end,
                "frequency": frequency
            }
        except Exception as e:
            logger.error(f"❌ Error creating preferences: {e}")
            raise
        finally:
            conn.close()
    
    @staticmethod
    def get_by_user(user_id: int) -> Optional[Dict[str, Any]]:
        """Obtiene las preferencias de un usuario"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT id, user_id, channels, notification_types, priority_filter,
                       quiet_hours_enabled, quiet_hours_start, quiet_hours_end,
                       frequency, created_at, updated_at
                FROM notification_preferences
                WHERE user_id = ?
            """, (user_id,))
            
            row = cursor.fetchone()
            if row:
                result = dict(row)
                result["channels"] = json.loads(result["channels"])
                result["types"] = json.loads(result["notification_types"])
                del result["notification_types"]
                return result
            return None
        finally:
            conn.close()
    
    @staticmethod
    def update(
        user_id: int,
        channels: List[str] = None,
        notification_types: List[str] = None,
        priority_filter: str = None,
        quiet_hours_enabled: bool = None,
        quiet_hours_start: str = None,
        quiet_hours_end: str = None,
        frequency: str = None
    ) -> bool:
        """Actualiza las preferencias de un usuario"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Construir UPDATE dinámico
            updates = []
            params = []
            
            if channels is not None:
                updates.append("channels = ?")
                params.append(json.dumps(channels))
            
            if notification_types is not None:
                updates.append("notification_types = ?")
                params.append(json.dumps(notification_types))
            
            if priority_filter is not None:
                updates.append("priority_filter = ?")
                params.append(priority_filter)
            
            if quiet_hours_enabled is not None:
                updates.append("quiet_hours_enabled = ?")
                params.append(quiet_hours_enabled)
            
            if quiet_hours_start is not None:
                updates.append("quiet_hours_start = ?")
                params.append(quiet_hours_start)
            
            if quiet_hours_end is not None:
                updates.append("quiet_hours_end = ?")
                params.append(quiet_hours_end)
            
            if frequency is not None:
                updates.append("frequency = ?")
                params.append(frequency)
            
            if not updates:
                return False
            
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(user_id)
            
            query = f"""
                UPDATE notification_preferences
                SET {', '.join(updates)}
                WHERE user_id = ?
            """
            
            cursor.execute(query, params)
            conn.commit()
            
            if cursor.rowcount > 0:
                logger.info(f"✅ Preferences updated for user {user_id}")
                return True
            return False
        finally:
            conn.close()
    
    @staticmethod
    def delete(user_id: int) -> bool:
        """Elimina las preferencias de un usuario"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                DELETE FROM notification_preferences
                WHERE user_id = ?
            """, (user_id,))
            conn.commit()
            
            if cursor.rowcount > 0:
                logger.info(f"✅ Preferences deleted for user {user_id}")
                return True
            return False
        finally:
            conn.close()


# Initialize database on import
try:
    init_db()
except Exception as e:
    logger.error(f"⚠️  Error initializing database: {e}")
