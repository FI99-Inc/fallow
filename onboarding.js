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
  
  // Update Header UI
  progressBar.style.width = `${(index / flowSteps.length) * 100}%`;
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
      <div class="choices-container">
        <div class="choice-card choice-left" data-opt="0">
          <span>${step.options[0].text}</span>
        </div>
        <div class="choice-card choice-right" data-opt="1">
          <span>${step.options[1].text}</span>
        </div>
      </div>
    `;
    
    const choices = newScreen.querySelectorAll('.choice-card');
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
        <p style="color: var(--color-text-light); margin-top:-10px;">${step.subtitle}</p>
        <div class="tags-grid">${tagsHtml}</div>
        <div class="continue-wrapper">
          <button class="continue-btn">Continue</button>
        </div>
      </div>
    `;
    
    const tags = newScreen.querySelectorAll('.tag-btn');
    const continueBtn = newScreen.querySelector('.continue-btn');
    const continueWrap = newScreen.querySelector('.continue-wrapper');
    let selectedIds = new Set();
    
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
  progressBar.style.width = `100%`;
  backBtn.classList.add('hidden');
  
  const finalScores = calculateScores();
  const insights = generateInsights(finalScores);
  saveProfile(finalScores);
  
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
        <p>For our Beta Test, our founders are manually curating recommendations based on your unique DNA.</p>
        
        <div data-fs-success style="margin-top: 20px; font-weight: bold; color: var(--color-primary); display: none;">
          Thank you! We'll email your matches shortly.
        </div>
        <div data-fs-error style="color: #d32f2f; margin-top: 10px;"></div>

        <form id="beta-submit-form" style="margin-top: 20px;">
            <input type="email" name="email" placeholder="Enter your email" required data-fs-field style="padding: 12px; border-radius: 8px; border: 1px solid var(--color-border); margin-right: 8px; width: 60%; background: var(--color-surface); color: var(--color-text);">
            <span data-fs-error="email" style="color: #d32f2f; display: block; margin-top: 5px;"></span>
            
            <input type="hidden" name="profile_data" id="hidden-profile-data" value='' data-fs-field>
            
            <button type="submit" class="btn-light" data-fs-submit-btn style="border: none; cursor: pointer; margin-top: 10px;">Send me my matches</button>
        </form>
        <button id="share-dna-btn" class="btn-light" style="border: 2px solid var(--color-primary); background: transparent; color: var(--color-primary); cursor: pointer; margin-top: 10px; width: 100%;">Share my DNA on Social</button>
        <p style="margin-top: 1.5rem; font-size: 0.85rem; color: var(--color-text-light);">
            Or skip the wait and <a href="results.html" style="color: var(--color-text); text-decoration: underline;">see algorithmic results now</a>.
        </p>
      </div>
    </div>
  `;
  
  // Inject the stringified profile data into the hidden input so Formspree emails it to us
  const hiddenInput = newScreen.querySelector('#hidden-profile-data');
  if (hiddenInput) {
      hiddenInput.value = JSON.stringify(finalScores, null, 2);
  }
  
  transitionScreens(newScreen, direction);
  
  // Initialize Formspree AJAX since the form was just injected
  setTimeout(() => {
    if (window.formspree) {
      window.formspree('initForm', { formElement: '#beta-submit-form', formId: 'myegbnlq' });
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
    insights.push("Community is key for you  an activity isn't fully engaging unless it involves sharing the experience with others.");
  }

  if (scores.physicality > 0.2) {
    insights.push("You need activities that get you moving or actively engaging with the physical world, not just staring at a screen.");
  } else if (scores.physicality < -0.2) {
    insights.push("You find your flow state in mental engagement  analyzing, reading, and diving deep into rabbit holes of information.");
  }

  return insights.slice(0, 3); // Guarantee max 3 insights
}

async function saveProfile(scores) {
  const constraintsData = [];
  userAnswers.forEach(ans => {
    if (ans && ans.constraints) {
      constraintsData.push(...ans.constraints);
    }
  });
  
  const profile = {
    timestamp: new Date().toISOString(),
    scores: scores,
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
