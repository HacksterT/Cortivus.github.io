# Cortivus Website

This repository contains the source code for the Cortivus company website, a static site hosted on GitHub Pages.

## Overview

Cortivus is a technology company specializing in AI solutions, custom RAG (Retrieval-Augmented Generation) systems, and data analytics. This website serves as the company's online presence, showcasing services and providing a contact form for potential clients.

## Features

- Responsive design that works on mobile, tablet, and desktop devices
- Modern UI with animated elements and gradients
- Contact form integration using Formspree
- Smooth scrolling navigation
- CSS Grid and Flexbox layout

## Technology Stack

- HTML5
- CSS3 (with custom variables and animations)
- Vanilla JavaScript
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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions about this website, please contact [info@cortivus.com](mailto:info@cortivus.com).
