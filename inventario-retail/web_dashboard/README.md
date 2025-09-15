# Dashboard Web Mini Market

Dashboard web con FastAPI, Jinja2, Bootstrap 5 y Chart.js para métricas y BI del sistema Mini Market.

## Requisitos

- Python 3.10+
- Dependencias:
  - fastapi
  - uvicorn[standard]
  - jinja2
  - python-multipart

Instala dependencias:

```bash
pip3 install --user -r requirements.txt
```

## Ejecutar

Desarrollo con autoreload:

```bash
python3 dashboard_app.py
```

Luego abre:
- http://localhost:8080/
- http://localhost:8080/providers
- http://localhost:8080/analytics

## Configuración de Base de Datos

El dashboard detecta la base `minimarket_inventory.db` en `inventario-retail/agente_negocio/` y utiliza `MiniMarketDatabaseManager`.
Si la DB no está disponible, las APIs devolverán mensajes de error en JSON y las vistas mostrarán placeholders.

## Tareas VS Code

Puedes crear una tarea para lanzar el dashboard. Si no existe, te la puedo generar desde aquí.
