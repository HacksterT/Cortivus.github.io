import azure.functions as func
import logging
import json

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

def get_cors_headers():
    """Return standard CORS headers"""
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "3600"
    }

@app.route(route="chat", methods=["GET", "POST", "OPTIONS"])
def chat_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    logging.info(f'Chat endpoint received a {req.method} request.')
    
    # Handle CORS preflight - this is critical
    if req.method == "OPTIONS":
        logging.info("Handling CORS preflight request")
        return func.HttpResponse(
            "",
            status_code=200,
            headers=get_cors_headers()
        )
    
    try:
        # Handle GET request (for testing)
        if req.method == "GET":
            return func.HttpResponse(
                json.dumps({"message": "Cortivus ChatBot API is running!", "status": "ok"}),
                status_code=200,
                headers={
                    "Content-Type": "application/json",
                    **get_cors_headers()
                }
            )
        
        # Handle POST request
        req_body = req.get_json()
        if not req_body:
            raise ValueError("No JSON body provided")
            
        message = req_body.get('message', '')
        mode = req_body.get('mode', 'company')
        history = req_body.get('history', [])
        
        logging.info(f"Processing message: '{message}' in mode: '{mode}'")
        
        # Route to appropriate handler based on mode
        if mode == 'policy':
            response_data = handle_policy_demo(message)
        elif mode == 'bar':
            response_data = handle_bar_demo(message)
        elif mode == 'sermon':
            response_data = handle_sermon_demo(message)
        else:  # company or default
            response_data = handle_company_qa(message)
        
        return func.HttpResponse(
            json.dumps(response_data),
            status_code=200,
            headers={
                "Content-Type": "application/json",
                **get_cors_headers()
            }
        )
        
    except Exception as e:
        logging.error(f"Error processing request: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Sorry, I encountered an error processing your request.", "details": str(e)}),
            status_code=500,
            headers={
                "Content-Type": "application/json",
                **get_cors_headers()
            }
        )

def handle_policy_demo(message):
    """Handle policy-related questions"""
    message_lower = message.lower()
    
    if 'vacation' in message_lower or 'time off' in message_lower or 'pto' in message_lower:
        return {
            "response": "**Vacation Policy Overview:**\n\nEmployees accrue 2.5 vacation days per month (30 days annually). Vacation time can be used after 90 days of employment. Requests should be submitted at least 2 weeks in advance. Maximum carryover is 40 hours into the next calendar year.\n\n*To receive the complete policy document, please complete our contact form.*",
            "sources": ["Employee Handbook - Section 4.2"]
        }
    elif 'sick' in message_lower or 'medical' in message_lower or 'illness' in message_lower:
        return {
            "response": "**Sick Leave Policy:**\n\nEmployees receive 8 hours of sick leave per month. Sick time can be used for personal illness, medical appointments, or caring for immediate family members. No waiting period required. Unused sick time rolls over annually up to 480 hours maximum.\n\n*Complete our contact form to receive detailed sick leave procedures.*",
            "sources": ["Employee Handbook - Section 4.3"]
        }
    elif 'benefit' in message_lower or 'insurance' in message_lower or '401k' in message_lower:
        return {
            "response": "**Benefits Package:**\n\n• Health Insurance: 100% premium coverage for employee, 80% for family\n• Dental & Vision: Full coverage\n• 401(k): 6% company match\n• Life Insurance: 2x annual salary\n• Professional Development: $2,000 annual allowance\n\n*Get the complete benefits guide by filling out our contact form.*",
            "sources": ["Benefits Summary 2024"]
        }
    else:
        return {
            "response": "I can help you find information about our employee policies including vacation, sick leave, benefits, remote work, and more. What specific policy would you like to know about?\n\n*Complete policy documents are available through our contact form.*",
            "sources": ["HR Policy Database"]
        }

def handle_bar_demo(message):
    """Handle bar recommendation questions"""
    message_lower = message.lower()
    
    if 'sweet' in message_lower or any(num in message_lower for num in ['4', '5']):
        return {
            "response": "Perfect! I've noted you enjoy sweet flavors. Next question:\n\n**Question 2 of 5:** How do you feel about strong alcohol flavors?\n\n1️⃣ Prefer mild  2️⃣ Light spirits  3️⃣ Balanced  4️⃣ Bold flavors  5️⃣ Very strong",
            "sources": ["Taste Profile System"]
        }
    elif 'fruity' in message_lower or 'tropical' in message_lower:
        return {
            "response": "Excellent! Based on your preferences so far, I'm seeing some great cocktail options emerging. A couple more questions:\n\n• Do you enjoy cocktails with fresh herbs (mint, basil)?\n• Preferred base spirit: vodka, rum, gin, or tequila?\n\n*I'll email you 3 personalized cocktail recipes - just complete our contact form when ready!*",
            "sources": ["Cocktail Database", "Taste Profile System"]
        }
    else:
        return {
            "response": "I'm building your taste profile! Tell me more about your preferences:\n\n• Sweet, sour, bitter, or balanced flavors?\n• Favorite spirits or ones you'd like to try?\n• Any cocktails you've enjoyed before?\n\n*Once complete, I'll email you 3 custom cocktail recommendations!*",
            "sources": ["Taste Profile System"]
        }

