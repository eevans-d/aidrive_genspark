export function formatTiempoTranscurrido(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffMinutes > 0) return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    return 'hace unos segundos';
}

export function formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

export function getMemoryUsage(): { used: number; total: number; limit: number } {
    const mem = (globalThis as any).performance?.memory;
    return mem ? {
        used: Math.round(mem.usedJSHeapSize / 1024 / 1024),
        total: Math.round(mem.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(mem.jsHeapSizeLimit / 1024 / 1024)
    } : { used: 0, total: 0, limit: 0 };
}

export function formatPrecio(precio: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(precio);
}

export function generateSlug(text: string): string {
    return text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

export function generateSearchTags(nombre: string, marca: string): string[] {
    const tags: string[] = [];
    if (nombre) tags.push(...nombre.toLowerCase().split(' ').slice(0, 5));
    if (marca) tags.push(marca.toLowerCase());
    return [...new Set(tags)].slice(0, 10);
}

export function calculateCompetitivenessScore(producto: any): number {
    const hasStock = producto.stock_disponible > 0 ? 1 : 0;
    const priceReasonableness = producto.precio_actual > 0 ? 1 : 0;
    const hasInfo = producto.nombre && producto.marca ? 1 : 0;
    return Math.round((hasStock + priceReasonableness + hasInfo) / 3 * 100);
}

export function calculateRelevanceScore(productos: any[], searchTerm: string): number {
    if (!searchTerm) return 100;

    let totalScore = 0;
    productos.forEach(producto => {
        const nameMatch = producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0;
        const brandMatch = producto.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0;
        totalScore += (nameMatch + brandMatch) / 2;
    });

    return productos.length > 0 ? Math.round((totalScore / productos.length) * 100) : 0;
}
