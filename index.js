document.addEventListener('DOMContentLoaded', () => {
    // 1. Intersection Observer for fade-up animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once it's visible to run animation only once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach(el => observer.observe(el));

    // 2. Waitlist Form Submission Handling
    const waitlistForm = document.getElementById('waitlist-form');
    const emailInput = document.getElementById('waitlist-email');
    const messageContainer = document.getElementById('waitlist-message');

    if (waitlistForm) {
        waitlistForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            
            if (email) {
                // Proof of concept: store in localStorage
                let waitlist = JSON.parse(localStorage.getItem('fallow_waitlist') || '[]');
                if (!waitlist.includes(email)) {
                    waitlist.push(email);
                    localStorage.setItem('fallow_waitlist', JSON.stringify(waitlist));
                }

                // Show success message
                messageContainer.textContent = "You're on the list! We'll be in touch soon.";
                messageContainer.style.color = '#fff'; // ensure it matches waitlist styling
                
                // Clear input
                emailInput.value = '';
                
                // Reset message after 5 seconds
                setTimeout(() => {
                    messageContainer.textContent = '';
                }, 5000);
            }
        });
    }

    // 3. Smooth scrolling for anchor links (fallback/enhancement)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
