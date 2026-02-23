# Plan De Ajuste Preproduccion: Facturas De Proveedores Y Lenguaje Operativo

Fecha: 2026-02-22
Audiencia: Owner + Operacion + Soporte + Ejecucion tecnica
Objetivo: definir como pulir el procesamiento de facturas y el lenguaje real del negocio antes de salida productiva.

## 0) Alcance Operativo (Que Si / Que No En Esta Etapa)

1. Si: mejorar calidad de carga de compras/ingresos, lenguaje operativo y mapeo producto-alias.
2. Si: ejecutar piloto controlado por proveedor con validacion humana.
3. No (todavia): automatizacion OCR completa de facturas PDF en produccion.
4. No (todavia): eliminar validacion humana en compras.

## 1) Resumen Ejecutivo

1. Tu idea de avanzar "proveedor por proveedor" es correcta y recomendable para tu contexto.
2. Hoy el sistema ya permite registrar ingresos de stock y trabaja bien con faltantes/acciones operativas, pero no existe flujo automatico de OCR/factura PDF en produccion.
3. El parser actual ya entiende verbos de cuaderno como `traer`, `comprar`, `pedir`, `falta`, `no hay`, pero todavia falta un diccionario robusto de alias comerciales de productos (ej: "coca de dos").
4. Recomendacion: arrancar con un piloto controlado de 4 semanas, con validacion humana obligatoria y metricas por proveedor.

## 2) Estado Real Verificado Hoy (2026-02-22)

| Componente | Estado | Evidencia | Implicancia |
|---|---|---|---|
| Ingreso de mercaderia por API | REAL | `supabase/functions/api-minimarket/index.ts:1592` | Se puede registrar entrada por producto/proveedor.
| Recepcion por orden de compra en backend | REAL | `supabase/functions/api-minimarket/index.ts:1701` | Existe endpoint atomico para recepciones.
| Precio de compra en ingreso | REAL (validado, no persistido) | `supabase/functions/api-minimarket/index.ts:1643` | Se valida `precio_compra`, pero no se guarda historico de costo interno todavia.
| UI de deposito (modo rapido/normal) | REAL | `minimarket-system/src/pages/Deposito.tsx:75` | Operacion diaria de entrada/salida/ajuste ya disponible.
| Parser operativo de cuaderno (acciones) | REAL | `minimarket-system/src/utils/cuadernoParser.ts:30` | Ya interpreta acciones tipo comprar/reponer/incidencia.
| Recordatorio automatico para faltantes criticos | REAL | `minimarket-system/src/hooks/queries/useFaltantes.ts:227` | Si prioridad=alta, crea tarea urgente.
| Endpoint de recepcion de compra expuesto en frontend | A_CREAR | `rg -n "compras/recepcion|deposito/ingreso|orden_compra|recepcion" minimarket-system/src/lib/apiClient.ts minimarket-system/src/pages` => sin resultados | El backend lo tiene, pero hoy el flujo UI principal sigue en deposito/manual.
| Flujo automatico OCR/facturas PDF | A_CREAR | `rg -n "OCR|ocr|factura|invoice" minimarket-system/src supabase/functions scripts docs` => sin resultados | Hoy no hay pipeline automatico de lectura de facturas.
| Diccionario formal de alias comerciales por producto | A_CREAR | parser actual basado en includes en `minimarket-system/src/utils/cuadernoParser.ts:147` | Falta resolver de forma robusta "COCA DE DOS" vs nombre canonico.

## 3) Respuestas Directas A Tus Dudas

### 3.1 "Conviene probar por proveedor, un dia cada uno?"

Si. Para vos, es la mejor estrategia de menor riesgo.

Secuencia recomendada por proveedor:
1. Tomar 20-40 facturas reales del proveedor.
2. Cargar lote controlado.
3. Revisar diferencias con vos (producto, unidad, cantidad, precio).
4. Ajustar reglas/alias.
5. Re-ejecutar el mismo lote (regresion).
6. Reci en ese punto pasar al siguiente proveedor.

Criterio de pase por proveedor:
1. Match correcto de lineas >= 95%.
2. Errores criticos (producto equivocado/unidad equivocada) = 0 en 2 corridas seguidas.
3. Tiempo de correccion manual <= 2 minutos por factura promedio.

### 3.2 "Como entrenar la parte linguistica e informal?"

No necesitas arrancar con "entrenamiento IA complejo". Primero reglas + catalogo + feedback humano.

Plan simple y efectivo:
1. Crear tabla de alias de producto (alias -> producto canonico).
2. Cargar aliases reales del negocio (ej: `coca de dos`, `coca z de 1`).
3. Aplicar matching por capas:
   - capa 1: codigo de barras/SKU exacto,
   - capa 2: alias exacto,
   - capa 3: similitud/fuzzy con confirmacion humana.
4. Guardar correcciones del usuario como nuevos aliases aprobados.

Ejemplo de estructura minima de alias:
- `alias_texto`: "coca de dos"
- `producto_id`: UUID producto canonico
- `proveedor_id`: opcional (si cambia por proveedor)
- `confianza`: alta/media
- `activo`: true/false

### 3.3 "Frases de cuaderno como traer/comprar/pedir/falta/no hay"

