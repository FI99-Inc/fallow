import glob
import re

# 1. Update HTML files (/clarify)
try:
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    html = html.replace('Join Waitlist', 'Request Beta Access')
    html = html.replace('I have 0 energy and 0 dollars', 'No energy. No budget.')
    html = html.replace("Discover what you're missing", 'Find Your Spark')
    html = html.replace('<h2>How it works</h2>', '<h2>The Process</h2>')
    html = html.replace('Discover what to do', 'Uncover Your Potential')
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
except Exception as e:
    print(f"Error updating HTML: {e}")


# 2. Update CSS files (/typeset, /delight, /adapt, /optimize)
css_files = glob.glob('*.css')
for file in css_files:
    try:
        with open(file, 'r', encoding='utf-8') as f:
            css = f.read()

        # /typeset
        if 'h1, h2, h3' in css:
            css = css.replace('h1, h2, h3 {', 'h1, h2, h3, h4 {\n  text-wrap: balance;')
        elif 'h1, h2, h3, .logo' in css:
            css = css.replace('h1, h2, h3, .logo {', 'h1, h2, h3, h4, .logo {\n  text-wrap: balance;')
        else:
            css += "\nh1, h2, h3, h4 {\n  text-wrap: balance;\n}\n"
        
        # /delight
        selection_css = "\n::selection {\n  background: var(--color-primary);\n  color: #F9F7F3;\n}\n"
        if '::selection' not in css:
            css = css + selection_css

        # /optimize
        css = re.sub(r'(\.fade-up\s*\{[^\}]+)transition:', r'\1will-change: transform, opacity;\n  transition:', css)
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(css)
    except Exception as e:
        print(f"Error updating CSS {file}: {e}")

# 3. Update index.css specific layout (/layout)
try:
    with open('index.css', 'r', encoding='utf-8') as f:
        idx_css = f.read()
    
    stagger_css = """
@media (min-width: 768px) {
  .steps-grid .step-card:nth-child(2) {
    margin-top: 3rem;
  }
  .steps-grid .step-card:nth-child(3) {
    margin-top: 6rem;
  }
  .vibe-grid .vibe-card:nth-child(2n) {
    margin-top: 2rem;
  }
}
"""
    if 'margin-top: 3rem;' not in idx_css:
        idx_css += stagger_css
        
    with open('index.css', 'w', encoding='utf-8') as f:
        f.write(idx_css)
except Exception as e:
    print(f"Error updating index.css: {e}")


# 4. Update index.js (/overdrive)
try:
    with open('index.js', 'r', encoding='utf-8') as f:
        js = f.read()

    parallax_js = """
// Impeccable Overdrive: Hero Parallax
document.addEventListener('mousemove', (e) => {
    const heroTitle = document.querySelector('.hero h1');
    if (!heroTitle) return;
    
    const x = (window.innerWidth / 2 - e.pageX) / 50;
    const y = (window.innerHeight / 2 - e.pageY) / 50;
    
    heroTitle.style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${-x}deg) translateZ(10px)`;
    heroTitle.style.transition = 'transform 0.1s ease-out';
});
"""
    if 'Impeccable Overdrive' not in js:
        js += '\n' + parallax_js
        
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(js)
except Exception as e:
    print(f"Error updating index.js: {e}")

print("Godmode execution complete!")
