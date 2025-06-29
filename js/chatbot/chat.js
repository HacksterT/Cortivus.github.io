/**
 * Cortivus Chatbot - Main Chat Module
 * 
 * This module handles the core chatbot functionality including:
 * - Chat initialization and UI rendering
 * - Message handling and API communication
 * - Conversation history management
 * - Demo mode selection and configuration
 */

// Configuration
const CHATBOT_CONFIG = {
    apiEndpoint: null, // Will be set based on environment
    demoMode: true, // Start in demo mode until API is configured
    maxHistoryItems: 50, // Maximum number of messages to store in history
    typingDelay: {
        min: 300, // Minimum typing delay in ms
        max: 1500 // Maximum typing delay in ms
    }
};

// Initialize API endpoint based on environment
if (window.location.hostname === 'cortivus.github.io') {
    // Production environment
    CHATBOT_CONFIG.apiEndpoint = 'https://cortivus-chatbot.azurewebsites.net/api/chat';
} else {
    // Development environment - use local endpoint if available
    CHATBOT_CONFIG.apiEndpoint = 'http://localhost:7071/api/chat';
}

// Chat state
const chatState = {
    isOpen: false,
    isLoading: false,
    activeMode: 'policy', // 'policy' or 'sermon'
    history: [],
    currentSession: null
};

// DOM Elements - will be populated on init
let chatElements = {};

/**
 * Initialize the chatbot
 */
function initChatbot() {
    loadChatUI();
    loadChatHistory();
    setupEventListeners();
    
    // Load demo data if in demo mode
    if (CHATBOT_CONFIG.demoMode) {
        loadDemoData();
    }
    
    console.log('Cortivus chatbot initialized');
}

/**
 * Load the chat UI components
 */
function loadChatUI() {
    // Import and initialize UI components
    import('./ui.js').then(ui => {
        ui.renderChatInterface();
        chatElements = ui.getChatElements();
    }).catch(error => {
        console.error('Failed to load chat UI:', error);
    });
}

/**
 * Load conversation history from local storage
 */
function loadChatHistory() {
    try {
        const savedHistory = localStorage.getItem('cortivus_chat_history');
        if (savedHistory) {
            chatState.history = JSON.parse(savedHistory).slice(0, CHATBOT_CONFIG.maxHistoryItems);
        }
    } catch (error) {
        console.error('Failed to load chat history:', error);
        // Reset history if corrupted
        chatState.history = [];
    }
}

/**
 * Set up event listeners for chat interactions
 */
function setupEventListeners() {
    // These will be implemented once the UI is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for UI module to load and create elements
        setTimeout(() => {
            if (chatElements.toggleButton) {
                chatElements.toggleButton.addEventListener('click', toggleChat);
            }
            
            if (chatElements.sendButton) {
                chatElements.sendButton.addEventListener('click', sendMessage);
            }
            
            if (chatElements.inputField) {
                chatElements.inputField.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });
            }
            
            if (chatElements.modeSelector) {
                chatElements.modeSelector.addEventListener('change', (e) => {
                    changeMode(e.target.value);
                });
            }
        }, 500);
    });
}

/**
 * Toggle the chat window open/closed
 */
function toggleChat() {
    chatState.isOpen = !chatState.isOpen;
    
    if (chatElements.chatWindow) {
        if (chatState.isOpen) {
            chatElements.chatWindow.classList.add('open');
            // Send welcome message if this is a new session
            if (!chatState.currentSession) {
                chatState.currentSession = Date.now();
                addSystemMessage(getWelcomeMessage());
            }
        } else {
            chatElements.chatWindow.classList.remove('open');
        }
    }
}

/**
 * Change the chat mode (policy or sermon)
 */
function changeMode(mode) {
    chatState.activeMode = mode;
    addSystemMessage(`Switched to ${mode === 'policy' ? 'Policy Retrieval' : 'Sermon Preparation'} mode.`);
}

