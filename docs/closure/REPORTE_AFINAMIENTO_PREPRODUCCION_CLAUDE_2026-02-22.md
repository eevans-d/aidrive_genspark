# Reporte de Afinamiento Preproduccion - Analisis Claude Code

> **Fecha:** 2026-02-22
> **Generado por:** Claude Code (sesion independiente)
> **Tipo:** Documento de consulta y guia de puesta en marcha
> **Contexto:** El owner (sin perfil tecnico) plantea dudas sobre como afinar el sistema con datos reales antes de produccion

---

## 1. Origen de este documento

El owner planteo 3 preguntas concretas antes de ir a produccion:

1. Como afinar el procesamiento de facturas de proveedores? Conviene ir proveedor por proveedor?
2. Como manejar los nombres informales de productos ("Coca de dos", "Coca Zero de litro")?
3. Las anotaciones tipo cuaderno ("traer", "falta", "no hay") funcionan?

Adicionalmente solicito un reporte general de otros aspectos similares que requieran afinamiento.

---

## 2. Analisis tecnico del estado actual

### 2.1 Procesamiento de facturas de proveedores

**ESTADO: El sistema NO procesa facturas fisicas (papel/PDF/foto).**

Lo que existe hoy es un pipeline diferente:

```
Sitio web Maxiconsumo → Scraper automatico → Tabla precios_proveedor → Matching → Comparacion de precios
```

Archivos clave verificados:
- `supabase/functions/scraper-maxiconsumo/scraping.ts` - Extrae productos del sitio web
- `supabase/functions/scraper-maxiconsumo/parsing.ts` - Parsea HTML y normaliza nombres
- `supabase/functions/scraper-maxiconsumo/matching.ts` - Matching por SKU/barcode/nombre/fuzzy
- `supabase/functions/scraper-maxiconsumo/storage.ts` - Persistencia en lotes de 50

Esto NO es lo mismo que "cargar una factura de proveedor". Para eso se necesitaria una interfaz donde el usuario ingrese los items de la factura y el sistema los vincule con productos existentes.

### 2.2 Sistema de matching actual

El matching (`matching.ts`) usa 4 estrategias en cascada:

| Orden | Estrategia | Confianza | Funciona para facturas? |
|-------|-----------|-----------|------------------------|
| 1 | SKU exacto | 95% | Solo si la factura trae SKU identico al del sistema |
| 2 | Codigo de barras exacto | 90% | Solo si la factura trae EAN/barcode |
| 3 | Nombre normalizado | 40-80% | Parcial - falla con nombres informales |
| 4 | Fuzzy (interseccion de palabras) | 30-40% | Muy limitado |

**Problema demostrado con ejemplo real:**

```
Nombre en factura:  "Coca-Cola Clasica P.E.T x 2,25 lt"
Nombre informal:    "Coca de dos"

Normalizacion del sistema actual:
  factura  → "coca cola clasica pet 225 lt"  (7 palabras)
  informal → "coca dos"                       (2 palabras)

Palabras en comun: {"coca"} = 1
Palabras totales:  {"coca","cola","clasica","pet","225","lt","dos"} = 7

Score = (1/7) * 80 = 11%  →  DESCARTADO (umbral minimo: 40%)
```

El matching actual es por interseccion de palabras. No entiende sinonimos, abreviaturas ni convenciones del rubro.

### 2.3 Cuaderno Inteligente (acciones operativas)

**ESTADO: FUNCIONA.** El parser en `minimarket-system/src/utils/cuadernoParser.ts` ya reconoce:

| Palabras detectadas | Accion asignada |
|---------------------|-----------------|
| falta, no hay, no queda, se acabo, necesito | `reponer` |
| traer, comprar, pedir, conseguir | `comprar` |
| revisar, verificar, anotar | `observacion` |
| roto, vencido, averiado, problema | `incidencia` |

Tambien detecta prioridad ("urgente" = alta) y cantidades numericas.