def handle_sermon_demo(message):
    """Handle sermon preparation questions"""
    message_lower = message.lower()
    
    if 'love' in message_lower or 'compassion' in message_lower:
        return {
            "response": "**Sermon Outline: The Heart of Love**\n\n**I. Introduction:** Love as God's defining characteristic\n**II. The Nature of Divine Love** (1 John 4:8-16)\n**III. Called to Love Others** (John 13:34-35)\n**IV. Love in Action** (1 Corinthians 13:4-8)\n**V. Conclusion:** Living as vessels of God's love\n\n*This is a preview. Complete our contact form to receive the full sermon with commentary, illustrations, and application points via email.*",
            "sources": ["Scripture Database", "Sermon Outline Library"]
        }
    elif 'faith' in message_lower or 'trust' in message_lower:
        return {
            "response": "**Sermon Outline: Unshakeable Faith**\n\n**I. Introduction:** What is biblical faith?\n**II. The Foundation of Faith** (Hebrews 11:1)\n**III. Faith Through Trials** (James 1:2-4)\n**IV. Growing in Faith** (Romans 10:17)\n**V. Conclusion:** Living by faith, not sight\n\n*This is a preview. Fill out our contact form to receive the complete sermon with detailed notes via email.*",
            "sources": ["Scripture Database", "Sermon Outline Library"]
        }
    else:
        return {
            "response": "I can help you develop a sermon on any topic! Popular themes include:\n\n• Faith and Trust\n• Love and Compassion  \n• Hope and Renewal\n• Service and Community\n• Forgiveness and Grace\n\nWhat theme resonates with your congregation right now?\n\n*I'll create a complete sermon outline and email it to you through our contact form.*",
            "sources": ["Sermon Theme Database"]
        }

def handle_company_qa(message):
    """Handle company Q&A questions"""
    message_lower = message.lower()
    
    if 'service' in message_lower or 'what do you do' in message_lower or 'offer' in message_lower:
        return {
            "response": "**What We Offer:**\n\n• **AI Automation** - Streamline repetitive workflows using powerful automation tools integrated with your existing processes\n\n• **RAG Knowledge Systems** - Connect your documents, data, or knowledge base to language models with custom Retrieval-Augmented Generation pipelines\n\n• **Data-Powered Insights** - Build dashboards, models, or reports that turn disconnected data into meaningful insights that drive decision-making\n\nReady to explore how these solutions can transform your organization?",
            "sources": ["Services Overview"]
        }
    elif 'technology' in message_lower or 'tech stack' in message_lower:
        return {
            "response": "**Our Technology Stack:**\n\n• **AI/ML:** Python, Azure OpenAI, Custom LLMs\n• **Backend:** Azure Functions, FastAPI, RESTful APIs\n• **Frontend:** Modern JavaScript, React, Responsive Design\n• **Data:** RAG pipelines, Vector databases, Analytics\n• **Cloud:** Microsoft Azure, Secure & Scalable\n\nWe use cutting-edge, enterprise-grade technologies to build reliable solutions.",
            "sources": ["Technical Capabilities"]
        }
    elif 'price' in message_lower or 'cost' in message_lower or 'pricing' in message_lower:
        return {
            "response": "**Flexible Pricing Options:**\n\nWe believe in transparent, value-based pricing tailored to your needs:\n\n• **Project-Based** - Fixed scope, clear deliverables\n• **Retainer** - Ongoing support and development\n• **Custom Solutions** - Enterprise pricing for large implementations\n\nEvery project starts with a free consultation to understand your specific requirements and provide accurate pricing.",
            "sources": ["Pricing Information"]
        }
    else:
        return {
            "response": "I'm here to answer questions about Cortivus and our AI solutions! Ask me about:\n\n• Our services and capabilities\n• Technology stack and approach\n• Pricing and project options\n• How we can help your organization\n\nWhat would you like to know more about?",
            "sources": ["Company Information"]
        }