/**
 * Dashboard KPIs Manager
 * =======================
 * Gestiona el dashboard de KPIs con actualización automática cada 30 segundos
 * - Obtiene datos del backend
 * - Actualiza valores en tarjetas
 * - Grafica tendencias con Chart.js
 * - Calcula trends (arriba/abajo/estable)
 */

class DashboardKPIsManager {
    constructor() {
        this.refreshInterval = 30000; // 30 segundos
        this.refreshTimer = null;
        this.trendsChart = null;
        this.sparklineCharts = {};
        this.lastData = null;
        
        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    /**
     * Inicializar componentes
     */
    init() {
        console.log('[KPIs] Inicializando Dashboard KPIs Manager');
        
        // Cargar datos iniciales
        this.refreshKPIs();
        
        // Configurar auto-refresh
        this.setupAutoRefresh();
    }
    
    /**
     * Configurar auto-refresh
     */
    setupAutoRefresh() {
        // Refrescar cada 30 segundos
        this.refreshTimer = setInterval(() => {
            this.refreshKPIs();
        }, this.refreshInterval);
        
        console.log(`[KPIs] Auto-refresh configurado cada ${this.refreshInterval / 1000} segundos`);
    }
    
    /**
     * Detener auto-refresh
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    
    /**
     * Refrescar todos los KPIs
     */
    async refreshKPIs() {
        try {
            console.log('[KPIs] Refreshing KPIs...');
            
            // Obtener datos del backend
            const kpis = await this.fetchKPIs();
            
            if (!kpis) {
                console.warn('[KPIs] No se obtuvieron KPIs');
                return;
            }
            
            // Actualizar tarjetas
            this.updateKPICards(kpis);
            
            // Actualizar gráficos
            await this.updateCharts(kpis);
            
            // Guardar datos para comparación
            this.lastData = kpis;
            
            // Actualizar timestamp
            this.updateLastUpdateTime();
            
            console.log('[KPIs] Refresh completado');
            
        } catch (error) {
            console.error('[KPIs] Error refreshing:', error);
        }
    }
    
    /**
     * Obtener KPIs del backend
     */
    async fetchKPIs() {
        try {
            const response = await fetch('/api/kpis/dashboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.getAPIKey()
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('[KPIs] Data received:', data);
            return data;
            
        } catch (error) {
            console.error('[KPIs] Error fetching KPIs:', error);
            return null;
        }
    }
    
    /**
     * Actualizar tarjetas KPI
     */
    updateKPICards(kpis) {
        // KPI 1: Ventas
        if (kpis.sales) {
            document.getElementById('kpi-sales-value').textContent = 
                '$' + parseFloat(kpis.sales.value).toFixed(2);
            this.updateTrendIndicator('kpi-sales-trend', kpis.sales.trend);
        }
        
        // KPI 2: Stock Crítico
        if (kpis.critical_stock) {
            document.getElementById('kpi-stock-value').textContent = 
                kpis.critical_stock.value;
            this.updateTrendIndicator('kpi-stock-trend', kpis.critical_stock.trend);
            this.updateProgressBar('stock-progress-bar', kpis.critical_stock.percentage);
        }
        
        // KPI 3: Pedidos Pendientes
        if (kpis.pending_orders) {
            document.getElementById('kpi-orders-value').textContent = 
                kpis.pending_orders.value;
            this.updateTrendIndicator('kpi-orders-trend', kpis.pending_orders.trend);
            this.updateOrdersStatus(kpis.pending_orders.status);
        }
        
        // KPI 4: Alertas
        if (kpis.active_alerts) {
            document.getElementById('kpi-alerts-value').textContent = 
                kpis.active_alerts.value;
            this.updateTrendIndicator('kpi-alerts-trend', kpis.active_alerts.trend);
            this.updateAlertsList(kpis.active_alerts.alerts);
        }
    }
    
    /**
     * Actualizar indicador de trend
     */
    updateTrendIndicator(elementId, trend) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const arrow = element.querySelector('.trend-arrow');
        const value = element.querySelector('.trend-value');
        
        // Determinar dirección
        arrow.className = 'trend-arrow';
        arrow.textContent = '→';
        
        if (trend.direction === 'up') {
            arrow.classList.add('up');
            arrow.textContent = '↗';
        } else if (trend.direction === 'down') {
            arrow.classList.add('down');
            arrow.textContent = '↘';
        } else {
            arrow.classList.add('stable');
        }
        
        // Actualizar valor
        if (value) {
            value.textContent = trend.value;
        }
    }
    
    /**
     * Actualizar progress bar
     */
    updateProgressBar(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.width = Math.min(percentage, 100) + '%';
            
            // Cambiar color según porcentaje
            if (percentage > 80) {
                element.className = 'progress-bar alert';
            } else if (percentage > 50) {
                element.className = 'progress-bar warning';
            } else {
                element.className = 'progress-bar';
            }
        }
    }
    
