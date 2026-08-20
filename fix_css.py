with open('index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix difference-bar
target_bar = '''
.difference-bar {
  height: 24px;
  background-color: var(--color-border);
}
'''.strip()
repl_bar = '''
.difference-bar {
  height: var(--border-weight);
  background-color: var(--color-border);
}
'''.strip()
content = content.replace(target_bar, repl_bar)

# Fix difference-glyph
target_glyph = '''
.difference-glyph {
  display: none;
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 6px;
  font-weight: bold;
  line-height: 1.05;
  color: var(--color-text-muted);
  opacity: 0.4;
  white-space: pre;
  user-select: none;
  -webkit-user-select: none;
}

@media (min-width: 860px) {
  .difference-glyph { display: block; justify-self: center; }
}
'''.strip()
repl_glyph = '''
.difference-glyph {
  display: none;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(4rem, 10vw, 8rem);
  line-height: 1;
  color: var(--color-primary-deep);
  user-select: none;
  -webkit-user-select: none;
}

@media (min-width: 860px) {
  .difference-glyph { display: block; justify-self: center; align-self: center; }
}
'''.strip()
content = content.replace(target_glyph, repl_glyph)

with open('index.css', 'w', encoding='utf-8') as f:
    f.write(content)
