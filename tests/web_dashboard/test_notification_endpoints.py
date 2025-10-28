import os
import uuid
import pytest
from typing import Dict

# Usamos el TestClient provisto por conftest.py
# Además, conftest ya inyecta el path de web_dashboard en sys.path
from repositories.notification_repository import NotificationRepository, PreferencesRepository


API_KEY_ENV = "DASHBOARD_API_KEY"
DEFAULT_API_KEY = os.getenv(API_KEY_ENV, "dev")


def _headers() -> Dict[str, str]:
    # Usar la API key efectiva del entorno
    return {"X-API-Key": os.getenv(API_KEY_ENV, DEFAULT_API_KEY)}


@pytest.fixture
def clean_user_state():
    """Limpia notificaciones y preferencias para un usuario de prueba antes y después."""
    user_id = 3210123
    # Pre-clean
    try:
        NotificationRepository.delete_all_user_notifications(user_id)
    except Exception:
        pass
    try:
        PreferencesRepository.delete(user_id)
    except Exception:
        pass

    yield user_id

    # Post-clean
    try:
        NotificationRepository.delete_all_user_notifications(user_id)
    except Exception:
        pass
    try:
        PreferencesRepository.delete(user_id)
    except Exception:
        pass


def test_preferences_default_and_update_flow(client, clean_user_state):
    os.environ[API_KEY_ENV] = os.getenv(API_KEY_ENV, "dev")
    user_id = clean_user_state

    # 1) GET preferencias por defecto (no existen -> defaults)
    r = client.get(f"/api/notification-preferences?user_id={user_id}", headers=_headers())
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user_id"] == user_id
    assert data["quiet_hours_enabled"] is False
    assert data["channels"] == ["websocket"]

    # 2) PUT para crear preferencias (primer PUT crea)
    body = {
        "channels": ["email", "websocket"],
        "types": ["inventory"],
        "priority_filter": "all",
        "quiet_hours_enabled": True,
        "quiet_hours_start": "22:00",
        "quiet_hours_end": "08:00",
        "frequency": "instant",
    }
    r = client.put(f"/api/notification-preferences?user_id={user_id}", json=body, headers=_headers())
    assert r.status_code == 200, r.text
    created = r.json()
    assert created["user_id"] == user_id
    assert created["quiet_hours_enabled"] is True
    assert "id" in created and created["id"]

    # 3) Segundo PUT actualiza preferencias existentes (cubre rama update)
    body2 = {
        "quiet_hours_enabled": False,
        "frequency": "digest",
    }
    r = client.put(f"/api/notification-preferences?user_id={user_id}", json=body2, headers=_headers())
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated["quiet_hours_enabled"] is False
    assert updated["frequency"] == "digest"

    # 4) GET debe reflejar los cambios
    r = client.get(f"/api/notification-preferences?user_id={user_id}", headers=_headers())
    assert r.status_code == 200
    again = r.json()
    assert again["quiet_hours_enabled"] is False
    assert again["frequency"] == "digest"


def test_notifications_crud_mark_and_clear(client, clean_user_state):
    os.environ[API_KEY_ENV] = os.getenv(API_KEY_ENV, "dev")
    user_id = clean_user_state

    # Crear 2 notificaciones vía repositorio
    n1 = NotificationRepository.create(user_id, "Stock bajo", "Producto sin stock", "inventory", "high")
    n2 = NotificationRepository.create(user_id, "Venta", "Nueva venta registrada", "sales", "medium")

    # Listar todas
    r = client.get(f"/api/notifications?user_id={user_id}&status=all&per_page=50", headers=_headers())
    assert r.status_code == 200, r.text
    payload = r.json()
    assert payload["total"] >= 2
    ids = [n["id"] for n in payload["notifications"]]
    assert n1["id"] in ids and n2["id"] in ids

    # Filtrar unread
    r = client.get(f"/api/notifications?user_id={user_id}&status=unread", headers=_headers())
    assert r.status_code == 200
    unread_payload = r.json()
    assert unread_payload["total"] >= 2

    # Marcar como leída n1
    r = client.put(f"/api/notifications/{n1['id']}/mark-as-read?read=true", headers=_headers())
    assert r.status_code == 200, r.text
    assert r.json()["success"] is True

    # Validar que unread disminuye
    r = client.get(f"/api/notifications?user_id={user_id}&status=unread", headers=_headers())
    assert r.status_code == 200
    unread_after = r.json()
    assert unread_after["total"] <= unread_payload["total"] - 1

    # Marcar como no leída nuevamente (read=false)
    r = client.put(f"/api/notifications/{n1['id']}/mark-as-read?read=false", headers=_headers())
    assert r.status_code == 200, r.text
    assert r.json()["success"] is True

    # Borrar notificación específica
    r = client.delete(f"/api/notifications/{n2['id']}", headers=_headers())
    assert r.status_code == 200, r.text
    assert r.json()["success"] is True

    # Limpiar todas
    r = client.delete(f"/api/notifications?user_id={user_id}", headers=_headers())
    assert r.status_code == 200, r.text
    assert r.json()["success"] is True
    assert isinstance(r.json().get("deleted_count"), int)

    # Verificar que ya no hay notificaciones
    r = client.get(f"/api/notifications?user_id={user_id}&status=all", headers=_headers())
    assert r.status_code == 200
    assert r.json()["total"] == 0


def test_mark_nonexistent_returns_404(client):
    os.environ[API_KEY_ENV] = os.getenv(API_KEY_ENV, "dev")
    fake_id = str(uuid.uuid4())
    r = client.put(f"/api/notifications/{fake_id}/mark-as-read?read=true", headers=_headers())
    assert r.status_code == 404


def test_delete_nonexistent_returns_404(client):
    os.environ[API_KEY_ENV] = os.getenv(API_KEY_ENV, "dev")
    fake_id = str(uuid.uuid4())
    r = client.delete(f"/api/notifications/{fake_id}", headers=_headers())
    assert r.status_code == 404
