import re

# Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<section class=\"band field-sky section\" id=\"difference-section\">', '<section class=\"band field-peach section\" id=\"difference-section\">')

pre_pattern = re.compile(r'<pre class=\"difference-glyph fade-up\" aria-hidden=\"true\">.*?</pre>', re.DOTALL)
new_glyph = '<div class=\"difference-glyph fade-up\" aria-hidden=\"true\">*</div>'
content = pre_pattern.sub(new_glyph, content)

content = content.replace('                <figcaption>That connection is the whole product.</figcaption>\n', '')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

# Update tokens.css
with open('tokens.css', 'r', encoding='utf-8') as f:
    tokens = f.read()

if '--field-peach:' not in tokens:
    tokens = tokens.replace('--field-sky: #DDE5ED;', '--field-sky: #DDE5ED;\n  --field-peach: #FCE8DE;')

if '.field-peach' not in tokens:
    tokens = tokens.replace('.field-sky        { background-color: var(--field-sky); }', '.field-sky        { background-color: var(--field-sky); }\n.field-peach      { background-color: var(--field-peach); }')

with open('tokens.css', 'w', encoding='utf-8') as f:
    f.write(tokens)
