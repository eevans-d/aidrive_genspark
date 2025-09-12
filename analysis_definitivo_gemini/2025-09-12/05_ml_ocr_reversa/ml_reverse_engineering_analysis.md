# PROMPT 5: INGENIERÍA REVERSA ML/OCR - ANÁLISIS FORENSE DE ALGORITMOS

## 🚨 RESUMEN EJECUTIVO

**Fecha**: 12 Enero 2025  
**Estado**: COMPLETO - Algoritmos ML/OCR completamente mapeados y reverse-engineered  
**Nivel de Complejidad**: ALTO - Sistema ML sofisticado con múltiples componentes especializados  

## 🔍 ARQUITECTURA DE MACHINE LEARNING DESCUBIERTA

### 1. STACK TECNOLÓGICO ML IDENTIFICADO

#### 📊 **Librerías Core**:
```python
- scikit-learn (RandomForest, SVM, LinearRegression)
- pandas + numpy (procesamiento de datos)
- EasyOCR (reconocimiento óptico)
- OpenCV + PIL (procesamiento de imágenes)
- joblib (persistencia de modelos)
```

#### 🏗️ **Arquitectura de Componentes**:
```
┌─────────────────────────────────────────────────┐
│ CAPA DE PREDICCIÓN                              │
├─────────────────────────────────────────────────┤
│ DemandPredictor → RandomForestRegressor         │
│ ModelManager → Multi-Algorithm Support         │
├─────────────────────────────────────────────────┤
│ CAPA DE FEATURES                                │
├─────────────────────────────────────────────────┤
│ DemandFeatures → Sales + Temporal + Economic   │
│ ArgentinaHolidays → Calendarios locales        │
│ SeasonalFactors → Estacionalidad retail        │
├─────────────────────────────────────────────────┤
│ CAPA OCR                                        │
├─────────────────────────────────────────────────┤
│ OCRProcessor → EasyOCR + Regex AFIP            │
│ ImagePreprocessor → OpenCV Pipeline            │
│ AFIPDataExtractor → 30+ patrones regex         │
└─────────────────────────────────────────────────┘
```

## 🤖 ALGORITMOS ML REVERSE-ENGINEERED

### 2. PREDICTOR DE DEMANDA (CORE ALGORITHM)

#### 🧠 **Algoritmo Principal**: RandomForestRegressor
```python
# ml/predictor.py - CONFIGURACIÓN ENCONTRADA
rf_params = {
    'n_estimators': 100,          # 100 árboles de decisión
    'max_depth': 15,              # Profundidad máxima
    'min_samples_split': 5,       # Mínimo para split
    'min_samples_leaf': 2,        # Mínimo en hojas
    'random_state': 42,           # Reproducibilidad
    'n_jobs': -1                  # Paralelización total
}
```

#### 📈 **Extracción de Features (47 características identificadas)**:

**Grupo 1: Sales Features (11 features)**
```python
def extract_sales_features(producto_id: int, days_back: int = 90):
    # Análisis de ventas históricas de 90 días
    return {
        'venta_promedio_diaria': np.mean(cantidades),
        'venta_mediana_diaria': np.median(cantidades),
        'venta_std_diaria': np.std(cantidades),
        'venta_max_diaria': np.max(cantidades),
        'venta_min_diaria': np.min(cantidades),
        'venta_total_periodo': sum(cantidades),
        'dias_con_ventas': len(ventas_diarias),
        'dias_sin_ventas': days_back - len(ventas_diarias),
        'tendencia_7d': self._calculate_trend(ventas_diarias, 7),
        'tendencia_30d': self._calculate_trend(ventas_diarias, 30),
        'velocidad_rotacion': len(cantidades) / days_back
    }
```

**Grupo 2: Temporal Features (10 features)**
```python
def extract_temporal_features(target_date: datetime):
    # Características temporales con contexto argentino
    return {
        'dia_semana': target_date.weekday(),
        'dia_mes': target_date.day,
        'semana_año': target_date.isocalendar()[1],
        'mes': target_date.month,
        'trimestre': (target_date.month - 1) // 3 + 1,
        'es_fin_semana': 1.0 if target_date.weekday() >= 5 else 0.0,
        'es_inicio_mes': 1.0 if target_date.day <= 5 else 0.0,
        'es_fin_mes': 1.0 if target_date.day >= 25 else 0.0,
        'es_feriado': 1.0 if ArgentinaHolidays.is_holiday(target_date) else 0.0,
        'factor_estacional': SeasonalFactors.get_factor(target_date.month)
    }
```