**El problema no esta en los verbos sino en el nombre del producto resultante.** Cuando el parser extrae "Coca dos" del input "falta Coca de dos, urgente", no puede vincularlo con "Coca-Cola Clasica P.E.T x 2,25 lt" en la base de datos porque no existe un sistema de aliases.

---

## 3. Respuestas a las preguntas del owner

### 3.1 Facturas: conviene ir proveedor por proveedor?

**Si.** Es la estrategia correcta por estas razones:

- Cada proveedor usa nomenclatura propia (Maxiconsumo dice "COCA COLA PET 2.25L", una distribuidora local dice "C.COLA 2 1/4", la factura impresa dice "CC CLASICA 2.25")
- Las correcciones de un proveedor no aplican necesariamente a otro
- Permite detectar patrones de un proveedor especifico antes de mezclar con otros

**Dinamica recomendada:**

```
DIA 1 - Proveedor A (ej: Maxiconsumo):
  1. Tomar 1 factura real completa
  2. Cargar cada item manualmente
  3. El sistema intenta matchear cada linea con un producto existente
  4. El owner confirma o corrige cada match
  5. Cada correccion se guarda como alias (nombre del proveedor → producto del sistema)
  6. Repetir con 2-3 facturas mas del mismo proveedor
  7. Al final del dia: el sistema conoce ~80% de los nombres de ESE proveedor

DIA 2 - Proveedor B (ej: distribuidora local):
  - Misma dinamica
  - Codigos y nombres completamente distintos al Proveedor A

DIA 3+ - Siguientes proveedores

SEMANA 2+:
  - Las facturas nuevas de proveedores ya procesados matchean ~90%+
  - Solo se corrigen productos nuevos o nombres que cambiaron
```

### 3.2 Nombres informales: como ensenarle al sistema?

**Se necesita un sistema de aliases que hoy NO existe.** No hay tabla `producto_aliases` en la base de datos.

La solucion es crear una capa de traduccion entre el nombre informal y el producto canonico:

| Lo que dice la persona | Lo que el sistema debe entender | Mecanismo |
|------------------------|--------------------------------|-----------|
| "Coca de dos" | Coca-Cola Clasica 2.25L | Alias guardado tras primera correccion |
| "Coca Zero de litro" | Coca-Cola Zero 1.5L | Alias guardado |
| "Coca Z de 1" | Coca-Cola Zero 1.5L | Segundo alias del mismo producto |
| "Fanta de 2" | Fanta Naranja 2.25L | Alias guardado |
| "La Serenisima entera" | Leche Entera La Serenisima 1L | Alias guardado |

**Reglas implicitas que tambien se pueden codificar:**

| Regla | Ejemplo | Logica |
|-------|---------|--------|
| Sin variedad = clasica/comun | "Coca" = Coca-Cola Clasica | Variedad por defecto por marca |
| "De litro" = 1.5L | "Coca de litro" = 1.5L no 1L | Convencion del rubro, no medida exacta |
| "De dos" = 2.25L | "Fanta de dos" = 2.25L | Convencion del rubro |
| Sin marca = la mas vendida | "Leche entera" = La Serenisima | Producto por defecto en categoria |

### 3.3 Anotaciones del cuaderno ("traer", "falta", etc.)

**Ya funciona la parte de acciones.** Lo que falta es la conexion con el punto 3.2:

```
Input del usuario:  "falta Coca de dos, urgente"
                         │
                         ▼
Parser de cuaderno (YA FUNCIONA):
  accion: "reponer"
  productoNombre: "Coca dos"     ← extrae correctamente
  prioridad: "alta"              ← detecta "urgente"
                         │
                         ▼
Matching con base de datos (NO FUNCIONA para nombres informales):
  "Coca dos" vs "Coca-Cola Clasica P.E.T x 2,25 lt" → Score 11% → FALLA
                         │
                         ▼
CON sistema de aliases (A CREAR):
  "Coca dos" → busca en tabla aliases → encuentra match → Coca-Cola Clasica 2.25L → OK
```

