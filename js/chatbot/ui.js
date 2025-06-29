/**
 * Cortivus Chatbot - UI Module
 * 
 * This module handles the chat interface rendering and UI interactions:
 * - Creates and injects chat UI components into the page
 * - Manages UI state and animations
 * - Provides DOM element references to the main chat module
 */

// Chat UI elements reference object
let chatElements = {};

/**
 * Render the chat interface by injecting HTML into the page
 */
function renderChatInterface() {
    // Create chat container if it doesn't exist
    if (!document.getElementById('cortivus-chat-container')) {
        // Create chat stylesheet
        createChatStylesheet();
        
        // Create chat HTML structure
        const chatContainer = document.createElement('div');
        chatContainer.id = 'cortivus-chat-container';
        
        chatContainer.innerHTML = `
            <button id="chat-toggle-btn" class="chat-toggle-btn" aria-label="Chat with Cortivus">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>
            
            <div id="chat-window" class="chat-window">
                <div class="chat-header">
                    <div class="chat-title">Cortivus Assistant</div>
                    <div class="chat-controls">
                        <select id="chat-mode-selector" class="chat-mode-selector">
                            <option value="policy">Policy Retrieval</option>
                            <option value="sermon">Sermon Preparation</option>
                        </select>
                        <button id="chat-close-btn" class="chat-close-btn" aria-label="Close chat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div id="chat-messages" class="chat-messages">
                    <!-- Messages will be inserted here -->
                </div>
                
                <div id="typing-indicator" class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                
                <div class="chat-input-container">
                    <textarea id="chat-input" class="chat-input" placeholder="Type your message..." rows="1"></textarea>
                    <button id="chat-send-btn" class="chat-send-btn" aria-label="Send message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Append to body
        document.body.appendChild(chatContainer);
        
        // Store references to DOM elements
        chatElements = {
            container: chatContainer,
            toggleButton: document.getElementById('chat-toggle-btn'),
            chatWindow: document.getElementById('chat-window'),
            closeButton: document.getElementById('chat-close-btn'),
            messageContainer: document.getElementById('chat-messages'),
            inputField: document.getElementById('chat-input'),
            sendButton: document.getElementById('chat-send-btn'),
            modeSelector: document.getElementById('chat-mode-selector'),
            typingIndicator: document.getElementById('typing-indicator')
        };
        
        // Set up additional event listeners
        setupUIEventListeners();
        
        // Auto-resize textarea as user types
        setupTextareaAutoResize();
    }
    
    return chatElements;
}

/**
 * Create and inject the chat stylesheet
 */
function createChatStylesheet() {
    const styleElement = document.createElement('style');
    styleElement.id = 'cortivus-chat-styles';
    
    // Use Cortivus color scheme
    const styles = `
        /* Chat Container */
        #cortivus-chat-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            font-family: 'Roboto', 'Segoe UI', sans-serif;
            color: #f0f0f0;
            line-height: 1.5;
        }
        
        /* Toggle Button */
        .chat-toggle-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0088cc, #005577);
            color: white;
            border: none;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            bottom: 0;
            right: 0;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .chat-toggle-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        
        /* Chat Window */
        .chat-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            background-color: #1a1a1a;
            border-radius: 10px;
            box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform-origin: bottom right;
            transform: scale(0);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .chat-window.open {
            transform: scale(1);
            opacity: 1;
        }
        
        /* Chat Header */
        .chat-header {
            background: linear-gradient(135deg, #0088cc, #005577);
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
        }
        
        .chat-title {
            font-weight: bold;
            font-size: 16px;
        }
        
        .chat-controls {
            display: flex;
            align-items: center;
        }
        
        .chat-mode-selector {
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px;
            margin-right: 10px;
            font-size: 12px;
        }
        
        .chat-close-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
            transition: opacity 0.2s;
        }
        
        .chat-close-btn:hover {
            opacity: 1;
        }
        
        /* Chat Messages Container */
        .chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background-color: #222222;
        }
        
        /* Message Styles */
        .chat-message {
            margin-bottom: 15px;
            max-width: 85%;
            word-wrap: break-word;
        }
        
        .chat-message.user {
            margin-left: auto;
        }
        
        .chat-message.bot {
            margin-right: auto;
        }
        
        .chat-message.system {
            margin: 10px auto;
            max-width: 90%;
            text-align: center;
        }
        
        .message-text {
            padding: 10px 15px;
            border-radius: 18px;
            display: inline-block;
        }
        
        .user .message-text {
            background-color: #0088cc;
            color: white;
            border-top-right-radius: 4px;
        }
        
        .bot .message-text {
            background-color: #333333;
            color: #f0f0f0;
            border-top-left-radius: 4px;
        }
        
        .system .message-text {
            background-color: rgba(255, 255, 255, 0.1);
            color: #aaaaaa;
            font-style: italic;
            font-size: 0.9em;
        }
        
        .message-sources {
            font-size: 0.8em;
            margin-top: 5px;
            color: #888888;
            padding-left: 15px;
        }
        
        .sources-label {
            font-weight: bold;
        }
        
        .source-item {
            text-decoration: underline;
            cursor: pointer;
        }
        
        /* Typing Indicator */
        .typing-indicator {
            display: none;
            padding: 10px 15px;
            background-color: #333333;
            border-radius: 18px;
            margin-bottom: 15px;
            width: fit-content;
            align-items: center;
        }
        
        .typing-indicator span {
            height: 8px;
            width: 8px;
            background-color: #aaaaaa;
            border-radius: 50%;
            display: inline-block;
            margin-right: 5px;
            animation: typing-dot 1.4s infinite ease-in-out both;
        }
        
        .typing-indicator span:nth-child(1) {
            animation-delay: 0s;
        }
        
        .typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
            margin-right: 0;
        }
        
        @keyframes typing-dot {
            0%, 80%, 100% { transform: scale(0.7); }
            40% { transform: scale(1); }
        }
        
        /* Chat Input Area */
        .chat-input-container {
            display: flex;
            padding: 15px;
            background-color: #1a1a1a;
            border-top: 1px solid #333333;
        }
        
        .chat-input {
            flex: 1;
            padding: 10px 15px;
            border: 1px solid #333333;
            border-radius: 20px;
            background-color: #2a2a2a;
            color: #f0f0f0;
            resize: none;
            max-height: 100px;
            overflow-y: auto;
        }
        
        .chat-input:focus {
            outline: none;
            border-color: #0088cc;
        }
        
        .chat-send-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0088cc, #005577);
            color: white;
            border: none;
            margin-left: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        
        .chat-send-btn:hover {
            transform: scale(1.05);
        }
        
        /* Responsive Styles */
        @media (max-width: 480px) {
            .chat-window {
                width: calc(100vw - 40px);
                height: 60vh;
                bottom: 70px;
            }
            
            .chat-toggle-btn {
                width: 50px;
                height: 50px;
            }
        }
    `;
    
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

/**
 * Set up event listeners for UI elements
 */
function setupUIEventListeners() {
    // Close button functionality
    if (chatElements.closeButton) {
        chatElements.closeButton.addEventListener('click', () => {
            if (chatElements.chatWindow) {
                chatElements.chatWindow.classList.remove('open');
            }
        });
    }
}

/**
 * Set up auto-resizing for the textarea
 */
function setupTextareaAutoResize() {
    if (chatElements.inputField) {
        chatElements.inputField.addEventListener('input', function() {
            // Reset height to auto to get the correct scrollHeight
            this.style.height = 'auto';
            
            // Set new height based on scrollHeight, with a max height
            const newHeight = Math.min(this.scrollHeight, 100);
            this.style.height = newHeight + 'px';
        });
    }
}

/**
 * Get references to chat UI elements
 */
function getChatElements() {
    return chatElements;
}

// Export functions for use in other modules
export {
    renderChatInterface,
    getChatElements
};
