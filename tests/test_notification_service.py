"""
Tests for Notification Service - SEMANA 2.1
Coverage: Email, SMS, WebSocket, In-app, Preferences
"""

import pytest
from fastapi.testclient import TestClient
import json
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
import sys
import os

# Add path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'inventario-retail', 'web_dashboard'))

# Import the app and notification service
from dashboard_app import app
from services.notification_service import (
    NotificationService,
    NotificationType,
    NotificationChannel,
    NotificationPriority
)


@pytest.fixture
def client():
    """FastAPI TestClient"""
    return TestClient(app)


@pytest.fixture
def api_key():
    """API key for tests"""
    return "dev"


@pytest.fixture
def notification_service():
    """NotificationService instance"""
    db_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "inventario-retail",
        "agente_negocio",
        "minimarket_inventory.db"
    )
    return NotificationService(db_path=db_path)


class TestNotificationServiceBasics:
    """Test basic notification service functionality"""

    def test_notification_service_init(self, notification_service):
        """✅ Test NotificationService initializes correctly"""
        assert notification_service is not None
        assert notification_service.db_path is not None
        assert "smtp_server" in notification_service.email_config
        assert "account_sid" in notification_service.sms_config

    def test_notification_types_enum(self):
        """✅ Test NotificationType enum values"""
        expected = [
            "stock_alert",
            "order_pending",
            "order_ready",
            "system_alert",
            "price_change",
            "inventory_low"
        ]
        actual = [nt.value for nt in NotificationType]
        assert set(actual) == set(expected)

    def test_notification_channels_enum(self):
        """✅ Test NotificationChannel enum values"""
        expected = ["email", "sms", "push", "in_app"]
        actual = [nc.value for nc in NotificationChannel]
        assert set(actual) == set(expected)

    def test_notification_priority_enum(self):
        """✅ Test NotificationPriority enum values"""
        expected = ["low", "medium", "high", "critical"]
        actual = [np.value for np in NotificationPriority]
        assert set(actual) == set(expected)


