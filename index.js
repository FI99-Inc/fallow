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

            if (!email || !email.includes('@')) {
                messageContainer.textContent = 'That email address looks incomplete. Check it and try again.';
                messageContainer.dataset.state = 'error';
                emailInput.focus();
                return;
            }

            if (email) {
                // Proof of concept: store in localStorage
                let waitlist = JSON.parse(localStorage.getItem('fallow_waitlist') || '[]');
                if (!waitlist.includes(email)) {
                    waitlist.push(email);
                    localStorage.setItem('fallow_waitlist', JSON.stringify(waitlist));
                }

                // Show success message
                messageContainer.textContent = "You're on the list. We'll be in touch soon.";
                messageContainer.dataset.state = 'ok';

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


// Hero parallax. Pointer-driven, so it is skipped entirely on touch, honours
// the reduced-motion setting, and coalesces to one write per frame.
(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || calm.matches) return;

    const heroTitle = document.querySelector('.hero h1');
    if (!heroTitle) return;

    let queued = false;
    let px = 0;
    let py = 0;

    const paint = () => {
        queued = false;
        // The entrance animation owns .fade-up's transform until it has landed.
        if (!heroTitle.classList.contains('visible')) return;
        const x = (window.innerWidth / 2 - px) / 50;
        const y = (window.innerHeight / 2 - py) / 50;
        heroTitle.style.transform =
            `perspective(1000px) rotateX(${y}deg) rotateY(${-x}deg) translateZ(10px)`;
    };

    heroTitle.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';

    document.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        px = e.pageX;
        py = e.pageY;
        if (!queued) {
            queued = true;
            requestAnimationFrame(paint);
        }
    }, { passive: true });
})();
