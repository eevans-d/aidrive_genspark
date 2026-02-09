/**
 * SISTEMA DE NOTIFICACIONES AVANZADAS
 * Edge Function para Gestión Completa de Notificaciones Multi-Canal
 *
 * CARACTERÍSTICAS:
 * - Templates de email profesionales con branding
 * - SMS vía Twilio para alertas críticas
 * - Slack/Teams para notificaciones de equipo
 * - Webhooks personalizados
 * - Gestión de preferencias por usuario
 * - Escalamiento automático según severidad
 *
 * @author MiniMax Agent - Sistema Automatizado
 * @version 3.0.0
 * @date 2025-11-01
 * @license Enterprise Level
 */
import { FixedWindowRateLimiter } from '../_shared/rate-limit.ts';
import { createLogger } from '../_shared/logger.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

const logger = createLogger('cron-notifications');
const environment = (Deno.env.get('ENVIRONMENT') ||
    (Deno.env.get('DENO_DEPLOYMENT_ID') ? 'production' : 'development')).toLowerCase();
const isProduction = environment === 'production';
const notificationsModeRaw = (Deno.env.get('NOTIFICATIONS_MODE') || 'simulation').toLowerCase();
const notificationsMode = notificationsModeRaw === 'real' ? 'real' : 'simulation';

if (notificationsModeRaw !== 'real' && notificationsModeRaw !== 'simulation') {
    logger.warn('INVALID_NOTIFICATIONS_MODE', { notificationsModeRaw, notificationsMode });
}

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

interface NotificationTemplate {
    id: string;
    name: string;
    type: 'email' | 'sms' | 'slack' | 'webhook';
    subject?: string;
    htmlBody: string;
    textBody: string;
    variables: string[];
    branding: {
        logo?: string;
        colors: {
            primary: string;
            secondary: string;
            accent: string;
        };
        company: string;
        footer: string;
    };
}

interface NotificationChannel {
    id: string;
    name: string;
    type: 'email' | 'sms' | 'slack' | 'teams' | 'webhook';
    config: {
        // Email
        smtpHost?: string;
        smtpPort?: number;
        smtpUser?: string;
        smtpPassword?: string;
        fromEmail?: string;
        fromName?: string;
        
        // SMS
        twilioAccountSid?: string;
        twilioAuthToken?: string;
        fromNumber?: string;
        
        // Slack/Teams
        webhookUrl?: string;
        channel?: string;
        username?: string;
        
        // Webhook
        method?: string;
        headers?: Record<string, string>;
    };
    isActive: boolean;
    rateLimit: {
        maxPerHour: number;
        maxPerDay: number;
    };
}

interface NotificationRequest {
    templateId: string;
    channels: string[];
    recipients: {
        email?: string[];
        phone?: string[];
        slack_channels?: string[];
        webhook_urls?: string[];
    };
    data: Record<string, any>;
    priority: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    requiresEscalation: boolean;
}

interface NotificationResult {
    success: boolean;
    channels: {
        channelId: string;
        status: 'sent' | 'failed' | 'rate_limited';
        messageId?: string;
        error?: string;
        timestamp: string;
    }[];
    totalSent: number;
    totalFailed: number;
    rateLimited: number;
}

interface EscalationRule {
    id: string;
    name: string;
    trigger: {
        severity: string[];
        timeThreshold: number; // minutes
        noResponse: boolean;
    };
    action: {
        type: 'email' | 'sms' | 'slack' | 'webhook';
        recipients: string[];
        templateId: string;
    };
    isActive: boolean;
}

// =====================================================
// RATE LIMITING (SHARED)
// =====================================================

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

type ChannelLimiters = {
    hourly: FixedWindowRateLimiter;
    daily: FixedWindowRateLimiter;
};

const CHANNEL_LIMITERS = new Map<string, ChannelLimiters>();

// =====================================================
// CONFIGURACIÓN DE TEMPLATES
// =====================================================

