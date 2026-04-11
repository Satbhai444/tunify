// Simple animations and interactions for Tunify Landing Page

document.addEventListener('DOMContentLoaded', () => {
    // Fade in elements on scroll
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card').forEach(card => {
        card.classList.add('fade-in');
        observer.observe(card);
    });

    // Button click effect
    const downloadBtn = document.querySelector('.btn-primary');
    downloadBtn.addEventListener('click', () => {
        console.log('Downloading Tunify APK...');
        // Tracking can be added here
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
