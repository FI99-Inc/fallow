import { supabase, getSession, normalizeActivity } from './supabase-client.js';
import { shareDNA } from './share.js';

document.addEventListener('DOMContentLoaded', async () => {
  // State
  let activities = [];
  let queue = [];
  let currentIndex = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;

  const stack = document.getElementById('card-stack');
  const counter = document.getElementById('card-counter');
  const emptyState = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const retryBtn = document.getElementById('retry-btn');
  const status = document.getElementById('swipe-status');
  const hints = document.getElementById('kbd-hints');
  const actions = document.getElementById('browse-actions');

  // Every write below goes through these, so a missing element degrades the
  // page instead of throwing and leaving the user a blank screen.
  const setCounter = (text) => { if (counter) counter.textContent = text; };

  // "1 / 578" told people they were on item one of a very long chore.
  // The deck is endless by design, so report what they have seen instead.
  const progressLabel = (n) => (n === 1 ? '1st look' : `${n} explored`);

  // Each axis is a pair of real words, not a truncated variable name.
  // The panel used to read "SOC -40 / STR 50 / PHY -20", which is a debug
  // readout of the product's signature idea.
  const DNA_AXES = {
    sociality:   { low: 'Solo',      high: 'Social' },
    structure:   { low: 'Freeform',  high: 'Structured' },
    physicality: { low: 'Still',     high: 'Physical' },
    expression:  { low: 'Absorbing', high: 'Making' },
    environment: { low: 'Indoors',   high: 'Outdoors' },
    barrier:     { low: 'Casual',    high: 'Involved' }
  };

  const announce = (text) => { if (status) status.textContent = text; };
  const show = (el) => { if (el) el.classList.remove('hidden'); };
  const hide = (el) => { if (el) el.classList.add('hidden'); };
  const btnPass = document.getElementById('btn-pass');
  const btnSave = document.getElementById('btn-save');
  const btnLike = document.getElementById('btn-like');

  // Load profile
  let profileData = JSON.parse(localStorage.getItem('fallow_profile'));
  let userProfile = profileData ? profileData.scores : {
    sociality: 0, structure: 0, physicality: 0,
    expression: 0, environment: 0, barrier: 0
  };
  let userInsights = profileData && profileData.insights ? profileData.insights : ['Curious Explorer', 'Ready for anything'];

  // Handle Two-Player Blend Mode
  const urlParams = new URLSearchParams(window.location.search);
  const blendParam = urlParams.get('blend');
  let activeProfile = userProfile;
  if (blendParam) {
    try {
        const partnerProfile = JSON.parse(atob(blendParam));
        const blended = {};
        for (let k in userProfile) {
            blended[k] = ((userProfile[k] || 0) + (partnerProfile[k] || 0)) / 2;
        }
        activeProfile = blended;
        document.getElementById('blend-banner').classList.remove('hidden');
        if (counter) counter.textContent = "Two-Player Mode";
    } catch(e) {
        console.error("Failed to parse blend parameter", e);
    }
  }

  // Attach share listener
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', (e) => {
      e.preventDefault();
      shareDNA(userInsights);
    });
  }

  // Load activities and sort by match score
  hide(stack);
  hide(actions);
  hide(hints);
  show(loadingState);

  try {
    const { data: acts, error } = await supabase.from('activities').select('*');
    if (error) throw error;
    activities = (acts || []).map(normalizeActivity).filter(Boolean);
  } catch (e) {
    console.error('Failed to load activities:', e);
    hide(loadingState);
    show(errorState);
    announce('We could not load the activity library.');
    if (retryBtn) retryBtn.addEventListener('click', () => window.location.reload());
    return;
  }

  hide(loadingState);
  show(stack);
  show(actions);
  show(hints);

  // Filter out already-swiped activities
  const swiped = JSON.parse(localStorage.getItem('fallow_browse_swiped') || '{}');

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

  // Score and sort: interleave high-match and moderate-match for variety
  const scored = activities
    .filter(a => !swiped[a.id])
    .map(a => {
        let matchScore = cosineSimilarity(activeProfile, a.dimensions);
        const penalty = applyConstraintsPenalty(a, userConstraints);
        return { ...a, matchScore: matchScore - penalty };
    });

  // Sort descending but inject variety: take top 3, skip 1, take next 2, skip 1, etc.
  scored.sort((a, b) => b.matchScore - a.matchScore);
  queue = interleave(scored);

  // Initialize visual DNA tracker
  renderDNATracker(activeProfile);

  // Button handlers
  if (btnPass) btnPass.addEventListener('click', () => swipeCard('pass'));
  if (btnSave) btnSave.addEventListener('click', () => swipeCard('save'));
  if (btnLike) btnLike.addEventListener('click', () => swipeCard('like'));

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (currentIndex >= queue.length) return;
    if (e.key === 'ArrowLeft') swipeCard('pass');
    if (e.key === 'ArrowRight') swipeCard('like');
    if (e.key === 'ArrowUp') swipeCard('save');
  });

  if (!queue.length) {
    generateCustomActivity();
    return;
  }

  setCounter(progressLabel(1));
  renderStack();
  announce(`${queue.length} activities to review. Showing the first.`);

  function interleave(sorted) {
    // Instead of pure best-to-worst, cluster in groups of 4 and shuffle within each group
    // This prevents monotony while keeping quality high
    const result = [];
    for (let i = 0; i < sorted.length; i += 4) {
      const chunk = sorted.slice(i, i + 4);
      // Light shuffle within the chunk
      for (let j = chunk.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [chunk[j], chunk[k]] = [chunk[k], chunk[j]];
      }
      result.push(...chunk);
    }
    return result;
  }

  function cosineSimilarity(profile, dims) {
    let dot = 0, normA = 0, normB = 0;
    for (const key in profile) {
      if (dims[key] !== undefined) {
        dot += profile[key] * dims[key];
        normA += profile[key] ** 2;
        normB += dims[key] ** 2;
      }
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  const aiLoadingState = document.getElementById('ai-loading-state');

  async function generateCustomActivity() {
    hide(emptyState);
    hide(stack);
    hide(actions);
    hide(hints);
    show(aiLoadingState);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-activity', {
        body: { profile: activeProfile, constraints: userConstraints }
      });
      if (error) throw error;
      if (!data || !data.activity) throw new Error("No activity returned");
      
      const newAct = data.activity;
      newAct.matchScore = 1.0; 
      
      activities.push(newAct);
      queue.push(newAct);
      
      hide(aiLoadingState);
      show(stack);
      show(actions);
      show(hints);
      
      setCounter(progressLabel(currentIndex + 1));
      
      renderStack();
    } catch (err) {
      console.error("AI Generation failed:", err);
      hide(aiLoadingState);
      showEmpty();
    }
  }

  function renderDNATracker(scores) {
    const container = document.getElementById('dna-bars-container');
    if (!container) return;

    container.replaceChildren();

    Object.entries(DNA_AXES).forEach(([dim, poles]) => {
      const val = Math.max(-1, Math.min(1, scores[dim] || 0));
      const pct = ((val + 1) / 2) * 100;

      const axis = document.createElement('div');
      axis.className = 'dna-axis';

      const labels = document.createElement('div');
      labels.className = 'dna-axis-labels';

      const low = document.createElement('span');
      low.className = 'dna-pole' + (val < -0.15 ? ' is-lean' : '');
      low.textContent = poles.low;

      const high = document.createElement('span');
      high.className = 'dna-pole' + (val > 0.15 ? ' is-lean' : '');
      high.textContent = poles.high;

      labels.append(low, high);

      const track = document.createElement('div');
      track.className = 'dna-track';
      const marker = document.createElement('span');
      marker.className = 'dna-marker';
      marker.style.left = `calc(${pct}% - 3px)`;
      track.appendChild(marker);

      axis.append(labels, track);
      container.appendChild(axis);
    });

    renderDNAMini(scores);
  }

  // The narrow-screen form of the same information: name only the axes the
  // profile actually leans on, strongest first.
  function renderDNAMini(scores) {
    const mini = document.getElementById('dna-mini');
    if (!mini) return;

    const leaning = Object.entries(DNA_AXES)
      .map(([dim, poles]) => {
        const val = scores[dim] || 0;
        return { val, abs: Math.abs(val), word: val > 0 ? poles.high : poles.low };
      })
      .filter(d => d.abs > 0.15)
      .sort((a, b) => b.abs - a.abs)
      .slice(0, 3)
      .map(d => d.word);

    mini.textContent = leaning.length
      ? leaning.join(' · ')
      : 'Reading your DNA';
  }

  function renderStack() {
    stack.innerHTML = '';
    if (currentIndex >= queue.length) {
      generateCustomActivity();
      return;
    }

    // Render up to 3 cards (front + 2 behind)
    const cardsToRender = Math.min(3, queue.length - currentIndex);
    for (let i = cardsToRender - 1; i >= 0; i--) {
      const activity = queue[currentIndex + i];
      const card = createCard(activity, i);
      stack.appendChild(card);
    }

    // Attach drag to front card
    const frontCard = stack.querySelector('.browse-card:not(.stack-1):not(.stack-2)');
    if (frontCard) attachDrag(frontCard);
  }

  function createCard(activity, stackPosition) {
    const card = document.createElement('div');
    card.className = 'browse-card';
    if (stackPosition === 1) card.classList.add('stack-1');
    if (stackPosition === 2) card.classList.add('stack-2');

    // One malformed record must never blank the whole deck.
    const pc = activity.practicalConstraints || {};
    const exp = activity.experiment || {};

    const matchPct = Math.round(Math.max(0, Math.min(100, (activity.matchScore + 1) / 2 * 100)));
    const barColor = matchPct > 70 ? 'var(--color-secondary)' :
                     matchPct > 45 ? 'var(--color-accent)' : 'var(--color-text-light)';

    card.innerHTML = `
      <div class="swipe-indicator pass-indicator">Pass</div>
      <div class="swipe-indicator save-indicator">Save</div>
      <div class="swipe-indicator like-indicator">Into it</div>

      <div class="card-category">${activity.category}</div>
      <h2 class="card-name">${activity.name}</h2>
      <p class="card-hook">"${activity.hook}"</p>

      <div class="card-details">
        <div class="card-detail-row">
          <span class="detail-label">First step</span>
          <span class="detail-value">${exp.smallestStep || 'Just show up once.'}</span>
        </div>
        <div class="card-detail-row">
          <span class="detail-label">Cost</span>
          <span class="detail-value">${pc.startCost || 'Not listed'}</span>
        </div>
        <div class="card-detail-row">
          <span class="detail-label">Time</span>
          <span class="detail-value">${pc.timePerSession || 'Not listed'}</span>
        </div>
      </div>

      <div class="card-match">
        <span class="match-label">Match</span>
        <div class="match-bar-container">
          <div class="match-bar-fill" style="width: 0%; background: ${barColor};" data-target="${matchPct}"></div>
        </div>
        <span class="match-percent">${matchPct}%</span>
      </div>
    `;

    // Animate match bar after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const bar = card.querySelector('.match-bar-fill');
        if (bar) bar.style.width = bar.dataset.target + '%';
      });
    });

    return card;
  }

  function attachDrag(card) {
    const onStart = (clientX, clientY) => {
      isDragging = true;
      startX = clientX;
      startY = clientY;
      card.style.transition = 'none';
    };

    const onMove = (clientX, clientY) => {
      if (!isDragging) return;
      currentX = clientX - startX;
      currentY = clientY - startY;
      const rotation = currentX * 0.08;
      card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`;

      // Show indicators
      const passInd = card.querySelector('.pass-indicator');
      const likeInd = card.querySelector('.like-indicator');
      const saveInd = card.querySelector('.save-indicator');
      const fade = (el, v) => { if (el) el.style.opacity = v; };
      const threshold = 60;

      if (currentX < -threshold) {
        fade(passInd, Math.min(1, (Math.abs(currentX) - threshold) / 60));
        fade(likeInd, '0'); fade(saveInd, '0');
      } else if (currentX > threshold) {
        fade(likeInd, Math.min(1, (currentX - threshold) / 60));
        fade(passInd, '0'); fade(saveInd, '0');
      } else if (currentY < -threshold) {
        fade(saveInd, Math.min(1, (Math.abs(currentY) - threshold) / 60));
        fade(passInd, '0'); fade(likeInd, '0');
      } else {
        fade(passInd, '0'); fade(likeInd, '0'); fade(saveInd, '0');
      }
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      card.style.transition = '';

      const swipeThreshold = 100;

      if (currentX < -swipeThreshold) {
        swipeCard('pass');
      } else if (currentX > swipeThreshold) {
        swipeCard('like');
      } else if (currentY < -swipeThreshold) {
        swipeCard('save');
      } else {
        // Snap back
        card.style.transform = '';
        card.querySelectorAll('.swipe-indicator').forEach(el => { el.style.opacity = '0'; });
      }

      currentX = 0;
      currentY = 0;
    };

    // Pointer events cover mouse, touch and pen with one set of listeners the
    // browser tears down on release, so nothing accumulates per rendered card.
    card.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      card.setPointerCapture(e.pointerId);
      onStart(e.clientX, e.clientY);
    });
    card.addEventListener('pointermove', e => {
      if (!isDragging) return;
      // Claim the gesture once it is clearly horizontal, so the card's own
      // vertical scroll and the swipe stop fighting each other.
      if (e.cancelable && Math.abs(e.clientX - startX) > Math.abs(e.clientY - startY)) {
        e.preventDefault();
      }
      onMove(e.clientX, e.clientY);
    });
    card.addEventListener('pointerup', onEnd);
    card.addEventListener('pointercancel', onEnd);
  }

  function swipeCard(direction) {
    if (currentIndex >= queue.length) return;
    const frontCard = stack.querySelector('.browse-card:not(.stack-1):not(.stack-2)');
    if (!frontCard) return;

    const activity = queue[currentIndex];

    // Animate out
    if (direction === 'pass') frontCard.classList.add('swipe-left');
    else if (direction === 'like') frontCard.classList.add('swipe-right');
    else if (direction === 'save') frontCard.classList.add('swipe-up');

    // Record the swipe
    recordSwipe(activity, direction);

    // Update DNA based on the swipe
    updateDNA(activity, direction);

    const verb = direction === 'pass' ? 'Passed on'
               : direction === 'save' ? 'Saved'
               : 'Marked interested in';
    announce(`${verb} ${activity.name}. ${Math.max(0, queue.length - currentIndex - 1)} left.`);

    currentIndex++;
    setCounter(progressLabel(Math.min(currentIndex + 1, queue.length)));

    // Wait for animation, then re-render
    setTimeout(() => {
      renderStack();
    }, 350);
  }

  async function recordSwipe(activity, direction) {
    // Persist so we don't show the same card again (keep local fallback)
    const swiped = JSON.parse(localStorage.getItem('fallow_browse_swiped') || '{}');
    swiped[activity.id] = { direction, date: new Date().toISOString() };
    localStorage.setItem('fallow_browse_swiped', JSON.stringify(swiped));

    // If liked/saved, also add to local statuses
    const statusMap = {
      'like': 'interested',
      'save': 'saved',
      'pass': 'pass'
    };

    if (direction === 'like' || direction === 'save') {
      const statuses = JSON.parse(localStorage.getItem('fallow_statuses') || '{}');
      statuses[activity.id] = {
        status: statusMap[direction],
        date: new Date().toISOString()
      };
      localStorage.setItem('fallow_statuses', JSON.stringify(statuses));
    }

    // Save to Supabase
    try {
      const session = await getSession();
      if (session && session.user) {
        await supabase.from('interactions').upsert({
          user_id: session.user.id,
          activity_id: activity.id,
          status: statusMap[direction],
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id,activity_id' });
      }
    } catch (err) {
      console.error("Failed to save swipe to Supabase:", err);
    }
  }

  async function updateDNA(activity, direction) {
    let profileData = JSON.parse(localStorage.getItem('fallow_profile'));
    if (!profileData || !profileData.scores) return;

    const scores = profileData.scores;
    const dims = activity.dimensions;

    // Swipe right (like) = shift towards this activity's profile
    // Swipe left (pass) = shift away
    // Save = very small shift towards (they're interested but not strongly signaling preference)
    const multiplier = direction === 'like' ? 0.08 :
                       direction === 'pass' ? -0.04 :
                       0.02; // save

    for (const key in dims) {
      if (scores[key] !== undefined) {
        scores[key] += dims[key] * multiplier;
        scores[key] = Math.max(-1, Math.min(1, scores[key]));
      }
    }

    profileData.scores = scores;
    localStorage.setItem('fallow_profile', JSON.stringify(profileData));

    // Update the visual DNA tracker
    renderDNATracker(scores);

    // Update in Supabase
    try {
      const session = await getSession();
      if (session && session.user) {
        await supabase.from('profiles').upsert({
          id: session.user.id,
          scores: scores,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Failed to update DNA in Supabase:", err);
    }
  }

  function showEmpty() {
    hide(stack);
    hide(actions);
    hide(hints);
    hide(loadingState);
    setCounter('');
    show(emptyState);
    announce('You have seen every activity in the queue.');
  }
});