---

## 4. Otros aspectos que necesitan afinamiento

### 4.1 Carga inicial de datos (Dia 0)

Antes de operar, el sistema necesita datos base:

| Dato | Como se carga | Observacion |
|------|--------------|-------------|
| Categorias | Manual via UI (pagina Categorias) | ~15-20 categorias principales |
| Productos | Manual via UI o importacion masiva | 200-500+ items, critico definir bien nombre canonico, marca, presentacion |
| Proveedores | Manual via UI (pagina Proveedores) | ~5-15 proveedores activos |
| Precios de venta | Manual por producto | Definir politica de margen y redondeo primero |
| Stock inicial | Via Deposito > Ingreso | Requiere conteo fisico previo |
| Clientes con cuenta corriente | Manual via UI (pagina Clientes) | Solo los que tienen fiado activo |

**Recomendacion:** No cargar todo de golpe. Empezar con 1 categoria completa (ej: "Bebidas") y validar que el flujo funciona bien de punta a punta antes de continuar.

**Importacion masiva CSV:** No existe hoy. Si el owner tiene una planilla con productos, se podria construir una herramienta de importacion.

### 4.2 Calibracion de umbrales de alertas

Los umbrales por defecto probablemente no se ajusten a la realidad del negocio:

| Alerta | Que ajustar | Como se aprende |
|--------|------------|-----------------|
| Stock bajo | `nivel_minimo` por producto | Si avisa con 50 unidades y eso es "mucho", subir el umbral. Si nunca avisa y te quedas sin stock, bajarlo |
| Producto por vencer | Dias de anticipacion | Depende del tipo de producto (lacteos vs secos) |
| Cambio de precio significativo | % umbral del scraper | 10% por defecto, ajustar segun sensibilidad real |
| Sugerencia de reposicion | Ventana de analisis (dias) | 30 dias por defecto, puede ser mucho o poco segun rotacion |

**Esto es producto por producto y solo se aprende con minimo 30 dias de operacion real.**

### 4.3 POS (Punto de Venta)

| Aspecto | Que validar con datos reales |
|---------|------------------------------|
| Busqueda de productos | Que encuentre el producto aunque se escriba informal (necesita aliases) |
| Regla de redondeo | Verificar que el redondeo a $50 sea el que realmente se usa en el local |
| Metodos de pago | Confirmar que efectivo, tarjeta, transferencia y fiado cubren TODOS los casos reales |
| Ticket/comprobante | Adaptar formato a necesidades legales/fiscales reales |

### 4.4 Cuentas corrientes (fiados)

| Aspecto | Que definir |
|---------|-------------|
| Limite de credito | Cuanto fiado se permite por cliente (puede ser distinto por cliente) |
| Periodicidad de corte | Semanal, quincenal o mensual |
| Aviso de mora | A partir de cuantos dias o monto avisar |
| Integracion WhatsApp | El boton existe en la UI pero necesita configurar numero destino |

### 4.5 Scraper de precios (Maxiconsumo)

| Aspecto | Que ajustar |
|---------|-------------|
| Hora de ejecucion | Verificar que la hora del cron sea antes de la apertura del local |
| Categorias scrapeadas | Agregar/quitar segun lo que realmente se compra ahi |
| Matching con productos propios | Necesita datos reales para mejorar (misma logica de aliases) |
| % minimo de ahorro | Calibrar para que solo avise con oportunidades que valgan la pena |

### 4.6 Reglas de negocio implicitas

Estas son cosas que el sistema no puede saber hasta que el owner las defina:

