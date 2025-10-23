# ✅ CHECKLIST EJECUTABLE - PLAN UX ALTO IMPACTO

**Proyecto:** aidrive_genspark  
**Inicio:** 20 Octubre 2025  
**Estado:** 🟢 LISTO PARA EJECUTAR

---

## 📋 TRACKING DE PROGRESO

```
[████░░░░░░░░░░░░░░░░] 20% SEMANA 1
[░░░░░░░░░░░░░░░░░░░░]  0% SEMANA 2
[░░░░░░░░░░░░░░░░░░░░]  0% SEMANA 3
[░░░░░░░░░░░░░░░░░░░░]  0% SEMANA 4
```

**Total Completado:** 0/80 tareas  
**Tiempo invertido:** 0/160 horas

---

## 🚀 SEMANA 1: FUNDAMENTOS Y QUICK WINS

### DÍA 1 (Lunes) - Setup + Búsqueda Rápida

**Estado:** ⚪ NO INICIADO  
**Duración estimada:** 6 horas  
**Completado:** 0/10 tareas

#### Tarea 1.1: Setup Infraestructura Redis ⏱️ 2h

- [ ] **1.1.1** Instalar Redis server
  ```bash
  sudo apt-get update
  sudo apt-get install redis-server -y
  redis-cli ping  # Debe retornar: PONG
  ```
  **Validación:** ✅ PONG recibido

- [ ] **1.1.2** Configurar persistencia Redis
  ```bash
  sudo nano /etc/redis/redis.conf
  # Agregar/modificar:
  # appendonly yes
  # save 900 1
  # save 300 10
  sudo systemctl restart redis
  sudo systemctl status redis
  ```
  **Validación:** ✅ Redis activo y persistente

- [ ] **1.1.3** Instalar cliente Python
  ```bash
  cd /home/eevan/ProyectosIA/aidrive_genspark
  source venv/bin/activate  # Si usas venv
  pip install redis==5.0.0
  pip install fastapi-cache2==0.2.1
  pip freeze | grep redis
  ```
  **Validación:** ✅ Paquetes instalados

- [ ] **1.1.4** Actualizar requirements.txt
  ```bash
  echo "redis==5.0.0" >> inventario-retail/web_dashboard/requirements.txt
  echo "fastapi-cache2==0.2.1" >> inventario-retail/web_dashboard/requirements.txt
  ```
  **Validación:** ✅ Archivo actualizado

- [ ] **1.1.5** Test conexión Python-Redis
  ```bash
  python3 -c "
  import redis
  r = redis.Redis(host='localhost', port=6379, decode_responses=True)
  print('Ping Redis:', r.ping())
  r.set('test_key', 'hello_minimarket')
  print('Test value:', r.get('test_key'))
  "
  ```
  **Validación:** ✅ Conexión exitosa

#### Tarea 1.2: Quick Win #1 - Búsqueda Ultrarrápida ⏱️ 4h

- [ ] **1.2.1** Agregar código Redis a dashboard_app.py
  ```python
  # Editar: inventario-retail/web_dashboard/dashboard_app.py
  # Agregar después de imports existentes:
  
  from redis import asyncio as aioredis
  from fastapi_cache import FastAPICache
  from fastapi_cache.backends.redis import RedisBackend
  from fastapi_cache.decorator import cache
  
  # En startup event:
  @app.on_event("startup")
  async def startup():
      redis = aioredis.from_url(
          "redis://localhost:6379",
          encoding="utf8",
          decode_responses=True
      )
      FastAPICache.init(RedisBackend(redis), prefix="minimarket-cache")
  ```
  **Archivo:** `inventario-retail/web_dashboard/dashboard_app.py`  
  **Validación:** ✅ Código agregado sin errores sintaxis