/**
 * Send a user message to the chatbot
 */
function sendMessage() {
    if (!chatElements.inputField || chatState.isLoading) return;
    
    const userMessage = chatElements.inputField.value.trim();
    if (!userMessage) return;
    
    // Add user message to chat
    addUserMessage(userMessage);
    chatElements.inputField.value = '';
    
    // Set loading state
    chatState.isLoading = true;
    showTypingIndicator();
    
    if (CHATBOT_CONFIG.demoMode) {
        // In demo mode, use local data to simulate response
        handleDemoResponse(userMessage);
    } else {
        // In production, call the API
        callChatAPI(userMessage);
    }
}

/**
 * Call the chat API with the user's message
 */
async function callChatAPI(message) {
    try {
        const response = await fetch(CHATBOT_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                mode: chatState.activeMode,
                history: chatState.history.slice(-5) // Send last 5 messages for context
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Simulate typing delay for more natural interaction
        const typingTime = Math.random() * 
            (CHATBOT_CONFIG.typingDelay.max - CHATBOT_CONFIG.typingDelay.min) + 
            CHATBOT_CONFIG.typingDelay.min;
            
        setTimeout(() => {
            hideTypingIndicator();
            addBotMessage(data.response, data.sources);
            chatState.isLoading = false;
        }, typingTime);
        
    } catch (error) {
        console.error('API call failed:', error);
        hideTypingIndicator();
        addSystemMessage('Sorry, I encountered an error. Please try again later.');
        chatState.isLoading = false;
    }
}

/**
 * Handle demo mode responses using local data
 */
function handleDemoResponse(message) {
    // Simulate API delay
    const typingTime = Math.random() * 
        (CHATBOT_CONFIG.typingDelay.max - CHATBOT_CONFIG.typingDelay.min) + 
        CHATBOT_CONFIG.typingDelay.min;
    
    setTimeout(() => {
        let response, sources;
        
        if (chatState.activeMode === 'policy') {
            // Get demo policy response
            const demoResponse = getDemoPolicyResponse(message);
            response = demoResponse.text;
            sources = demoResponse.sources;
        } else {
            // Get demo sermon response
            const demoResponse = getDemoSermonResponse(message);
            response = demoResponse.text;
            sources = demoResponse.sources;
        }
        
        hideTypingIndicator();
        addBotMessage(response, sources);
        chatState.isLoading = false;
    }, typingTime);
}

/**
 * Get a demo response for policy questions
 * This will be expanded when we load the actual demo data
 */
function getDemoPolicyResponse(message) {
    // This is a placeholder - will be replaced with actual demo data
    return {
        text: "This is a demo response for policy mode. In the full implementation, this will use the policy data to provide relevant information based on your query.",
        sources: ["Demo Policy Document"]
    };
}

/**
 * Get a demo response for sermon preparation
 * This will be expanded when we load the actual demo data
 */
function getDemoSermonResponse(message) {
    // This is a placeholder - will be replaced with actual demo data
    return {
        text: "This is a demo response for sermon preparation mode. In the full implementation, this will provide scripture references and sermon outline suggestions based on your topic.",
        sources: ["Demo Scripture Database"]
    };
}

/**
 * Load demo data for offline testing
 */
function loadDemoData() {
    // This will be implemented to load JSON data from demo-data folder
    console.log('Loading demo data...');
    
    // Load policy data
    fetch('./js/chatbot/demo-data/policies.json')
        .then(response => response.json())
        .then(data => {
            window.demoPolicyData = data;
            console.log('Policy demo data loaded');
        })
        .catch(error => {
            console.error('Failed to load policy demo data:', error);
        });
        
    // Load sermon data
    fetch('./js/chatbot/demo-data/sermons.json')
        .then(response => response.json())
        .then(data => {
            window.demoSermonData = data;
            console.log('Sermon demo data loaded');
        })
        .catch(error => {
            console.error('Failed to load sermon demo data:', error);
        });
}

/**
 * Add a user message to the chat
 */
function addUserMessage(message) {
    const messageObj = {
        type: 'user',
        text: message,
        timestamp: new Date().toISOString()
    };
    
    addMessageToChat(messageObj);
}

/**
 * Add a bot message to the chat
 */
function addBotMessage(message, sources = []) {
    const messageObj = {
        type: 'bot',
        text: message,
        sources: sources,
        timestamp: new Date().toISOString()
    };
    
    addMessageToChat(messageObj);
}

/**
 * Add a system message to the chat
 */
function addSystemMessage(message) {
    const messageObj = {
        type: 'system',
        text: message,
        timestamp: new Date().toISOString()
    };
    
    addMessageToChat(messageObj);
}

/**
 * Add a message to the chat and update history
 */
function addMessageToChat(messageObj) {
    // Add to history
    chatState.history.push(messageObj);
    
    // Trim history if needed
    if (chatState.history.length > CHATBOT_CONFIG.maxHistoryItems) {
        chatState.history = chatState.history.slice(-CHATBOT_CONFIG.maxHistoryItems);
    }
    
    // Save to local storage
    try {
        localStorage.setItem('cortivus_chat_history', JSON.stringify(chatState.history));
    } catch (error) {
        console.error('Failed to save chat history:', error);
    }
    
    // Render in UI
    if (chatElements.messageContainer) {
        const messageElement = createMessageElement(messageObj);
        chatElements.messageContainer.appendChild(messageElement);
        chatElements.messageContainer.scrollTop = chatElements.messageContainer.scrollHeight;
    }
}

/**
 * Create a DOM element for a message
 */
function createMessageElement(messageObj) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', messageObj.type);
    
    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');
    textDiv.innerHTML = formatMessageText(messageObj.text);
    messageDiv.appendChild(textDiv);
    
    // Add sources if available
    if (messageObj.sources && messageObj.sources.length > 0) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.classList.add('message-sources');
        
        const sourcesLabel = document.createElement('span');
        sourcesLabel.classList.add('sources-label');
        sourcesLabel.textContent = 'Sources: ';
        sourcesDiv.appendChild(sourcesLabel);
        
        messageObj.sources.forEach((source, index) => {
            const sourceSpan = document.createElement('span');
            sourceSpan.classList.add('source-item');
            sourceSpan.textContent = source;
            sourcesDiv.appendChild(sourceSpan);
            
            if (index < messageObj.sources.length - 1) {
                sourcesDiv.appendChild(document.createTextNode(', '));
            }
        });
        
        messageDiv.appendChild(sourcesDiv);
    }
    
    return messageDiv;
}

/**
 * Format message text with markdown-like syntax
 */
function formatMessageText(text) {
    // Convert URLs to links
    text = text.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Convert **bold** syntax
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* syntax
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert newlines to <br>
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    if (!chatElements.typingIndicator) return;
    
    chatElements.typingIndicator.style.display = 'flex';
    chatElements.messageContainer.scrollTop = chatElements.messageContainer.scrollHeight;
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    if (!chatElements.typingIndicator) return;
    
    chatElements.typingIndicator.style.display = 'none';
}

/**
 * Get welcome message based on active mode
 */
function getWelcomeMessage() {
    if (chatState.activeMode === 'policy') {
        return "Welcome to the Cortivus Policy Assistant! I can help you find information about our policies and procedures. What would you like to know?";
    } else {
        return "Welcome to the Cortivus Sermon Preparation Assistant! I can help you prepare sermons by finding relevant scriptures and creating outlines. What topic are you exploring?";
    }
}

// Initialize chatbot when script is loaded
document.addEventListener('DOMContentLoaded', initChatbot);

// Export functions for use in other modules
export {
    toggleChat,
    sendMessage,
    changeMode,
    chatState,
    CHATBOT_CONFIG
};
