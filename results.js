import { shareDNA } from './share.js';
import { supabase, normalizeActivity } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Read user profile from localStorage (mock if absent)
    let profileData = JSON.parse(localStorage.getItem('fallow_profile'));
    if (!profileData || !profileData.scores) {
        // Fallback for direct linking
        profileData = {
            scores: { sociality: 0.2, structure: -0.4, physicality: 0.1, expression: 0.8, environment: 0.3, barrier: -0.5 },
            insights: ["Creative Maker", "Prefers Unstructured Time", "Low Barrier to Entry"]
        };
    }
    const userProfile = profileData.scores;
    const insights = profileData.insights || ['Curious Explorer', 'Ready for anything'];

    // Share button listener
    const shareBtn = document.getElementById('share-results-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
            e.preventDefault();
            shareDNA(insights);
        });
    }

    // Blend button listener
    const blendBtn = document.getElementById('blend-btn');
    if (blendBtn) {
        blendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const profileData = JSON.parse(localStorage.getItem('fallow_profile'));
            if (profileData && profileData.scores) {
                const encoded = btoa(JSON.stringify(profileData.scores));
                const link = window.location.origin + '/browse.html?blend=' + encoded;
                navigator.clipboard.writeText(link).then(() => {
                    alert("Blend link copied! Send it to a partner or friend to find activities you both like.");
                }).catch(err => {
                    prompt("Copy this link to blend DNA:", link);
                });
            }
        });
    }

    // Reset button listener
    const resetBtn = document.getElementById('reset-dna-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset your Activity DNA? This cannot be undone.")) {
                localStorage.removeItem('fallow_profile');
                localStorage.removeItem('fallow_browse_swiped');
                localStorage.removeItem('fallow_statuses');
                localStorage.removeItem('fallow_commitments');
                window.location.href = 'index.html';
            }
        });
    }

    const fallowMode = localStorage.getItem('fallow_mode');
    if (fallowMode) {
        document.querySelector('.intro h1').textContent = "We found your quick fix.";
        document.querySelector('.intro p').textContent = "Based on your current mood, here are a few things that fit perfectly.";
        localStorage.removeItem('fallow_mode'); // Clear it so it doesn't stick forever
    }

    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const retryBtn = document.getElementById('retryBtn');
    const show = (el) => { if (el) el.classList.remove('hidden'); };
    const hide = (el) => { if (el) el.classList.add('hidden'); };

    renderDNASummary(userProfile, fallowMode);

    // 2. Load activities
    let activities = [];
    try {
        const { data: acts, error } = await supabase.from('activities').select('*');
        if (error) throw error;
        activities = (acts || []).map(normalizeActivity).filter(Boolean);
    } catch (e) {
        console.error("Failed to load activities", e);
        hide(loadingState);
        show(errorState);
        if (retryBtn) retryBtn.addEventListener('click', () => window.location.reload());
        return;
    }

    hide(loadingState);

    const userConstraints = profileData && profileData.constraints ? profileData.constraints : [];

    function applyConstraintsPenalty(activity, constraints) {
        let penalty = 0;
        const pc = activity.practicalConstraints || {};
        const exp = activity.experiment || {};

        if (constraints.includes('budget')) {
            const costStr = (pc.startCost || '').toLowerCase();
            if (costStr.includes('$100') || costStr.includes('$200') || costStr.includes('expensive')) penalty += 0.5;
        }
        if (constraints.includes('time')) {
            const timeStr = (pc.timePerSession || '').toLowerCase();
            if (timeStr.includes('hours') || timeStr.includes('weekend') || timeStr.includes('days')) penalty += 0.4;
        }
        if (constraints.includes('alone')) {
            if (exp.soloFriendly === false) penalty += 0.5;
        }
        if (constraints.includes('meet_people')) {
            if (activity.dimensions && activity.dimensions.sociality < 0) penalty += 0.4;
        }
        if (constraints.includes('no_screens')) {
            if ((activity.category || '').toLowerCase().includes('digital') || (activity.category || '').toLowerCase().includes('screen')) penalty += 0.5;
        }
        return penalty;
    }

    // 3. Compute scores
    const scoredActivities = activities.map(act => {
        const score = cosineSimilarity(userProfile, act.dimensions);
        const penalty = applyConstraintsPenalty(act, userConstraints);
        return { ...act, matchScore: score - penalty };
    });

    // Sort by score
    scoredActivities.sort((a, b) => b.matchScore - a.matchScore);

    // 4. Inject Serendipity
    // Get top 3 standard recommendations
    const recommendations = scoredActivities.slice(0, 3);

    // Find stretch recommendations:
    // Look at user's top 2 absolute dimensions
    const dims = Object.keys(userProfile).map(k => ({ name: k, val: userProfile[k], abs: Math.abs(userProfile[k]) }));
    dims.sort((a, b) => b.abs - a.abs);
    const top2Dims = [dims[0], dims[1]];

    // Find activities in a DIFFERENT category than the top 3 that match the top 2 dims
    const topCats = new Set(recommendations.map(r => r.category));
    const potentialStretch = scoredActivities.filter(act => {
        if (topCats.has(act.category)) return false;
        // Check if act aligns with user's top 2 dims (same sign, magnitude > 0.3)
        const d1 = act.dimensions[top2Dims[0].name];
        const d2 = act.dimensions[top2Dims[1].name];
        const u1 = top2Dims[0].val;
        const u2 = top2Dims[1].val;
        return (d1 * u1 > 0) && (Math.abs(d1) > 0.3) && (d2 * u2 > 0) && (Math.abs(d2) > 0.3);
    });

    if (potentialStretch.length > 0) {
        const stretch1 = potentialStretch[0];
        stretch1.isStretch = true;
        recommendations.push(stretch1);
    } else if (scoredActivities.length > 3) {
        recommendations.push(scoredActivities[3]);
    }

    if (potentialStretch.length > 1) {
        const stretch2 = potentialStretch[1];
        stretch2.isStretch = true;
        recommendations.push(stretch2);
    } else if (scoredActivities.length > 4) {
        recommendations.push(scoredActivities[4]);
    }

    // Sort final 5 to interleave stretch randomly or just put them at the end
    // For now, keep top 3, then stretch
    renderRecommendations(recommendations.filter(Boolean), userProfile);
});

