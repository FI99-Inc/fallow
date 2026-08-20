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
    drawDNAChart(userProfile);

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

    // One set for the whole batch, so cards can claim different dimensions.
    const usedDims = new Set();

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

        const rationale = generateRationale(userProfile, act, index, usedDims);
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

// Per-dimension vocabulary. Each entry names the *mechanic* rather than the
// label, so a rationale can say something true about this specific activity.
const DIMENSION_COPY = {
    sociality: {
        high: { user: "you get your energy from other people", act: "it puts you in a room with other people" },
        low:  { user: "you recharge on your own",              act: "it is yours alone" }
    },
    structure: {
        high: { user: "you want a clear method to follow",     act: "it has rules, steps and a right answer" },
        low:  { user: "you would rather improvise",            act: "there is no correct way to do it" }
    },
    physicality: {
        high: { user: "you think better when your body is busy", act: "it is physical" },
        low:  { user: "you prefer to sit still and go deep",     act: "it is quiet, close work" }
    },
    expression: {
        high: { user: "you need to make something that is yours", act: "you end up holding something you made" },
        low:  { user: "you would rather absorb than produce",     act: "it rewards study more than output" }
    },
    environment: {
        high: { user: "you want to be outside",            act: "it happens outdoors" },
        low:  { user: "you want it to work at home",       act: "it fits in a corner of your apartment" }
    },
    barrier: {
        high: { user: "you do not mind a real setup cost", act: "it asks for some commitment up front" },
        low:  { user: "you want to start without a project", act: "you can start this week with almost nothing" }
    }
};

const clause = (dim, value) => {
    const entry = DIMENSION_COPY[dim];
    if (!entry) return null;
    return value > 0 ? entry.high : entry.low;
};

const sentenceCase = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Build the "why" and "what might not work" lines for ONE recommendation.
 *
 * This used to lock onto the user's single strongest dimension once and reuse
 * it for every card, so all five recommendations rendered the same sentence
 * with the activity name swapped in — which reads as a mail-merge and undoes
 * the whole premise. It now scores each activity against the profile
 * separately, so different activities genuinely surface different reasons.
 *
 * @param {object} userProfile - dimension -> -1..1
 * @param {object} act - activity with .dimensions
 * @param {number} index - position in the list, used only to vary phrasing
 */
