from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os

load_dotenv()
HF_KEY = os.getenv('HF_KEY')

class TextGenerator:
    def __init__(self):
        try:
            self.client = InferenceClient(
                model="meta-llama/Meta-Llama-3-8B-Instruct", 
                token=HF_KEY
            )
            self.loaded = True
            print("Text_Generation model loaded successfully")
        except Exception as e:
            print(f"Text_Generation Model not loaded: {e}")
            self.loaded = False
            
    def generate_interview_response(self, user_message, interview_context=None):
        if not self.loaded:
            # Fallback smart interviewer dialogue tree
            import json
            turn_idx = 0
            if interview_context:
                try:
                    history = json.loads(interview_context)
                    if isinstance(history, list):
                        user_turns = [m for m in history if m.get("role") == "user"]
                        turn_idx = len(user_turns)
                except Exception as e:
                    print(f"Error parsing history in fallback: {e}")
            
            fallback_questions = [
                "Thank you for sharing that! To start, could you explain the differences between Python's list and tuple structures, and when you would prefer one over the other?",
                "Excellent. Memory management is crucial in Python. Can you discuss how Python's garbage collector works, specifically how it handles reference counting and circular dependencies?",
                "Great insights. Let's move to software architecture. How would you design a rate limiter for a public API, and what data structures would you use to store client request frequencies?",
                "That's a sound approach. Let's wrap up with team collaboration. How do you handle code reviews when you disagree with a senior developer's design decisions?",
                "Thank you. Those are all the questions I have for today. Do you have any questions for me about NightOwl or the role?",
                "Wonderful. Thank you for your time. The interview is now complete, and we will contact you shortly with the next steps."
            ]
            
            # Since index is 1-based on user replies (after welcome, index is 1, which maps to fallback_questions[0])
            idx = turn_idx - 1
            if idx < 0:
                idx = 0
            if idx < len(fallback_questions):
                return fallback_questions[idx]
            else:
                return fallback_questions[-1]
            
        system_prompt = """You are a professional AI interviewer conducting a job interview. 
        Your role is to:
        1. Ask relevant, thoughtful questions about the candidate's experience and skills
        2. Provide a welcoming and professional atmosphere
        3. Guide the conversation naturally
        4. Be encouraging but professional
        5. Keep responses concise and focused on the interview
        
        Current interview context: {context}
        
        Candidate's response: {response}
        
        Please provide your next interview question or response:"""
        
        context = interview_context or "General job interview"
        
        messages = [
            {"role": "system", "content": system_prompt.format(context=context, response=user_message)},
            {"role": "user", "content": user_message}
        ]
        
        try:
            response = self.client.chat_completion(
                messages=messages,
                max_tokens=300,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Generation error: {e}")
            return "Let me ask you another question. Can you tell me about your professional background?"

client_tg = TextGenerator()

