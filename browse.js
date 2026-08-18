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
  const actions = document.getElementById('browse-actions');
  const btnPass = document.getElementById('btn-pass');
  const btnSave = document.getElementById('btn-save');
  const btnLike = document.getElementById('btn-like');

  // Load profile
  let profileData = JSON.parse(localStorage.getItem('fallow_profile'));
  let userProfile = profileData ? profileData.scores : {
    sociality: 0, structure: 0, physicality: 0,
    expression: 0, environment: 0, barrier: 0
  };

  // Load activities and sort by match score
  try {
    const res = await fetch('data/activities.json');
    activities = await res.json();
  } catch (e) {
    console.error('Failed to load activities:', e);
    return;
  }

  // Filter out already-swiped activities
  const swiped = JSON.parse(localStorage.getItem('fallow_browse_swiped') || '{}');

  // Score and sort: interleave high-match and moderate-match for variety
  const scored = activities
    .filter(a => !swiped[a.id])
    .map(a => ({ ...a, matchScore: cosineSimilarity(userProfile, a.dimensions) }));

  // Sort descending but inject variety: take top 3, skip 1, take next 2, skip 1, etc.
  scored.sort((a, b) => b.matchScore - a.matchScore);
  queue = interleave(scored);

  counter.textContent = `1 / ${queue.length}`;
  renderStack();

  // Button handlers
  btnPass.addEventListener('click', () => swipeCard('pass'));
  btnSave.addEventListener('click', () => swipeCard('save'));
  btnLike.addEventListener('click', () => swipeCard('like'));

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (currentIndex >= queue.length) return;
    if (e.key === 'ArrowLeft') swipeCard('pass');
    if (e.key === 'ArrowRight') swipeCard('like');
    if (e.key === 'ArrowUp') swipeCard('save');
  });

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

  function renderStack() {
    stack.innerHTML = '';
    if (currentIndex >= queue.length) {
      showEmpty();
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

    const matchPct = Math.round(Math.max(0, Math.min(100, (activity.matchScore + 1) / 2 * 100)));
    const barColor = matchPct > 70 ? 'var(--color-secondary)' :
                     matchPct > 45 ? 'var(--color-accent)' : 'var(--color-text-light)';

    card.innerHTML = `
      <div class="swipe-indicator pass-indicator">Pass</div>
      <div class="swipe-indicator like-indicator">Into it</div>
      
      <div class="card-category">${activity.category}</div>
      <h2 class="card-name">${activity.name}</h2>
      <p class="card-hook">"${activity.hook}"</p>
      
      <div class="card-details">
        <div class="card-detail-row">
          <span class="detail-label">First step</span>
          <span class="detail-value">${activity.experiment.smallestStep}</span>
        </div>
        <div class="card-detail-row">
          <span class="detail-label">Cost</span>
          <span class="detail-value">${activity.practicalConstraints.startCost}</span>
        </div>
        <div class="card-detail-row">
          <span class="detail-label">Time</span>
          <span class="detail-value">${activity.practicalConstraints.timePerSession}</span>
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
      const threshold = 60;

      if (currentX < -threshold) {
        passInd.style.opacity = Math.min(1, (Math.abs(currentX) - threshold) / 60);
        likeInd.style.opacity = '0';
      } else if (currentX > threshold) {
        likeInd.style.opacity = Math.min(1, (currentX - threshold) / 60);
        passInd.style.opacity = '0';
      } else {
        passInd.style.opacity = '0';
        likeInd.style.opacity = '0';
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
        card.querySelector('.pass-indicator').style.opacity = '0';
        card.querySelector('.like-indicator').style.opacity = '0';
      }

      currentX = 0;
      currentY = 0;
    };

    // Mouse events
    card.addEventListener('mousedown', e => { e.preventDefault(); onStart(e.clientX, e.clientY); });
    document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    document.addEventListener('mouseup', onEnd);

    // Touch events
    card.addEventListener('touchstart', e => {
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    }, { passive: true });
    card.addEventListener('touchmove', e => {
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: true });
    card.addEventListener('touchend', onEnd);
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

    currentIndex++;
    counter.textContent = `${Math.min(currentIndex + 1, queue.length)} / ${queue.length}`;

    // Wait for animation, then re-render
    setTimeout(() => {
      renderStack();
    }, 350);
  }

  function recordSwipe(activity, direction) {
    // Persist so we don't show the same card again
    const swiped = JSON.parse(localStorage.getItem('fallow_browse_swiped') || '{}');
    swiped[activity.id] = { direction, date: new Date().toISOString() };
    localStorage.setItem('fallow_browse_swiped', JSON.stringify(swiped));

    // If liked/saved, also add to statuses
    if (direction === 'like' || direction === 'save') {
      const statuses = JSON.parse(localStorage.getItem('fallow_statuses') || '{}');
      statuses[activity.id] = {
        status: direction === 'like' ? 'interested' : 'saved',
        date: new Date().toISOString()
      };
      localStorage.setItem('fallow_statuses', JSON.stringify(statuses));
    }
  }

  function updateDNA(activity, direction) {
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
  }

  function showEmpty() {
    stack.classList.add('hidden');
    actions.classList.add('hidden');
    emptyState.classList.remove('hidden');
  }
});