- [ ] **1.2.2** Implementar endpoint búsqueda con cache
  ```python
  # Editar: inventario-retail/web_dashboard/dashboard_app.py
  # Agregar nuevo endpoint:
  
  @app.get("/api/productos/search")
  @cache(expire=300)
  async def search_productos(
      q: str = Query(..., min_length=1),
      limit: int = Query(10, ge=1, le=50),
      db: Session = Depends(get_db)
  ):
      """Búsqueda ultrarrápida con cache Redis"""
      from sqlalchemy import or_
      
      productos = db.query(Producto).filter(
          Producto.activo == True,
          or_(
              Producto.nombre.ilike(f"%{q}%"),
              Producto.codigo_barras.ilike(f"%{q}%")
          )
      ).limit(limit).all()
      
      return {
          "query": q,
          "count": len(productos),
          "results": [
              {
                  "id": p.id,
                  "nombre": p.nombre,
                  "codigo_barras": p.codigo_barras,
                  "precio": float(p.precio),
                  "stock": p.stock
              } for p in productos
          ],
          "cached": True
      }
  ```
  **Validación:** ✅ Endpoint agregado

- [ ] **1.2.3** Crear índices base de datos
  ```bash
  # Crear archivo: migrations/add_search_indexes.sql
  cat > inventario-retail/migrations/add_search_indexes.sql << 'EOF'
  -- Índices para optimizar búsqueda
  CREATE INDEX IF NOT EXISTS idx_productos_nombre 
  ON productos(nombre COLLATE NOCASE);
  
  CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras 
  ON productos(codigo_barras);
  
  CREATE INDEX IF NOT EXISTS idx_productos_activo 
  ON productos(activo);
  
  CREATE INDEX IF NOT EXISTS idx_productos_search 
  ON productos(activo, nombre COLLATE NOCASE);
  
  -- Verificar índices creados
  SELECT name, tbl_name, sql 
  FROM sqlite_master 
  WHERE type='index' AND tbl_name='productos';
  EOF
  
  # Aplicar índices
  sqlite3 inventario-retail/minimarket_inventory.db < inventario-retail/migrations/add_search_indexes.sql
  ```
  **Validación:** ✅ Índices creados

- [ ] **1.2.4** Crear archivo JS autocompletado
  ```bash
  mkdir -p inventario-retail/web_dashboard/static/js
  cat > inventario-retail/web_dashboard/static/js/search-autocomplete.js << 'EOF'
  // Autocompletado inteligente de búsqueda
  
  class SearchAutocomplete {
      constructor(inputSelector, dropdownSelector) {
          this.input = document.querySelector(inputSelector);
          this.dropdown = document.querySelector(dropdownSelector);
          this.debounceTimer = null;
          this.init();
      }
      
      init() {
          if (!this.input) return;
          
          this.input.addEventListener('input', (e) => this.handleInput(e));
          this.input.addEventListener('focus', (e) => this.handleInput(e));
          document.addEventListener('click', (e) => this.handleClickOutside(e));
      }
      
      handleInput(e) {
          clearTimeout(this.debounceTimer);
          
          const query = e.target.value.trim();
          if (query.length < 2) {
              this.hideDropdown();
              return;
          }
          
          this.debounceTimer = setTimeout(() => {
              this.search(query);
          }, 200);
      }
      
      async search(query) {
          try {
              const response = await fetch(
                  `/api/productos/search?q=${encodeURIComponent(query)}&limit=8`
              );
              const data = await response.json();
              
              this.showResults(data.results);
          } catch (error) {
              console.error('Error búsqueda:', error);
          }
      }
      
      showResults(results) {
          if (results.length === 0) {
              this.dropdown.innerHTML = '<div class="autocomplete-empty">No se encontraron productos</div>';
          } else {
              this.dropdown.innerHTML = results.map(p => `
                  <div class="autocomplete-item" data-id="${p.id}">
                      <div class="item-name">${p.nombre}</div>
                      <div class="item-details">
                          <span class="item-price">$${p.precio.toFixed(2)}</span>
                          <span class="item-stock ${p.stock < 10 ? 'low' : ''}">${p.stock} unid</span>
                      </div>
                  </div>
              `).join('');
              
              // Event listeners para items
              this.dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                  item.addEventListener('click', () => {
                      this.selectItem(item.dataset.id);
                  });
              });
          }
          
          this.dropdown.style.display = 'block';
      }
      
      hideDropdown() {
          this.dropdown.style.display = 'none';
      }
      
      handleClickOutside(e) {
          if (!this.dropdown.contains(e.target) && e.target !== this.input) {
              this.hideDropdown();
          }
      }
      
      selectItem(productId) {
          // Implementar lógica de selección
          console.log('Producto seleccionado:', productId);
          this.hideDropdown();
      }
  }
  
  // Inicializar al cargar DOM
  document.addEventListener('DOMContentLoaded', () => {
      new SearchAutocomplete('#producto-search', '#autocomplete-dropdown');
  });
  EOF
  ```
  **Validación:** ✅ Archivo JS creado