function cosineSimilarity(profile, item) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (const key in profile) {
        if (item[key] !== undefined) {
            dotProduct += profile[key] * item[key];
            normA += profile[key] * profile[key];
            normB += item[key] * item[key];
        }
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function renderDNASummary(profile, fallowMode) {
    const summaryEl = document.getElementById('dnaSummary');
    if (!summaryEl) return;

    if (fallowMode) {
        summaryEl.textContent = `Vibe: ${fallowMode.replace('_', ' ').toUpperCase()}`;
        return;
    }

    const getTrait = (val, negStr, posStr) => val > 0.2 ? posStr : val < -0.2 ? negStr : "";

    const traits = [
        getTrait(profile.sociality, "Solo", "Social"),
        getTrait(profile.structure, "Freeform", "Structured"),
        getTrait(profile.physicality, "Mental", "Physical"),
        getTrait(profile.expression, "Analytical", "Creative"),
        getTrait(profile.environment, "Indoors", "Outdoors")
    ].filter(Boolean);

    summaryEl.textContent = `Your DNA: ${traits.slice(0, 3).join(" \u00B7 ")}`;
}

function renderRecommendations(recs, userProfile) {
    const container = document.getElementById('resultsContainer');
    const template = document.getElementById('cardTemplate');
    if (!container || !template) return;

    recs.filter(Boolean).forEach((act, index) => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.card');
        card.style.animationDelay = `${index * 0.15}s`;

        clone.querySelector('.category').textContent = act.category;

        // Convert score (-1 to 1) to percentage (0 to 100) roughly
        const percentMatch = Math.round(((act.matchScore + 1) / 2) * 100);
        clone.querySelector('.match-score').textContent = `${percentMatch}% Match`;

        if (act.isStretch) {
            clone.querySelector('.stretch-badge').classList.remove('hidden');
        }

        clone.querySelector('.activity-name').textContent = act.name;
        clone.querySelector('.hook-line').textContent = `"${act.hook}"`;

        const rationale = generateRationale(userProfile, act);
        clone.querySelector('.why-like-text').textContent = rationale.why;
        clone.querySelector('.caveat-text').textContent = rationale.caveat;

        const exp = act.experiment || {};
        const pcv = act.practicalConstraints || {};
        clone.querySelector('.experiment-step').textContent = exp.smallestStep || 'Just try it once, badly.';
        clone.querySelector('.success-feels-like span').textContent = exp.whatSuccessFeelsLike || 'You want to do it again.';

        clone.querySelector('.cost-value').textContent = pcv.startCost || 'Not listed';
        clone.querySelector('.time-value').textContent = pcv.timePerSession || 'Not listed';
        clone.querySelector('.equip-value').textContent = pcv.equipmentNeeded || 'Nothing to start';

        // Interactions
        const btnCommit = clone.querySelector('.btn-commit');
        const btnSave = clone.querySelector('.btn-save');
        const btnPass = clone.querySelector('.btn-pass');
        const passReasons = clone.querySelector('.pass-reasons');
        const celebration = clone.querySelector('.celebration');
        const actionsRow = clone.querySelector('.card-actions');

        btnCommit.addEventListener('click', () => {
            saveActivityStatus(act.id, 'committed');
            addCommitment(act);
            btnCommit.textContent = "You're doing this";
            btnCommit.disabled = true;
            if (celebration) celebration.classList.remove('hidden');
            // Let the confirmation land before moving them on.
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
        });

        btnSave.addEventListener('click', () => {
            saveActivityStatus(act.id, 'saved');
            btnSave.textContent = "Saved";
            btnSave.disabled = true;
        });

        btnPass.addEventListener('click', () => {
            passReasons.classList.toggle('hidden');
        });

        const chips = clone.querySelectorAll('.chip');
        chips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                saveActivityStatus(act.id, 'passed', e.target.textContent);
                card.style.opacity = '0.5';
                passReasons.classList.add('hidden');
                actionsRow.classList.add('hidden');
            });
        });

        container.appendChild(clone);
    });
}

