/**
 * Cortivus Chatbot - UI Module (View Layer)
 *
 * This module is responsible ONLY for rendering the chat interface.
 * It creates the necessary HTML and CSS and provides references to the DOM elements.
 * It does NOT handle any logic or event listeners.
 */

(function(window) {
    'use strict';

    // To hold references to the created DOM elements
    let chatElements = {};

    /**
     * Renders the chat interface by injecting HTML and CSS into the page.
     * This function should only be called once.
     */
    function renderChatInterface() {
        // Use the debug logger if available
        const log = window.CortivusDebug ? window.CortivusDebug.log : () => {};

        if (document.getElementById('cortivus-chat-container')) {
            log('Chat container already exists. Aborting render.', 'warn');
            return chatElements;
        }
        log('Starting to render Chat UI.', 'info');

        // 1. Create and inject the stylesheet
        createChatStylesheet();
        log('Chat stylesheet created and injected.', 'debug');

        // 2. Create the main chat container
        const chatContainer = document.createElement('div');
        chatContainer.id = 'cortivus-chat-container';
        chatContainer.innerHTML = getChatHTML();
        document.body.appendChild(chatContainer);
        log('Chat HTML structure created and appended to body.', 'debug');

        // 3. Store references to all the important DOM elements
        chatElements = {
            container: chatContainer,
            toggleButton: document.getElementById('chat-toggle-btn'),
            chatWindow: document.getElementById('chat-window'),
            closeButton: document.getElementById('chat-close-btn'),
            messageContainer: document.getElementById('chat-messages'),
            quickRepliesContainer: document.getElementById('chat-quick-replies'),
            inputField: document.getElementById('chat-input'),
            sendButton: document.getElementById('chat-send-btn'),
            typingIndicator: document.getElementById('typing-indicator'),
            // New demo button elements
            demoButtons: {
                policy: document.getElementById('demo-btn-policy'),
                bar: document.getElementById('demo-btn-bar'),
                sermon: document.getElementById('demo-btn-sermon')
            }
        };
        log('Chat DOM elements have been cached.', 'debug', chatElements);

        // Verify that all elements were found
        for (const key in chatElements) {
            if (key === 'demoButtons') {
                for (const btnKey in chatElements[key]) {
                    if (!chatElements[key][btnKey]) {
                        log(`Demo button not found: ${btnKey}`, 'error');
                    }
                }
            } else if (!chatElements[key]) {
                log(`UI element not found: ${key}`, 'error');
            }
        }

        log('Chat UI rendering complete.', 'info');
        return chatElements;
    }

    /**
     * Returns the HTML string for the chat window.
     * @returns {string} The HTML content.
     */
    function getChatHTML() {
        return `
            <button id="chat-toggle-btn" class="chat-toggle-btn" aria-label="Chat with Cortivus">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </button>
            <div id="chat-window" class="chat-window">
                <div class="chat-header">
                    <div class="chat-title">The Cortivus Brain</div>
                    <div class="chat-controls">
                        <button id="chat-close-btn" class="chat-close-btn" aria-label="Close chat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
                <div class="demo-button-bar">
                    <button id="demo-btn-policy" class="demo-btn" data-demo="policy" aria-label="Policy Demo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>
                        Policy Demo
                    </button>
                    <button id="demo-btn-bar" class="demo-btn" data-demo="bar" aria-label="Bar Recommendation Demo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12V7a1 1 0 0 1 1-1h4l1-2h2l1 2h4a1 1 0 0 1 1 1v5M5 12l6 6 6-6"></path></svg>
                        Bar Demo
                    </button>
                    <button id="demo-btn-sermon" class="demo-btn" data-demo="sermon" aria-label="Sermon Preparation Demo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        Sermon Demo
                    </button>
                </div>
                <div id="chat-messages" class="chat-messages"></div>
                <div id="chat-quick-replies" class="chat-quick-replies"></div>
                <div id="typing-indicator" class="typing-indicator"><span></span><span></span><span></span></div>
                <div class="chat-input-container">
                    <textarea id="chat-input" class="chat-input" placeholder="Type your message..." rows="1"></textarea>
                    <button id="chat-send-btn" class="chat-send-btn" aria-label="Send message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Creates and injects the CSS stylesheet for the chat UI.
     */
    function createChatStylesheet() {
        const styleElement = document.createElement('style');
        styleElement.id = 'cortivus-chat-styles';
        styleElement.textContent = getChatCSS();
        document.head.appendChild(styleElement);
    }

    /**
     * Returns the CSS string for the chat UI.
     * @returns {string} The CSS rules.
     */
    function getChatCSS() {
        // Using template literal for easy multiline CSS string
        return `
            #cortivus-chat-container { position: fixed; bottom: 20px; right: 20px; z-index: 1000; font-family: 'Roboto', 'Segoe UI', sans-serif; color: #f0f0f0; line-height: 1.5; }
            .floating-debug-bar { display: none !important; }
            .chat-toggle-btn { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%; background-color: #0088cc; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); transition: all 0.3s ease; z-index: 1001; font-size: 24px; }
            .chat-toggle-btn:hover { transform: scale(1.05); background-color: #34495e; }
            .chat-window { position: fixed; bottom: 90px; right: 20px; width: 380px; max-height: 65vh; background-color: #1a1a1a; border-radius: 10px; box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3); display: flex; flex-direction: column; overflow: hidden; transform-origin: bottom right; transform: scale(0); opacity: 0; transition: transform 0.3s ease, opacity 0.3s ease; z-index: 1000; visibility: hidden; }
            .chat-window.open { transform: scale(1); opacity: 1; visibility: visible; }
            .chat-header { background: linear-gradient(135deg, #0088cc, #005577); padding: 15px; display: flex; justify-content: space-between; align-items: center; border-top-left-radius: 10px; border-top-right-radius: 10px; flex-shrink: 0; }
            .chat-title { font-weight: bold; font-size: 16px; }
            .chat-controls { display: flex; align-items: center; }
            .chat-close-btn { background: none; border: none; color: white; cursor: pointer; padding: 5px; display: flex; align-items: center; justify-content: center; opacity: 0.8; transition: opacity 0.2s; }
            .chat-close-btn:hover { opacity: 1; }
            
            /* Demo Button Bar Styles */
            .demo-button-bar { background-color: #2a2a2a; padding: 10px 15px; display: flex; gap: 8px; border-bottom: 1px solid #333; flex-shrink: 0; overflow-x: auto; }
            .demo-btn { background-color: #333; color: #f0f0f0; border: 1px solid #555; border-radius: 15px; padding: 6px 10px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 5px; transition: all 0.2s ease; white-space: nowrap; flex-shrink: 0; }
            .demo-btn:hover { background-color: #0088cc; border-color: #0088cc; transform: translateY(-1px); }
            .demo-btn.active { background-color: #0088cc; border-color: #0088cc; }
            .demo-btn svg { flex-shrink: 0; }
            
            /* Responsive adjustments for demo buttons */
            @media (max-width: 420px) {
                .chat-window { width: calc(100vw - 40px); right: 20px; }
                .demo-btn { font-size: 0.8em; padding: 5px 8px; }
                .demo-btn span { display: none; } /* Hide text on very small screens, keep icons */
            }
            
            .chat-messages { flex: 1; padding: 15px; overflow-y: auto; background-color: #222222; }
            .chat-message { margin-bottom: 15px; max-width: 85%; word-wrap: break-word; display: flex; flex-direction: column; }
            .chat-message.user { align-items: flex-end; margin-left: auto; }
            .chat-message.bot { align-items: flex-start; margin-right: auto; }
            .chat-message.system { align-items: center; margin: 10px auto; max-width: 90%; text-align: center; }
            .message-text { padding: 10px 15px; border-radius: 18px; display: inline-block; }
            .user .message-text { background-color: #0088cc; color: white; border-top-right-radius: 4px; }
            .bot .message-text { background-color: #333333; color: #f0f0f0; border-top-left-radius: 4px; }
            .system .message-text { background-color: rgba(255, 255, 255, 0.1); color: #aaaaaa; font-style: italic; font-size: 0.9em; }
            .message-sources { font-size: 0.8em; margin-top: 5px; color: #888888; padding-left: 15px; }
            .sources-label { font-weight: bold; }
            .source-item { text-decoration: underline; cursor: pointer; }
            .chat-quick-replies { padding: 0 15px 10px; display: flex; flex-wrap: wrap; gap: 10px; flex-shrink: 0; }
            .quick-reply-btn { background-color: #333; color: #f0f0f0; border: 1px solid #555; border-radius: 20px; padding: 8px 15px; cursor: pointer; font-size: 0.9em; transition: background-color 0.2s, border-color 0.2s; }
            .quick-reply-btn:hover { background-color: #0088cc; border-color: #0088cc; }
            .typing-indicator { display: none; padding: 10px 15px; background-color: #333333; border-radius: 18px; margin: 0 15px 15px; width: fit-content; align-items: center; }
            .typing-indicator.show { display: flex; }
            .typing-indicator span { height: 8px; width: 8px; background-color: #aaaaaa; border-radius: 50%; display: inline-block; margin-right: 5px; animation: typing-dot 1.4s infinite ease-in-out both; }
            .typing-indicator span:nth-child(1) { animation-delay: 0s; }
            .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.4s; margin-right: 0; }
            @keyframes typing-dot { 0%, 80%, 100% { transform: scale(0.7); } 40% { transform: scale(1); } }
            .chat-input-container { display: flex; padding: 15px; background-color: #1a1a1a; border-top: 1px solid #333333; flex-shrink: 0; }
            .chat-input { flex: 1; padding: 10px 15px; border: 1px solid #333333; border-radius: 20px; background-color: #2a2a2a; color: #f0f0f0; resize: none; max-height: 100px; overflow-y: auto; }
            .chat-input:focus { outline: none; border-color: #0088cc; }
            .chat-send-btn { width: 40px; height: 40px; border-radius: 50%; background-color: #0088cc; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-left: 10px; transition: background-color 0.2s; flex-shrink: 0; }
            .chat-send-btn:hover { background-color: #006699; }
        `;
    }

    /**
     * Returns the cached DOM elements.
     * @returns {object} The object containing references to the chat UI elements.
     */
    function getChatElements() {
        return chatElements;
    }

    // Expose the public API on the window object
    window.CortivusChatUI = {
        render: renderChatInterface,
        getElements: getChatElements
    };

})(window);