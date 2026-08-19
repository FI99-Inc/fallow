import { supabase, normalizeActivity } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const dashboardContent = document.getElementById('dashboard-content');
    const completedSection = document.getElementById('completed-section');
    const completedContent = document.getElementById('completed-content');
    const savedSection = document.getElementById('saved-section');
    const savedContent = document.getElementById('saved-content');
    const statusLine = document.getElementById('dashboard-status');

    const announce = (text) => { if (statusLine) statusLine.textContent = text; };
    const read = (key, fallback) => {
        try {
            const raw = JSON.parse(localStorage.getItem(key) || fallback);
            return raw;
        } catch (e) {
            console.error('Corrupt payload in ' + key, e);
            return JSON.parse(fallback);
        }
    };

    const commitments = read('fallow_commitments', '[]');

    if (!Array.isArray(commitments) || commitments.length === 0) {
        renderEmptyState();
    } else {
        commitments.forEach(c => renderCommitment(c));
    }

    renderCompleted();
    renderSaved();



    function renderEmptyState() {
        const template = document.getElementById('emptyStateTemplate');
        if (!template || !dashboardContent) return;
        dashboardContent.appendChild(template.content.cloneNode(true));
    }

    function renderCommitment(activity) {
        const template = document.getElementById('commitmentTemplate');
        if (!template || !dashboardContent || !activity) return;
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.commitment-card');

        clone.querySelector('.category').textContent = activity.category || '';
        clone.querySelector('.activity-name').textContent = activity.name || '';
        clone.querySelector('.experiment-step').textContent =
            (activity.experiment && activity.experiment.smallestStep) || '';

        const isPhysical = activity.category && (activity.category.toLowerCase().includes('physical') || activity.category.toLowerCase().includes('outdoor'));
        const query = encodeURIComponent(activity.name);
        let actionHtml = '';
        if (isPhysical) {
            actionHtml = `<a href="https://www.google.com/maps/search/${query}+near+me" target="_blank" rel="noopener noreferrer" class="btn btn-outline experiment-action">Find ${activity.name} nearby</a>`;
        } else {
            actionHtml = `<a href="https://www.youtube.com/results?search_query=${query}+for+beginners" target="_blank" rel="noopener noreferrer" class="btn btn-outline experiment-action">Watch a beginner guide</a>`;
        }
        const actionDiv = document.createElement('div');
        actionDiv.innerHTML = actionHtml;
        clone.querySelector('.experiment-box').appendChild(actionDiv);

        const buttons = clone.querySelectorAll('.btn-feedback');
        const result = clone.querySelector('.feedback-result');

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const feedback = e.currentTarget.getAttribute('data-feedback');
                handleFeedback(activity, feedback, card, buttons, result);
            });
        });

        dashboardContent.appendChild(clone);
    }

    // Reporting that you loved something used to delete it and reload the page
    // into an empty state. Now it resolves in place and moves to the record of
    // things you actually tried.
    function handleFeedback(activity, feedback, card, buttons, result) {
        if (feedback !== 'cancel') {
            const profileData = read('fallow_profile', 'null');
            if (profileData && profileData.scores && activity.dimensions) {
                const dims = activity.dimensions;
                const multiplier = feedback === 'loved' ? 0.2 : (feedback === 'hated' ? -0.2 : 0.05);

                for (let key in dims) {
                    if (profileData.scores[key] !== undefined) {
                        profileData.scores[key] += (dims[key] * multiplier);
                        profileData.scores[key] = Math.max(-1, Math.min(1, profileData.scores[key]));
                    }
                }
                localStorage.setItem('fallow_profile', JSON.stringify(profileData));
            }
            recordTried(activity, feedback);
        }

        // Remove from the active list
        let list = read('fallow_commitments', '[]');
        if (Array.isArray(list)) {
            list = list.filter(item => item && item.id !== activity.id);
            localStorage.setItem('fallow_commitments', JSON.stringify(list));
        }

        const copy = {
            loved: 'Logged. Your DNA shifted toward more of this.',
            okay: 'Logged. Noted without much of a nudge either way.',
            hated: 'Logged. Your DNA shifted away from this kind of thing.',
            cancel: 'Dropped. No judgement, and no effect on your DNA.'
        };

        buttons.forEach(b => { b.disabled = true; });
        if (result) {
            result.textContent = copy[feedback] || 'Logged.';
            result.hidden = false;
        }
        if (card) card.classList.add('is-resolved');
        announce(copy[feedback] || 'Logged.');

        // Let the confirmation be read, then fold the card away and refresh the
        // record below without throwing the page away.
        setTimeout(() => {
            if (card) card.remove();
            if (completedContent) completedContent.replaceChildren();
            renderCompleted();
            const remaining = read('fallow_commitments', '[]');
            if (Array.isArray(remaining) && remaining.length === 0 && dashboardContent
                && !dashboardContent.querySelector('.empty-state')) {
                renderEmptyState();
            }
        }, 2200);
    }

    function recordTried(activity, feedback) {
        let tried = read('fallow_tried', '[]');
        if (!Array.isArray(tried)) tried = [];
        tried.unshift({
            id: activity.id,
            name: activity.name,
            verdict: feedback,
            date: new Date().toISOString()
        });
        localStorage.setItem('fallow_tried', JSON.stringify(tried));
    }

    function renderCompleted() {
        const tried = read('fallow_tried', '[]');
        const template = document.getElementById('triedTemplate');
        if (!Array.isArray(tried) || tried.length === 0 || !template || !completedContent) return;

        const verdictCopy = { loved: 'Loved it', okay: 'It was okay', hated: 'Not for me' };

        tried.forEach(item => {
            const clone = template.content.cloneNode(true);
            clone.querySelector('.tried-name').textContent = item.name || '';
            const verdictEl = clone.querySelector('.tried-verdict');
            verdictEl.textContent = verdictCopy[item.verdict] || 'Tried';
            verdictEl.dataset.verdict = item.verdict || 'okay';
            clone.querySelector('.tried-date').textContent = formatDate(item.date);
            completedContent.appendChild(clone);
        });

        if (completedSection) completedSection.classList.remove('hidden');
    }

    // Everything saved while swiping used to be written and never shown.
    async function renderSaved() {
        const statuses = read('fallow_statuses', '{}');
        const template = document.getElementById('savedTemplate');
        if (!statuses || !template || !savedContent) return;

        const savedIds = Object.keys(statuses).filter(id => {
            const s = statuses[id];
            return s && (s.status === 'saved' || s.status === 'interested');
        });
        if (savedIds.length === 0) return;

        let activities = [];
        try {
            const { data, error } = await supabase.from('activities').select('*').in('id', savedIds);
            if (error) throw error;
            activities = (data || []).map(normalizeActivity).filter(Boolean);
        } catch (e) {
            console.error('Could not load saved activities', e);
            return;
        }
        if (activities.length === 0) return;

        activities.forEach(act => {
            const clone = template.content.cloneNode(true);
            clone.querySelector('.category').textContent = act.category || '';
            clone.querySelector('.saved-name').textContent = act.name || '';
            clone.querySelector('.saved-hook').textContent = act.hook || '';
            savedContent.appendChild(clone);
        });

        if (savedSection) savedSection.classList.remove('hidden');
    }

    function formatDate(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return '';
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
});
