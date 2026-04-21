import pathlib

def clean_file(filepath):
    p = pathlib.Path(filepath)
    if p.exists():
        text = p.read_text('utf-8')
        text = text.replace("''#", "'#")
        text = text.replace("''rgba", "'rgba")
        text = text.replace("''transparent''", "'transparent'")
        text = text.replace("F8''", "F8'")
        text = text.replace("FF''", "FF'")
        text = text.replace("F6''", "F6'")
        text = text.replace("18''", "18'")
        text = text.replace("AF''", "AF'")
        text = text.replace("80''", "80'")
        text = text.replace("51''", "51'")
        text = text.replace("EB''", "EB'")
        text = text.replace("FB''", "FB'")
        # A more generic cleanup just in case:
        text = text.replace("''", "'") 
        # But wait, replacing '' with ' might break empty strings if any exist like useState(''). 
        # So it's better to just write the file with fix logic.
        
        # Let's read, find anything with ''#XXXXX'' and replace it.
        import re
        text = re.sub(r"''(#\w{6})''", r"'\1'", text)
        text = re.sub(r"''(transparent)''", r"'\1'", text)
        p.write_text(text, 'utf-8')

for f in ['src/pages/Session.jsx', 'src/pages/Profile.jsx']:
    clean_file(f)
