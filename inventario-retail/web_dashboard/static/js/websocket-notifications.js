/**
 * WebSocket Notification Manager - SEMANA 2.2
 * Real-time push notifications via WebSocket
 * 
 * Características:
 * - Conexión WebSocket bidireccional
 * - Reconexión automática con backoff exponencial
 * - Gestión de eventos: connect, disconnect, notification
 * - Toast notifications con animaciones
 * - Notificación bell icon con contador
 * - Persistencia de mensajes no leídos
 */

class WebSocketNotificationManager {
    constructor(options = {}) {
        this.wsUrl = options.wsUrl || `ws://${window.location.host}/ws/notifications`;
        this.userId = options.userId || null;
        this.apiKey = options.apiKey || null;
        
        // WebSocket state
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // ms
        this.reconnectBackoff = 1.5;
        
        // Event handlers
        this.handlers = {
            connect: options.onConnect || null,
            disconnect: options.onDisconnect || null,
            notification: options.onNotification || null,
            error: options.onError || null
        };
        
        // DOM elements
        this.notificationBell = document.getElementById('notification-bell');
        this.notificationCounter = document.getElementById('notification-counter');
        this.toastContainer = document.getElementById('notification-toast-container');
        
        // Initialize
        this.initializeDOM();
        this.loadUnreadCount();
        
        logger.info('🔔 WebSocketNotificationManager initialized');
    }
    
    initializeDOM() {
        // Initialize DOM elements if they don't exist
        
        // Create toast container if not exists
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'notification-toast-container';
            this.toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(this.toastContainer);
        }
        
        // Create notification bell if not exists
        if (!this.notificationBell) {
            const bellHtml = `
                <div id="notification-bell" style="
                    position: relative;
                    cursor: pointer;
                    font-size: 24px;
                    display: inline-block;
                ">
                    🔔
                    <span id="notification-counter" style="
                        position: absolute;
                        top: -8px;
                        right: -8px;
                        background: #ef4444;
                        color: white;
                        border-radius: 50%;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        font-weight: bold;
                        display: none;
                    ">0</span>
                </div>
            `;
            const navRight = document.querySelector('.nav-right') || 
                           document.querySelector('nav') || 
                           document.body;
            navRight.insertAdjacentHTML('beforeend', bellHtml);
            
            this.notificationBell = document.getElementById('notification-bell');
            this.notificationCounter = document.getElementById('notification-counter');
        }
        
