import { shareDNA } from './share.js';

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

    const fallowMode = localStorage.getItem('fallow_mode');
    if (fallowMode) {
        document.querySelector('.intro h1').textContent = "We found your quick fix.";
        document.querySelector('.intro p').textContent = "Based on your current mood, here are a few things that fit perfectly.";
        localStorage.removeItem('fallow_mode'); // Clear it so it doesn't stick forever
    }

    renderDNASummary(userProfile, fallowMode);

    // 2. Load activities
    let activities = [];
    try {
        const response = await fetch('data/activities.json');
        activities = await response.json();
    } catch (e) {
        console.error("Failed to load activities", e);
        return;
    }

    // 3. Compute scores
    const scoredActivities = activities.map(act => {
        const score = cosineSimilarity(userProfile, act.dimensions);
        return { ...act, matchScore: score };
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
    } else {
        recommendations.push(scoredActivities[3]);
    }
    
    if (potentialStretch.length > 1) {
        const stretch2 = potentialStretch[1];
        stretch2.isStretch = true;
        recommendations.push(stretch2);
    } else {
        recommendations.push(scoredActivities[4]);
    }

    // Sort final 5 to interleave stretch randomly or just put them at the end
    // For now, keep top 3, then stretch
    renderRecommendations(recommendations, userProfile);
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

    summaryEl.textContent = `Your DNA: ${traits.slice(0, 3).join("  ")}`;
}

function renderRecommendations(recs, userProfile) {
    const container = document.getElementById('resultsContainer');
    const template = document.getElementById('cardTemplate');

    recs.forEach((act, index) => {
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

        clone.querySelector('.experiment-step').textContent = act.experiment.smallestStep;
        clone.querySelector('.success-feels-like span').textContent = act.experiment.whatSuccessFeelsLike;

        clone.querySelector('.cost-value').textContent = act.practicalConstraints.startCost;
        clone.querySelector('.time-value').textContent = act.practicalConstraints.timePerSession;
        clone.querySelector('.equip-value').textContent = act.practicalConstraints.equipmentNeeded;

        // Interactions
        const btnCommit = clone.querySelector('.btn-commit');
        const btnSave = clone.querySelector('.btn-save');
        const btnPass = clone.querySelector('.btn-pass');
        const passReasons = clone.querySelector('.pass-reasons');
        const celebration = clone.querySelector('.celebration');
        const actionsRow = clone.querySelector('.card-actions');

        btnCommit.addEventListener('click', () => {
            saveActivityStatus(act.id, 'committed');
            localStorage.setItem('fallow_commitment', JSON.stringify(act));
            window.location.href = 'dashboard.html';
        });

        btnSave.addEventListener('click', () => {
            saveActivityStatus(act.id, 'saved');
            btnSave.textContent = "Saved ";
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
            why = `You lean toward ${userTrait} challenges. ${act.name} is exactly that  it provides a perfect outlet for this energy.`;
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
            caveat = `You might find it unusually ${actTrait} compared to what you're used to  lean into the discomfort.`;
            break;
        }
    }

    return { why, caveat };
}

// Waitlist handling for results page
const waitlistForm = document.querySelector('.waitlist-form');
if (waitlistForm) {
    waitlistForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = waitlistForm.querySelector('input[type="email"]');
        const email = input.value.trim();
        if (email) {
            let waitlist = JSON.parse(localStorage.getItem('fallow_waitlist') || '[]');
            if (!waitlist.includes(email)) {
                waitlist.push(email);
                localStorage.setItem('fallow_waitlist', JSON.stringify(waitlist));
            }
            waitlistForm.innerHTML = '<p style="color: var(--success-color); font-weight: 600;">You are on the list! We will be in touch soon.</p>';
        }
    });
}