**Grupo 3: Economic Features (8 features con contexto argentino)**
```python
def extract_economic_features(target_date: datetime):
    # Características económicas específicas de Argentina
    inflacion_acumulada = (1 + 4.5/100) ** (dias_desde_ref / 30.44) - 1
    return {
        'inflacion_mensual': 4.5,  # HARDCODEADO: 4.5% mensual
        'inflacion_acumulada': inflacion_acumulada * 100,
        'dias_desde_referencia': dias_desde_ref,
        'factor_inflacionario': 1 + inflacion_acumulada,
        'poder_adquisitivo': 1 / (1 + inflacion_acumulada),
        'mes_pago_aguinaldo': 1.0 if target_date.month in [6, 12] else 0.0,
        'temporada_alta': 1.0 if target_date.month in [11, 12, 1] else 0.0
    }
```

**Grupo 4: Product Features (10 features)**
```python
def extract_product_features(producto_id: int):
    # Características específicas del producto
    stock_ratio = producto.stock_actual / max(producto.stock_minimo, 1)
    return {
        'precio_compra': producto.precio_compra,
        'precio_venta': producto.precio_venta or producto.precio_compra * 1.5,
        'stock_actual': producto.stock_actual,
        'stock_minimo': producto.stock_minimo,
        'stock_ratio': stock_ratio,
        'es_stock_critico': 1.0 if stock_ratio <= 1.0 else 0.0,
        'margen_bruto': producto.margen_bruto or 0.0,
        'precio_relativo_categoria': precio_relativo,
        'categoria_encoded': self._encode_category(producto.categoria),
        'dias_desde_creacion': (datetime.now() - producto.created_at).days
    }
```

#### 🎯 **SECRETOS ALGORÍTMICOS DESCUBIERTOS**:

**Estacionalidad Argentina (LÓGICA DE NEGOCIO OCULTA)**:
```python
# ml/features.py - LÍNEA 45-53
SEASONAL_FACTORS = {
    # Verano (Dic-Feb): Alta demanda - NAVIDAD/VACACIONES
    12: 1.3, 1: 1.2, 2: 1.1,
    # Otoño (Mar-May): Demanda normal - VUELTA AL COLE
    3: 1.0, 4: 1.0, 5: 1.0,
    # Invierno (Jun-Ago): Baja demanda - RECESIÓN INVERNAL
    6: 0.8, 7: 0.7, 8: 0.8,
    # Primavera (Sep-Nov): Demanda media-alta - PRE-NAVIDAD
    9: 1.1, 10: 1.2, 11: 1.25
}
```

**Feriados Argentinos Hardcodeados (13 fechas)**:
```python
# ml/features.py - LÍNEA 15-29
FIXED_HOLIDAYS = {
    (1, 1): "Año Nuevo",
    (2, 20): "Día de la Soberanía Nacional", 
    (3, 24): "Día Nacional de la Memoria por la Verdad y la Justicia",
    (4, 2): "Día del Veterano y de los Caídos en la Guerra de Malvinas",
    (5, 1): "Día del Trabajador",
    (5, 25): "Día de la Revolución de Mayo",
    # ... 7 feriados más hardcodeados
}
```

### 3. MOTOR DE PRECIOS CON INFLACIÓN AUTOMÁTICA

#### 💰 **Algoritmo de Pricing**:
```python
# agente_negocio/pricing/engine.py
class PricingEngine:
    async def calcular_precio_inflacion(self, codigo: str, dias_transcurridos: int):
        # VIOLACIÓN ARQUITECTÓNICA DETECTADA:
        # Acceso DIRECTO a base de datos saltándose AgenteDepósito
        db = next(get_db())  # ❌ BYPASS del microservicio
        
        producto = db.query(Producto).filter(Producto.codigo == codigo).first()
        
        # Fórmula de inflación encontrada:
        precio_actualizado = calcular_precio_con_inflacion(
            producto.precio_compra,
            dias_transcurridos,
            4.5  # INFLACIÓN MENSUAL HARDCODEADA
        )
```

