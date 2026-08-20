import { supabase, getSession } from './supabase-client.js';
import { shareDNA } from './share.js';

// Data Definition
const flowSteps = [
  // Phase 1: Pairwise Choices
  {
    type: 'pairwise',
    question: "Your ideal Saturday morning:",
    options: [
      { text: "Quiet morning alone with coffee and a project", scores: { sociality: -0.4 } },
      { text: "Brunch with a group of friends at a new spot", scores: { sociality: 0.4 } }
    ]
  },
  {
    type: 'pairwise',
    question: "Which sounds more satisfying?",
    options: [
      { text: "Following a complex recipe step by step and nailing it", scores: { structure: 0.4 } },
      { text: "Improvising dinner from whatever's in the fridge", scores: { structure: -0.4 } }
    ]
  },
  {
    type: 'pairwise',
    question: "You have unexpected free time:",
    options: [
      { text: "Deep dive into a documentary rabbit hole", scores: { physicality: -0.4 } },
      { text: "Go for a long walk or bike ride with no destination", scores: { physicality: 0.4 } }
    ]
  },
  {
    type: 'pairwise',
    question: "Which end result appeals more?",
    options: [
      { text: "Solving a puzzle nobody else could crack", scores: { expression: -0.3 } },
      { text: "Making something you can hold in your hands", scores: { expression: 0.3 } }
    ]
  },
  {
    type: 'pairwise',
    question: "Where do you recharge?",
    options: [
      { text: "A cozy room with good lighting and your stuff around you", scores: { environment: -0.4 } },
      { text: "Somewhere outside with fresh air and open space", scores: { environment: 0.4 } }
    ]
  },
  {
    type: 'pairwise',
    question: "Which trade-off is easier to accept?",
    options: [
      { text: "Something free but limited", scores: { barrier: -0.4 } },
      { text: "Something expensive but with no limits", scores: { barrier: 0.4 } }
    ]
  },
  {
    type: 'pairwise',
    question: "Which sounds more appealing?",
    options: [
      { text: "Getting noticeably better at one thing over months", scores: { structure: 0.2, expression: -0.1 } },
      { text: "Trying something completely different every weekend", scores: { structure: -0.2, expression: 0.1 } }
    ]
  },
  {
    type: 'pairwise',
    question: "Which frustration is more tolerable?",
    options: [
      { text: "Working on something for weeks before seeing any result", scores: { structure: 0.2, barrier: 0.2 } },
      { text: "Getting instant results but hitting a ceiling quickly", scores: { structure: -0.2, barrier: -0.2 } }
    ]
  },

  // Phase 2: Scenarios
  {
    type: 'scenario',
    question: "Which accomplishment would make you proudest?",
    options: [
      { text: "Fixing something everyone said was broken beyond repair", scores: { expression: -0.2, structure: 0.2 } },
      { text: "Creating something beautiful from raw materials", scores: { expression: 0.4, structure: 0.1 } },
      { text: "Beating a personal record you've been chasing", scores: { physicality: 0.3, sociality: -0.1 } },
      { text: "Teaching someone a skill and watching them get it", scores: { sociality: 0.4, expression: -0.1 } }
    ]
  },
  {
    type: 'scenario',
    question: "What kind of rabbit hole do you fall into?",
    options: [
      { text: "How things are made (factory tours, craft videos, build logs)", scores: { expression: 0.2, physicality: 0.1 } },
      { text: "Strategy and optimization (tier lists, meta analysis, min-maxing)", scores: { expression: -0.3, structure: 0.3 } },
      { text: "History and stories (Wikipedia binges, true crime, documentaries)", scores: { physicality: -0.3, structure: -0.1 } },
      { text: "Aesthetics and design (architecture, interiors, fashion, typography)", scores: { expression: 0.3, environment: -0.1 } }
    ]
  },
  {
    type: 'scenario',
    question: "When you were a kid, what was your favorite thing?",
    options: [
      { text: "Building and constructing (LEGOs, forts, models)", scores: { structure: 0.3, expression: 0.1 } },
      { text: "Drawing, painting, or making things", scores: { expression: 0.4, structure: -0.1 } },
      { text: "Running around outside, climbing, exploring", scores: { physicality: 0.4, environment: 0.4 } },
      { text: "Reading, puzzles, or games", scores: { physicality: -0.3, expression: -0.2 } }
    ]
  },

  // Phase 3: Constraints
  {
    type: 'constraints',
    question: "What's your situation right now?",
    subtitle: "(select all that apply)",
    options: [
      { text: "I have very little free time", id: "time" },
      { text: "I'm on a tight budget", id: "budget" },
      { text: "I live in a small space", id: "space" },
      { text: "I want to meet people", id: "meet_people" },
      { text: "I need to get away from screens", id: "no_screens" },
      { text: "I want something I can do alone", id: "alone" }
    ]
  },
  {
    type: 'constraints',
    question: "What's held you back before?",
    subtitle: "(select all that apply)",
    options: [
      { text: "Everything costs too much to try", id: "cost" },
      { text: "I feel embarrassed being a beginner", id: "embarrassed" },
      { text: "I don't know where to start", id: "start" },
      { text: "I get bored and quit", id: "bored" },
      { text: "Nothing sounds interesting enough", id: "interesting" },
      { text: "I don't have anyone to do things with", id: "no_friends" }
    ]
  }
];