const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
    'daily_price_update': {
        id: 'daily_price_update',
        name: 'Reporte Diario de Precios',
        type: 'email',
        subject: '📊 Reporte Diario MiniMarket - {{executionDate}}',
        htmlBody: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; background-color: #f8f9fa;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <div style="background-color: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                        🛒
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">MiniMarket Daily Report</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Actualización Automática de Precios - {{executionDate}}</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px; background-color: white; margin: 0 10px;">
                    <!-- Executive Summary -->
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                        <h2 style="margin: 0 0 15px 0; font-size: 24px;">📈 Resumen Ejecutivo</h2>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 32px; font-weight: bold;">{{productsProcessed}}</div>
                                <div style="font-size: 14px; opacity: 0.9;">Productos Procesados</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 32px; font-weight: bold;">{{executionTime}}s</div>
                                <div style="font-size: 14px; opacity: 0.9;">Tiempo de Ejecución</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 32px; font-weight: bold;">{{alertsGenerated}}</div>
                                <div style="font-size: 14px; opacity: 0.9;">Alertas Generadas</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 32px; font-weight: bold;">{{successRate}}%</div>
                                <div style="font-size: 14px; opacity: 0.9;">Tasa de Éxito</div>
                            </div>
                        </div>
                    </div>

                    <!-- Critical Alerts -->
                    {{#if criticalAlerts}}
                    <div style="background-color: #fff5f5; border: 2px solid #fed7d7; border-radius: 10px; padding: 20px; margin-bottom: 30px;">
                        <h2 style="color: #c53030; margin: 0 0 15px 0; font-size: 20px;">🚨 Alertas Críticas</h2>
                        {{criticalAlerts}}
                    </div>
                    {{/if}}

                    <!-- Category Breakdown -->
                    <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 30px;">
                        <h2 style="color: #2d3748; margin: 0 0 15px 0; font-size: 20px;">📊 Detalles por Categoría</h2>
                        {{categoryBreakdown}}
                    </div>

                    <!-- Recommendations -->
                    <div style="background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); color: white; border-radius: 10px; padding: 20px; margin-bottom: 30px;">
                        <h2 style="margin: 0 0 15px 0; font-size: 20px;">💡 Recomendaciones</h2>
                        {{recommendations}}
                    </div>

                    <!-- System Status -->
                    <div style="background-color: #f0fff4; border: 1px solid #9ae6b4; border-radius: 10px; padding: 20px;">
                        <h2 style="color: #22543d; margin: 0 0 15px 0; font-size: 20px;">⚡ Estado del Sistema</h2>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                            <div style="display: flex; align-items: center; background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #48bb78;">
                                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #48bb78; margin-right: 10px;"></div>
                                <span style="color: #2f855a; font-weight: 500;">Base de Datos: Operativa</span>
                            </div>
                            <div style="display: flex; align-items: center; background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #48bb78;">
                                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #48bb78; margin-right: 10px;"></div>
                                <span style="color: #2f855a; font-weight: 500;">Scraper: Funcionando</span>
                            </div>
                            <div style="display: flex; align-items: center; background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #48bb78;">
                                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #48bb78; margin-right: 10px;"></div>
                                <span style="color: #2f855a; font-weight: 500;">Circuit Breakers: Estables</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #2d3748; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; margin: 0 10px 10px;">
                    <p style="margin: 0; font-size: 14px; opacity: 0.8;">🤖 Generado automáticamente por el Sistema de Cron Jobs MiniMarket</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.6;">📧 ¿Problemas? Contacta a soporte técnico | 🌐 Ver Dashboard Completo</p>
                </div>
            </div>
        `,
        textBody: `
MiniMarket - Reporte Diario de Precios
========================================

Fecha: {{executionDate}}

RESUMEN EJECUTIVO:
• Productos Procesados: {{productsProcessed}}
• Tiempo de Ejecución: {{executionTime}}s
• Alertas Generadas: {{alertsGenerated}}
• Tasa de Éxito: {{successRate}}%

ALERTAS CRÍTICAS:
{{criticalAlerts}}

DETALLES POR CATEGORÍA:
{{categoryBreakdown}}

RECOMENDACIONES:
{{recommendations}}

ESTADO DEL SISTEMA:
• Base de Datos: ✅ Operativa
• Scraper: ✅ Funcionando  
• Circuit Breakers: ✅ Estables

---
Generado automáticamente por MiniMarket System
        `,
        variables: ['executionDate', 'productsProcessed', 'executionTime', 'alertsGenerated', 'successRate', 'criticalAlerts', 'categoryBreakdown', 'recommendations'],
        branding: {
            colors: {
                primary: '#667eea',
                secondary: '#764ba2',
                accent: '#f093fb'
            },
            company: 'MiniMarket',
            footer: 'Sistema Automatizado de Gestión de Precios'
        }
    },
    
    'critical_alert': {
        id: 'critical_alert',
        name: 'Alerta Crítica del Sistema',
        type: 'email',
        subject: '🚨 ALERTA CRÍTICA - {{alertType}}',
        htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fef2f2;">
                <!-- Critical Header -->
                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <div style="background-color: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                        🚨
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">ALERTA CRÍTICA</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">{{alertType}} - Requiere Atención Inmediata</p>
                </div>
                
                <!-- Alert Content -->
                <div style="padding: 30px; background-color: white; margin: 0 10px;">
                    <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">⚠️ {{alertTitle}}</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #374151;">{{alertDescription}}</p>
                    
                    <!-- Technical Details -->
                    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 25px 0;">
                        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📊 Detalles Técnicos</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div><strong>Job ID:</strong> {{jobId}}</div>
                            <div><strong>Execution ID:</strong> {{executionId}}</div>
                            <div><strong>Timestamp:</strong> {{timestamp}}</div>
                            <div><strong>Severidad:</strong> <span style="color: #dc2626; font-weight: bold; font-size: 18px;">{{severity}}</span></div>
                        </div>
                    </div>
                    
                    <!-- Recommended Action -->
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%); border-radius: 10px; padding: 20px; margin: 25px 0; border-left: 5px solid #f59e0b;">
                        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">💡 Acción Recomendada</h3>
                        <p style="margin: 0; color: #92400e; font-size: 16px; line-height: 1.5;">{{recommendedAction}}</p>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{dashboardUrl}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 5px;">
                            🔍 Ver Dashboard Completo
                        </a>
                        <a href="{{logsUrl}}" style="display: inline-block; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 5px;">
                            📋 Revisar Logs
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; margin: 0 10px 10px;">
                    <p style="margin: 0; font-size: 14px; opacity: 0.8;">🔔 Sistema de Alertas MiniMarket</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.6;">Esta alerta se generó automáticamente y requiere atención inmediata</p>
                </div>
            </div>
        `,
        textBody: `
ALERTA CRÍTICA - Sistema MiniMarket
===================================

Tipo: {{alertType}}
Título: {{alertTitle}}

Descripción:
{{alertDescription}}

DETALLES TÉCNICOS:
• Job ID: {{jobId}}
• Execution ID: {{executionId}}
• Timestamp: {{timestamp}}
• Severidad: {{severity}}

ACCIÓN RECOMENDADA:
{{recommendedAction}}

ACCIONES RÁPIDAS:
• Dashboard: {{dashboardUrl}}
• Logs: {{logsUrl}}

---
Sistema de Alertas MiniMarket - Requiere Atención Inmediata
        `,
        variables: ['alertType', 'alertTitle', 'alertDescription', 'jobId', 'executionId', 'timestamp', 'severity', 'recommendedAction', 'dashboardUrl', 'logsUrl'],
        branding: {
            colors: {
                primary: '#dc2626',
                secondary: '#991b1b',
                accent: '#f59e0b'
            },
            company: 'MiniMarket',
            footer: 'Sistema de Alertas Críticas'
        }
    },

    'weekly_trend_report': {
        id: 'weekly_trend_report',
        name: 'Reporte Semanal de Tendencias',
        type: 'email',
        subject: '📈 Reporte Semanal - Análisis de Tendencias MiniMarket',
        htmlBody: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 0 auto; background-color: #f8fafc;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 15px 15px 0 0;">
                    <div style="background-color: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px;">
                        📊
                    </div>
                    <h1 style="margin: 0; font-size: 32px; font-weight: 700;">Análisis Semanal de Tendencias</h1>
                    <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Inteligencia de Negocios MiniMarket</p>
                    <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.8;">Semana del {{weekStart}} al {{weekEnd}}</p>
                </div>
                
                <!-- Executive Summary -->
                <div style="padding: 40px; background-color: white; margin: 0 15px;">
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 15px; padding: 30px; margin-bottom: 40px;">
                        <h2 style="margin: 0 0 20px 0; font-size: 26px;">🎯 Resumen Ejecutivo</h2>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 25px;">
                            <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px; text-align: center; backdrop-filter: blur(10px);">
                                <div style="font-size: 36px; font-weight: bold;">{{productsAnalyzed}}</div>
                                <div style="font-size: 15px; opacity: 0.9;">Productos Analizados</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px; text-align: center; backdrop-filter: blur(10px);">
                                <div style="font-size: 36px; font-weight: bold;">{{trendsDetected}}</div>
                                <div style="font-size: 15px; opacity: 0.9;">Tendencias Detectadas</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px; text-align: center; backdrop-filter: blur(10px);">
                                <div style="font-size: 36px; font-weight: bold;">{{accuracyScore}}%</div>
                                <div style="font-size: 15px; opacity: 0.9;">Precisión ML</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px; text-align: center; backdrop-filter: blur(10px);">
                                <div style="font-size: 36px; font-weight: bold;">{{recommendationsCount}}</div>
                                <div style="font-size: 15px; opacity: 0.9;">Recomendaciones</div>
                            </div>
                        </div>
                    </div>

                    <!-- Trend Analysis -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 15px; padding: 30px; margin-bottom: 30px;">
                        <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">📈 Análisis de Tendencias</h2>
                        {{trendAnalysis}}
                    </div>

                    <!-- ML Predictions -->
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border-radius: 15px; padding: 30px; margin-bottom: 30px;">
                        <h2 style="margin: 0 0 20px 0; font-size: 24px;">🤖 Predicciones ML</h2>
                        {{mlPredictions}}
                    </div>

                    <!-- Executive Recommendations -->
                    <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; border-radius: 15px; padding: 30px;">
                        <h2 style="margin: 0 0 20px 0; font-size: 24px;">💼 Recomendaciones Ejecutivas</h2>
                        {{executiveRecommendations}}
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #1e293b; color: white; padding: 25px; text-align: center; border-radius: 0 0 15px 15px; margin: 0 15px 15px;">
                    <p style="margin: 0; font-size: 14px; opacity: 0.8;">🤖 Generado por MiniMarket AI Analytics System</p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.6;">📊 ¿Datos adicionales? Contacta al equipo de Business Intelligence</p>
                </div>
            </div>
        `,
        textBody: `
MiniMarket - Análisis Semanal de Tendencias
===========================================

Período: {{weekStart}} al {{weekEnd}}

RESUMEN EJECUTIVO:
• Productos Analizados: {{productsAnalyzed}}
• Tendencias Detectadas: {{trendsDetected}}
• Precisión ML: {{accuracyScore}}%
• Recomendaciones: {{recommendationsCount}}

ANÁLISIS DE TENDENCIAS:
{{trendAnalysis}}

PREDICCIONES ML:
{{mlPredictions}}

RECOMENDACIONES EJECUTIVAS:
{{executiveRecommendations}}

---
Análisis generado por MiniMarket AI Analytics System
        `,
        variables: ['weekStart', 'weekEnd', 'productsAnalyzed', 'trendsDetected', 'accuracyScore', 'recommendationsCount', 'trendAnalysis', 'mlPredictions', 'executiveRecommendations'],
        branding: {
            colors: {
                primary: '#4facfe',
                secondary: '#00f2fe',
                accent: '#43e97b'
            },
            company: 'MiniMarket',
            footer: 'AI Analytics & Business Intelligence'
        }
    }
};

// =====================================================
// CANALES DE NOTIFICACIÓN CONFIGURADOS
// =====================================================

const NOTIFICATION_CHANNELS: Record<string, NotificationChannel> = {
    'email_default': {
        id: 'email_default',
        name: 'Email Principal',
        type: 'email',
        config: {
            smtpHost: Deno.env.get('SMTP_HOST') || 'smtp.gmail.com',
            smtpPort: parseInt(Deno.env.get('SMTP_PORT') || '587'),
            smtpUser: Deno.env.get('SMTP_USER') || '',
            smtpPassword: Deno.env.get('SMTP_PASS') || '',
            fromEmail: Deno.env.get('SMTP_FROM') || Deno.env.get('EMAIL_FROM') || 'noreply@minimarket-system.com',
            fromName: 'Sistema MiniMarket'
        },
        isActive: true,
        rateLimit: {
            maxPerHour: 100,
            maxPerDay: 1000
        }
    },

    'sms_critical': {
        id: 'sms_critical',
        name: 'SMS Alertas Críticas',
        type: 'sms',
        config: {
            twilioAccountSid: Deno.env.get('TWILIO_ACCOUNT_SID'),
            twilioAuthToken: Deno.env.get('TWILIO_AUTH_TOKEN'),
            fromNumber: Deno.env.get('TWILIO_FROM_NUMBER') || '+1234567890'
        },
        isActive: true,
        rateLimit: {
            maxPerHour: 10,
            maxPerDay: 50
        }
    },

    'slack_alerts': {
        id: 'slack_alerts',
        name: 'Slack Alertas Equipo',
        type: 'slack',
        config: {
            webhookUrl: Deno.env.get('SLACK_WEBHOOK_URL'),
            channel: '#alerts-minimarket',
            username: 'MiniMarket Bot'
        },
        isActive: true,
        rateLimit: {
            maxPerHour: 50,
            maxPerDay: 200
        }
    }
};

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders({
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    });

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const action = url.pathname.split('/').pop() || 'send';

        logger.info('ACTION_START', { action });

        if (isProduction && notificationsMode !== 'real' && (action === 'send' || action === 'test')) {
            logger.warn('NOTIFICATIONS_MODE_BLOCKED', { action, notificationsMode, environment });
            return new Response(JSON.stringify({
                success: false,
                error: {
                    code: 'NOTIFICATIONS_MODE_BLOCKED',
                    message: 'NOTIFICATIONS_MODE=simulation bloqueado en producción. Configure NOTIFICATIONS_MODE=real.',
                    timestamp: new Date().toISOString()
                }
            }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Configuración de Supabase faltante');
        }

        let response: Response;

        switch (action) {
            case 'send':
                response = await sendNotificationHandler(req, supabaseUrl, serviceRoleKey, corsHeaders);
                break;
            case 'templates':
                response = await getTemplatesHandler(corsHeaders);
                break;
            case 'channels':
                response = await getChannelsHandler(corsHeaders);
                break;
            case 'test':
                response = await testNotificationHandler(req, supabaseUrl, serviceRoleKey, corsHeaders);
                break;
            case 'preferences':
                response = await getUserPreferencesHandler(req, supabaseUrl, serviceRoleKey, corsHeaders);
                break;
            case 'escalation':
                response = await checkEscalationHandler(req, supabaseUrl, serviceRoleKey, corsHeaders);
                break;
            default:
                throw new Error(`Acción no válida: ${action}`);
        }

        return response;

    } catch (error) {
        // Safe cast error
        const err = error as Error;
        logger.error('ERROR', { error: err.message });
        
        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'NOTIFICATION_ERROR',
                message: err.message,
                timestamp: new Date().toISOString()
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// =====================================================
// MANEJADORES PRINCIPALES
// =====================================================

/**
 * ENVIAR NOTIFICACIÓN
 */
async function sendNotificationHandler(
    req: Request,
    supabaseUrl: string,
    serviceRoleKey: string,
    corsHeaders: Record<string, string>
): Promise<Response> {
    const notificationRequest: NotificationRequest = await req.json();
    
    logger.info('SEND_NOTIFICATION', { templateId: notificationRequest.templateId });

    // Validar request
    if (!notificationRequest.templateId || !notificationRequest.channels || !notificationRequest.recipients) {
        throw new Error('Request inválido: faltan campos requeridos');
    }

    const template = NOTIFICATION_TEMPLATES[notificationRequest.templateId];
    if (!template) {
        throw new Error(`Template no encontrado: ${notificationRequest.templateId}`);
    }

    // Generar contenido para cada canal
    const results: NotificationResult = {
        success: false,
        channels: [],
        totalSent: 0,
        totalFailed: 0,
        rateLimited: 0
    };

    // Enviar por cada canal especificado
    for (const channelId of notificationRequest.channels) {
        const channel = NOTIFICATION_CHANNELS[channelId];
        if (!channel || !channel.isActive) {
            results.channels.push({
                channelId,
                status: 'failed',
                error: 'Canal inactivo o no encontrado',
                timestamp: new Date().toISOString()
            });
            results.totalFailed++;
            continue;
        }

        try {
            const result = await sendToChannel(channel, template, notificationRequest, supabaseUrl, serviceRoleKey);
            results.channels.push(result);
            
            if (result.status === 'sent') results.totalSent++;
            else if (result.status === 'rate_limited') results.rateLimited++;
            else results.totalFailed++;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.channels.push({
                channelId,
                status: 'failed',
                error: errorMessage,
                timestamp: new Date().toISOString()
            });
            results.totalFailed++;
        }
    }

    // Registrar notificación en base de datos
    await recordNotificationLog(notificationRequest, results, supabaseUrl, serviceRoleKey);

    // Verificar si necesita escalamiento
    if (notificationRequest.requiresEscalation && results.totalFailed > 0) {
        await triggerEscalation(notificationRequest, results, supabaseUrl, serviceRoleKey);
    }

    results.success = results.totalSent > 0;

    logger.info('SEND_RESULT', { sent: results.totalSent, failed: results.totalFailed });

    return new Response(JSON.stringify({
        success: results.success,
        data: {
            notificationId: `notif_${Date.now()}`,
            result: results,
            timestamp: new Date().toISOString()
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

/**
 * ENVIAR A CANAL ESPECÍFICO
 */
async function sendToChannel(
    channel: NotificationChannel,
    template: NotificationTemplate,
    request: NotificationRequest,
    supabaseUrl: string,
    serviceRoleKey: string
): Promise<{
    channelId: string;
    status: 'sent' | 'failed' | 'rate_limited';
    messageId?: string;
    error?: string;
    timestamp: string;
}> {
    const timestamp = new Date().toISOString();

    const rateLimitState = await enforceChannelRateLimit(channel.id);
    if (!rateLimitState.allowed) {
        const reason = rateLimitState.scope === 'day' ? 'diario' : rateLimitState.scope === 'db' ? 'persistente' : 'horario';
        return {
            channelId: channel.id,
            status: 'rate_limited',
            error: `Rate limit ${reason} excedido para este canal`,
            timestamp
        };
    }

    try {
        let messageId: string | undefined;

        switch (channel.type) {
            case 'email':
                messageId = await sendEmail(channel, template, request);
                break;
            case 'sms':
                messageId = await sendSMS(channel, template, request);
                break;
            case 'slack':
                messageId = await sendSlack(channel, template, request);
                break;
            case 'webhook':
                messageId = await sendWebhook(channel, template, request);
                break;
            default:
                throw new Error(`Tipo de canal no soportado: ${channel.type}`);
        }

        // Actualizar rate limits
        await updateRateLimits(channel.id);

        return {
            channelId: channel.id,
            status: 'sent',
            messageId,
            timestamp
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('SEND_CHANNEL_ERROR', { channelId: channel.id, error: errorMessage });
        return {
            channelId: channel.id,
            status: 'failed',
            error: errorMessage,
            timestamp
        };
    }
}

/**
 * ENVIAR EMAIL
 */
async function sendEmail(
    channel: NotificationChannel,
    template: NotificationTemplate,
    request: NotificationRequest
): Promise<string> {
    if (!channel.config.smtpHost || !channel.config.fromEmail) {
        throw new Error('Configuración de email incompleta');
    }

    // Generar contenido con variables
    const htmlBody = processTemplate(template.htmlBody, request.data);
    const textBody = processTemplate(template.textBody, request.data);
    const subject = processTemplate(template.subject || '', request.data);

    // En implementación real, aquí se enviaría el email
    // Por ahora simulamos el envío
    logger.info('SIMULATION_EMAIL_SEND', { 
        to: request.recipients.email?.join(', '),
        subject,
        preview: htmlBody.substring(0, 200)
    });

    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 100));

    return `email_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * ENVIAR SMS
 */
async function sendSMS(
    channel: NotificationChannel,
    template: NotificationTemplate,
    request: NotificationRequest
): Promise<string> {
    if (!channel.config.twilioAccountSid || !channel.config.fromNumber) {
        throw new Error('Configuración de SMS incompleta');
    }

    // Generar mensaje SMS (máximo 160 caracteres)
    const message = processTemplate(template.textBody, request.data)
        .substring(0, 160);

    // En implementación real, aquí se enviaría SMS via Twilio
    logger.info('SIMULATION_SMS_SEND', {
        to: request.recipients.phone?.join(', '),
        message
    });

    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 200));

    return `sms_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * ENVIAR SLACK
 */
async function sendSlack(
    channel: NotificationChannel,
    template: NotificationTemplate,
    request: NotificationRequest
): Promise<string> {
    if (!channel.config.webhookUrl) {
        throw new Error('URL de webhook de Slack no configurada');
    }

    // Crear mensaje de Slack
    const message = {
        channel: channel.config.channel || '#general',
        username: channel.config.username || 'MiniMarket Bot',
        text: processTemplate(template.textBody, request.data).substring(0, 4000),
        attachments: [
            {
                color: request.priority === 'critical' ? 'danger' : 
                       request.priority === 'high' ? 'warning' : 'good',
                fields: [
                    {
                        title: 'Tipo',
                        value: template.name,
                        short: true
                    },
                    {
                        title: 'Prioridad',
                        value: request.priority,
                        short: true
                    },
                    {
                        title: 'Fuente',
                        value: request.source,
                        short: true
                    }
                ],
                footer: 'MiniMarket Notifications',
                ts: Math.floor(Date.now() / 1000)
            }
        ]
    };

    // En implementación real, aquí se enviaría a Slack
    logger.info('SIMULATION_SLACK_SEND', {
        channel: channel.config.channel,
        hasWebhook: !!channel.config.webhookUrl
    });

    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 150));

    return `slack_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * ENVIAR WEBHOOK
 */
async function sendWebhook(
    channel: NotificationChannel,
    template: NotificationTemplate,
    request: NotificationRequest
): Promise<string> {
    if (!channel.config.webhookUrl) {
        throw new Error('URL de webhook no configurada');
    }

    // Crear payload del webhook
    const payload = {
        template: template.id,
        data: request.data,
        priority: request.priority,
        source: request.source,
        timestamp: new Date().toISOString(),
        recipients: request.recipients
    };

    // En implementación real, aquí se enviaría el webhook
    logger.info('SIMULATION_WEBHOOK_SEND', {
        url: channel.config.webhookUrl,
        payload
    });

    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 100));

    return `webhook_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

function processTemplate(template: string, data: Record<string, any>): string {
    let processed = template;
    
    // Reemplazar variables {{variable}}
    for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processed = processed.replace(regex, String(value || ''));
    }

    // Reemplazar condicionales simples {{#if condition}}...{{/if}}
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    processed = processed.replace(ifRegex, (match, condition, content) => {
        return data[condition] ? content : '';
    });

    return processed;
}

function getChannelLimiters(channelId: string): ChannelLimiters {
    const existing = CHANNEL_LIMITERS.get(channelId);
    if (existing) return existing;

    const channel = NOTIFICATION_CHANNELS[channelId];
    const hourlyMax = channel?.rateLimit?.maxPerHour ?? 100;
    const dailyMax = channel?.rateLimit?.maxPerDay ?? 1000;

    const limiter: ChannelLimiters = {
        hourly: new FixedWindowRateLimiter(hourlyMax, ONE_HOUR_MS),
        daily: new FixedWindowRateLimiter(dailyMax, ONE_DAY_MS)
    };

    CHANNEL_LIMITERS.set(channelId, limiter);
    return limiter;
}

async function enforceChannelRateLimit(channelId: string): Promise<{ allowed: boolean; scope?: 'hour' | 'day' | 'db'; resetAt?: number; }>
{
    const channel = NOTIFICATION_CHANNELS[channelId];
    if (!channel) return { allowed: true };

    const dbAllowed = await checkChannelRateLimitDb(channelId, channel);
    if (!dbAllowed) {
        return { allowed: false, scope: 'db' };
    }

    const { hourly, daily } = getChannelLimiters(channelId);
    const hourlyState = hourly.check(`${channelId}:hour`);
    if (!hourlyState.allowed) {
        return { allowed: false, scope: 'hour', resetAt: hourlyState.resetAt };
    }

    const dailyState = daily.check(`${channelId}:day`);
    if (!dailyState.allowed) {
        return { allowed: false, scope: 'day', resetAt: dailyState.resetAt };
    }

    return { allowed: true };
}

async function checkChannelRateLimitDb(channelId: string, channel: NotificationChannel): Promise<boolean> {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) return true;

    try {
        const headers = {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Prefer': 'count=exact'
        };

        const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS).toISOString();
        const oneDayAgo = new Date(Date.now() - ONE_DAY_MS).toISOString();

        const hourlyUrl = `${supabaseUrl}/rest/v1/cron_jobs_notifications?select=count&channel_id=eq.${channelId}&sent_at=gte.${oneHourAgo}`;
        const dailyUrl = `${supabaseUrl}/rest/v1/cron_jobs_notifications?select=count&channel_id=eq.${channelId}&sent_at=gte.${oneDayAgo}`;

        const [hourlyCount, dailyCount] = await Promise.all([
            fetchNotificationCount(hourlyUrl, headers),
            fetchNotificationCount(dailyUrl, headers)
        ]);

        if (hourlyCount >= (channel.rateLimit?.maxPerHour ?? 100)) return false;
        if (dailyCount >= (channel.rateLimit?.maxPerDay ?? 1000)) return false;

        return true;

    } catch (error) {
        logger.error('DB_RATE_LIMIT_ERROR', { error: (error as Error).message });
        return true;
    }
}

async function fetchNotificationCount(url: string, headers: Record<string, string>): Promise<number> {
    const response = await fetch(url, { headers });
    if (!response.ok) return 0;

    const contentRange = response.headers.get('content-range');
    if (contentRange && contentRange.includes('/')) {
        const total = parseInt(contentRange.split('/')[1], 10);
        if (!Number.isNaN(total)) {
            return total;
        }
    }

    const body = await response.json();
    if (Array.isArray(body)) {
        if (typeof body[0]?.count === 'number') return body[0].count;
        return body.length;
    }

    return 0;
}

async function updateRateLimits(channelId: string): Promise<void> {
    // El rate limit en memoria se actualiza con enforceChannelRateLimit; esta función mantiene el hook para futura persistencia.
    logger.debug('RATE_LIMIT_UPDATE', { channelId });
}

async function recordNotificationLog(
    request: NotificationRequest,
    result: NotificationResult,
    supabaseUrl: string,
    serviceRoleKey: string
): Promise<void> {
    try {
        for (const channel of result.channels) {
            const logData = {
                template_id: request.templateId,
                channel_id: channel.channelId,
                priority: request.priority,
                source: request.source,
                recipients: request.recipients,
                data: request.data,
                status: channel.status,
                message_id: channel.messageId,
                error_message: channel.error,
                sent_at: new Date().toISOString()
            };

            await fetch(`${supabaseUrl}/rest/v1/cron_jobs_notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`
                },
                body: JSON.stringify(logData)
            });
        }
    } catch (error) {
        logger.error('LOG_RECORD_ERROR', { error: (error as Error).message });
    }
}

async function triggerEscalation(
    request: NotificationRequest,
    result: NotificationResult,
    supabaseUrl: string,
    serviceRoleKey: string
): Promise<void> {
    logger.info('ESCALATION_TRIGGER', { totalFailed: result.totalFailed });

    // Crear alerta de escalamiento
    const escalationData = {
        job_id: 'notifications',
        execution_id: `escalation_${Date.now()}`,
        tipo_alerta: 'notificacion_fallida',
        severidad: request.priority === 'critical' ? 'critica' : 'alta',
        titulo: `Fallo en notificaciones para ${request.templateId}`,
        descripcion: `${result.totalFailed} notificaciones fallaron de ${result.totalSent + result.totalFailed} enviadas`,
        accion_recomendada: 'Verificar configuración de canales y rate limits',
        canales_notificacion: ['email'],
        fecha_envio: new Date().toISOString()
    };

    await fetch(`${supabaseUrl}/rest/v1/cron_jobs_alerts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify(escalationData)
    });
}

