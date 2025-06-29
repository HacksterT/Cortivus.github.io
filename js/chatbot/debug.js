/**
 * Cortivus Chatbot - Debug Utility
 * 
 * This module provides debugging tools for the chatbot implementation
 * to help identify and fix issues with event handling and initialization.
 */

// Debug configuration
const DEBUG_CONFIG = {
    enabled: true,           // Master toggle for debug mode
    logToConsole: true,      // Output debug messages to console
    visualFeedback: true,    // Show visual indicators for events
    logLevel: 'info'         // 'error', 'warn', 'info', 'debug', 'trace'
};

// Log levels with corresponding console methods
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
};

// Current log level threshold
const currentLogLevel = LOG_LEVELS[DEBUG_CONFIG.logLevel] || LOG_LEVELS.info;

/**
 * Log a debug message if debug mode is enabled
 * @param {string} message - The message to log
 * @param {string} level - Log level ('error', 'warn', 'info', 'debug', 'trace')
 * @param {any} data - Optional data to include with the log
 */
function log(message, level = 'info', data = null) {
    if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.logToConsole) return;
    
    const logLevel = LOG_LEVELS[level] || LOG_LEVELS.info;
    if (logLevel > currentLogLevel) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[Cortivus ${level.toUpperCase()} ${timestamp}]`;
    
    switch (level) {
        case 'error':
            console.error(prefix, message, data || '');
            break;
        case 'warn':
            console.warn(prefix, message, data || '');
            break;
        case 'debug':
            console.debug(prefix, message, data || '');
            break;
        case 'trace':
            console.trace(prefix, message, data || '');
            break;
        case 'info':
        default:
            console.info(prefix, message, data || '');
    }
}

/**
 * Create a visual indicator for an event (flashes an element)
 * @param {HTMLElement} element - The element to highlight
 * @param {string} eventType - The type of event that occurred
 */
function visualEvent(element, eventType) {
    if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.visualFeedback || !element) return;
    
    // Create or get debug overlay for the element
    let overlay = element.querySelector('.debug-event-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'debug-event-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '10000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontSize = '12px';
        overlay.style.fontFamily = 'monospace';
        overlay.style.textAlign = 'center';
        overlay.style.padding = '4px';
        
        // Make sure the element can contain the overlay
        if (window.getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(overlay);
    }
    
    // Show the event
    overlay.textContent = eventType;
    overlay.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
    overlay.style.opacity = '1';
    
    // Flash effect
    setTimeout(() => {
        overlay.style.transition = 'opacity 1s ease-out';
        overlay.style.opacity = '0';
    }, 500);
}

/**
 * Track an element's event listeners for debugging
 * @param {HTMLElement} element - The element to track
 * @param {string} eventType - The event type to track
 * @param {string} handlerSource - Identifier for where the handler was added
 */
function trackEvent(element, eventType, handlerSource) {
    if (!element || !eventType) return;
    
    // Store original addEventListener
    if (!element._originalAddEventListener) {
        element._originalAddEventListener = element.addEventListener;
        
        // Override addEventListener
        element.addEventListener = function(type, handler, options) {
            log(`Event listener added: ${type} from ${handlerSource || 'unknown source'}`, 'debug', { 
                element: this, 
                handler: handler.toString().substring(0, 100) + '...'
            });
            return this._originalAddEventListener(type, handler, options);
        };
    }
    
    // Add a wrapper for the specific event we want to track
    const originalHandler = element['on' + eventType];
    if (originalHandler) {
        log(`Found existing on${eventType} handler`, 'debug', {
            element: element,
            handler: originalHandler.toString().substring(0, 100) + '...'
        });
    }
    
    // Override the on-event property
    Object.defineProperty(element, 'on' + eventType, {
        get: function() {
            return this['_on' + eventType];
        },
        set: function(handler) {
            log(`Setting on${eventType} handler from ${handlerSource || 'unknown source'}`, 'debug', {
                element: this,
                handler: handler ? handler.toString().substring(0, 100) + '...' : null
            });
            this['_on' + eventType] = handler;
        },
        configurable: true
    });
}

/**
 * Monitor DOM element creation and updates
 * @param {string} selector - CSS selector for elements to monitor
 * @param {Function} callback - Function to call when matching elements are found
 */
function monitorElements(selector, callback) {
    if (!DEBUG_CONFIG.enabled) return;
    
    // Check existing elements
    document.querySelectorAll(selector).forEach(callback);
    
    // Watch for new elements
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches(selector)) {
                            callback(node);
                        }
                        node.querySelectorAll(selector).forEach(callback);
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    return observer;
}

// Create global namespace for Cortivus Debug
window.CortivusDebug = {
    log,
    visualEvent,
    trackEvent,
    monitorElements,
    
    // Allow runtime configuration
    setEnabled: function(enabled) {
        DEBUG_CONFIG.enabled = enabled;
        log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`, 'info');
    },
    
    setLogLevel: function(level) {
        if (LOG_LEVELS.hasOwnProperty(level)) {
            DEBUG_CONFIG.logLevel = level;
            log(`Log level set to ${level}`, 'info');
        } else {
            log(`Invalid log level: ${level}`, 'error');
        }
    }
};
