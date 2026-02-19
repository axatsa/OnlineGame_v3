import json
from openai import OpenAI
from config import OPENAI_API_KEY
from typing import List, Dict, Any, Tuple

client = OpenAI(api_key=OPENAI_API_KEY)

SYSTEM_PROMPT = "You are a helpful education assistant. Output valid JSON only."

def _get_completion(messages: List[Dict[str, str]], model="gpt-3.5-turbo") -> Tuple[Any, int]:
    """Helper to call OpenAI and return (content, total_tokens)"""
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7
        )
        content = response.choices[0].message.content
        usage = response.usage.total_tokens if response.usage else 0
        
        # Clean up potential markdown filtering
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "")
        elif content.startswith("```"):
            content = content.replace("```", "")
            
        return json.loads(content), usage
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return None, 0

def generate_math_problems(topic: str, count: int, difficulty: str, grade: str = "", context: str = "") -> Tuple[List[str], int]:
    user_prompt = f"""
    Generate {count} math problems.
    Topic: {topic}
    Difficulty: {difficulty}
    Grade Level: {grade}
    Class Context/Description: {context} (Use this style/theme if applicable)
    
    Return ONLY a JSON array of strings.
    Example: ["2 + 2 = ?", "Solve for x: 2x = 10"]
    """
    return _get_completion([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ])

def generate_crossword_words(topic: str, count: int, language: str, grade: str = "", context: str = "") -> Tuple[List[Dict[str, str]], int]:
    user_prompt = f"""
    Generate {count} words and simple clues related to the topic "{topic}" in {language}.
    Grade Level: {grade}
    Class Context: {context}
    
    Return ONLY a JSON array of objects with 'word' and 'clue' properties.
    The 'word' should be in UPPERCASE.
    Example: [{{"word": "APPLE", "clue": "A red fruit"}}]
    """
    return _get_completion([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ])

def generate_quiz(topic: str, count: int, grade: str = "", context: str = "") -> Tuple[List[Dict], int]:
    """For Tug of War and Jeopardy"""
    user_prompt = f"""
    Generate {count} multiple-choice quiz questions.
    Topic: {topic}
    Grade: {grade}
    Context: {context}
    
    Return ONLY a JSON array of objects:
    {{
        "q": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "a": "Correct Option Text"
    }}
    """
    return _get_completion([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ])

def generate_assignment(subject: str, topic: str, count: int, grade: str = "", context: str = "") -> Tuple[Dict, int]:
    """Generates a full structured assignment"""
    user_prompt = f"""
    Create a detailed school assignment/worksheet.
    Subject: {subject}
    Topic: {topic}
    Grade: {grade}
    Context: {context} (Tailor the tone/examples to this description)
    Question Count: {count}
    
    Return ONLY a JSON object matching this structure:
    {{
        "title": "Creative Title",
        "subject": "{subject}",
        "grade": "{grade}",
        "intro": "Brief instructions",
        "questions": [
            {{ 
                "num": 1, 
                "text": "Question text here...", 
                "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"], 
                "answer": "B) Option 2" 
            }}
        ]
    }}
    Make sure to provide 4 options for each question and the correct answer.
    """
def generate_jeopardy(topic: str, grade: str = "", context: str = "") -> Tuple[Dict, int]:
    """Generates a full Jeopardy game board"""
    user_prompt = f"""
    Create a Jeopardy game board.
    Topic: {topic}
    Grade: {grade}
    Context: {context}
    
    Generate 5 distinct categories related to the topic.
    For each category, generate 5 questions with increasing difficulty (100 to 500 points).
    
    Return ONLY a JSON object with this structure:
    {{
        "categories": [
            {{
                "name": "Category Name",
                "questions": [
                    {{ "points": 100, "q": "Question text...", "a": "Short Answer" }},
                    {{ "points": 200, "q": "Question text...", "a": "Short Answer" }},
                    {{ "points": 300, "q": "Question text...", "a": "Short Answer" }},
                    {{ "points": 400, "q": "Question text...", "a": "Short Answer" }},
                    {{ "points": 500, "q": "Question text...", "a": "Short Answer" }}
                ]
            }}
        ]
    }}
    """
    return _get_completion([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ], model="gpt-3.5-turbo-16k")
