import { sanitizeSearchInput } from './utils/params.ts';
import {
    PRODUCT_ORDER_FIELDS,
    COMPARACION_ORDER_FIELDS,
    SINCRONIZACION_PRIORIDADES,
    ALERTA_SEVERIDADES,
    ALERTA_TIPOS,
    ESTADISTICAS_GRANULARIDADES
} from './utils/constants.ts';

export type PreciosParams = {
    categoria: string;
    limite: number;
    offset: number;
    activo: string;
};

export function validatePreciosParams(url: URL): PreciosParams {
    const categoria = sanitizeSearchInput(url.searchParams.get('categoria') || 'todos');
    const limiteRaw = parseInt(url.searchParams.get('limit') || '50', 10);
    const limite = Number.isNaN(limiteRaw) ? 50 : Math.min(Math.max(limiteRaw, 1), 500);
    const offsetRaw = parseInt(url.searchParams.get('offset') || '0', 10);
    const offset = Number.isNaN(offsetRaw) ? 0 : Math.max(offsetRaw, 0);
    const activoRaw = url.searchParams.get('activo') || 'true';
    const activo = ['true', 'false'].includes(activoRaw) ? activoRaw : 'true';

    return { categoria, limite, offset, activo };
}

export type ProductosParams = {
    busqueda: string;
    categoria: string;
    marca: string;
    limite: number;
    soloConStock: boolean;
    ordenarPor: string;
};

export function validateProductosParams(url: URL): ProductosParams {
    const busqueda = sanitizeSearchInput(url.searchParams.get('busqueda') || '');
    const categoria = sanitizeSearchInput(url.searchParams.get('categoria') || 'todos');
    const marca = sanitizeSearchInput(url.searchParams.get('marca') || '');
    const limiteRaw = parseInt(url.searchParams.get('limit') || '100', 10);
    const limite = Number.isNaN(limiteRaw) ? 100 : Math.min(Math.max(limiteRaw, 1), 1000);
    const soloConStock = url.searchParams.get('solo_con_stock') === 'true';
    const ordenarPorRaw = url.searchParams.get('ordenar_por') || 'nombre_asc';
    const ordenarPor = PRODUCT_ORDER_FIELDS.includes(ordenarPorRaw as any) ? ordenarPorRaw : 'nombre_asc';

    return { busqueda, categoria, marca, limite, soloConStock, ordenarPor };
}

export type ComparacionParams = {
    soloOportunidades: boolean;
    minDiferencia: number;
    limite: number;
    orden: string;
    incluirAnalisis: boolean;
};

export function validateComparacionParams(url: URL): ComparacionParams {
    const soloOportunidades = url.searchParams.get('solo_oportunidades') === 'true';
    const minDifRaw = parseFloat(url.searchParams.get('min_diferencia') || '0');
    const minDiferencia = Number.isNaN(minDifRaw) ? 0 : Math.max(minDifRaw, 0);
    const limiteRaw = parseInt(url.searchParams.get('limit') || '50', 10);
    const limite = Number.isNaN(limiteRaw) ? 50 : Math.min(Math.max(limiteRaw, 1), 500);
    const ordenRaw = url.searchParams.get('orden') || 'diferencia_absoluta_desc';
    const orden = COMPARACION_ORDER_FIELDS.includes(ordenRaw as any) ? ordenRaw : 'diferencia_absoluta_desc';
    const incluirAnalisis = url.searchParams.get('incluir_analisis') === 'true';

    return { soloOportunidades, minDiferencia, limite, orden, incluirAnalisis };
}

export type SincronizacionParams = {
    categoria: string;
    forceFull: boolean;
    priority: string;
};

export function validateSincronizacionParams(url: URL): SincronizacionParams {
    const categoria = sanitizeSearchInput(url.searchParams.get('categoria') || 'todos');
    const forceFull = url.searchParams.get('force_full') === 'true';
    const priorityRaw = url.searchParams.get('priority') || 'normal';
    const priority = SINCRONIZACION_PRIORIDADES.includes(priorityRaw as any) ? priorityRaw : 'normal';

    return { categoria, forceFull, priority };
}

export type AlertasParams = {
    severidad: string;
    tipo: string;
    limite: number;
    soloNoProcesadas: boolean;
    incluirAnalisis: boolean;
};

export function validateAlertasParams(url: URL): AlertasParams {
    const severidadRaw = url.searchParams.get('severidad') || 'todos';
    const severidad = ALERTA_SEVERIDADES.includes(severidadRaw as any) ? severidadRaw : 'todos';
    const tipoRaw = url.searchParams.get('tipo') || 'todos';
    const tipo = ALERTA_TIPOS.includes(tipoRaw as any) ? tipoRaw : 'todos';
    const limiteRaw = parseInt(url.searchParams.get('limit') || '20', 10);
    const limite = Number.isNaN(limiteRaw) ? 20 : Math.min(Math.max(limiteRaw, 1), 100);
    const soloNoProcesadas = url.searchParams.get('solo_no_procesadas') !== 'false';
    const incluirAnalisis = url.searchParams.get('incluir_analisis') === 'true';

    return { severidad, tipo, limite, soloNoProcesadas, incluirAnalisis };
}

export type EstadisticasParams = {
    dias: number;
    categoria: string;
    granularidad: string;
    incluirPredicciones: boolean;
};

export function validateEstadisticasParams(url: URL): EstadisticasParams {
    const diasRaw = parseInt(url.searchParams.get('dias') || '7', 10);
    const dias = Math.min(Math.max(Number.isNaN(diasRaw) ? 7 : diasRaw, 1), 90);
    const categoria = sanitizeSearchInput(url.searchParams.get('categoria') || '');
    const granularidadRaw = url.searchParams.get('granularidad') || 'dia';
    const granularidad = ESTADISTICAS_GRANULARIDADES.includes(granularidadRaw as any) ? granularidadRaw : 'dia';
    const incluirPredicciones = url.searchParams.get('incluir_predicciones') === 'true';

    return { dias, categoria, granularidad, incluirPredicciones };
}
