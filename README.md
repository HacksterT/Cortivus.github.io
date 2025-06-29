# Cortivus Website

This repository contains the source code for the Cortivus company website, a static site hosted on GitHub Pages.

## Overview

Cortivus is a technology company specializing in AI solutions, custom RAG (Retrieval-Augmented Generation) systems, and data analytics. This website serves as the company's online presence, showcasing services and providing a contact form for potential clients. The site features a modern, responsive design with interactive elements and will soon include an AI chatbot demonstration.

## Features

- Responsive design that works on mobile, tablet, and desktop devices
- Modern UI with animated elements and gradients
- Interactive workflow list with custom icons and hover effects
- Two-column layout with optimized container sizing
- Contact form integration using Formspree
- Smooth scrolling navigation
- CSS Grid and Flexbox layout
- External stylesheet architecture for maintainability

## Technology Stack

- HTML5
- CSS3 (with custom variables, animations, and responsive design)
- Vanilla JavaScript
- Font Awesome for custom icons
- GitHub Pages for hosting
- Formspree for form handling

## Development

### Local Development

To work on this website locally:

1. Clone the repository:

   ```bash
   git clone https://github.com/HacksterT/Cortivus.github.io.git
   ```

2. Open the project in your preferred code editor.

3. Make changes to the HTML, CSS, or JavaScript as needed.

4. Test your changes by opening the `index.html` file in a web browser.

### FormSpree Integration

The contact form uses [FormSpree](https://formspree.io/) for processing form submissions without requiring a backend server:

1. The form in `index.html` includes an action URL pointing to FormSpree:

   ```html
   <form action="https://formspree.io/f/xwpbrabj" method="POST">
   ```

2. When users submit the form, FormSpree handles the submission and emails the form data to the registered email address.

3. To modify the form destination:
   - Create an account on FormSpree
   - Set up a new form and get a new endpoint
   - Replace the existing endpoint in the form action attribute

### Deployment

The website is automatically deployed to GitHub Pages when changes are pushed to the main branch:

1. Commit your changes:

   ```bash
   git add .
   git commit -m "Description of changes"
   ```

2. Push to GitHub:

   ```bash
   git push origin main
   ```

3. GitHub Pages will automatically build and deploy the site to the custom domain `https://cortivus.com`.

## Custom Domain

This site is hosted on GitHub Pages with the custom domain `cortivus.com`, configured via the CNAME file. The domain setup includes:

1. A CNAME file in the repository root containing the domain name
2. DNS settings with the domain registrar pointing to GitHub Pages
3. GitHub Pages settings configured to use the custom domain

If you need to change the domain in the future:

1. Update the CNAME file with the new domain
2. Update DNS settings with your domain registrar
3. Configure GitHub Pages settings in the repository

## Chatbot Implementation Plan

### Purpose & Functionality

1. **Showcase Expertise**: Demonstrate RAG and AI assistant capabilities directly on the website
2. **Lead Generation**: Capture visitor information and qualify leads
3. **Answer FAQs**: Handle common questions about services
4. **Provide Examples**: Show how solutions work in real-time through interactive demos

### Technical Implementation

#### LLM Selection

- **Primary Choice**: MiniMax M1
  - Cost-effective: $0.40/million tokens for input, $2.20/million tokens for output
  - 1 million token context window (ideal for document demos)
  - Strong reasoning capabilities for complex tasks

#### Architecture

```ascii
GitHub Pages Site (Static Frontend)
    │
    ├── HTML/CSS/JS
    │   └── Chatbot UI Component
    │
    └── API Requests ───────┐
                           │
                           ▼
                    Azure Function
                           │
                           ▼
                      MiniMax API
```

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
  - Custom chat interface with site-matching design
  - Responsive layout for all devices
  - Local storage for conversation history

- **Backend**: Azure Functions (Python)
  - Seamless integration with existing Python RAG system
  - Serverless architecture on existing Azure business account
  - Secure API key management via Azure Key Vault
  - CORS configuration for GitHub Pages integration

- **Integration**: REST API
  - JSON message format
  - Asynchronous communication
  - Error handling and retry logic

#### Demo Scenarios

1. **Policy Retrieval Demo**
   - Pre-loaded sample policies in JSON format
   - Interactive Q&A about policy contents
   - Visual demonstration of retrieval process with highlighting

2. **Sermon Prep Assistant Demo**
   - Scripture database with commentary (JSON/XML format)
   - Thematic analysis and connections
   - Sermon outline generation with exportable format

#### Python Implementation Details

- **Libraries & Frameworks**:
  - FastAPI for API endpoint structure within Azure Functions
  - Langchain for RAG pipeline integration
  - Azure SDK for Python for cloud service integration
  - Requests for API communication with MiniMax

- **Error Handling & Logging**:
  - Comprehensive try/except blocks with detailed error messages
  - Azure Application Insights integration for monitoring
  - Proper HTTP status codes and error responses

- **RAG Integration**:
  - Direct import of existing Python RAG components
  - Shared utility functions between local development and Azure
  - Optimized document chunking for context window management

#### Cost Management

- Context window optimization (60-80% token reduction)
- Caching common responses in browser localStorage
- Selective document retrieval with Azure Functions
- Leveraging Azure Functions free tier (1M executions/month)
- Efficient Python implementation to minimize execution time

### Implementation Timeline

1. Frontend UI development (HTML/CSS/JS) - 1 week
2. Azure Function setup and API integration - 1 week
3. Demo content creation and formatting - 3 days
4. Testing and optimization - 2 days
5. Production deployment - 1 day

## Recent Updates

- Extracted inline CSS to external stylesheet
- Fixed layout issues with workflow list
- Added Font Awesome icons to workflow items
- Enhanced color scheme with gradient text and hover effects
- Optimized container sizing for different screen sizes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions about this website, please contact [servingyou@cortivus.com](mailto:servingyou@cortivus.com).