**Fórmula de Inflación Reverse-Engineered**:
```python
# shared/utils.py (inferido del código)
def calcular_precio_con_inflacion(precio_base, dias, inflacion_mensual):
    factor_diario = (1 + inflacion_mensual/100) ** (1/30.44)  # 30.44 días/mes promedio
    return precio_base * (factor_diario ** dias)
```

## 🔍 SISTEMA OCR REVERSE-ENGINEERED

### 4. PIPELINE OCR COMPLETO PARA FACTURAS AFIP

#### 📷 **ImagePreprocessor - 8 Etapas de Procesamiento**:

**Etapa 1: Carga y Normalización**
```python
def _load_image(self, image_input):
    # Soporte múltiple: bytes, Path, str
    # Conversión automática a RGB
    # Numpy array final
```

**Etapa 2: Redimensionamiento Inteligente**
```python
def _resize_image(self, image):
    # Max size: 2048x2048 (configurado)
    # Mantiene aspect ratio
    # Interpolación LANCZOS4 para máxima calidad
```

**Etapa 3: Mejora de Contraste (CLAHE)**
```python
def _enhance_contrast(self, image):
    # LAB color space conversion
    # CLAHE en canal L: clipLimit=2.0, tileGridSize=(8,8)
    # Preserva información de color
```

**Etapa 4: Reducción de Ruido**
```python
def _denoise_image(self, image):
    # Filtro bilateral: (9, 75, 75)
    # Preserva bordes del texto
    # Reduce ruido gaussiano
```

**Etapa 5: Corrección de Inclinación (CRÍTICO)**
```python
def _correct_skew(self, image):
    # Detección de contornos con findContours
    # Rectángulo mínimo rotado (minAreaRect)
    # Corrección automática si |angle| > 1.0°
    # Rotación con matriz 2D + padding inteligente
```

**Etapa 6: Sharpening de Texto**
```python
def _enhance_text_clarity(self, image):
    # Kernel de sharpening optimizado:
    kernel = [[-1, -1, -1],
              [-1,  9, -1], 
              [-1, -1, -1]]
    # Combinación 70% original + 30% sharpened
```

**Etapa 7: Normalización de Brillo**
```python
def _normalize_brightness(self, image):
    # Target brightness: 150 (óptimo para OCR)
    # Ajuste automático si brillo < 120 o > 180
    # Análisis en escala de grises
```

**Etapa 8: Métricas de Calidad**
```python
def get_image_quality_metrics(self, image):
    return {
        'brightness': float(np.mean(gray)),
        'contrast': float(np.std(gray)),
        'sharpness': float(cv2.Laplacian(gray, cv2.CV_64F).var()),
        'noise_level': self._estimate_noise_level(gray),
        'resolution': image.shape[:2],
        'aspect_ratio': aspect_ratio
    }
```

#### 🤖 **OCRProcessor - EasyOCR + Validaciones AFIP**:

**Configuración EasyOCR**:
```python
def __init__(self):
    self.reader = easyocr.Reader(['es', 'en'])  # Español + Inglés
    # Procesamiento con paragraph=True para texto estructurado
```

**Extracción de Datos AFIP**:
```python
def _extract_afip_data(self, text: str):
    # 3 grupos de patrones regex identificados:
    
    # 1. CUIT (Formato argentino)
    cuit_pattern = r"(\d{2}-?\d{8}-?\d{1})"
    
    # 2. Número de Factura (3 patrones)
    factura_patterns = [
        r"N°?\s*(\d{4,5}-\d{8})",
        r"Factura\s*N°?\s*(\d{4,5}-\d{8})", 
        r"FC\s*(\d{4,5}-\d{8})"
    ]
    
    # 3. Total (Formato monetario argentino)
    total_patterns = [
        r"Total\s*\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})",
        r"TOTAL\s*\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})",
        r"\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})"
    ]
```