// State
let currentIndex = 0;
let userAnswers = new Array(flowSteps.length).fill(null);
let isTransitioning = false;

// DOM Elements
const screenContainer = document.getElementById('screen-container');
const progressBar = document.getElementById('progress-bar');
const backBtn = document.getElementById('back-btn');
const stepCounter = document.getElementById('step-counter');

// Initialization
function init() {
  backBtn.addEventListener('click', goBack);
  renderScreen(0, 'forward');
}

// Navigation Logic
function nextStep(answerData) {
  if (isTransitioning) return;

  userAnswers[currentIndex] = answerData;

  if (currentIndex < flowSteps.length - 1) {
    currentIndex++;
    renderScreen(currentIndex, 'forward');
  } else {
    // Go to results
    currentIndex++;
    renderResultsScreen('forward');
  }
}

function goBack() {
  if (isTransitioning || currentIndex === 0) return;
  currentIndex--;
  renderScreen(currentIndex, 'backward');
}

// Rendering Engine
function renderScreen(index, direction) {
  isTransitioning = true;
  const step = flowSteps[index];

  // Update Header UI. Counting completed steps out of flowSteps.length caps the
  // bar at 92% on the final question, so count the current step instead.
  const pct = Math.round(((index + 1) / (flowSteps.length + 1)) * 100);
  progressBar.style.transform = `scaleX(${pct / 100})`;
  if (progressBar.parentElement) {
    progressBar.parentElement.setAttribute('aria-valuenow', String(index + 1));
    progressBar.parentElement.setAttribute('aria-valuemax', String(flowSteps.length + 1));
  }
  if (stepCounter) {
    stepCounter.textContent = `${index + 1} of ${flowSteps.length}`;
  }
  backBtn.classList.toggle('hidden', index === 0);

  // Create new screen element
  const newScreen = document.createElement('div');
  newScreen.className = `screen ${step.type}-screen`;

  // Build interior based on type
  if (step.type === 'pairwise') {
    newScreen.innerHTML = `
      <div class="pairwise-title-container">
        <h2 class="question-title">${step.question}</h2>
      </div>
      <div class="choices-container" role="group" aria-label="${step.question}">
        <button type="button" class="choice-card choice-left" data-opt="0">
          <span>${step.options[0].text}</span>
        </button>
        <button type="button" class="choice-card choice-right" data-opt="1">
          <span>${step.options[1].text}</span>
        </button>
      </div>
    `;

    const choices = newScreen.querySelectorAll('.choice-card');
    // Going back used to show a blank question; show what they picked.
    const prior = userAnswers[index];
    if (prior && typeof prior.optionIndex === 'number' && choices[prior.optionIndex]) {
      choices[prior.optionIndex].classList.add('previously-chosen');
      choices[prior.optionIndex].setAttribute('aria-pressed', 'true');
    }
    choices.forEach(card => {
      card.addEventListener('click', function() {
        if (isTransitioning) return;
        this.classList.add('selected');
        const otherCard = this.classList.contains('choice-left') ? choices[1] : choices[0];
        otherCard.classList.add('dimmed');

        const optIndex = parseInt(this.getAttribute('data-opt'), 10);
        setTimeout(() => nextStep({ optionIndex: optIndex, scores: step.options[optIndex].scores }), 400);
      });
    });

  } else if (step.type === 'scenario') {
    let optionsHtml = step.options.map((opt, i) => `
      <button class="scenario-btn" data-opt="${i}">${opt.text}</button>
    `).join('');

    newScreen.innerHTML = `
      <div class="scenario-container">
        <h2 class="question-title">${step.question}</h2>
        <div class="scenario-options">${optionsHtml}</div>
      </div>
    `;

    const btns = newScreen.querySelectorAll('.scenario-btn');
    const priorScenario = userAnswers[index];
    if (priorScenario && typeof priorScenario.optionIndex === 'number' && btns[priorScenario.optionIndex]) {
      btns[priorScenario.optionIndex].classList.add('previously-chosen');
      btns[priorScenario.optionIndex].setAttribute('aria-pressed', 'true');
    }
    btns.forEach(btn => {
      btn.addEventListener('click', function() {
        if (isTransitioning) return;
        this.classList.add('selected');
        const optIndex = parseInt(this.getAttribute('data-opt'), 10);
        setTimeout(() => nextStep({ optionIndex: optIndex, scores: step.options[optIndex].scores }), 300);
      });
    });

  } else if (step.type === 'constraints') {
    let tagsHtml = step.options.map(opt => `
      <button class="tag-btn" data-id="${opt.id}">${opt.text}</button>
    `).join('');

    newScreen.innerHTML = `
      <div class="constraints-container">
        <h2 class="question-title">${step.question}</h2>
        <p class="constraints-subtitle">${step.subtitle}</p>
        <div class="tags-grid">${tagsHtml}</div>
        <div class="continue-wrapper">
          <button class="continue-btn">Continue</button>
        </div>
      </div>
    `;

    const tags = newScreen.querySelectorAll('.tag-btn');
    const continueBtn = newScreen.querySelector('.continue-btn');
    const continueWrap = newScreen.querySelector('.continue-wrapper');
    const priorConstraints = userAnswers[index];
    let selectedIds = new Set(
      priorConstraints && Array.isArray(priorConstraints.constraints) ? priorConstraints.constraints : []
    );
    tags.forEach(tag => {
      if (selectedIds.has(tag.getAttribute('data-id'))) tag.classList.add('selected');
    });
    if (selectedIds.size > 0 && continueWrap) continueWrap.classList.add('visible');

    tags.forEach(tag => {
      tag.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        if (selectedIds.has(id)) {
          selectedIds.delete(id);
          this.classList.remove('selected');
        } else {
          selectedIds.add(id);
          this.classList.add('selected');
        }

        if (selectedIds.size > 0) {
          continueWrap.classList.add('visible');
        } else {
          continueWrap.classList.remove('visible');
        }
      });
    });

    continueBtn.addEventListener('click', () => {
      if (selectedIds.size === 0) return; // Prevent proceeding if none selected, though UI hides it
      nextStep({ constraints: Array.from(selectedIds) });
    });
  }

  transitionScreens(newScreen, direction);
}

