import os

for root, dirs, files in os.walk('.'):
    for f in files:
        if f.endswith('.py') or f.endswith('.html'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            new_content = content.replace('\"', '"')
            
            if new_content != content:
                print(f"Fixed quotes in {filepath}")
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(new_content)
