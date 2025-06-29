/**
 * Cortivus Website Main JavaScript
 * Handles mobile navigation, smooth scrolling, and other UI interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const nav = document.querySelector('nav');
    
    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', function() {
            nav.classList.toggle('mobile-active');
            
            // Change icon based on state
            const icon = mobileNavToggle.querySelector('i');
            if (nav.classList.contains('mobile-active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
    
    // Close mobile menu when clicking a nav link
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (nav.classList.contains('mobile-active')) {
                nav.classList.remove('mobile-active');
                
                // Reset icon
                const icon = mobileNavToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });
    
    // Handle window resize - reset mobile nav if window size changes
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && nav.classList.contains('mobile-active')) {
            nav.classList.remove('mobile-active');
            
            // Reset icon
            const icon = mobileNavToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
});