| Regla | Ejemplo | Como ensenarla |
|-------|---------|----------------|
| Variedad por defecto | "Coca" = clasica, no zero ni light | Alias + regla por marca |
| Tamano por defecto | "De litro" = 1.5L en la practica | Alias especifico |
| Proveedor preferido por producto | "La coca siempre de Maxiconsumo" | Asignar proveedor principal en cada producto |
| Cantidad habitual de pedido | "Siempre pido 5 cajas de coca" | Se aprende del historial (automatico con el tiempo) |
| Margen objetivo | "A la coca le pongo 30%" | Configurar por producto o categoria |
| Productos estacionales | "Helados solo en verano" | Marcar como estacional |

### 4.7 Notificaciones

| Canal | Estado actual | Que configurar |
|-------|--------------|----------------|
| Email (SendGrid) | Configurado | Verificar API key y emails destinatarios correctos |
| Slack | Preparado | Necesita webhook URL si se va a usar |
| WhatsApp | Boton en UI | Solo abre WhatsApp con texto pre-armado, no es automatico |

---

## 5. Estrategia de afinamiento recomendada (por fases)

### Fase 1: Carga base
- Cargar categorias principales
- Cargar los 50-100 productos que mas se venden
- Cargar proveedores principales (3-5)
- Conteo fisico de stock y carga como stock inicial
- Cargar clientes con cuenta corriente activa

### Fase 2: Operacion asistida
- Empezar a registrar ventas reales con el POS
- Registrar TODAS las ventas (resistir la tentacion de volver al metodo anterior)
- Corregir precios, nombres y categorias a medida que aparecen errores
- Cargar productos nuevos a medida que se necesiten

### Fase 3: Entrenamiento del matching (proveedor por proveedor)
- Dia 1: Proveedor A - cargar items de facturas reales, confirmar/corregir matches, guardar aliases
- Dia 2: Proveedor B - idem con su nomenclatura propia
- Dia 3+: siguientes proveedores
- Semana 2+: facturas de proveedores ya procesados deberian matchear 90%+ automatico

### Fase 4: Calibracion de alertas
- Revisar diariamente alertas de stock bajo
- Ajustar umbrales producto por producto
- Evaluar utilidad de sugerencias de reposicion
- Ajustar sensibilidad del scraper de precios

### Fase 5: Operacion autonoma
- El sistema tiene historial suficiente para sugerir bien
- Alertas calibradas segun la realidad
- Aliases cubren la mayoria de nombres informales
- Ciclo: vender → sistema detecta faltantes → genera pedidos → owner los envia

---

## 6. Componentes que necesitan construirse (A CREAR)

| Componente | Prioridad | Que es |
|------------|-----------|--------|
| Tabla `producto_aliases` | ALTA | Guardar nombres informales/alternativos vinculados a cada producto |
| UI de confirmacion de match | ALTA | Pantalla donde el sistema muestre "Creo que X es Y, confirmar?" y guarde la correccion como alias |
| Carga de factura manual asistida | ALTA | Interfaz para ingresar items de una factura y que el sistema sugiera el producto correspondiente |
| Importacion CSV de productos | MEDIA | Para la carga inicial masiva si se tiene una planilla existente |
| Reglas de variedad por defecto | MEDIA | "Si dice Coca sin especificar = Clasica" como regla configurable |
| Historial de correcciones | BAJA | Para ver, editar y administrar los aliases creados |

---

## 7. Resumen de respuestas

| Pregunta del owner | Respuesta |
|--------------------|-----------|
| Como afinar facturas de proveedores? | Estrategia proveedor por proveedor es correcta. Se necesita sistema de aliases (no existe hoy) y UI de carga asistida de facturas |
| Como manejar nombres informales? | Tabla de aliases + UI de confirmacion. El matching actual es por interseccion de palabras y no alcanza |
| Funcionan "traer", "falta", "no hay"? | SI, el Cuaderno ya reconoce las acciones. Lo que falta es vincular el nombre informal del producto con el producto real |
| Que mas hay que afinar? | Carga inicial de datos, umbrales de alertas, reglas de negocio implicitas, configuracion de notificaciones, POS y cuentas corrientes |
