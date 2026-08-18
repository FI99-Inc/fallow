import os
import json
import re

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Rename Kindling -> Fallow
        content = content.replace("Kindling", "Fallow")
        content = content.replace("kindling_", "fallow_")
        content = content.replace("kindling", "fallow")

        # Strip all non-ascii characters (this effectively strips emojis, but preserves normal english text)
        content = re.sub(r'[^\x00-\x7F]+', '', content)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Processed {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

if __name__ == '__main__':
    base_dir = "c:/Users/SJ/Documents/antigravity/serene-curie"
    for root, dirs, files in os.walk(base_dir):
        if ".git" in root or ".gemini" in root:
            continue
        for file in files:
            if file.endswith('.html') or file.endswith('.js') or file.endswith('.json') or file.endswith('.md'):
                process_file(os.path.join(root, file))