function renderResultsScreen(direction) {
  isTransitioning = true;
  progressBar.style.transform = 'scaleX(1)';
  backBtn.classList.add('hidden');

  const finalScores = calculateScores();
  const insights = generateInsights(finalScores);
  saveProfile(finalScores, insights);

  const newScreen = document.createElement('div');
  newScreen.className = 'screen results-screen';

  // Build chart dimensions
  const dims = [
    { key: 'sociality', left: 'Solo', right: 'Social' },
    { key: 'structure', left: 'Freeform', right: 'Structured' },
    { key: 'physicality', left: 'Mental', right: 'Physical' },
    { key: 'expression', left: 'Analytical', right: 'Creative' },
    { key: 'environment', left: 'Indoor', right: 'Outdoor' },
    { key: 'barrier', left: 'Low Barrier', right: 'High Invest' }
  ];

  let chartHtml = dims.map(d => {
    // Score maps from [-1, 1] to [0, 100]%
    let rawScore = finalScores[d.key] || 0;
    let percentage = ((rawScore + 1) / 2) * 100;
    return `
      <div class="dimension-row">
        <span class="dim-label left">${d.left}</span>
        <div class="slider-track">
          <div class="slider-center"></div>
          <div class="slider-dot" data-target="${percentage}" style="left: 50%;"></div>
        </div>
        <span class="dim-label right">${d.right}</span>
      </div>
    `;
  }).join('');

  let insightsHtml = insights.map(ins => `
    <div class="insight-card">${ins}</div>
  `).join('');

  newScreen.innerHTML = `
    <div class="results-container">
      <div class="results-header">
        <h1>Your Activity DNA</h1>
        <p>We've analyzed your subtle preferences. Here is your psychological profile.</p>
        <p class="quiz-tagline">You let your mind lie fallow. Here's what's growing.</p>
      </div>

      <div class="results-content">
        <div class="chart-section">
          <h2 class="chart-title">Preference Spectrum</h2>
          <div class="chart-body">
            ${chartHtml}
          </div>
        </div>

        <div class="insights-section">
          ${insightsHtml}
        </div>
      </div>

      <div class="teaser-section">
        <h2>We found 5 activities weirdly perfect for you</h2>
        <p>They're ready now. Nothing to sign up for.</p>

        <div class="teaser-actions">
          <a href="results.html" class="btn-light btn-light--primary">See my 5 matches</a>
          <button type="button" id="share-dna-btn" class="btn-light btn-light--ghost">Share my DNA</button>
        </div>

        <div class="beta-optin">
          <h3>Want a hand-picked set too?</h3>
          <p>For the beta, our founders curate a second set by hand from your DNA and email it over. Entirely optional.</p>

          <div class="optin-success" data-fs-success hidden>
            Thank you. We'll email your hand-picked matches shortly.
          </div>
          <div class="optin-error" data-fs-error></div>

          <form id="beta-submit-form" class="optin-form">
            <label class="visually-hidden" for="beta-email">Email address</label>
            <input type="email" id="beta-email" name="email" placeholder="you@example.com" autocomplete="email" required data-fs-field>
            <input type="hidden" name="profile_data" id="hidden-profile-data" value="" data-fs-field>
            <button type="submit" class="btn-light btn-light--ghost" data-fs-submit-btn>Send them over</button>
          </form>
          <span class="optin-error" data-fs-error="email"></span>
        </div>
      </div>
    </div>
  `;

  // Inject the stringified profile data into the hidden input so Formspree emails it to us
  const hiddenInput = newScreen.querySelector('#hidden-profile-data');
  if (hiddenInput) {
      hiddenInput.value = JSON.stringify(finalScores, null, 2);
  }

  transitionScreens(newScreen, direction);

  // Replace Formspree with Supabase waitlist submission
  setTimeout(() => {
    const form = newScreen.querySelector('#beta-submit-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = form.querySelector('input[name="email"]');
        const email = emailInput ? emailInput.value : '';
        const profileDataStr = newScreen.querySelector('#hidden-profile-data').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const successDiv = newScreen.querySelector('[data-fs-success]');
        const errorDiv = newScreen.querySelector('[data-fs-error]');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
          const { error } = await supabase.from('waitlist').insert({
            email: email,
            profile_data: JSON.parse(profileDataStr)
          });

          if (error) throw error;

          if (successDiv) successDiv.style.display = 'block';
          if (errorDiv) errorDiv.textContent = '';
          form.style.display = 'none';
        } catch (err) {
          console.error("Waitlist error:", err);
          if (errorDiv) errorDiv.textContent = 'Oops! There was a problem saving your email.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send me my matches';
        }
      });
    }
  }, 100);

  // Attach Share listener
  const shareBtn = newScreen.querySelector('#share-dna-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      shareDNA(insights);
    });
  }

  // Trigger animations for chart after mounting
  setTimeout(() => {
    const dots = newScreen.querySelectorAll('.slider-dot');
    dots.forEach(dot => {
      dot.style.left = `${dot.getAttribute('data-target')}%`;
    });
  }, 100);
}

