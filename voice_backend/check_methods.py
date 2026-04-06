from piper.voice import PiperVoice
import inspect

methods = [m[0] for m in inspect.getmembers(PiperVoice)]
with open('methods.txt', 'w', encoding='utf-8') as f:
    for m in methods:
        f.write(m + '\\n')