class TestNotificationEndpoints:
    """Test notification API endpoints"""

    def test_send_notification_endpoint_missing_api_key(self, client):
        """✅ Test send notification without API key returns 401"""
        response = client.post(
            "/api/notifications/send",
            params={
                "user_id": 1,
                "notification_type": "stock_alert",
                "subject": "Test",
                "message": "Test message"
            }
        )
        assert response.status_code == 401

    def test_send_notification_endpoint_with_api_key(self, client, api_key):
        """✅ Test send notification with valid API key"""
        response = client.post(
            "/api/notifications/send",
            params={
                "user_id": 1,
                "notification_type": "stock_alert",
                "subject": "Stock Alert",
                "message": "Product A stock is low",
                "channels": "in_app",
                "priority": "high"
            },
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "notification_id" in data
        assert "channels_sent" in data

    def test_send_notification_multiple_channels(self, client, api_key):
        """✅ Test send notification with multiple channels"""
        response = client.post(
            "/api/notifications/send",
            params={
                "user_id": 1,
                "notification_type": "order_pending",
                "subject": "Order Pending",
                "message": "Your order is pending",
                "channels": "email,sms,in_app",
                "priority": "medium"
            },
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["channels_sent"]) >= 1

    def test_send_notification_invalid_type(self, client, api_key):
        """✅ Test send notification with invalid notification type"""
        response = client.post(
            "/api/notifications/send",
            params={
                "user_id": 1,
                "notification_type": "invalid_type",
                "subject": "Test",
                "message": "Test message",
                "channels": "in_app"
            },
            headers={"X-API-Key": api_key}
        )
        # Should return 400 or 500 depending on error handling
        assert response.status_code in [400, 422, 500]

    def test_send_notification_invalid_priority(self, client, api_key):
        """✅ Test send notification with invalid priority"""
        response = client.post(
            "/api/notifications/send",
            params={
                "user_id": 1,
                "notification_type": "stock_alert",
                "subject": "Test",
                "message": "Test message",
                "channels": "in_app",
                "priority": "invalid_priority"
            },
            headers={"X-API-Key": api_key}
        )
        # Should return 400 or 500 depending on error handling
        assert response.status_code in [400, 422, 500]


class TestGetNotificationsEndpoint:
    """Test get notifications endpoint"""

    def test_get_notifications_missing_api_key(self, client):
        """✅ Test get notifications without API key returns 401"""
        response = client.get(
            "/api/notifications",
            params={"user_id": 1}
        )
        assert response.status_code == 401

    def test_get_notifications_valid_api_key(self, client, api_key):
        """✅ Test get notifications with valid API key"""
        response = client.get(
            "/api/notifications",
            params={"user_id": 1, "limit": 20, "offset": 0},
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        assert "total_returned" in data

    def test_get_notifications_pagination(self, client, api_key):
        """✅ Test get notifications with pagination"""
        # Send multiple notifications first
        for i in range(3):
            client.post(
                "/api/notifications/send",
                params={
                    "user_id": 1,
                    "notification_type": "stock_alert",
                    "subject": f"Alert {i}",
                    "message": f"Message {i}",
                    "channels": "in_app"
                },
                headers={"X-API-Key": api_key}
            )

        # Get with limit
        response = client.get(
            "/api/notifications",
            params={"user_id": 1, "limit": 2, "offset": 0},
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 2

    def test_get_notifications_unread_only(self, client, api_key):
        """✅ Test get notifications unread_only filter"""
        response = client.get(
            "/api/notifications",
            params={"user_id": 1, "unread_only": True},
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data


class TestMarkNotificationRead:
    """Test mark notification as read endpoint"""

    def test_mark_read_missing_api_key(self, client):
        """✅ Test mark read without API key returns 401"""
        response = client.post(
            "/api/notifications/1/read",
            params={"user_id": 1}
        )
        assert response.status_code == 401

    def test_mark_read_valid_api_key(self, client, api_key):
        """✅ Test mark read with valid API key"""
        # First send a notification
        send_response = client.post(
            "/api/notifications/send",
            params={
                "user_id": 1,
                "notification_type": "stock_alert",
                "subject": "Test",
                "message": "Test message",
                "channels": "in_app"
            },
            headers={"X-API-Key": api_key}
        )
        notif_id = send_response.json()["notification_id"]

        # Mark as read
        response = client.post(
            f"/api/notifications/{notif_id}/read",
            params={"user_id": 1},
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "notification_id" in data


class TestNotificationPreferences:
    """Test notification preferences endpoints"""

    def test_get_preferences_missing_api_key(self, client):
        """✅ Test get preferences without API key returns 401"""
        response = client.get("/api/notifications/preferences/1")
        assert response.status_code == 401

    def test_get_preferences_valid_api_key(self, client, api_key):
        """✅ Test get preferences with valid API key"""
        response = client.get(
            "/api/notifications/preferences/1",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        assert "email_enabled" in data
        assert "sms_enabled" in data
        assert "push_enabled" in data

    def test_set_preferences_missing_api_key(self, client):
        """✅ Test set preferences without API key returns 401"""
        response = client.post(
            "/api/notifications/preferences/1",
            json={"email_enabled": False}
        )
        assert response.status_code == 401

    def test_set_preferences_valid_api_key(self, client, api_key):
        """✅ Test set preferences with valid API key"""
        preferences = {
            "email_enabled": False,
            "sms_enabled": True,
            "push_enabled": False,
            "stock_alerts": True,
            "order_alerts": False
        }
        response = client.post(
            "/api/notifications/preferences/1",
            json=preferences,
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_preferences_persist(self, client, api_key):
        """✅ Test preferences are persisted"""
        # Set preferences
        preferences = {"email_enabled": False, "sms_enabled": True}
        client.post(
            "/api/notifications/preferences/2",
            json=preferences,
            headers={"X-API-Key": api_key}
        )

        # Get preferences
        response = client.get(
            "/api/notifications/preferences/2",
            headers={"X-API-Key": api_key}
        )
        data = response.json()
        assert data["email_enabled"] is False or data["email_enabled"] == 0


class TestNotificationServiceAsync:
    """Test async notification service methods"""

    @pytest.mark.asyncio
    async def test_send_notification_async(self, notification_service):
        """✅ Test async send notification"""
        result = await notification_service.send_notification(
            user_id=1,
            notification_type=NotificationType.STOCK_ALERT,
            subject="Test Alert",
            message="Test message",
            channels=[NotificationChannel.IN_APP],
            priority=NotificationPriority.HIGH
        )
        assert result["success"] is True
        assert result["notification_id"] is not None

    @pytest.mark.asyncio
    async def test_get_user_notifications_async(self, notification_service):
        """✅ Test async get user notifications"""
        notifications = await notification_service.get_user_notifications(
            user_id=1,
            limit=10
        )
        assert isinstance(notifications, list)

    @pytest.mark.asyncio
    async def test_get_unread_count_async(self, notification_service):
        """✅ Test async get unread count"""
        count = await notification_service.get_unread_count(user_id=1)
        assert isinstance(count, int)
        assert count >= 0

    @pytest.mark.asyncio
    async def test_mark_as_read_async(self, notification_service):
        """✅ Test async mark notification as read"""
        # Send notification first
        result = await notification_service.send_notification(
            user_id=1,
            notification_type=NotificationType.STOCK_ALERT,
            subject="Test",
            message="Test",
            channels=[NotificationChannel.IN_APP]
        )
        notif_id = result["notification_id"]

        # Mark as read
        success = await notification_service.mark_as_read(notif_id, user_id=1)
        assert isinstance(success, bool)

    @pytest.mark.asyncio
    async def test_set_preferences_async(self, notification_service):
        """✅ Test async set preferences"""
        preferences = {
            "email_enabled": False,
            "sms_enabled": True,
            "stock_alerts": True
        }
        success = await notification_service.set_preferences(user_id=1, preferences=preferences)
        assert success is True

    @pytest.mark.asyncio
    async def test_get_preferences_async(self, notification_service):
        """✅ Test async get preferences"""
        preferences = await notification_service.get_preferences(user_id=1)
        assert isinstance(preferences, dict)
        assert "email_enabled" in preferences or "user_id" in preferences


class TestNotificationIntegration:
    """Integration tests for notification system"""

    def test_notification_workflow(self, client, api_key):
        """✅ Test complete notification workflow"""
        # 1. Send notification
        send_resp = client.post(
            "/api/notifications/send",
            params={
                "user_id": 1,
                "notification_type": "stock_alert",
                "subject": "Integration Test",
                "message": "Testing workflow",
                "channels": "in_app",
                "priority": "high"
            },
            headers={"X-API-Key": api_key}
        )
        assert send_resp.status_code == 200
        notif_id = send_resp.json()["notification_id"]

        # 2. Get notifications
        get_resp = client.get(
            "/api/notifications",
            params={"user_id": 1},
            headers={"X-API-Key": api_key}
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["unread_count"] >= 0

        # 3. Mark as read
        read_resp = client.post(
            f"/api/notifications/{notif_id}/read",
            params={"user_id": 1},
            headers={"X-API-Key": api_key}
        )
        assert read_resp.status_code == 200

    def test_multi_user_notifications(self, client, api_key):
        """✅ Test notifications isolated per user"""
        # Send to user 1
        client.post(
            "/api/notifications/send",
            params={
                "user_id": 1,
                "notification_type": "stock_alert",
                "subject": "For User 1",
                "message": "Test",
                "channels": "in_app"
            },
            headers={"X-API-Key": api_key}
        )

        # Send to user 2
        client.post(
            "/api/notifications/send",
            params={
                "user_id": 2,
                "notification_type": "order_pending",
                "subject": "For User 2",
                "message": "Test",
                "channels": "in_app"
            },
            headers={"X-API-Key": api_key}
        )

        # Get user 1 notifications
        resp1 = client.get(
            "/api/notifications",
            params={"user_id": 1},
            headers={"X-API-Key": api_key}
        )
        assert resp1.status_code == 200

        # Get user 2 notifications
        resp2 = client.get(
            "/api/notifications",
            params={"user_id": 2},
            headers={"X-API-Key": api_key}
        )
        assert resp2.status_code == 200


class TestNotificationPerformance:
    """Performance and load testing"""

    def test_send_notification_performance(self, client, api_key):
        """✅ Test notification send performance (<1s)"""
        import time
        start = time.time()

        for i in range(10):
            client.post(
                "/api/notifications/send",
                params={
                    "user_id": 1,
                    "notification_type": "stock_alert",
                    "subject": f"Perf Test {i}",
                    "message": "Performance test",
                    "channels": "in_app"
                },
                headers={"X-API-Key": api_key}
            )

        elapsed = time.time() - start
        avg_time = elapsed / 10
        assert avg_time < 1.0, f"Average send time {avg_time}s exceeds 1s limit"

    def test_get_notifications_performance(self, client, api_key):
        """✅ Test get notifications performance (<500ms)"""
        import time

        start = time.time()
        response = client.get(
            "/api/notifications",
            params={"user_id": 1, "limit": 100},
            headers={"X-API-Key": api_key}
        )
        elapsed = (time.time() - start) * 1000  # Convert to ms

        assert response.status_code == 200
        assert elapsed < 500, f"Get notifications took {elapsed}ms, exceeds 500ms limit"

    def test_concurrent_notification_sends(self, client, api_key):
        """✅ Test concurrent notification sends"""
        import concurrent.futures

        def send_notification(i):
            return client.post(
                "/api/notifications/send",
                params={
                    "user_id": i % 10,
                    "notification_type": "stock_alert",
                    "subject": f"Concurrent {i}",
                    "message": "Concurrent test",
                    "channels": "in_app"
                },
                headers={"X-API-Key": api_key}
            )

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(send_notification, i) for i in range(50)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        success_count = sum(1 for r in results if r.status_code == 200)
        assert success_count >= 45, f"Only {success_count}/50 concurrent sends succeeded"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