// Transition Manager
function transitionScreens(newScreen, direction) {
  const currentScreen = screenContainer.querySelector('.screen.active');

  if (currentScreen) {
    currentScreen.classList.remove('active');
    currentScreen.style.transform = direction === 'forward' ? 'translateY(-20px)' : 'translateY(20px)';
    currentScreen.style.opacity = '0';

    // Remove after animation
    setTimeout(() => {
      if (currentScreen.parentNode) {
        currentScreen.parentNode.removeChild(currentScreen);
      }
    }, 600);
  }

  // Prepare new screen
  newScreen.style.transform = direction === 'forward' ? 'translateY(20px)' : 'translateY(-20px)';
  screenContainer.appendChild(newScreen);

  // Trigger reflow
  void newScreen.offsetWidth;

  // Animate in
  newScreen.classList.add('active');
  newScreen.style.transform = '';

  setTimeout(() => {
    isTransitioning = false;
  }, 600);
}

// Data Processing
function calculateScores() {
  const dimensions = {
    sociality: 0,
    structure: 0,
    physicality: 0,
    expression: 0,
    environment: 0,
    barrier: 0
  };

  userAnswers.forEach(answer => {
    if (answer && answer.scores) {
      for (const [dim, val] of Object.entries(answer.scores)) {
        dimensions[dim] += val;
      }
    }
  });

  // Clamp to [-1, 1]
  for (const key in dimensions) {
    dimensions[key] = Math.max(-1, Math.min(1, dimensions[key]));
  }

  return dimensions;
}