    /**
     * Actualizar estado de pedidos
     */
    updateOrdersStatus(status) {
        const badge = document.getElementById('orders-status');
        if (badge) {
            badge.className = 'status-badge status-' + status;
            const statusLabel = {
                'pending': 'En revisión',
                'processing': 'Procesando',
                'ok': 'Al día'
            };
            badge.textContent = statusLabel[status] || status;
        }
    }
    
    /**
     * Actualizar lista de alertas
     */
    updateAlertsList(alerts) {
        const list = document.getElementById('kpi-alert-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        if (!alerts || alerts.length === 0) {
            list.innerHTML = '<div class="alert-item" style="color: #10b981;">✓ Sin alertas</div>';
            return;
        }
        
        alerts.forEach(alert => {
            const item = document.createElement('div');
            item.className = 'alert-item';
            item.textContent = alert;
            list.appendChild(item);
        });
    }
    
    /**
     * Actualizar gráficos de tendencias
     */
    async updateCharts(kpis) {
        // Destruir gráfico anterior si existe
        if (this.trendsChart) {
            this.trendsChart.destroy();
        }
        
        // Preparar datos para tendencias
        const trendsData = kpis.weekly_trends || {
            days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab', 'Dom'],
            sales: [0, 0, 0, 0, 0, 0, 0],
            critical_stock: [0, 0, 0, 0, 0, 0, 0],
            orders: [0, 0, 0, 0, 0, 0, 0]
        };
        
        // Crear gráfico de línea
        const ctx = document.getElementById('kpis-trend-chart');
        if (ctx) {
            this.trendsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trendsData.days,
                    datasets: [
                        {
                            label: 'Ventas',
                            data: trendsData.sales,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 4,
                            pointBackgroundColor: '#10b981',
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Stock Crítico',
                            data: trendsData.critical_stock,
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: false,
                            pointRadius: 4,
                            pointBackgroundColor: '#f59e0b',
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Pedidos',
                            data: trendsData.orders,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: false,
                            pointRadius: 4,
                            pointBackgroundColor: '#3b82f6',
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            cornerRadius: 6,
                            titleFont: {
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 12
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                font: {
                                    size: 11,
                                    color: '#6b7280'
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 11,
                                    color: '#6b7280'
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Actualizar timestamp de última actualización
     */
    updateLastUpdateTime() {
        const timeElement = document.getElementById('last-update-time');
        if (timeElement) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            timeElement.textContent = timeStr;
        }
    }
    
    /**
     * Obtener API Key
     */
    getAPIKey() {
        return localStorage.getItem('api_key') || 
               document.querySelector('meta[name="x-api-key"]')?.content || 
               'dev';
    }
}

// ============================================
// Funciones Globales
// ============================================

let dashboardKPIsManager = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    dashboardKPIsManager = new DashboardKPIsManager();
});

/**
 * Refrescar KPIs manualmente
 */
function refreshDashboardKPIs() {
    if (dashboardKPIsManager) {
        dashboardKPIsManager.refreshKPIs();
    }
}

/**
 * Obtener datos KPIs actuales
 */
function getDashboardKPIs() {
    return dashboardKPIsManager?.lastData || null;
}

/**
 * Cambiar intervalo de auto-refresh
 */
function setKPIsRefreshInterval(milliseconds) {
    if (dashboardKPIsManager) {
        dashboardKPIsManager.refreshInterval = milliseconds;
        dashboardKPIsManager.stopAutoRefresh();
        dashboardKPIsManager.setupAutoRefresh();
        console.log(`[KPIs] Intervalo actualizado a ${milliseconds / 1000} segundos`);
    }
}

/**
 * Detener auto-refresh
 */
function stopKPIsAutoRefresh() {
    if (dashboardKPIsManager) {
        dashboardKPIsManager.stopAutoRefresh();
    }
}

/**
 * Resumir auto-refresh
 */
function resumeKPIsAutoRefresh() {
    if (dashboardKPIsManager) {
        dashboardKPIsManager.setupAutoRefresh();
    }
}
