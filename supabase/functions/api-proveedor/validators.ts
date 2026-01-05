import { sanitizeSearchInput } from './utils/params.ts';

export type PreciosParams = {
    categoria: string;
    limite: number;
    offset: number;
    activo: string;
};

export function validatePreciosParams(url: URL): PreciosParams {
    const categoria = url.searchParams.get('categoria') || 'todos';
    const limite = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 500);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);
    const activo = url.searchParams.get('activo') || 'true';

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
    const limite = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1000);
    const soloConStock = url.searchParams.get('solo_con_stock') === 'true';
    const ordenarPor = url.searchParams.get('ordenar_por') || 'nombre_asc';

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
    const minDiferencia = Math.max(parseFloat(url.searchParams.get('min_diferencia') || '0') || 0, 0);
    const limite = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 500);
    const orden = url.searchParams.get('orden') || 'diferencia_absoluta_desc';
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
    const priority = url.searchParams.get('priority') || 'normal';

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
    const severidad = url.searchParams.get('severidad') || 'todos';
    const tipo = url.searchParams.get('tipo') || 'todos';
    const limite = Math.min(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 100);
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
    const granularidad = url.searchParams.get('granularidad') || 'dia';
    const incluirPredicciones = url.searchParams.get('incluir_predicciones') === 'true';

    return { dias, categoria, granularidad, incluirPredicciones };
}