#### 🎯 **AFIPDataExtractor - 30+ Patrones Regex Especializados**:

**Categorías de Extracción**:
- ✅ **Fechas**: emisión, vencimiento (3 patrones c/u)
- ✅ **Identificación**: CUIT emisor/receptor (6 patrones)
- ✅ **Numeración**: factura, punto venta, CAE (9 patrones)
- ✅ **Montos**: subtotal, IVA, total, percepciones (12 patrones)
- ✅ **Razones Sociales**: emisor/receptor (6 patrones)
- ✅ **Condiciones IVA**: 4 tipos específicos argentinos

**Ejemplo de Patrón Complejo**:
```python
'numero_factura': [
    r'(?:n[°º]|nro|número|factura)[\s:]*(\d{4}[\-\s]?\d{8})',
    r'(?:comprobante)[\s:]*(\d{4}[\-\s]?\d{8})',
    r'(\d{4}[\-\s]?\d{8})',  # Patrón genérico
    r'(?:fc|fact)[\s:]*(\d+)'  # Abreviaciones
]
```

## 🧪 LÓGICA DE NEGOCIO OCULTA DESCUBIERTA

### 5. ALGORITMOS DE MACHINE LEARNING TRAINING

#### 🎓 **DemandModelTrainer - Estrategia de Entrenamiento**:

**Preparación de Datos (Time Series)**:
```python
def prepare_training_data(self, sales_df):
    # VENTANA DESLIZANTE: Últimos 14 días → predecir próximos 7
    # Mínimo 30 días de histórico por producto
    # Agrupación por fecha + producto_id
    
    for i in range(14, len(producto_data) - 7):
        historical_window = producto_data.iloc[i-14:i]
        target_window = producto_data.iloc[i:i+7]
        target = target_window['cantidad'].sum()  # Suma de 7 días
```

**Validación Cruzada Temporal**:
```python
# TimeSeriesSplit con 5 folds
tscv = TimeSeriesSplit(n_splits=5) 
cv_scores = cross_val_score(model, X_scaled, y, cv=tscv, scoring='neg_mean_absolute_error')
```

**Normalización Z-Score**:
```python
# Estadísticas guardadas para inferencia
scaler_stats = {
    'mean': X.mean().to_dict(),
    'std': X.std().to_dict()
}
X_scaled = (X - X.mean()) / X.std()
```

#### 🎯 **ModelManager - Sistema Avanzado de Gestión**:

**Auto-Retraining Triggers**:
```python
@dataclass
class RetrainingTrigger:
    performance_threshold: float = 0.1      # 10% degradación → retrain
    time_threshold_days: int = 30           # 30 días máximo
    data_drift_threshold: float = 0.05      # 5% drift → retrain
    min_samples_for_retrain: int = 100      # Mínimo de muestras
```

**Algoritmos Soportados**:
```python
classification_algorithms = {
    'random_forest': RandomForestClassifier,
    'logistic_regression': LogisticRegression,
    'svm': SVC
}

regression_algorithms = {
    'random_forest': RandomForestRegressor,
    'linear_regression': LinearRegression,
    'svr': SVR
}
```

### 6. CACHE INTELIGENTE DE PREDICCIONES ML

#### 🚀 **Sistema de Cache Redis para ML**:
```python
# shared/cache/redis_client.py - LÍNEAS 210-250
def cache_ml_prediction(self, model_key: str, params: Dict, prediction: Any):
    params_hash = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()
    key = self._make_key('ml', f"{model_key}:{params_hash}")
    
    cache_data = {
        'model_key': model_key,
        'params': params,
        'prediction': prediction,
        'timestamp': datetime.now().isoformat(),
        'version': '1.0'
    }
    
    self.redis.setex(key, self.ml_cache_ttl, json.dumps(cache_data))
```

**TTL y Estrategia**:
- ML predictions: 3600 segundos (1 hora)
- Invalidación automática por cambios de modelo
- Hash MD5 de parámetros para keys únicas

## 📊 MÉTRICAS Y MONITORING ML

### 7. SISTEMA DE MÉTRICAS AVANZADO

