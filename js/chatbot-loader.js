/**
 * Cortivus Chatbot Loader
 * 
 * This script adds the chatbot to any page where it's included.
 * The chatbot is already self-initializing, so this script just ensures
 * it's properly loaded and styled.
 */

// Add a small script tag to indicate the chatbot is being loaded
console.log('Cortivus Chatbot: Loading...');

// The chatbot is already set to initialize itself on DOMContentLoaded
// No additional initialization needed - the modules handle this internally

// Add a small indicator that the chatbot is available
const chatbotIndicator = document.createElement('div');
chatbotIndicator.style.display = 'none';
chatbotIndicator.id = 'cortivus-chatbot-loaded';
document.body.appendChild(chatbotIndicator);

// If you need to customize the chatbot, you can add configuration here
// For now, we'll use the default settings in the modules
