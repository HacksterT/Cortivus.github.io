import azure.functions as func
import logging

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

@app.route(route="chat", methods=["POST"])
def chat_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Chat endpoint received a request.')
    
    try:
        # For now, just return a simple response
        return func.HttpResponse(
            '{"response": "Hello from Cortivus chatbot API! -v2", "sources": []}',
            status_code=200,
            headers={"Content-Type": "application/json"}
        )
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return func.HttpResponse(
            '{"error": "Internal server error"}',
            status_code=500,
            headers={"Content-Type": "application/json"}
        )