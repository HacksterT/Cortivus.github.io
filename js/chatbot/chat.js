/**
 * Cortivus Chatbot - Main Controller Module
 *
 * This module handles the core chatbot functionality including:
 * - Initialization and event listener setup.
 * - State management (open/closed, loading, mode).
 * - Message handling and API communication.
 * - Demo mode responses.
 */
(function(window) {
    'use strict';

    // --- Configuration ---
    const CONFIG = {
        apiEndpoint: 'http://localhost:7071/api/chat', // Default to local
        demoMode: true,
        maxHistoryItems: 50,
        typingDelay: { min: 300, max: 1500 }
    };

    // --- State ---
    const state = {
        isChatOpen: false,
        isLoading: false,
        activeMode: 'policy', // 'policy' or 'sermon'
        history: [],
        currentSessionId: null
    };

    // --- DOM Elements ---
    let dom = {}; // To be populated by UI module

    // --- Debug Logger ---
    const log = (message, level = 'log', data = null) => {
        if (window.CortivusDebug && window.CortivusDebug.log) {
            window.CortivusDebug.log(message, level, data);
        }
    };

    /**
     * Initializes the chatbot. This is the main entry point.
     */
    function init() {
        log('CortivusChat: Initializing controller.', 'info');

        if (window.location.hostname === 'cortivus.github.io') {
            CONFIG.apiEndpoint = 'https://cortivus-chatbot.azurewebsites.net/api/chat';
            CONFIG.demoMode = false;
            log(`Production environment detected. API endpoint: ${CONFIG.apiEndpoint}`, 'config');
        } else {
            log(`Development environment detected. API endpoint: ${CONFIG.apiEndpoint}`, 'config');
        }

        if (!window.CortivusChatUI) {
            return log('CortivusChatUI module not found. Aborting.', 'error');
        }
        dom = window.CortivusChatUI.render();
        log('UI rendered and DOM elements cached.', 'debug', dom);

        setupEventListeners();

        if (CONFIG.demoMode) {
            loadDemoData();
            log('Demo mode is active. Demo data loaded.', 'info');
        }
        
        log('CortivusChat controller initialized successfully.', 'info');
    }

    /**
     * Attaches all necessary event listeners to the DOM elements.
     */
    function setupEventListeners() {
        if (!dom.toggleButton) return log('Toggle button not found.', 'error');
        
        dom.toggleButton.addEventListener('click', () => toggleChat());
        dom.closeButton.addEventListener('click', () => toggleChat(false));
        dom.sendButton.addEventListener('click', handleSendMessage);
        dom.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        dom.inputField.addEventListener('input', handleTextareaResize);

        log('All event listeners attached.', 'debug');
    }

    /**
     * Toggles the chat window's visibility.
     * @param {boolean} [forceState] - True to force open, false to force close.
     */
    function toggleChat(forceState = null) {
        const shouldBeOpen = forceState !== null ? forceState : !state.isChatOpen;
        if (shouldBeOpen === state.isChatOpen) return; // No change

        state.isChatOpen = shouldBeOpen;
        log(`Toggling chat. New state: ${state.isChatOpen ? 'open' : 'closed'}`, 'event');
        
        dom.chatWindow.classList.toggle('open', state.isChatOpen);

        if (state.isChatOpen) {
            dom.inputField.focus();
            if (!state.currentSessionId) {
                state.currentSessionId = new Date().toISOString();
                log('New chat session started.', 'info');
                addSystemMessage(getWelcomeMessage());
                showQuickReplies([
                    { label: 'Policy Demo', action: 'policy_demo' },
                    { label: 'Sermon Demo', action: 'sermon_demo' },
                    { label: 'Company Info', action: 'company_info' },
                    { label: 'Contact Us', action: 'contact_info' }
                ]);
            }
        }
    }
    
    /**
     * Handles the logic for sending a message from the user input.
     */
    function handleSendMessage() {
        if (state.isLoading) return;
        const messageText = dom.inputField.value.trim();
        if (!messageText) return;

        log(`User sending message: \"${messageText}\"`, 'event');
        addUserMessage(messageText);
        showQuickReplies([]); // Hide quick replies when user types
        dom.inputField.value = '';
        handleTextareaResize(); // Reset textarea height

        showTypingIndicator();
        state.isLoading = true;

        if (CONFIG.demoMode) {
            handleDemoResponse(messageText);
        } else {
            callChatAPI(messageText);
        }
    }

    /**
     * Changes the active chat mode.
     * @param {string} newMode - The mode to switch to ('policy' or 'sermon').
     */


    /**
     * Auto-resizes the input textarea based on content.
     */
    function handleTextareaResize() {
        const el = dom.inputField;
        el.style.height = 'auto';
        const newHeight = Math.min(el.scrollHeight, 100); // Max height of 100px
        el.style.height = `${newHeight}px`;
    }

    // --- Message & UI Update Functions ---

    function addUserMessage(text) { addMessageToChat({ type: 'user', text }); }
    function addBotMessage(text, sources = []) { addMessageToChat({ type: 'bot', text, sources }); }
    function addSystemMessage(text) { addMessageToChat({ type: 'system', text }); }

    function addMessageToChat(messageObj) {
        messageObj.timestamp = new Date().toISOString();
        state.history.push(messageObj);
        if (state.history.length > CONFIG.maxHistoryItems) {
            state.history.shift();
        }

        const messageElement = createMessageElement(messageObj);
        dom.messageContainer.appendChild(messageElement);
        dom.messageContainer.scrollTop = dom.messageContainer.scrollHeight;
        log('Message added to chat', 'debug', messageObj);
    }

    function createMessageElement(messageObj) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${messageObj.type}`;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.innerHTML = formatMessageText(messageObj.text);
        messageDiv.appendChild(textDiv);
        
        if (messageObj.sources && messageObj.sources.length > 0) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.className = 'message-sources';
            sourcesDiv.innerHTML = '<span class="sources-label">Sources:</span> ' +
                messageObj.sources.map(s => `<span class="source-item">${s}</span>`).join(', ');
            messageDiv.appendChild(sourcesDiv);
        }
        return messageDiv;
    }

    function formatMessageText(text) {
        let formattedText = text
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
        return formattedText.replace(/\n/g, '<br>');
    }

    function showTypingIndicator() {
        if (dom.typingIndicator) dom.typingIndicator.classList.add('show');
    }

    function hideTypingIndicator() {
        if (dom.typingIndicator) dom.typingIndicator.classList.remove('show');
    }

    function getWelcomeMessage() {
        return "Welcome to the brains behind Cortivus! Please select an option below or type your question.";
    }

    function showQuickReplies(replies) {
        dom.quickRepliesContainer.innerHTML = '';
        if (!replies || replies.length === 0) {
            dom.quickRepliesContainer.style.display = 'none';
            return;
        }

        dom.quickRepliesContainer.style.display = 'flex';
        replies.forEach(reply => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.textContent = reply.label;
            button.dataset.action = reply.action;
            button.addEventListener('click', () => handleQuickReplyClick(reply));
            dom.quickRepliesContainer.appendChild(button);
        });
    }

    function handleQuickReplyClick(reply) {
        log(`Quick reply clicked: "${reply.label}"`, 'event', reply);
        showQuickReplies([]); // Hide buttons after click
        addUserMessage(reply.label);

        // Simulate bot response based on action
        showTypingIndicator();
        state.isLoading = true;
        
        const delay = Math.random() * (CONFIG.typingDelay.max - CONFIG.typingDelay.min) + CONFIG.typingDelay.min;
        setTimeout(() => {
            let response;
            switch (reply.action) {
                case 'company_info':
                    response = getCompanyInfoResponse();
                    break;
                case 'contact_info':
                    response = getContactInfoResponse();
                    break;
                case 'policy_demo':
                    response = getDemoPolicyResponse();
                    break;
                case 'sermon_demo':
                    response = getDemoSermonResponse();
                    break;
                default:
                    response = { text: "I'm not sure how to handle that yet." };
            }
            hideTypingIndicator();
            addBotMessage(response.text, response.sources);
            state.isLoading = false;
        }, delay);
    }

    // --- API & Demo Logic ---

    async function callChatAPI(message) {
        try {
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, mode: state.activeMode, history: state.history.slice(-5) })
            });
            
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            
            const data = await response.json();
            const delay = Math.random() * (CONFIG.typingDelay.max - CONFIG.typingDelay.min) + CONFIG.typingDelay.min;
            
            setTimeout(() => {
                hideTypingIndicator();
                addBotMessage(data.response, data.sources);
                state.isLoading = false;
            }, delay);
            
        } catch (error) {
            log(`API call failed: ${error.message}`, 'error');
            hideTypingIndicator();
            addSystemMessage('Sorry, I encountered an error. Please try again later.');
            state.isLoading = false;
        }
    }

    function handleDemoResponse(message) {
        const delay = Math.random() * (CONFIG.typingDelay.max - CONFIG.typingDelay.min) + CONFIG.typingDelay.min;
        setTimeout(() => {
            const demoResponse = state.activeMode === 'policy'
                ? getDemoPolicyResponse(message)
                : getDemoSermonResponse(message);
            
            hideTypingIndicator();
            addBotMessage(demoResponse.text, demoResponse.sources);
            state.isLoading = false;
        }, delay);
    }

    function getDemoPolicyResponse(message) {
        // Placeholder - will be replaced with actual demo data logic
        return {
            text: "This is a demo response for policy mode. The full implementation will use policy data to provide relevant information.",
            sources: ["Demo Policy Document"]
        };
    }

    function getDemoSermonResponse(message) {
        // Placeholder - will be replaced with actual demo data logic
        return {
            text: "This is a demo response for sermon preparation. The full implementation will provide scripture references and sermon outlines.",
            sources: ["Demo Scripture Database"]
        };
    }

    function getCompanyInfoResponse() {
        return {
            text: "Cortivus is a visionary company dedicated to leveraging AI to enhance pastoral and administrative tasks for faith-based organizations. Our tools help with everything from sermon preparation to policy management, allowing leaders to focus more on their community.",
            sources: ["About Us Page"]
        };
    }

    function getContactInfoResponse() {
        return {
            text: "You can easily get in touch with us through the contact form on our website. Just scroll down to the 'Let's Build Something Amazing' section!"
        };
    }

    function loadDemoData() {
        log('Loading demo data into window scope.', 'debug');
        // In a real app, this would be fetched. For demo, it's embedded.
        window.demoPolicyData = { /* ... policies ... */ };
        window.demoSermonData = { /* ... scriptures ... */ };
    }

    // --- Expose Public API ---
    window.CortivusChat = {
        init: init
    };

})(window);
