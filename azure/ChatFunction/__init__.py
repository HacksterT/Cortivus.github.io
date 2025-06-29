import logging
import azure.functions as func
import json
import os
from datetime import datetime
import sys

# Add the shared directory to the path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.minimax_client import MiniMaxClient
from shared.rag_utils import RAGProcessor

# Initialize logging
logger = logging.getLogger('cortivus-chatbot')

def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Main entry point for the Chat Azure Function
    
    This function handles incoming chat requests, processes them through the RAG system,
    and returns responses from the MiniMax API.
    """
    logger.info('Python HTTP trigger function processed a request.')
    
    # Set up CORS headers
    headers = {
        "Access-Control-Allow-Origin": "https://cortivus.github.io",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }
    
    # Handle preflight OPTIONS request
    if req.method == "OPTIONS":
        return func.HttpResponse(
            status_code=200,
            headers=headers
        )
    
    try:
        # Parse request body
        req_body = req.get_json()
        user_message = req_body.get('message')
        chat_mode = req_body.get('mode', 'policy')  # Default to policy mode
        history = req_body.get('history', [])
        
        # Validate input
        if not user_message:
            return func.HttpResponse(
                json.dumps({"error": "No message provided"}),
                status_code=400,
                headers=headers,
                mimetype="application/json"
            )
        
        # Initialize RAG processor
        rag = RAGProcessor()
        
        # Process query through RAG system
        relevant_docs = rag.retrieve_documents(user_message, chat_mode)
        
        # Initialize MiniMax client
        minimax = MiniMaxClient()
        
        # Prepare conversation history for the API
        formatted_history = format_history_for_minimax(history)
        
        # Generate response using MiniMax API
        response_text, token_usage = minimax.generate_response(
            user_message, 
            relevant_docs, 
            formatted_history,
            chat_mode
        )
        
        # Log token usage for monitoring
        logger.info(f"Token usage: {token_usage}")
        
        # Extract sources from relevant documents
        sources = extract_sources(relevant_docs)
        
        # Prepare response
        response = {
            "response": response_text,
            "sources": sources,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return func.HttpResponse(
            json.dumps(response),
            status_code=200,
            headers=headers,
            mimetype="application/json"
        )
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error", "details": str(e)}),
            status_code=500,
            headers=headers,
            mimetype="application/json"
        )

def format_history_for_minimax(history):
    """
    Format conversation history for the MiniMax API
    
    Args:
        history: List of message objects from the frontend
        
    Returns:
        List of formatted messages for the MiniMax API
    """
    formatted_history = []
    
    for msg in history:
        if msg['type'] == 'user':
            formatted_history.append({
                "role": "user",
                "content": msg['text']
            })
        elif msg['type'] == 'bot':
            formatted_history.append({
                "role": "assistant",
                "content": msg['text']
            })
    
    return formatted_history

def extract_sources(relevant_docs):
    """
    Extract source information from relevant documents
    
    Args:
        relevant_docs: List of document objects from the RAG system
        
    Returns:
        List of source strings
    """
    sources = []
    
    for doc in relevant_docs:
        if 'source' in doc and doc['source'] not in sources:
            sources.append(doc['source'])
    
    return sources