function saveActivityStatus(id, status, reason = null) {
    let statuses = JSON.parse(localStorage.getItem('fallow_statuses') || '{}');
    statuses[id] = { status, reason, date: new Date().toISOString() };
    localStorage.setItem('fallow_statuses', JSON.stringify(statuses));
}

// The dashboard reads this. It is a list, not a single slot, so committing to a
// second activity no longer erases the first.
function addCommitment(act) {
    let list = [];
    try {
        const raw = JSON.parse(localStorage.getItem('fallow_commitments') || '[]');
        if (Array.isArray(raw)) list = raw;
    } catch (e) { /* corrupt payload, start clean */ }

    if (!list.some(item => item && item.id === act.id)) {
        list.push({ ...act, committedAt: new Date().toISOString() });
    }
    localStorage.setItem('fallow_commitments', JSON.stringify(list));
}

function generateRationale(userProfile, act) {
    // Simple template logic
    const dimNames = {
        sociality: { high: "highly social", low: "deeply solo" },
        structure: { high: "highly structured and rule-based", low: "freeform and exploratory" },
        physicality: { high: "physically active", low: "mental and focused" },
        expression: { high: "creative and expressive", low: "analytical and consuming" },
        environment: { high: "outdoorsy", low: "indoor-friendly" }
    };

    // Find user's strongest dimension
    let maxDim = null;
    let maxVal = 0;
    for (const [key, val] of Object.entries(userProfile)) {
        if (key === 'barrier') continue;
        if (Math.abs(val) > Math.abs(maxVal)) {
            maxVal = val;
            maxDim = key;
        }
    }

    let why = "";
    if (maxDim) {
        const isHigh = maxVal > 0;
        const userTrait = isHigh ? dimNames[maxDim].high : dimNames[maxDim].low;

        // Check if activity matches this
        const actVal = act.dimensions[maxDim];
        if ((isHigh && actVal > 0.2) || (!isHigh && actVal < -0.2)) {
            why = `You lean toward ${userTrait} challenges. ${act.name} is exactly that \u2014 it provides a perfect outlet for this energy.`;
        } else {
            why = `While you usually prefer ${userTrait} activities, ${act.name} offers a refreshing change of pace that taps into your other strengths.`;
        }
    } else {
        why = `${act.name} is a balanced activity that fits well with your versatile profile.`;
    }

    // Generate caveat (look for a dimension where user and act differ significantly)
    let caveat = "It hits all your sweet spots.";
    for (const [key, val] of Object.entries(userProfile)) {
        if (key === 'barrier') continue;
        const actVal = act.dimensions[key];
        if (Math.abs(val - actVal) > 0.8) {
            const actTrait = actVal > 0 ? dimNames[key].high : dimNames[key].low;
            caveat = `You might find it unusually ${actTrait} compared to what you're used to \u2014 lean into the discomfort.`;
            break;
        }
    }

    return { why, caveat };
}

const waitlistForm = document.getElementById('results-waitlist-form');
const waitlistMessage = document.getElementById('results-waitlist-message');
if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = waitlistForm.querySelector('input[type="email"]');
        const email = input ? input.value.trim() : '';

        const say = (text, state) => {
            if (!waitlistMessage) return;
            waitlistMessage.textContent = text;
            waitlistMessage.dataset.state = state;
        };

        if (!email || !email.includes('@')) {
            say('That email address looks incomplete. Check it and try again.', 'error');
            if (input) input.focus();
            return;
        }

        try {
            const profileDataStr = localStorage.getItem('fallow_profile');
            let profileData = null;
            if (profileDataStr) {
                profileData = JSON.parse(profileDataStr);
            }

            const { error } = await supabase.from('waitlist').insert({
                email: email,
                profile_data: profileData
            });

            if (error) throw error;
        } catch (err) {
            console.error('Could not save waitlist entry', err);
            say('We could not save that just now. Try again in a moment.', 'error');
            return;
        }

        say("You're on the list. We'll be in touch before early access opens.", 'ok');
        waitlistForm.reset();
    });
}

// Magic Link handling
const magicForm = document.getElementById('magic-link-form');
if (magicForm) {
    magicForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('magic-link-email').value;
        const msg = document.getElementById('magic-link-msg');
        const submitBtn = magicForm.querySelector('button');
        
        msg.textContent = 'Sending...';
        msg.style.color = 'var(--color-text)';
        submitBtn.disabled = true;

        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.origin + '/dashboard.html'
            }
        });

        if (error) {
            msg.textContent = 'Error: ' + error.message;
            msg.style.color = 'var(--color-primary-deep)';
            submitBtn.disabled = false;
        } else {
            msg.textContent = 'Check your email for the magic link!';
            msg.style.color = 'var(--color-primary)';
            magicForm.reset();
        }
    });
}
