import glob, re
import os

css_files = glob.glob('*.css')

root_vars = '''
:root {
  --color-bg: #EAE5DC;
  --color-surface: transparent;
  --color-surface-dim: transparent;
  --color-text: #1C1A17;
  --color-text-muted: #59544D;
  --color-text-light: #59544D;
  --color-primary: #8C3B26;
  --color-primary-light: #B07D35;
  --color-primary-hover: #1C1A17;
  --color-secondary: #5F6B5F;
  --color-accent: #B07D35;
  --color-accent-hover: #1C1A17;
  --color-border: #1C1A17;
  --bg-color: #EAE5DC;
  --text-main: #1C1A17;
  --card-bg: transparent;
  --border-color: #1C1A17;
  --success-color: #5F6B5F;
  --surprise-color: #8C3B26;

  --font-display: 'Fraunces', serif;
  --font-serif: 'Fraunces', serif;
  --font-body: 'Inter', sans-serif;
  --font-sans: 'Inter', sans-serif;

  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 0px;
  --radius-pill: 0px;

  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
  --shadow-card: none;
  
  --transition-fast: 300ms ease;
  --transition-normal: 600ms cubic-bezier(0.25, 1, 0.5, 1);
  --transition-slow: 1000ms cubic-bezier(0.25, 1, 0.5, 1);
}
'''

for file in css_files:
    if file == 'index.css': continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace root block
    if ':root' in content:
        content = re.sub(r':root\s*\{[^}]*\}', root_vars, content, flags=re.DOTALL)
    else:
        content = root_vars + '\n' + content
        
    # Strip border radius and box shadow
    content = re.sub(r'border-radius:\s*[^;]+;', 'border-radius: 0;', content)
    content = re.sub(r'box-shadow:\s*[^;]+;', 'box-shadow: none;', content)
    
    # Enhance typography for specific classes
    content = re.sub(r'font-size:\s*1\.5rem;', 'font-size: 2.5rem;', content)
    content = re.sub(r'font-size:\s*2rem;', 'font-size: 3.5rem;', content)
    
    # Make borders sharp
    content = re.sub(r'border:\s*none;', 'border: 1px solid var(--color-border);', content)
    
    # Noise overlay
    if file != 'share.css':
        noise_css = """
body::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
}
"""
        if 'body::after' not in content:
            content += noise_css
            
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print('Updated CSS files.')
