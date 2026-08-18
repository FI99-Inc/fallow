document.addEventListener('DOMContentLoaded', () => {
    const dashboardContent = document.getElementById('dashboard-content');
    const commitment = JSON.parse(localStorage.getItem('fallow_commitment'));
    
    if (!commitment) {
        renderEmptyState();
    } else {
        renderCommitment(commitment);
    }

    function renderEmptyState() {
        const template = document.getElementById('emptyStateTemplate');
        dashboardContent.appendChild(template.content.cloneNode(true));
    }

    function renderCommitment(activity) {
        const template = document.getElementById('commitmentTemplate');
        const clone = template.content.cloneNode(true);

        clone.querySelector('.category').textContent = activity.category;
        clone.querySelector('.activity-name').textContent = activity.name;
        clone.querySelector('.experiment-step').textContent = activity.experiment.smallestStep;

        const buttons = clone.querySelectorAll('.btn-feedback');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const feedback = e.target.getAttribute('data-feedback');
                handleFeedback(activity, feedback);
            });
        });

        dashboardContent.appendChild(clone);
    }

    function handleFeedback(activity, feedback) {
        if (feedback !== 'cancel') {
            // Update DNA based on feedback
            let profileData = JSON.parse(localStorage.getItem('fallow_profile'));
            if (profileData && profileData.scores) {
                const dims = activity.dimensions;
                const multiplier = feedback === 'loved' ? 0.2 : (feedback === 'hated' ? -0.2 : 0.05);
                
                // Shift user profile slightly towards (or away from) the activity's dimensions
                for (let key in dims) {
                    if (profileData.scores[key] !== undefined) {
                        profileData.scores[key] += (dims[key] * multiplier);
                        // clamp between -1 and 1
                        profileData.scores[key] = Math.max(-1, Math.min(1, profileData.scores[key]));
                    }
                }
                localStorage.setItem('fallow_profile', JSON.stringify(profileData));
                alert(`Feedback saved! Your DNA has been updated based on your reaction to ${activity.name}.`);
            }
        }
        
        // Clear commitment
        localStorage.removeItem('fallow_commitment');
        window.location.reload();
    }
});