function generateRationale(userProfile, act, index = 0, usedDims = null) {
    const dims = act && act.dimensions ? act.dimensions : {};

    const agreements = [];  // dimensions where user and activity pull the same way
    let worst = null;       // strongest genuine opposition, for an honest caveat

    for (const [key, userVal] of Object.entries(userProfile)) {
        if (!(key in dims)) continue;
        const actVal = dims[key];
        const aligned = userVal * actVal;

        // Agreement: same sign, both far enough from neutral to mean anything.
        if (aligned > 0 && Math.abs(userVal) > 0.15 && Math.abs(actVal) > 0.15) {
            agreements.push({ key, userVal, actVal, agreement: aligned });
        }

        // A caveat is only honest if the two actually pull in OPPOSITE
        // directions. Ranking by |userVal - actVal| instead produced lines like
        // "it fits in a corner of your apartment, but you want it to work at
        // home" — two facts that agree, written as a conflict.
        if (aligned < 0 && Math.abs(userVal) > 0.15 && Math.abs(actVal) > 0.3) {
            // Barrier is one-directional: an activity being cheaper and easier
            // than you'd tolerate is not a drawback, so only warn when it asks
            // for MORE than the user signalled they want to give.
            const oneWay = key === 'barrier' && actVal <= userVal;
            const opposition = Math.abs(userVal - actVal);
            if (!oneWay && (!worst || opposition > worst.opposition)) {
                worst = { key, userVal, actVal, opposition };
            }
        }
    }

    // Dimensions the user cares about that this activity simply does not serve.
    // Not a conflict, but a real and specific limitation worth naming.
    const blindSpots = [];
    for (const [key, userVal] of Object.entries(userProfile)) {
        if (!(key in dims)) continue;
        if (Math.abs(userVal) > 0.25 && Math.abs(dims[key]) < 0.3) {
            blindSpots.push({ key, userVal, slack: Math.abs(userVal) });
        }
    }
    blindSpots.sort((a, b) => b.slack - a.slack);

    agreements.sort((a, b) => b.agreement - a.agreement);

    // Prefer a dimension no other card has claimed yet. Five cards that all
    // happen to share the user's dominant trait would otherwise print five
    // copies of the same sentence.
    let best = null;
    if (agreements.length) {
        best = (usedDims && agreements.find(c => !usedDims.has(c.key))) || agreements[0];
        if (usedDims) usedDims.add(best.key);
    }

    let why;
    if (best) {
        const userSide = clause(best.key, best.userVal);
        const actSide = clause(best.key, best.actVal);
        // Three frames, rotated by position, so two cards that happen to land on
        // the same dimension still do not read as the same sentence.
        const frames = [
            () => `${sentenceCase(actSide.act)}, and ${userSide.user}.`,
            () => `Because ${userSide.user}, this one fits: ${actSide.act}.`,
            () => `${sentenceCase(actSide.act)}. That matters here because ${userSide.user}.`
        ];
        // Offset the frame by the dimension name too, so two cards that do
        // land on the same dimension still do not read identically.
        const dimOffset = Object.keys(DIMENSION_COPY).indexOf(best.key);
        why = frames[(index + dimOffset) % frames.length]();
    } else {
        const neutralFrames = [
            `${act.name} sits near the middle of your profile. Nothing about it fights you, which makes it a low-risk place to start.`,
            `Your profile does not pull hard for or against ${act.name}. It is on the list as a wildcard rather than a match.`,
            `Nothing in ${act.name} lines up sharply with your profile, which is exactly why it might surprise you.`
        ];
        why = neutralFrames[index % neutralFrames.length];
    }

    let caveat;
    if (worst) {
        const actSide = clause(worst.key, worst.actVal);
        const userSide = clause(worst.key, worst.userVal);
        caveat = `${sentenceCase(actSide.act)}, but ${userSide.user}. That is the part you will have to push through.`;
    } else if (blindSpots.length) {
        const gap = clause(blindSpots[0].key, blindSpots[0].userVal);
        caveat = `It will not do much for one thing you clearly want: ${gap.user}. Expect to get that somewhere else.`;
    } else if (act && act.isStretch) {
        const stretchFrames = [
            `Nothing in it fights your profile. It is simply further from your usual territory than the rest of this list.`,
            `This is the curveball of the set. It does not contradict your profile, it just sits outside the shape of it.`,
            `We put this in deliberately. It is the least predictable thing on your list, which is the point.`
        ];
        caveat = stretchFrames[index % stretchFrames.length];
    } else {
        const softFrames = [
            `Nothing here cuts against your profile. The risk is the opposite: it may feel too safe to hold your attention.`,
            `No part of this works against you, which also means it will not stretch you much.`,
            `This one is comfortable on every axis we measured. Comfortable is where hobbies go quiet.`
        ];
        caveat = softFrames[index % softFrames.length];
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


function drawDNAChart(scores) {
    const container = document.getElementById('dna-chart-container');
    if (!container) return;
    
    // scores are between -1 and 1
    const getVal = (s) => {
        if (s === undefined) return 0.5;
        // Map -1..1 to 0..1 (min radius 10% to look good, max 100%)
        return 0.1 + ((s + 1) / 2) * 0.9;
    };
    
    const s = getVal(scores.sociality);
    const st = getVal(scores.structure);
    const p = getVal(scores.physicality);
    const ex = getVal(scores.expression);
    const env = getVal(scores.environment);
    const b = getVal(scores.barrier);
    
    // Angles and points
    // 1: Top (Sociality), angle = -pi/2
    const p1x = 100, p1y = 100 - 80 * s;
    // 2: Top Right (Structure), angle = -pi/6
    const p2x = 100 + 80 * st * Math.cos(Math.PI/6), p2y = 100 - 80 * st * Math.sin(Math.PI/6);
    // 3: Bottom Right (Physicality), angle = pi/6
    const p3x = 100 + 80 * p * Math.cos(Math.PI/6), p3y = 100 + 80 * p * Math.sin(Math.PI/6);
    // 4: Bottom (Expression), angle = pi/2
    const p4x = 100, p4y = 100 + 80 * ex;
    // 5: Bottom Left (Environment), angle = 5pi/6
    const p5x = 100 - 80 * env * Math.cos(Math.PI/6), p5y = 100 + 80 * env * Math.sin(Math.PI/6);
    // 6: Top Left (Barrier), angle = 7pi/6 (or -5pi/6)
    const p6x = 100 - 80 * b * Math.cos(Math.PI/6), p6y = 100 - 80 * b * Math.sin(Math.PI/6);
    
    const polyPoints = ${p1x}, , , , , ,;
    
    // To 100 scale scores for labels
    const pct = (val) => Math.round(((val + 1) / 2) * 100);

    const svg = 
        <svg class="dna-chart" viewBox="-60 -40 320 280" role="img" aria-label="Your Activity DNA profile">
            <polygon class="dna-hex" points="100,20 169.3,60 169.3,140 100,180 30.7,140 30.7,60" />
            <g class="dna-axes">
                <line x1="100" y1="100" x2="100" y2="20" />
                <line x1="100" y1="100" x2="169.3" y2="60" />
                <line x1="100" y1="100" x2="169.3" y2="140" />
                <line x1="100" y1="100" x2="100" y2="180" />
                <line x1="100" y1="100" x2="30.7" y2="140" />
                <line x1="100" y1="100" x2="30.7" y2="60" />
            </g>
            <polygon class="dna-profile" points="" />
            <g class="dna-labels">
                <g class="dna-label-group">
                    <text x="100" y="-3" text-anchor="middle" class="dna-label-name">Sociality</text>
                    <text x="100" y="11" text-anchor="middle" class="dna-label-score"></text>
                </g>
                <g class="dna-label-group">
                    <text x="180" y="58" text-anchor="start" class="dna-label-name">Structure</text>
                    <text x="180" y="72" text-anchor="start" class="dna-label-score"></text>
                </g>
                <g class="dna-label-group">
                    <text x="180" y="142" text-anchor="start" class="dna-label-name">Physicality</text>
                    <text x="180" y="156" text-anchor="start" class="dna-label-score"></text>
                </g>
                <g class="dna-label-group">
                    <text x="100" y="200" text-anchor="middle" class="dna-label-name">Expression</text>
                    <text x="100" y="214" text-anchor="middle" class="dna-label-score"></text>
                </g>
                <g class="dna-label-group">
                    <text x="20" y="142" text-anchor="end" class="dna-label-name">Environment</text>
                    <text x="20" y="156" text-anchor="end" class="dna-label-score"></text>
                </g>
                <g class="dna-label-group">
                    <text x="20" y="58" text-anchor="end" class="dna-label-name">Barrier</text>
                    <text x="20" y="72" text-anchor="end" class="dna-label-score"></text>
                </g>
            </g>
            <g class="dna-dots">
                <circle cx="" cy="" r="4"><title>Sociality: </title></circle>
                <circle cx="" cy="" r="4"><title>Structure: </title></circle>
                <circle cx="" cy="" r="4"><title>Physicality: </title></circle>
                <circle cx="" cy="" r="4"><title>Expression: </title></circle>
                <circle cx="" cy="" r="4"><title>Environment: </title></circle>
                <circle cx="" cy="" r="4"><title>Barrier: </title></circle>
            </g>
        </svg>
    ;
    container.innerHTML = svg;
}