        // Add click handler to bell
        if (this.notificationBell) {
            this.notificationBell.addEventListener('click', () => this.showNotificationCenter());
        }
    }
    
    connect() {
        // Establece conexión WebSocket
        if (this.isConnected) {
            logger.warn('⚠️ WebSocket ya conectado');
            return;
        }
        
        try {
            logger.info(`🔌 Conectando a WebSocket: ${this.wsUrl}`);
            
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onerror = (error) => this.handleError(error);
            this.ws.onclose = () => this.handleClose();
            
        } catch (error) {
            logger.error(`❌ WebSocket connection failed: ${error.message}`);
            this.scheduleReconnect();
        }
    }
    
    handleOpen() {
        // Manejador de conexión exitosa
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        logger.info('✅ WebSocket connected');
        
        // Autenticación
        if (this.userId && this.apiKey) {
            this.send({
                type: 'auth',
                user_id: this.userId,
                api_key: this.apiKey
            });
        }
        
        // Llamar handler de conexión
        if (this.handlers.connect) {
            this.handlers.connect();
        }
        
        // Actualizar UI
        this.updateBellStatus('connected');
    }
    
    handleMessage(event) {
        // Procesa mensajes recibidos del servidor
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'notification':
                    this.handleNotification(data);
                    break;
                
                case 'notification_read':
                    this.handleNotificationRead(data);
                    break;
                
                case 'unread_count':
                    this.handleUnreadCountUpdate(data);
                    break;
                
                case 'auth_success':
                    logger.info('✅ WebSocket authenticated');
                    break;
                
                case 'auth_failed':
                    logger.error('❌ WebSocket authentication failed');
                    this.disconnect();
                    break;
                
                case 'ping':
                    this.send({ type: 'pong' });
                    break;
                
                default:
                    logger.warn(`⚠️ Unknown message type: ${data.type}`);
            }
        } catch (error) {
            logger.error(`❌ Message parsing error: ${error.message}`);
        }
    }
    
    handleNotification(data) {
        // Maneja notificaciones entrantes
        logger.info(`📨 Notification received: ${data.notification_id}`);
        
        const notification = {
            id: data.notification_id,
            type: data.notification_type,
            priority: data.priority,
            subject: data.subject,
            message: data.message,
            timestamp: new Date(),
            read: false
        };
        
        // Guardar en localStorage
        this.saveNotificationLocally(notification);
        
        // Mostrar toast
        this.showToast(notification);
        
        // Actualizar contador
        this.incrementUnreadCount();
        
        // Reproducir sonido si está permitido
        this.playNotificationSound(notification.priority);
        
        // Llamar handler personalizado
        if (this.handlers.notification) {
            this.handlers.notification(notification);
        }
    }
    
    handleNotificationRead(data) {
        // Actualiza estado de notificación leída
        logger.info(`✓ Notification marked as read: ${data.notification_id}`);
        // UI update si es necesario
    }
    
    handleUnreadCountUpdate(data) {
        // Actualiza contador de no leídas desde servidor
        this.updateUnreadCount(data.count);
    }
    
    handleError(error) {
        // Manejador de errores
        logger.error(`❌ WebSocket error: ${error}`);
        
        if (this.handlers.error) {
            this.handlers.error(error);
        }
    }
    
    handleClose() {
        // Manejador de desconexión
        this.isConnected = false;
        logger.warn('⚠️ WebSocket disconnected');
        
        this.updateBellStatus('disconnected');
        
        if (this.handlers.disconnect) {
            this.handlers.disconnect();
        }
        
        // Intentar reconexión
        this.scheduleReconnect();
    }
    
    scheduleReconnect() {
        // Programa reconexión con backoff exponencial
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('❌ Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(this.reconnectBackoff, this.reconnectAttempts - 1);
        
        logger.info(`🔄 Reconectando en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => this.connect(), delay);
    }
    
    send(data) {
        // Envía mensaje al servidor
        if (!this.isConnected) {
            logger.warn('⚠️ WebSocket no conectado, no se puede enviar mensaje');
            return false;
        }
        
        try {
            this.ws.send(JSON.stringify(data));
            return true;
        } catch (error) {
            logger.error(`❌ Send failed: ${error.message}`);
            return false;
        }
    }
    
    disconnect() {
        // Desconecta el WebSocket
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }
    
    showToast(notification) {
        // Muestra notificación tipo toast
        const toastId = `toast-${notification.id}`;
        
        const priorityColors = {
            low: '#10b981',      // green
            medium: '#f59e0b',   // amber
            high: '#ef4444',     // red
            critical: '#7c2d12'  // dark red
        };
        
        const color = priorityColors[notification.priority] || '#3b82f6';
        
        const toastHtml = `
            <div id="${toastId}" style="
                background: white;
                border-left: 4px solid ${color};
                border-radius: 4px;
                padding: 16px;
                margin-bottom: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                animation: slideInRight 0.3s ease-out;
                max-width: 100%;
            ">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 4px 0; color: #1f2937; font-weight: 600;">
                            ${this.escapeHtml(notification.subject)}
                        </h4>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                            ${this.escapeHtml(notification.message)}
                        </p>
                        <small style="color: #9ca3af; font-size: 12px; margin-top: 4px; display: block;">
                            ${new Date(notification.timestamp).toLocaleTimeString()}
                        </small>
                    </div>
                    <button onclick="document.getElementById('${toastId}').remove();" 
                            style="
                                background: none;
                                border: none;
                                font-size: 20px;
                                cursor: pointer;
                                color: #9ca3af;
                                padding: 0;
                                margin-left: 12px;
                            ">✕</button>
                </div>
            </div>
        `;
        
        this.toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const element = document.getElementById(toastId);
            if (element) {
                element.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => element.remove(), 300);
            }
        }, 5000);
    }
    
    showNotificationCenter() {
        // Muestra modal del centro de notificaciones
        // TODO: Implementar en SEMANA 2.3
        logger.info('📬 Opening notification center...');
        alert('Notification center - Coming soon!');
    }
    
    updateBellStatus(status) {
        // Actualiza estado visual del bell icon
        if (!this.notificationBell) return;
        
        if (status === 'connected') {
            this.notificationBell.style.opacity = '1';
            this.notificationBell.style.filter = 'none';
        } else if (status === 'disconnected') {
            this.notificationBell.style.opacity = '0.5';
            this.notificationBell.style.filter = 'grayscale(100%)';
        }
    }
    
    incrementUnreadCount() {
        // Incrementa contador de no leídas
        const current = parseInt(this.notificationCounter?.textContent || 0);
        this.updateUnreadCount(current + 1);
    }
    
    updateUnreadCount(count) {
        // Actualiza contador de no leídas
        if (!this.notificationCounter) return;
        
        this.notificationCounter.textContent = count;
        
        if (count > 0) {
            this.notificationCounter.style.display = 'flex';
        } else {
            this.notificationCounter.style.display = 'none';
        }
        
        // Guardar en localStorage
        localStorage.setItem('notification_unread_count', count);
    }
    
    loadUnreadCount() {
        // Carga contador desde localStorage o servidor
        const saved = localStorage.getItem('notification_unread_count');
        if (saved) {
            this.updateUnreadCount(parseInt(saved));
        }
    }
    
    saveNotificationLocally(notification) {
        // Guarda notificación en localStorage
        const key = 'notifications_local';
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        
        stored.unshift(notification);
        
        // Mantener máximo 50 notificaciones
        if (stored.length > 50) {
            stored.pop();
        }
        
        localStorage.setItem(key, JSON.stringify(stored));
    }
    
    playNotificationSound(priority = 'medium') {
        // Reproduce sonido de notificación (si está soportado)
        try {
            // Usar Web Audio API o elemento <audio> si está disponible
            if ('Notification' in window && Notification.permission === 'granted') {
                // Se podría usar aquí
                logger.info('🔊 Notification sound would play here');
            }
        } catch (error) {
            logger.warn(`⚠️ Sound playback failed: ${error.message}`);
        }
    }
    
    escapeHtml(text) {
        // Escapa caracteres HTML para prevenir XSS
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getNotificationHistory() {
        // Retorna historial de notificaciones locales
        return JSON.parse(localStorage.getItem('notifications_local') || '[]');
    }
    
    clearNotificationHistory() {
        // Limpia historial de notificaciones
        localStorage.setItem('notifications_local', '[]');
    }
}

// Función global para inicializar
function initializeWebSocketNotifications(options = {}) {
    window.notificationManager = new WebSocketNotificationManager(options);
    window.notificationManager.connect();
    return window.notificationManager;
}

// Estilos de animación CSS
const notificationStyles = `
<style>
@keyframes slideInRight {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}

@media (max-width: 640px) {
    #notification-toast-container {
        left: 10px !important;
        right: 10px !important;
        max-width: none !important;
    }
}
</style>
`;

// Inyectar estilos en el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        document.head.insertAdjacentHTML('beforeend', notificationStyles);
    });
} else {
    document.head.insertAdjacentHTML('beforeend', notificationStyles);
}

// Crear logger global si no existe
if (typeof logger === 'undefined') {
    window.logger = {
        info: (msg) => console.log(`ℹ️ ${msg}`),
        warn: (msg) => console.warn(`⚠️ ${msg}`),
        error: (msg) => console.error(`❌ ${msg}`)
    };
}
    
    initializeDOM() {
        
        // Create toast container if not exists
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'notification-toast-container';
            this.toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(this.toastContainer);
        }
        
        // Create notification bell if not exists
        if (!this.notificationBell) {
            const bellHtml = `
                <div id="notification-bell" style="
                    position: relative;
                    cursor: pointer;
                    font-size: 24px;
                    display: inline-block;
                ">
                    🔔
                    <span id="notification-counter" style="
                        position: absolute;
                        top: -8px;
                        right: -8px;
                        background: #ef4444;
                        color: white;
                        border-radius: 50%;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        font-weight: bold;
                        display: none;
                    ">0</span>
                </div>
            `;
            const navRight = document.querySelector('.nav-right') || 
                           document.querySelector('nav') || 
                           document.body;
            navRight.insertAdjacentHTML('beforeend', bellHtml);
            
            this.notificationBell = document.getElementById('notification-bell');
            this.notificationCounter = document.getElementById('notification-counter');
        }
        
        // Add click handler to bell
        if (this.notificationBell) {
            this.notificationBell.addEventListener('click', () => this.showNotificationCenter());
        }
    }
    
    connect() {
        if (this.isConnected) {
            logger.warn('⚠️ WebSocket ya conectado');
            return;
        }
        
        try {
            logger.info(`🔌 Conectando a WebSocket: ${this.wsUrl}`);
            
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onerror = (error) => this.handleError(error);
            this.ws.onclose = () => this.handleClose();
            
        } catch (error) {
            logger.error(`❌ WebSocket connection failed: ${error.message}`);
            this.scheduleReconnect();
        }
    }
    
    handleOpen() {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        logger.info('✅ WebSocket connected');
        
        // Autenticación
        if (this.userId && this.apiKey) {
            this.send({
                type: 'auth',
                user_id: this.userId,
                api_key: this.apiKey
            });
        }
        
        // Llamar handler de conexión
        if (this.handlers.connect) {
            this.handlers.connect();
        }
        
        // Actualizar UI
        this.updateBellStatus('connected');
    }
    
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'notification':
                    this.handleNotification(data);
                    break;
                
                case 'notification_read':
                    this.handleNotificationRead(data);
                    break;
                
                case 'unread_count':
                    this.handleUnreadCountUpdate(data);
                    break;
                
                case 'auth_success':
                    logger.info('✅ WebSocket authenticated');
                    break;
                
                case 'auth_failed':
                    logger.error('❌ WebSocket authentication failed');
                    this.disconnect();
                    break;
                
                case 'ping':
                    this.send({ type: 'pong' });
                    break;
                
                default:
                    logger.warn(`⚠️ Unknown message type: ${data.type}`);
            }
        } catch (error) {
            logger.error(`❌ Message parsing error: ${error.message}`);
        }
    }
    
    handleNotification(data) {
        logger.info(`📨 Notification received: ${data.notification_id}`);
        
        const notification = {
            id: data.notification_id,
            type: data.notification_type,
            priority: data.priority,
            subject: data.subject,
            message: data.message,
            timestamp: new Date(),
            read: false
        };
        
        // Guardar en localStorage
        this.saveNotificationLocally(notification);
        
        // Mostrar toast
        this.showToast(notification);
        
        // Actualizar contador
        this.incrementUnreadCount();
        
        // Reproducir sonido si está permitido
        this.playNotificationSound(notification.priority);
        
        // Llamar handler personalizado
        if (this.handlers.notification) {
            this.handlers.notification(notification);
        }
    }
    
    handleNotificationRead(data) {
        logger.info(`✓ Notification marked as read: ${data.notification_id}`);
        // UI update si es necesario
    }
    
    handleUnreadCountUpdate(data) {
        this.updateUnreadCount(data.count);
    }
    
    handleError(error) {
        logger.error(`❌ WebSocket error: ${error}`);
        
        if (this.handlers.error) {
            this.handlers.error(error);
        }
    }
    
    handleClose() {
        this.isConnected = false;
        logger.warn('⚠️ WebSocket disconnected');
        
        this.updateBellStatus('disconnected');
        
        if (this.handlers.disconnect) {
            this.handlers.disconnect();
        }
        
        // Intentar reconexión
        this.scheduleReconnect();
    }
    
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('❌ Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(this.reconnectBackoff, this.reconnectAttempts - 1);
        
        logger.info(`🔄 Reconectando en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => this.connect(), delay);
    }
    
    send(data) {
        if (!this.isConnected) {
            logger.warn('⚠️ WebSocket no conectado, no se puede enviar mensaje');
            return false;
        }
        
        try {
            this.ws.send(JSON.stringify(data));
            return true;
        } catch (error) {
            logger.error(`❌ Send failed: ${error.message}`);
            return false;
        }
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }
    
    showToast(notification) {
        const toastId = `toast-${notification.id}`;
        
        const priorityColors = {
            low: '#10b981',      // green
            medium: '#f59e0b',   // amber
            high: '#ef4444',     // red
            critical: '#7c2d12'  // dark red
        };
        
        const color = priorityColors[notification.priority] || '#3b82f6';
        
        const toastHtml = `
            <div id="${toastId}" style="
                background: white;
                border-left: 4px solid ${color};
                border-radius: 4px;
                padding: 16px;
                margin-bottom: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                animation: slideInRight 0.3s ease-out;
                max-width: 100%;
            ">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 4px 0; color: #1f2937; font-weight: 600;">
                            ${this.escapeHtml(notification.subject)}
                        </h4>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                            ${this.escapeHtml(notification.message)}
                        </p>
                        <small style="color: #9ca3af; font-size: 12px; margin-top: 4px; display: block;">
                            ${new Date(notification.timestamp).toLocaleTimeString()}
                        </small>
                    </div>
                    <button onclick="document.getElementById('${toastId}').remove();" 
                            style="
                                background: none;
                                border: none;
                                font-size: 20px;
                                cursor: pointer;
                                color: #9ca3af;
                                padding: 0;
                                margin-left: 12px;
                            ">✕</button>
                </div>
            </div>
        `;
        
        this.toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const element = document.getElementById(toastId);
            if (element) {
                element.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => element.remove(), 300);
            }
        }, 5000);
    }
    
    showNotificationCenter() {
        // TODO: Implementar en SEMANA 2.3
        logger.info('📬 Opening notification center...');
        alert('Notification center - Coming soon!');
    }
    
    updateBellStatus(status) {
        if (!this.notificationBell) return;
        
        if (status === 'connected') {
            this.notificationBell.style.opacity = '1';
            this.notificationBell.style.filter = 'none';
        } else if (status === 'disconnected') {
            this.notificationBell.style.opacity = '0.5';
            this.notificationBell.style.filter = 'grayscale(100%)';
        }
    }
    
    incrementUnreadCount() {
        const current = parseInt(this.notificationCounter?.textContent || 0);
        this.updateUnreadCount(current + 1);
    }
    
    updateUnreadCount(count) {
        if (!this.notificationCounter) return;
        
        this.notificationCounter.textContent = count;
        
        if (count > 0) {
            this.notificationCounter.style.display = 'flex';
        } else {
            this.notificationCounter.style.display = 'none';
        }
        
        // Guardar en localStorage
        localStorage.setItem('notification_unread_count', count);
    }
    
    loadUnreadCount() {
        const saved = localStorage.getItem('notification_unread_count');
        if (saved) {
            this.updateUnreadCount(parseInt(saved));
        }
    }
    
    saveNotificationLocally(notification) {
        const key = 'notifications_local';
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        
        stored.unshift(notification);
        
        // Mantener máximo 50 notificaciones
        if (stored.length > 50) {
            stored.pop();
        }
        
        localStorage.setItem(key, JSON.stringify(stored));
    }
    
    playNotificationSound(priority = 'medium') {
        try {
            // Usar Web Audio API o elemento <audio> si está disponible
            if ('Notification' in window && Notification.permission === 'granted') {
                // Se podría usar aquí
                logger.info('🔊 Notification sound would play here');
            }
        } catch (error) {
            logger.warn(`⚠️ Sound playback failed: ${error.message}`);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getNotificationHistory() {
        return JSON.parse(localStorage.getItem('notifications_local') || '[]');
    }
    
    clearNotificationHistory() {
        localStorage.setItem('notifications_local', '[]');
    }
}

// Función global para inicializar
function initializeWebSocketNotifications(options = {}) {
    window.notificationManager = new WebSocketNotificationManager(options);
    window.notificationManager.connect();
    return window.notificationManager;
}

// Estilos de animación CSS
const notificationStyles = `
<style>
@keyframes slideInRight {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}

@media (max-width: 640px) {
    #notification-toast-container {
        left: 10px !important;
        right: 10px !important;
        max-width: none !important;
    }
}
</style>
`;

// Inyectar estilos en el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        document.head.insertAdjacentHTML('beforeend', notificationStyles);
    });
} else {
    document.head.insertAdjacentHTML('beforeend', notificationStyles);
}

// Crear logger global si no existe
if (typeof logger === 'undefined') {
    window.logger = {
        info: (msg) => console.log(`ℹ️ ${msg}`),
        warn: (msg) => console.warn(`⚠️ ${msg}`),
        error: (msg) => console.error(`❌ ${msg}`)
    };
}