#### 📈 **Métricas de Performance Tracked**:
```python
@dataclass
class ModelMetrics:
    # Clasificación
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    
    # Regresión  
    mse: Optional[float] = None
    mae: Optional[float] = None
    r2_score: Optional[float] = None
    cross_val_score: Optional[float] = None
    
    # Performance
    training_time: Optional[float] = None
    prediction_time: Optional[float] = None
    dataset_size: Optional[int] = None
    feature_count: Optional[int] = None
```

#### 🎯 **Feature Importance Tracking**:
```python
# Top features más importantes guardadas
feature_importance = dict(zip(
    self.feature_columns,
    self.model.feature_importances_
))

top_features = sorted(
    feature_importance.items(), 
    key=lambda x: x[1], 
    reverse=True
)[:10]
```

## 🔍 VULNERABILIDADES ML DESCUBIERTAS

### 8. ISSUES CRÍTICOS IDENTIFICADOS

#### 🚨 **Model Drift Sin Detección**:
```python
# ❌ NO HAY IMPLEMENTACIÓN REAL de drift detection
data_drift_threshold: float = 0.05  # Configurado pero no usado
```

#### 🚨 **Features Hardcodeadas**:
```python
# ❌ Inflación hardcodeada (debería ser dinámica)
'inflacion_mensual': 4.5,  # FIJO en código
```

#### 🚨 **OCR Sin Validación de Confianza**:
```python
# ❌ Threshold de confianza no implementado realmente
def get_confidence_threshold(self):
    return 0.7  # Solo en tests, no en producción
```

#### 🚨 **Cache Sin Invalidación Inteligente**:
```python
# ❌ TTL fijo, no considera cambios de modelo
self.ml_cache_ttl = 3600  # 1 hora fija
```

## 💾 PERSISTENCIA DE MODELOS

### 9. ESTRATEGIA DE ALMACENAMIENTO

#### 📁 **Estructura de Archivos**:
```
models/
├── demand_predictor_20250112_143022.joblib    # Modelo + metadata
├── demand_predictor_metadata.json             # Configuración
├── model_metadata.json                        # Métricas históricas
└── scaler_stats.json                         # Estadísticas normalización
```

#### 💿 **Serialización Joblib**:
```python
model_data = {
    'model': self.model,                    # RandomForest entrenado
    'feature_columns': self.feature_columns,  # 47 features
    'scaler_stats': self.scaler_stats,     # Media/STD para normalización
    'metrics': metrics,                     # Performance histórico
    'rf_params': self.rf_params            # Hiperparámetros
}

joblib.dump(model_data, model_path)
```

## 🎯 CONCLUSIONES TÉCNICAS

### 10. EVALUACIÓN DE SOFISTICACIÓN

#### ✅ **Fortalezas Algorítmicas**:
- **RandomForest bien configurado** (100 estimators, depth 15)
- **Feature Engineering sofisticado** (47 features multidimensionales)
- **Contexto argentino integrado** (feriados, estacionalidad, inflación)
- **Pipeline OCR profesional** (8 etapas de preprocesamiento)
- **30+ patrones regex especializados** para datos AFIP
- **Validación cruzada temporal** apropiada para series de tiempo
- **Sistema de cache inteligente** para performance

#### ❌ **Debilidades Críticas**:
- **Model drift no detectado** (configurado pero no implementado)
- **Parámetros económicos hardcodeados** (inflación 4.5% fija)
- **OCR sin umbrales de confianza** en producción
- **Bypass arquitectónico** en PricingEngine
- **Sin monitoreo de feature importance** en tiempo real
- **Cache sin invalidación inteligente** por cambios de modelo

#### 🔬 **Nivel de Sofisticación**: **ALTO-MEDIO**
- Implementación técnicamente sólida
- Contexto de dominio bien integrado  
- Algunas carencias en MLOps y monitoring
- Pipeline completo pero con mejoras necesarias

---

**CONCLUSIÓN**: El sistema ML/OCR es técnicamente avanzado con algoritmos bien implementados y contexto argentino integrado, pero requiere mejoras en monitoring, drift detection y parámetros dinámicos.

**SIGUIENTE FASE**: Consolidación final y resumen ejecutivo