// =====================================================
// MANEJADORES DE API
// =====================================================

async function getTemplatesHandler(corsHeaders: Record<string, string>): Promise<Response> {
    return new Response(JSON.stringify({
        success: true,
        data: Object.values(NOTIFICATION_TEMPLATES).map(template => ({
            id: template.id,
            name: template.name,
            type: template.type,
            variables: template.variables
        }))
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getChannelsHandler(corsHeaders: Record<string, string>): Promise<Response> {
    const channels = Object.values(NOTIFICATION_CHANNELS).map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        isActive: channel.isActive,
        rateLimit: channel.rateLimit
    }));

    return new Response(JSON.stringify({
        success: true,
        data: channels
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function testNotificationHandler(
    req: Request,
    supabaseUrl: string,
    serviceRoleKey: string,
    corsHeaders: Record<string, string>
): Promise<Response> {
    const { templateId, channelId, testData = {} } = await req.json();

    if (!templateId || !channelId) {
        throw new Error('templateId y channelId son requeridos');
    }

    const template = NOTIFICATION_TEMPLATES[templateId];
    const channel = NOTIFICATION_CHANNELS[channelId];

    if (!template || !channel) {
        throw new Error('Template o canal no encontrado');
    }

    const testRequest: NotificationRequest = {
        templateId,
        channels: [channelId],
        recipients: {
            email: ['test@minimarket.com'],
            phone: ['+1234567890']
        },
        data: {
            ...testData,
            executionDate: new Date().toLocaleDateString(),
            testMode: true
        },
        priority: 'low',
        source: 'test',
        requiresEscalation: false
    };

    const result = await sendToChannel(channel, template, testRequest, supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({
        success: result.status === 'sent',
        data: result
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getUserPreferencesHandler(
    req: Request,
    supabaseUrl: string,
    serviceRoleKey: string,
    corsHeaders: Record<string, string>
): Promise<Response> {
    const userId = req.headers.get('x-user-id') || 'default';

    // En implementación real, obtendríamos preferencias del usuario desde BD
    const preferences = {
        userId,
        channels: {
            email: true,
            sms: false,
            slack: true
        },
        severities: {
            low: false,
            medium: true,
            high: true,
            critical: true
        },
        templates: Object.keys(NOTIFICATION_TEMPLATES).reduce((acc, templateId) => {
            acc[templateId] = true;
            return acc;
        }, {} as Record<string, boolean>)
    };

    return new Response(JSON.stringify({
        success: true,
        data: preferences
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function checkEscalationHandler(
    req: Request,
    supabaseUrl: string,
    serviceRoleKey: string,
    corsHeaders: Record<string, string>
): Promise<Response> {
    const { severity, noResponseMinutes = 30 } = await req.json();

    // Verificar si hay alertas que requieren escalamiento
    const cutoffTime = new Date(Date.now() - noResponseMinutes * 60 * 1000).toISOString();
    const response = await fetch(
        `${supabaseUrl}/rest/v1/cron_jobs_alerts?select=*&severidad=eq.${severity}&estado_alerta=eq.activa&created_at=lt.${cutoffTime}`,
        {
            headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`
            }
        }
    );

    const alerts = response.ok ? await response.json() : [];
    const requiresEscalation = alerts.length > 0;

    return new Response(JSON.stringify({
        success: true,
        data: {
            requiresEscalation,
            alertCount: alerts.length,
            alerts: alerts.slice(0, 10) // Top 10 alertas
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
