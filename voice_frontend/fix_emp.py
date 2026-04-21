import pathlib

for filepath in ['src/pages/Session.jsx', 'src/pages/Profile.jsx']:
    p = pathlib.Path(filepath)
    if p.exists():
        text = p.read_text('utf-8')
        text = text.replace("useState(')", "useState('')")
        text = text.replace("setApiError(')", "setApiError('')")
        text = text.replace("setNewName(')", "setNewName('')")
        text = text.replace("setError(')", "setError('')")
        text = text.replace("(')", "('')") # Catch-all for any others
        p.write_text(text, 'utf-8')
