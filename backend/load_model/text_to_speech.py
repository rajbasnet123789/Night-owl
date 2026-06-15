from gtts import gTTS
import tempfile
import os
from dotenv import load_dotenv

load_dotenv()

class TextToSpeech:
    def __init__(self):
        self.language = 'en'
        
    def text_to_audio(self, text, output_path=None):
        try:
            tts = gTTS(text=text, lang=self.language, slow=False)
            
            if output_path is None:
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
                output_path = temp_file.name
                temp_file.close()
            
            tts.save(output_path)
            return output_path
        except Exception as e:
            print(f"TTS Error: {e}")
            return None
            
    def cleanup(self, file_path):
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass

client_tts = TextToSpeech()