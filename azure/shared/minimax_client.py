"""
MiniMax API Client for Cortivus Chatbot

This module handles communication with the MiniMax M1 API, including:
- Secure API key management
- Prompt construction
- Response generation
- Token usage tracking
"""

import os
import json
import logging
import requests
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from tenacity import retry, stop_after_attempt, wait_exponential

# Initialize logging
logger = logging.getLogger('cortivus-chatbot')

class MiniMaxClient:
    """Client for interacting with the MiniMax M1 API"""
    
    def __init__(self):
        """Initialize the MiniMax client with API credentials"""
        self.api_key = self._get_api_key()
        self.api_base_url = "https://api.minimax.chat/v1/text/generation"
        self.model = "minimax-m1"
        
        # Default parameters
        self.default_params = {
            "temperature": 0.7,
            "top_p": 0.95,
            "max_tokens": 1000
        }
    
    def _get_api_key(self):
        """
        Retrieve the MiniMax API key from Azure Key Vault
        
        Returns:
            str: The API key
        """
        try:
            # Check if running in Azure Functions environment
            if 'AZURE_KEYVAULT_URL' in os.environ:
                # Use Azure Key Vault
                key_vault_url = os.environ["AZURE_KEYVAULT_URL"]
                secret_name = "MiniMaxApiKey"
                
                credential = DefaultAzureCredential()
                client = SecretClient(vault_url=key_vault_url, credential=credential)
                retrieved_secret = client.get_secret(secret_name)
                
                return retrieved_secret.value
            else:
                # Local development - use environment variable
                api_key = os.environ.get("MINIMAX_API_KEY")
                if not api_key:
                    logger.warning("MINIMAX_API_KEY not found in environment variables")
                return api_key
        except Exception as e:
            logger.error(f"Error retrieving API key: {str(e)}")
            raise
    
    def _construct_prompt(self, user_message, relevant_docs, chat_mode):
        """
        Construct a prompt for the MiniMax API based on the user message and relevant documents
        
        Args:
            user_message (str): The user's message
            relevant_docs (list): List of relevant documents from the RAG system
            chat_mode (str): The chat mode ('policy' or 'sermon')
            
        Returns:
            str: The constructed prompt
        """
        # Base system instructions based on chat mode
        if chat_mode == 'policy':
            system_prompt = """You are the Cortivus Policy Assistant, an AI designed to help users understand Cortivus policies and procedures. 
            Answer questions based only on the provided policy documents. If the answer is not in the documents, politely say you don't have that information.
            Keep responses concise, professional, and helpful. When quoting policies, cite the specific section."""
        else:  # sermon mode
            system_prompt = """You are the Cortivus Sermon Preparation Assistant, an AI designed to help pastors and teachers prepare sermons and Bible studies.
            Use the provided scripture references and commentary to suggest sermon outlines, thematic connections, and application points.
            Balance theological depth with practical application. Cite scripture references when appropriate."""
        
        # Format relevant documents as context
        context = ""
        if relevant_docs:
            context = "Here are relevant documents to help answer the query:\n\n"
            for i, doc in enumerate(relevant_docs):
                context += f"Document {i+1}: {doc.get('content', '')}\n"
                if 'source' in doc:
                    context += f"Source: {doc['source']}\n"
                context += "\n"
        
        # Combine into final prompt
        full_prompt = f"{system_prompt}\n\n{context}\n\nUser query: {user_message}\n\nResponse:"
        
        return full_prompt
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def generate_response(self, user_message, relevant_docs, conversation_history, chat_mode):
        """
        Generate a response using the MiniMax API
        
        Args:
            user_message (str): The user's message
            relevant_docs (list): List of relevant documents from the RAG system
            conversation_history (list): Previous conversation messages
            chat_mode (str): The chat mode ('policy' or 'sermon')
            
        Returns:
            tuple: (response_text, token_usage)
        """
        if not self.api_key:
            logger.error("No API key available")
            return "I'm sorry, but I'm unable to process your request due to a configuration issue. Please try again later.", 0
        
        try:
            # Construct the prompt
            prompt = self._construct_prompt(user_message, relevant_docs, chat_mode)
            
            # Prepare the API request
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            # Prepare messages format
            messages = []
            
            # Add system message
            if chat_mode == 'policy':
                system_content = "You are the Cortivus Policy Assistant. Answer questions based only on the provided policy documents."
            else:
                system_content = "You are the Cortivus Sermon Preparation Assistant. Help users prepare sermons using scripture references and commentary."
            
            messages.append({
                "role": "system",
                "content": system_content
            })
            
            # Add conversation history
            if conversation_history:
                messages.extend(conversation_history[-5:])  # Include last 5 messages for context
            
            # Add context from RAG as a system message
            if relevant_docs:
                context = "Here are relevant documents to help answer the query:\n\n"
                for i, doc in enumerate(relevant_docs):
                    context += f"Document {i+1}: {doc.get('content', '')}\n"
                    if 'source' in doc:
                        context += f"Source: {doc['source']}\n"
                    context += "\n"
                
                messages.append({
                    "role": "system",
                    "content": context
                })
            
            # Add the current user message
            messages.append({
                "role": "user",
                "content": user_message
            })
            
            # Prepare the request payload
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": self.default_params["temperature"],
                "top_p": self.default_params["top_p"],
                "max_tokens": self.default_params["max_tokens"]
            }
            
            # Make the API request
            response = requests.post(
                self.api_base_url,
                headers=headers,
                json=payload
            )
            
            # Check for successful response
            response.raise_for_status()
            response_data = response.json()
            
            # Extract response text and token usage
            response_text = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
            token_usage = response_data.get("usage", {}).get("total_tokens", 0)
            
            return response_text, token_usage
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request error: {str(e)}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response body: {e.response.text}")
            
            # Return a user-friendly error message
            return "I'm sorry, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.", 0
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return "I apologize, but I encountered an unexpected error. Please try again or contact support if the issue persists.", 0
