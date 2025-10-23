#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
conftest.py - Pytest configuration and fixtures for web_dashboard tests
========================================================================

Provides:
- TestClient fixture for FastAPI app
- API key fixture
- Database initialization
"""

import pytest
import sys
import os
from pathlib import Path

# Add dashboard to path
dashboard_path = Path(__file__).parent.parent.parent / "inventario-retail" / "web_dashboard"
if str(dashboard_path) not in sys.path:
    sys.path.insert(0, str(dashboard_path))

from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def api_key():
    """API key for testing (default dev key)"""
    return "dev"


@pytest.fixture(scope="function")
def client(api_key):
    """FastAPI TestClient fixture"""
    # Import dashboard app
    from dashboard_app import app
    
    # Create test client
    test_client = TestClient(app)
    
    # Set default API key in environ
    os.environ["DASHBOARD_API_KEY"] = api_key
    
    yield test_client


@pytest.fixture
def user_id():
    """Test user ID"""
    return 1


@pytest.fixture
def notification_data():
    """Sample notification data"""
    return {
        "user_id": 1,
        "title": "Test Notification",
        "message": "This is a test notification",
        "type": "info",
        "priority": "normal"
    }
