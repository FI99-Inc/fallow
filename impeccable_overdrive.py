import glob
import re

css_files = glob.glob('*.css')

for file in css_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # /colorize
    # Update color-primary to a more vibrant #D9532A
    content = content.replace('--color-primary: #8C3B26;', '--color-primary: #D9532A;')

    # /bolder
    # Make headings bold
    content = re.sub(r'font-weight:\s*300;', 'font-weight: 700;', content)
    content = re.sub(r'font-weight:\s*400;(\s*line-height:\s*1.05;)', r'font-weight: 700;\1', content)
    # Make borders 2px
    content = re.sub(r'border:\s*1px\s*solid', 'border: 2px solid', content)
    content = re.sub(r'border-top:\s*1px\s*solid', 'border-top: 2px solid', content)
    content = re.sub(r'border-bottom:\s*1px\s*solid', 'border-bottom: 2px solid', content)
    content = re.sub(r'border-left:\s*1px\s*solid', 'border-left: 2px solid', content)
    content = re.sub(r'border-right:\s*1px\s*solid', 'border-right: 2px solid', content)

    # /animate
    # Add spring animations to transitions
    # If the user has transition-fast defined, let's redefine it
    content = content.replace('--transition-fast: 300ms ease;', '--transition-fast: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);')
    
    # Add hover scaling to buttons
    if '.btn:hover {' in content:
        content = content.replace('.btn:hover {', '.btn:hover {\n  transform: scale(1.02);')
    if '.btn:active {' in content:
        content = content.replace('.btn:active {', '.btn:active {\n  transform: scale(0.98);')
    else:
        # Add .btn:active
        if '.btn {' in content:
            content += '\n.btn:active {\n  transform: scale(0.98);\n}\n'

    # Add clip-path wipe animation to .fade-up
    content = content.replace('transform: translateY(10px);', 'transform: translateY(20px); clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);')
    content = content.replace('transform: translateY(0);', 'transform: translateY(0); clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);')

    # /harden
    # Ensure min-height 44px on buttons
    if '.btn {' in content:
        content = content.replace('.btn {', '.btn {\n  min-height: 44px;')
    
    # Add focus-visible outlines globally
    focus_css = """
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}
"""
    if '*:focus-visible' not in content:
        content += focus_css
        
    # Text overflow protections on typical text elements (buttons, cards)
    if '.vibe-card {' in content:
        content = content.replace('.vibe-card {', '.vibe-card {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;')
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Impeccable overdrive complete!")