Esto ya esta parcialmente cubierto:
- `traer`, `comprar`, `pedir` -> comprar
- `falta`, `no hay`, `se acabo` -> reponer

Evidencia: `minimarket-system/src/utils/cuadernoParser.ts:34` y `minimarket-system/src/utils/cuadernoParser.ts:47`.

Lo que falta es reforzar nombres de producto, no tanto verbos de accion.

## 4) Plan Recomendado (4 Semanas)

### Semana 1 - Preparacion
1. Definir "catalogo canonico" (1 nombre por producto, con unidad y marca).
2. Crear diccionario inicial de alias (top 200 terminos reales de mostrador/deposito).
3. Definir tablero de metricas (precision, tiempos, errores por tipo).
4. Definir plantilla unica de validacion por factura (para evitar criterios distintos entre personas).

### Semana 2 - Piloto Proveedores A/B
1. Dia 1-2: Proveedor A (2 lotes).
2. Dia 3-4: Proveedor B (2 lotes).
3. Dia 5: ajuste transversal de reglas.
4. Salida esperada: lista cerrada de errores tipicos por proveedor.

### Semana 3 - Piloto Proveedores C/D
1. Repetir metodologia.
2. Ejecutar regresion cruzada: lo que mejoras para C/D no debe romper A/B.
3. Salida esperada: diccionario de alias v1 estable.

### Semana 4 - Pre Go-Live
1. Corrida final con mix de todos los proveedores.
2. Simulacion operativa real (quien carga, quien valida, quien corrige).
3. Checklist final + plan de contingencia manual.
4. Regla de seguridad: si falla una regla critica, fallback inmediato a carga asistida/manual.

## 5) Otros Aspectos Similares Que Conviene Ajustar

| Area | Riesgo si no se ajusta | Recomendacion practica |
|---|---|---|
| Unidades y presentaciones (1L, 1.5L, 2.25L, pack x6) | Confusion de stock/costo | Tabla de equivalencias por producto y proveedor.
| Productos homonimos (clasica/zero/light) | Carga en item incorrecto | Alias con desambiguacion por variante.
| Precios y redondeos | Margenes distorsionados | Regla unica de redondeo y auditoria semanal.
| Duplicados de carga | Sobre stock o doble costo | Control por numero de comprobante + proveedor + fecha.
| Devoluciones / notas de credito | Stock y costo inflados | Flujo explicito de ajuste negativo con motivo obligatorio.
| Operacion humana | Dependencia de memoria personal | SOP de 1 pagina por tarea critica + capacitacion corta.
| Monitoreo diario | Problemas detectados tarde | Dashboard de 5 KPI operativos con umbrales.

## 6) KPI Minimos Para Liberar Este Frente

1. Precision de mapeo de lineas de factura >= 95% (global).
2. Precision por proveedor >= 93% (ninguno por debajo).
3. Errores criticos (producto/unidad) <= 1%.
4. Tiempo promedio de carga + validacion <= 3 min por factura.
5. Tasa de correccion manual en descenso semana a semana.

## 6.1) Criterio De Pase Por Proveedor (Pragmatico)

1. Verde: precision >= 95% y 0 errores criticos en 2 corridas seguidas.
2. Amarillo: precision 90%-94% o errores criticos aislados.
3. Rojo: precision < 90% o errores de unidad/variante repetidos.
4. Regla: no avanzar de proveedor en estado Rojo.

## 7) Recomendacion Final Para Vos (Owner)

Tu enfoque por proveedor/dia es correcto y te protege de errores grandes.

Orden sugerido de ejecucion:
1. Cerrar primero diccionario de alias + equivalencias de unidad.
2. Hacer piloto por proveedor con validacion humana obligatoria.
3. Pasar a automatizacion mayor (OCR/factura) recien cuando la base de datos de alias ya sea estable.

## 8) Plantilla Operativa Corta (Negocio) - Etapa Preproduccion

### 8.1 Campos Manuales (los que si conviene cargar hoy)

1. `producto_factura_texto`: descripcion exacta impresa en la linea.
2. `alias_negocio`: como lo nombran ustedes en local/deposito.
3. `variante_presentacion`: clasica/zero/light + tamano o pack (ej: 2.25L, x6).
4. `cantidad`: cantidad de la linea.
5. `unidad`: unidad/pack/caja/litro/kilo.
6. `precio_unitario`: precio por unidad de la linea.
7. `mapeo_ok`: si quedo bien mapeado (`si/no`).
8. `error_tipo`: solo si fallo (`producto|variante|unidad|precio|duplicado`).
9. `correccion_final`: alias o producto canonico correcto.
10. `obs_operativa`: friccion real detectada (breve).

### 8.2 Campos Autoextraidos Por Agente Desde Imagen (no cargarlos manualmente salvo falla)

1. `proveedor`
2. `factura_fecha`
3. `factura_numero`
4. `tipo_comprobante`
5. `subtotal_linea` y/o `total_factura` (si la calidad de imagen lo permite)

### 8.3 Regla De Fallback

1. Si el agente no extrae con confianza alta `factura_fecha` o `factura_numero`, se completa manualmente solo ese dato.
2. No frenar la operacion por campos secundarios: priorizar mapeo correcto de producto/variante/unidad.