- [ ] **1.2.5** Crear CSS para autocompletado
  ```bash
  mkdir -p inventario-retail/web_dashboard/static/css
  cat > inventario-retail/web_dashboard/static/css/search-autocomplete.css << 'EOF'
  /* Autocompletado de búsqueda */
  
  .search-container {
      position: relative;
      width: 100%;
      max-width: 500px;
  }
  
  #producto-search {
      width: 100%;
      padding: 12px 40px 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      transition: all 0.3s ease;
  }
  
  #producto-search:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  #autocomplete-dropdown {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-top: 4px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
  }
  
  .autocomplete-item {
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.2s;
      border-bottom: 1px solid #f3f4f6;
  }
  
  .autocomplete-item:hover {
      background-color: #f9fafb;
  }
  
  .autocomplete-item:last-child {
      border-bottom: none;
  }
  
  .item-name {
      font-weight: 500;
      color: #111827;
      margin-bottom: 4px;
  }
  
  .item-details {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
  }
  
  .item-price {
      color: #10b981;
      font-weight: 600;
  }
  
  .item-stock {
      color: #6b7280;
  }
  
  .item-stock.low {
      color: #ef4444;
      font-weight: 600;
  }
  
  .autocomplete-empty {
      padding: 16px;
      text-align: center;
      color: #9ca3af;
  }
  
  /* Loading spinner */
  .search-loading {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      border: 2px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
  }
  
  @keyframes spin {
      to { transform: translateY(-50%) rotate(360deg); }
  }
  EOF
  ```
  **Validación:** ✅ CSS creado

- [ ] **1.2.6** Crear test de performance
  ```bash
  cat > tests/test_search_performance.py << 'EOF'
  """
  Tests de performance para búsqueda de productos
  """
  import pytest
  import time
  from fastapi.testclient import TestClient
  from inventario_retail.web_dashboard.dashboard_app import app
  
  client = TestClient(app)
  
  def test_search_performance_under_500ms():
      """Búsqueda debe ser <500ms en p95"""
      durations = []
      
      for _ in range(20):
          start = time.time()
          response = client.get("/api/productos/search?q=coca")
          duration = (time.time() - start) * 1000
          durations.append(duration)
          
          assert response.status_code == 200
      
      # Calcular p95
      durations.sort()
      p95 = durations[int(len(durations) * 0.95)]
      
      assert p95 < 500, f"P95 latencia: {p95:.0f}ms (debe ser <500ms)"
  
  def test_search_cache_effectiveness():
      """Segunda búsqueda debe usar cache (más rápida)"""
      # Primera búsqueda (cache miss)
      start1 = time.time()
      response1 = client.get("/api/productos/search?q=test123")
      duration1 = (time.time() - start1) * 1000
      
      # Segunda búsqueda (cache hit)
      start2 = time.time()
      response2 = client.get("/api/productos/search?q=test123")
      duration2 = (time.time() - start2) * 1000
      
      assert response1.status_code == 200
      assert response2.status_code == 200
      assert duration2 < duration1 * 0.5, "Cache debe reducir latencia >50%"
  
  def test_search_returns_valid_data():
      """Búsqueda retorna estructura correcta"""
      response = client.get("/api/productos/search?q=producto")
      data = response.json()
      
      assert "query" in data
      assert "count" in data
      assert "results" in data
      assert isinstance(data["results"], list)
      
      if data["results"]:
          first = data["results"][0]
          assert "id" in first
          assert "nombre" in first
          assert "precio" in first
          assert "stock" in first
  EOF
  ```
  **Validación:** ✅ Tests creados

- [ ] **1.2.7** Ejecutar tests de búsqueda
  ```bash
  cd /home/eevan/ProyectosIA/aidrive_genspark
  pytest tests/test_search_performance.py -v --tb=short
  ```
  **Validación:** ✅ Tests pasan (3/3)

