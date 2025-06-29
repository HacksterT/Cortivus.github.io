/**
 * Cortivus Chatbot - Main Controller Module
 *
 * This module handles the core chatbot functionality including:
 * - Initialization and event listener setup.
 * - State management (open/closed, loading, mode).
 * - Message handling and API communication.
 * - Demo mode responses and demo button handling.
 */
(function(window) {
    'use strict';

    // --- Configuration ---
    const CONFIG = {
        apiEndpoint: window.location.hostname === 'localhost' 
            ? 'http://localhost:7071/api/chat'  // Local
            : 'https://cortivus-chatbot-api-a7athug0ggcybrec.eastus-01.azurewebsites.net/api/chat', // Azure
        demoMode: window.location.hostname === 'localhost',
        maxHistoryItems: 50,
        typingDelay: { min: 300, max: 1500 }
    };

    // --- State ---
    const state = {
        isChatOpen: false,
        isLoading: false,
        activeDemo: null, // 'policy', 'bar', 'sermon', or null for company Q&A
        history: [],
        currentSessionId: null,
        demoData: {} // Will store demo-specific data
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

        // Set up demo button event listeners
        if (dom.demoButtons) {
            Object.keys(dom.demoButtons).forEach(demoType => {
                const button = dom.demoButtons[demoType];
                if (button) {
                    button.addEventListener('click', () => handleDemoButtonClick(demoType));
                }
            });
        }

        log('All event listeners attached.', 'debug');
    }

    /**
     * Handles demo button clicks
     * @param {string} demoType - The type of demo ('policy', 'bar', 'sermon')
     */
    function handleDemoButtonClick(demoType) {
        log(`Demo button clicked: ${demoType}`, 'event');
        
        // Check if switching from another demo
        if (state.activeDemo && state.activeDemo !== demoType) {
            const currentDemoName = getDemoDisplayName(state.activeDemo);
            const newDemoName = getDemoDisplayName(demoType);
            
            const confirmMessage = `You're currently in ${currentDemoName}. Switch to ${newDemoName}? Your previous conversation will be cleared.`;
            
            if (!confirm(confirmMessage)) {
                return; // User cancelled the switch
            }
            
            // Clear chat history when switching demos
            clearChatMessages();
        }
        
        // Update active demo state
        setActiveDemo(demoType);
        
        // Clear previous demo quick replies if any
        showQuickReplies([]);
        
        // Add system message about demo activation
        const demoName = getDemoDisplayName(demoType);
        addSystemMessage(`${demoName} activated. ${getDemoInstructions(demoType)}`);
        
        // Show demo-specific quick start options
        showDemoQuickReplies(demoType);
    }

    /**
     * Gets the display name for a demo type
     * @param {string} demoType - The demo type
     * @returns {string} Display name
     */
    function getDemoDisplayName(demoType) {
        const names = {
            'policy': 'Policy Demo',
            'bar': 'Bar Demo', 
            'sermon': 'Sermon Demo',
            'company': 'Company Q&A'
        };
        return names[demoType] || demoType;
    }

    /**
     * Clears all chat messages except system messages
     */
    function clearChatMessages() {
        if (dom.messageContainer) {
            dom.messageContainer.innerHTML = '';
        }
        state.history = [];
        log('Chat messages cleared for demo switch', 'info');
    }

    /**
     * Sets the active demo and updates UI accordingly
     * @param {string} demoType - The demo type to activate
     */
    function setActiveDemo(demoType) {
        // Remove active class from all demo buttons
        if (dom.demoButtons) {
            Object.values(dom.demoButtons).forEach(btn => {
                if (btn) btn.classList.remove('active');
            });
        }
        
        // Set new active demo
        state.activeDemo = demoType;
        
        // Add active class to clicked button
        if (dom.demoButtons && dom.demoButtons[demoType]) {
            dom.demoButtons[demoType].classList.add('active');
        }
        
        const placeholders = {
            'policy': 'Ask about leave policies, benefits, or HR procedures...',
            'bar': 'Tell me about your taste preferences...',
            'sermon': 'What topic or scripture would you like to explore?',
            'company': 'Ask about our services, technology, or how we can help...'
        };
        
        if (dom.inputField && placeholders[demoType]) {
            dom.inputField.placeholder = placeholders[demoType];
        }
        
        log(`Active demo set to: ${demoType}`, 'state');
    }

    /**
     * Returns instructions for each demo type
     * @param {string} demoType - The demo type
     * @returns {string} Instructions text
     */
    function getDemoInstructions(demoType) {
        const instructions = {
            'policy': 'Ask me about employee policies, leave programs, benefits, or HR procedures. I can search through policy documents and provide relevant information.',
            'bar': 'Tell me about your taste preferences and I\'ll recommend cocktails perfectly suited to your palate. At the end, I\'ll send the full recipes to your email.',
            'sermon': 'Share a topic, scripture reference, or theme you\'d like to explore. I\'ll help create a comprehensive sermon outline and email it to you.',
            'company': 'Ask me about Cortivus services, our technology capabilities, pricing, or how we can help your organization. I\'m here to answer questions about our company and solutions.'
        };
        return instructions[demoType] || 'Demo instructions not available.';
    }

    /**
     * Shows demo-specific quick reply options
     * @param {string} demoType - The demo type
     */
    function showDemoQuickReplies(demoType) {
        const quickReplies = {
            'policy': [
                { label: 'Vacation Policy', action: 'policy_vacation' },
                { label: 'Sick Leave', action: 'policy_sick' },
                { label: 'Benefits Overview', action: 'policy_benefits' },
                { label: 'Remote Work', action: 'policy_remote' }
            ],
            'bar': [
                { label: 'I like sweet drinks', action: 'taste_sweet' },
                { label: 'I prefer strong cocktails', action: 'taste_strong' },
                { label: 'I enjoy fruity flavors', action: 'taste_fruity' },
                { label: 'Start taste profile', action: 'taste_profile' }
            ],
            'sermon': [
                { label: 'Love & Compassion', action: 'sermon_love' },
                { label: 'Faith & Trust', action: 'sermon_faith' },
                { label: 'Service & Community', action: 'sermon_service' },
                { label: 'Hope & Renewal', action: 'sermon_hope' }
            ],
            'company': [
                { label: 'Our Services', action: 'company_services' },
                { label: 'Technology Stack', action: 'company_tech' },
                { label: 'Pricing Info', action: 'company_pricing' },
                { label: 'Get Started', action: 'company_contact' }
            ]
        };
        
        if (quickReplies[demoType]) {
            showQuickReplies(quickReplies[demoType]);
        }
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

        // Route message based on active demo
        if (state.activeDemo) {
            handleDemoResponse(messageText, state.activeDemo);
        } else {
            // Company Q&A mode
            if (CONFIG.demoMode) {
                handleCompanyQADemo(messageText);
            } else {
                callChatAPI(messageText);
            }
        }
    }

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
    function addBotMessage(text, sources = []) { 
        const messageObj = { type: 'bot', text, sources };
        
        // Add demo indicator for bot messages
        if (state.activeDemo) {
            messageObj.demoMode = getDemoDisplayName(state.activeDemo);
        } else {
            messageObj.demoMode = 'Company Q&A';
        }
        
        addMessageToChat(messageObj); 
    }
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
        
        // Add demo mode indicator for bot messages
        if (messageObj.type === 'bot' && messageObj.demoMode) {
            const demoIndicator = document.createElement('div');
            demoIndicator.className = 'demo-indicator';
            demoIndicator.textContent = messageObj.demoMode;
            messageDiv.appendChild(demoIndicator);
        }
        
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
        return "Welcome to The Cortivus Brain! Click a demo button above to explore our capabilities, or ask me about our company and services.";
    }

    function showQuickReplies(replies) {
        if (!dom.quickRepliesContainer) return;
        
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

        // Simulate bot response based on action and current demo mode
        showTypingIndicator();
        state.isLoading = true;
        
        const delay = Math.random() * (CONFIG.typingDelay.max - CONFIG.typingDelay.min) + CONFIG.typingDelay.min;
        setTimeout(() => {
            let response;
            
            // Handle demo-specific quick replies
            if (state.activeDemo) {
                response = handleDemoQuickReply(reply, state.activeDemo);
            } else {
                // Handle general quick replies
                switch (reply.action) {
                    case 'contact_info':
                        response = getContactInfoResponse();
                        break;
                    default:
                        response = { text: "I'm not sure how to handle that yet." };
                }
            }
            
            hideTypingIndicator();
            addBotMessage(response.text, response.sources);
            state.isLoading = false;
            // Re-show company quick replies if in company demo
            if (state.activeDemo === 'company') {
                setTimeout(() => {
                    showDemoQuickReplies('company');
                }, 750);
            }
        }, delay);
    }

    /**
     * Handles demo-specific quick reply responses
     * @param {object} reply - The quick reply object
     * @param {string} demoType - The active demo type
     * @returns {object} Response object with text and sources
     */
    function handleDemoQuickReply(reply, demoType) {
        switch (demoType) {
            case 'policy':
                return handlePolicyQuickReply(reply);
            case 'bar':
                return handleBarQuickReply(reply);
            case 'sermon':
                return handleSermonQuickReply(reply);
            case 'company':
                return handleCompanyQuickReply(reply);
            default:
                return { text: "Demo mode not recognized." };
        }
    }

    function handlePolicyQuickReply(reply) {
        const responses = {
            'policy_vacation': {
                text: "**Vacation Policy Overview:**\n\nEmployees accrue 2.5 vacation days per month (30 days annually). Vacation time can be used after 90 days of employment. Requests should be submitted at least 2 weeks in advance. Maximum carryover is 40 hours into the next calendar year.\n\n*To receive the complete policy document, please complete our contact form.*",
                sources: ["Employee Handbook - Section 4.2"]
            },
            'policy_sick': {
                text: "**Sick Leave Policy:**\n\nEmployees receive 8 hours of sick leave per month. Sick time can be used for personal illness, medical appointments, or caring for immediate family members. No waiting period required. Unused sick time rolls over annually up to 480 hours maximum.\n\n*Complete our contact form to receive detailed sick leave procedures.*",
                sources: ["Employee Handbook - Section 4.3"]
            },
            'policy_benefits': {
                text: "**Benefits Package:**\n\n• Health Insurance: 100% premium coverage for employee, 80% for family\n• Dental & Vision: Full coverage\n• 401(k): 6% company match\n• Life Insurance: 2x annual salary\n• Professional Development: $2,000 annual allowance\n\n*Get the complete benefits guide by filling out our contact form.*",
                sources: ["Benefits Summary 2024"]
            },
            'policy_remote': {
                text: "**Remote Work Policy:**\n\nEligible employees may work remotely up to 3 days per week after 6 months of employment. Home office stipend of $500 provided. Core collaboration hours: 10 AM - 3 PM in company time zone. Productivity metrics apply.\n\n*Access the full remote work agreement through our contact form.*",
                sources: ["Remote Work Policy - Updated 2024"]
            }
        };
        
        return responses[reply.action] || { text: "Policy information not found." };
    }

    function handleBarQuickReply(reply) {
        const responses = {
            'taste_sweet': {
                text: "Great! I'll note that you enjoy sweet cocktails. Let me ask a few more questions to perfect your recommendations:\n\n• Do you prefer fruity sweetness or more dessert-like flavors?\n• Any favorite spirits? (vodka, rum, whiskey, etc.)\n• How do you feel about creamy textures?",
                sources: ["Taste Profile System"]
            },
            'taste_strong': {
                text: "Perfect! I love working with people who appreciate bold flavors. A few more questions:\n\n• Which spirits do you gravitate toward?\n• Do you enjoy bitter or smoky notes?\n• Neat, on the rocks, or mixed but strong?\n\nI'm building your profile for some fantastic recommendations!",
                sources: ["Taste Profile System"]
            },
            'taste_fruity': {
                text: "Excellent choice! Fruity cocktails offer such variety. Help me narrow it down:\n\n• Tropical fruits (pineapple, mango) or classic fruits (berry, citrus)?\n• Light and refreshing or rich and complex?\n• Any fruits you particularly love or want to avoid?",
                sources: ["Taste Profile System"]
            },
            'taste_profile': {
                text: "Let's create your perfect taste profile! I'll ask 5 quick questions:\n\n**Question 1 of 5:** On a scale of 1-5, how much do you enjoy sweet flavors in your drinks?\n\n1️⃣ Not at all  2️⃣ A little  3️⃣ Moderate  4️⃣ Quite sweet  5️⃣ Very sweet",
                sources: ["Taste Profile System"]
            }
        };
        
        return responses[reply.action] || { text: "Let me know your taste preferences and I'll recommend the perfect cocktails!" };
    }

    function handleSermonQuickReply(reply) {
        const responses = {
            'sermon_love': {
                text: "**Love & Compassion Theme:**\n\nThis is a beautiful and foundational topic. Here are some key scriptures to consider:\n\n• 1 Corinthians 13:4-8 (Love is patient and kind...)\n• John 13:34-35 (A new commandment I give you...)\n• 1 John 4:7-12 (Beloved, let us love one another...)\n\nWould you like me to develop a full sermon outline? I'll need your email to send the complete structure with commentary and application points.",
                sources: ["Scripture Database", "Sermon Themes Library"]
            },
            'sermon_faith': {
                text: "**Faith & Trust Theme:**\n\nA powerful topic for any congregation. Key passages include:\n\n• Hebrews 11:1 (Now faith is the substance of things hoped for...)\n• Romans 10:17 (Faith comes by hearing...)\n• Matthew 17:20 (If you have faith like a mustard seed...)\n\nI can create a comprehensive sermon outline with introduction, main points, illustrations, and application. Provide your email and I'll send the full outline.",
                sources: ["Scripture Database", "Sermon Themes Library"]
            },
            'sermon_service': {
                text: "**Service & Community Theme:**\n\nThis theme resonates deeply with congregational life. Consider these scriptures:\n\n• Mark 10:43-44 (Whoever wants to be great among you...)\n• Galatians 5:13 (Serve one another in love)\n• 1 Peter 4:10 (Each should use their gifts to serve others...)\n\nReady for a full sermon outline? I'll develop main points, supporting verses, and practical applications. Just provide your email for delivery.",
                sources: ["Scripture Database", "Sermon Themes Library"]
            },
            'sermon_hope': {
                text: "**Hope & Renewal Theme:**\n\nA message of encouragement and transformation. Key texts:\n\n• Romans 15:13 (May the God of hope fill you...)\n• 2 Corinthians 5:17 (If anyone is in Christ, new creation...)\n• Jeremiah 29:11 (For I know the plans I have for you...)\n\nI can craft a complete sermon outline with theological depth and practical application. Share your email and I'll send the full outline with commentary.",
                sources: ["Scripture Database", "Sermon Themes Library"]
            }
        };
        
        return responses[reply.action] || { text: "Share your sermon topic and I'll help develop a comprehensive outline!" };
    }

    function handleCompanyQuickReply(reply) {
        const responses = {
            'company_services': {
                text: "**What We Offer:**\n\n• **AI Automation** - Streamline repetitive workflows using powerful automation tools integrated with your existing processes\n\n• **RAG Knowledge Systems** - Connect your documents, data, or knowledge base to language models with custom Retrieval-Augmented Generation pipelines\n\n• **Data-Powered Insights** - Build dashboards, models, or reports that turn disconnected data into meaningful insights that drive decision-making\n\nReady to explore how these solutions can transform your organization?",
                sources: ["Services Overview"]
            },
            'company_tech': {
                text: "**Our Technology Stack:**\n\n• **AI/ML:** Python, Azure OpenAI, Custom LLMs\n• **Backend:** Azure Functions, FastAPI, RESTful APIs\n• **Frontend:** Modern JavaScript, React, Responsive Design\n• **Data:** RAG pipelines, Vector databases, Analytics\n• **Cloud:** Microsoft Azure, Secure & Scalable\n\nWe use cutting-edge, enterprise-grade technologies to build reliable solutions.",
                sources: ["Technical Capabilities"]
            },
            'company_pricing': {
                text: "**Flexible Pricing Options:**\n\nWe believe in transparent, value-based pricing tailored to your needs:\n\n• **Project-Based** - Fixed scope, clear deliverables\n• **Retainer** - Ongoing support and development\n• **Custom Solutions** - Enterprise pricing for large implementations\n\nEvery project starts with a free consultation to understand your specific requirements and provide accurate pricing.",
                sources: ["Pricing Information"]
            },
            'company_contact': {
                text: "**Ready to Get Started?**\n\nWe'd love to discuss how AI can transform your organization!\n\n**Next Steps:**\n1. Complete our contact form below\n2. Schedule a free 30-minute consultation\n3. Receive a custom proposal for your needs\n\nScroll down to the 'Let's Build Something Amazing' section to begin!",
                sources: ["Contact Information"]
            }
        };
        
        return responses[reply.action] || { text: "Service information not found." };
    }

    // --- API & Demo Logic ---

    async function callChatAPI(message) {
        try {
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message, 
                    mode: state.activeDemo || 'company', 
                    history: state.history.slice(-5) 
                })
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

    function handleDemoResponse(message, demoType) {
        const delay = Math.random() * (CONFIG.typingDelay.max - CONFIG.typingDelay.min) + CONFIG.typingDelay.min;
        setTimeout(() => {
            let demoResponse;
            
            switch(demoType) {
                case 'policy':
                    demoResponse = getDemoPolicyResponse(message);
                    break;
                case 'bar':
                    demoResponse = getDemoBarResponse(message);
                    break;
                case 'sermon':
                    demoResponse = getDemoSermonResponse(message);
                    break;
                case 'company':
                    demoResponse = getCompanyQAResponse(message);
                    break;
                default:
                    demoResponse = { text: "Demo mode not recognized." };
            }
            
            hideTypingIndicator();
            addBotMessage(demoResponse.text, demoResponse.sources);
            state.isLoading = false;
        }, delay);
    }

    function handleCompanyQADemo(message) {
        const delay = Math.random() * (CONFIG.typingDelay.max - CONFIG.typingDelay.min) + CONFIG.typingDelay.min;
        setTimeout(() => {
            const response = getCompanyQAResponse(message);
            hideTypingIndicator();
            addBotMessage(response.text, response.sources);
            state.isLoading = false;
        }, delay);
    }

    function getDemoPolicyResponse(message) {
        // Enhanced policy demo responses
        const lowercaseMessage = message.toLowerCase();
        
        if (lowercaseMessage.includes('vacation') || lowercaseMessage.includes('time off') || lowercaseMessage.includes('pto')) {
            return {
                text: "Based on our vacation policy, employees accrue 2.5 days monthly (30 days annually). You can use vacation time after 90 days of employment. Please submit requests 2 weeks in advance when possible.\n\n*For the complete policy document with all details and procedures, please fill out our contact form.*",
                sources: ["Employee Handbook Section 4.2", "HR Policy Database"]
            };
        } else if (lowercaseMessage.includes('sick') || lowercaseMessage.includes('medical') || lowercaseMessage.includes('illness')) {
            return {
                text: "Our sick leave policy provides 8 hours monthly with no waiting period. You can use it for personal illness, medical appointments, or caring for immediate family. Unused time rolls over up to 480 hours maximum.\n\n*Complete our contact form to receive the detailed sick leave procedures.*",
                sources: ["Employee Handbook Section 4.3"]
            };
        } else if (lowercaseMessage.includes('benefit') || lowercaseMessage.includes('insurance') || lowercaseMessage.includes('401k')) {
            return {
                text: "Our comprehensive benefits include 100% health insurance premium coverage for employees, dental/vision coverage, 401(k) with 6% match, life insurance, and $2,000 professional development allowance.\n\n*Get the complete benefits guide by submitting our contact form.*",
                sources: ["Benefits Summary 2024", "HR Benefits Database"]
            };
        } else {
            return {
                text: "I can help you find information about our employee policies including vacation, sick leave, benefits, remote work, and more. What specific policy would you like to know about?\n\n*Complete policy documents are available through our contact form.*",
                sources: ["HR Policy Database"]
            };
        }
    }

    function getDemoBarResponse(message) {
        const lowercaseMessage = message.toLowerCase();
        
        // Track taste profile responses
        if (!state.demoData.tasteProfile) {
            state.demoData.tasteProfile = {};
        }
        
        if (lowercaseMessage.includes('sweet') || lowercaseMessage.match(/[45]/)) {
            state.demoData.tasteProfile.sweetness = 'high';
            return {
                text: "Perfect! I've noted you enjoy sweet flavors. Next question:\n\n**Question 2 of 5:** How do you feel about strong alcohol flavors?\n\n1️⃣ Prefer mild  2️⃣ Light spirits  3️⃣ Balanced  4️⃣ Bold flavors  5️⃣ Very strong",
                sources: ["Taste Profile System"]
            };
        } else if (lowercaseMessage.includes('fruity') || lowercaseMessage.includes('tropical')) {
            return {
                text: "Excellent! Based on your preferences so far, I'm seeing some great cocktail options emerging. A couple more questions:\n\n• Do you enjoy cocktails with fresh herbs (mint, basil)?\n• Preferred base spirit: vodka, rum, gin, or tequila?\n\n*I'll email you 3 personalized cocktail recipes - just complete our contact form when ready!*",
                sources: ["Cocktail Database", "Taste Profile System"]
            };
        } else {
            return {
                text: "I'm building your taste profile! Tell me more about your preferences:\n\n• Sweet, sour, bitter, or balanced flavors?\n• Favorite spirits or ones you'd like to try?\n• Any cocktails you've enjoyed before?\n\n*Once complete, I'll email you 3 custom cocktail recommendations!*",
                sources: ["Taste Profile System"]
            };
        }
    }

    function getDemoSermonResponse(message) {
        const lowercaseMessage = message.toLowerCase();
        
        if (lowercaseMessage.includes('love') || lowercaseMessage.includes('compassion')) {
            return {
                text: "**Sermon Outline: The Heart of Love**\n\n**I. Introduction:** Love as God's defining characteristic\n**II. The Nature of Divine Love** (1 John 4:8-16)\n**III. Called to Love Others** (John 13:34-35)\n**IV. Love in Action** (1 Corinthians 13:4-8)\n**V. Conclusion:** Living as vessels of God's love\n\n*This is a preview. Complete our contact form to receive the full sermon with commentary, illustrations, and application points via email.*",
                sources: ["Scripture Database", "Sermon Outline Library"]
            };
        } else if (lowercaseMessage.includes('faith') || lowercaseMessage.includes('trust')) {
            return {
                text: "**Sermon Outline: Unshakeable Faith**\n\n**I. Introduction:** What is biblical faith?\n**II. The Foundation of Faith** (Hebrews 11:1)\n**III. Faith Through Trials** (James 1:2-4)\n**IV. Growing in Faith** (Romans 10:17)\n**V. Conclusion:** Living by faith, not sight\n\n*This is a preview. Fill out our contact form to receive the complete sermon with detailed notes via email.*",
                sources: ["Scripture Database", "Sermon Outline Library"]
            };
        } else {
            return {
                text: "I can help you develop a sermon on any topic! Popular themes include:\n\n• Faith and Trust\n• Love and Compassion  \n• Hope and Renewal\n• Service and Community\n• Forgiveness and Grace\n\nWhat theme resonates with your congregation right now?\n\n*I'll create a complete sermon outline and email it to you through our contact form.*",
                sources: ["Sermon Theme Database"]
            };
        }
    }

    function getCompanyQAResponse(message) {
        const lowercaseMessage = message.toLowerCase();
        
        if (lowercaseMessage.includes('service') || lowercaseMessage.includes('what do you do')) {
            return {
                text: "Cortivus specializes in AI solutions for faith-based organizations and businesses. We create custom RAG systems, develop intelligent chatbots, provide data analytics, and build AI-powered tools for sermon preparation, policy management, and administrative tasks.",
                sources: ["Company Overview"]
            };
        } else if (lowercaseMessage.includes('contact') || lowercaseMessage.includes('get in touch')) {
            return getContactInfoResponse();
        } else if (lowercaseMessage.includes('technology') || lowercaseMessage.includes('tech stack')) {
            return {
                text: "We work with cutting-edge AI technologies including Python, Azure cloud services, various LLM APIs, RAG implementations, and modern web frameworks. Our solutions are designed to be scalable, secure, and user-friendly.",
                sources: ["Technical Capabilities"]
            };
        } else {
            return {
                text: "I'm here to help answer questions about Cortivus and our AI solutions. We specialize in helping organizations leverage artificial intelligence for practical applications. What would you like to know more about?",
                sources: ["Company Information"]
            };
        }
    }

    function getContactInfoResponse() {
        return {
            text: "Ready to explore how AI can transform your organization? Complete the contact form on our website (scroll down to 'Let's Build Something Amazing') and we'll discuss your specific needs and how our solutions can help!"
        };
    }

    function loadDemoData() {
        log('Loading demo data into window scope.', 'debug');
        // In a real app, this would be fetched. For demo, it's embedded.
        window.demoPolicyData = { /* ... policies ... */ };
        window.demoSermonData = { /* ... scriptures ... */ };
        window.demoBarData = { /* ... cocktail recipes ... */ };
    }

    // --- Expose Public API ---
    window.CortivusChat = {
        init: init,
        setActiveDemo: setActiveDemo  // Expose for external demo button handling if needed
    };

})(window);