function generateInsights(scores) {
  const insights = [];

  if (scores.structure > 0.2 && scores.expression > 0.2) {
    insights.push("You're a <strong>Structured Maker</strong>  you love the satisfaction of following a reliable process and ending up with a tangible result.");
  } else if (scores.structure < -0.2 && scores.expression > 0.2) {
    insights.push("You're a <strong>Freeform Creator</strong>  you thrive on improvisation and turning raw inspiration into reality without strict rules.");
  } else if (scores.structure > 0.2 && scores.expression < -0.2) {
    insights.push("You're an <strong>Analytical Optimizer</strong>  you're drawn to understanding complex systems, solving puzzles, and mastering rulesets.");
  } else if (scores.structure < -0.2 && scores.expression < -0.2) {
    insights.push("You're an <strong>Intuitive Explorer</strong>  you prefer organic discovery and adapting to whatever catches your interest in the moment.");
  } else {
    insights.push("You have a wonderfully balanced approach, making you adaptable to both creative and analytical challenges.");
  }

  if (scores.sociality < -0.2) {
    insights.push("You lean toward solo activities where you can focus deeply and dictate your own pace without social friction.");
  } else if (scores.sociality > 0.2) {
    insights.push("Community is key for you: an activity isn't fully engaging unless it involves sharing the experience with others.");
  }

  if (scores.physicality > 0.2) {
    insights.push("You need activities that get you moving or actively engaging with the physical world, not just staring at a screen.");
  } else if (scores.physicality < -0.2) {
    insights.push("You find your flow state in mental engagement: analyzing, reading, and diving deep into rabbit holes of information.");
  }

  return insights.slice(0, 3); // Guarantee max 3 insights
}

async function saveProfile(scores, insights) {
  const constraintsData = [];
  userAnswers.forEach(ans => {
    if (ans && ans.constraints) {
      constraintsData.push(...ans.constraints);
    }
  });

  const profile = {
    timestamp: new Date().toISOString(),
    scores: scores,
    insights: insights || [],
    rawAnswers: userAnswers,
    constraints: constraintsData
  };

  localStorage.setItem('fallow_profile', JSON.stringify(profile));

  // Save to Supabase
  try {
    const session = await getSession();
    if (session && session.user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          scores: scores,
          updated_at: new Date().toISOString()
        });

      if (error) console.error("Error saving profile to Supabase:", error);
    }
  } catch (err) {
    console.error("Supabase error:", err);
  }
}

// Start
document.addEventListener('DOMContentLoaded', init);