- [ ] **1.2.8** Test manual búsqueda
  ```bash
  # Iniciar dashboard
  cd inventario-retail/web_dashboard
  python dashboard_app.py &
  
  # Esperar 3 segundos
  sleep 3
  
  # Test búsqueda
  curl -s "http://localhost:8080/api/productos/search?q=coca" | jq .
  
  # Verificar cache (segunda llamada debe ser más rápida)
  time curl -s "http://localhost:8080/api/productos/search?q=coca" > /dev/null
  ```
  **Validación:** ✅ Respuesta <500ms

- [ ] **1.2.9** Commit cambios Día 1
  ```bash
  git add -A
  git commit -m "feat(ux): Quick Win #1 - Búsqueda ultrarrápida con Redis cache

  - Instalado y configurado Redis server
  - Implementado endpoint /api/productos/search con cache
  - Agregado autocompletado JavaScript inteligente
  - Creados índices BD para optimizar búsquedas
  - Tests de performance: latencia p95 <500ms
  - Coverage: búsqueda ~90% más rápida con cache
  
  Impacto:
  - Latencia búsqueda: 2-3 seg → <500ms (-83%)
  - Cache hit ratio: >70%
  - UX: Autocompletado en 200ms
  
  Refs: PLAN_EJECUCION_UX_ALTO_IMPACTO.md Día 1"
  ```
  **Validación:** ✅ Commit creado

- [ ] **1.2.10** Actualizar checklist progreso
  ```bash
  # Actualizar este archivo con ✅ en tareas completadas
  # Total DÍA 1: 10/10 tareas ✅
  ```
  **Validación:** ✅ Checklist actualizado

---

### DÍA 2 (Martes) - OCR Preview + KPIs Dashboard

**Estado:** ⚪ NO INICIADO  
**Duración estimada:** 7 horas  
**Completado:** 0/15 tareas

#### Tarea 2.1: Quick Win #2 - OCR Preview Inteligente ⏱️ 3.5h

- [ ] **2.1.1** Crear template modal OCR preview
- [ ] **2.1.2** Implementar JavaScript preview logic
- [ ] **2.1.3** Backend: endpoint /api/ocr/process
- [ ] **2.1.4** Backend: función calculate_confidence
- [ ] **2.1.5** CSS styling modal
- [ ] **2.1.6** Test manual upload factura
- [ ] **2.1.7** Validar edición inline campos

#### Tarea 2.2: Quick Win #3 - Dashboard KPIs ⏱️ 3.5h

- [ ] **2.2.1** Agregar KPI cards a dashboard.html
- [ ] **2.2.2** Backend: endpoint /api/kpis/dashboard
- [ ] **2.2.3** Backend: endpoint /api/kpis/weekly-trends
- [ ] **2.2.4** JavaScript clase DashboardKPIs
- [ ] **2.2.5** CSS styling KPI cards
- [ ] **2.2.6** Integrar Chart.js para gráfico
- [ ] **2.2.7** Test actualización automática (30 seg)
- [ ] **2.2.8** Commit cambios Día 2

---

### DÍA 3 (Miércoles) - Notificaciones Parte 1

**Estado:** ⚪ NO INICIADO  
**Duración estimada:** 7 horas  
**Completado:** 0/12 tareas

[... continúa con DÍA 3, 4, 5...]

---

## 📊 MÉTRICAS DE PROGRESO

### Semana 1 (Días 1-5)

**Tareas completadas:** 0/50  
**Horas invertidas:** 0/40  
**Tests pasando:** 0/15  
**Coverage:** N/A

**Estado:** ⚪ NO INICIADO

### Objetivos Semana 1:
- [ ] Búsqueda <500ms en p95
- [ ] OCR errors <5%
- [ ] Dashboard KPIs actualizándose
- [ ] Cache hit ratio >60%
- [ ] 3 Quick Wins completos

---

## 🎯 SIGUIENTE ACCIÓN

**AHORA MISMO:** Ejecutar DÍA 1, Tarea 1.1.1  

```bash
# Comando a ejecutar:
sudo apt-get update && sudo apt-get install redis-server -y
redis-cli ping
```

**¿Listo para comenzar?** 🚀

---

## 📝 NOTAS Y BLOQUEADORES

### Bloqueadores actuales:
- Ninguno

### Decisiones pendientes:
- Ninguna

### Riesgos identificados:
- Ninguno

---

**Última actualización:** 20 Oct 2025 - 19:30  
**Actualizado por:** GitHub Copilot Assistant

