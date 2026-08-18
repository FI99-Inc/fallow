document.addEventListener('DOMContentLoaded', () => {
    const vibeCards = document.querySelectorAll('.vibe-card');
    
    const vibeProfiles = {
        'low_energy': {
            scores: {
                sociality: -0.6,
                structure: 0.0,
                physicality: -0.8,
                expression: 0.2,
                environment: -0.6,
                barrier: -0.8
            }
        },
        'get_out': {
            scores: {
                sociality: 0.3,
                structure: -0.4,
                physicality: 0.5,
                expression: 0.0,
                environment: 0.8,
                barrier: -0.2
            }
        },
        'use_hands': {
            scores: {
                sociality: -0.2,
                structure: 0.4,
                physicality: 0.2,
                expression: 0.8,
                environment: -0.3,
                barrier: 0.1
            }
        },
        'rabbit_hole': {
            scores: {
                sociality: -0.5,
                structure: 0.6,
                physicality: -0.7,
                expression: -0.4,
                environment: -0.5,
                barrier: -0.5
            }
        }
    };

    vibeCards.forEach(card => {
        card.addEventListener('click', () => {
            const vibe = card.getAttribute('data-vibe');
            const profile = vibeProfiles[vibe];
            if (profile) {
                // Save synthetic profile for this constraint
                localStorage.setItem('fallow_profile', JSON.stringify({
                    timestamp: new Date().toISOString(),
                    scores: profile.scores,
                    rawAnswers: [],
                    constraints: [vibe]
                }));
                // Flag to tell results page to modify copy
                localStorage.setItem('fallow_mode', vibe);
                window.location.href = 'results.html';
            }
        });
    });
});
