import json
import re
from openai import OpenAI
from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_MODEL
import logging

logger = logging.getLogger(__name__)
from typing import List, Dict, Any, Tuple

client = OpenAI(api_key=OPENAI_API_KEY)

SYSTEM_PROMPT = "You are a helpful education assistant. Output valid JSON only."



def _get_completion(messages: List[Dict[str, str]], model=OPENAI_MODEL) -> Tuple[Any, int]:
    """Helper to call OpenAI and return (content, total_tokens)"""
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7
        )
        content = response.choices[0].message.content
        usage = response.usage.total_tokens if response.usage else 0
        
        # Robust JSON extraction
        try:
            # 1. Try parsing directly
            return json.loads(content), usage
        except json.JSONDecodeError:
            pass

        # 2. Try extracting from markdown code blocks
        json_match = re.search(r"```(?:json)?\s*(.*?)```", content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1).strip()), usage
            except json.JSONDecodeError:
                pass

        # 3. Try finding the first structure (array or object)
        # Look for [ ... ] or { ... }
        structure_match = re.search(r"(\{.*\}|\[.*\])", content, re.DOTALL)
        if structure_match:
            try:
                return json.loads(structure_match.group(1).strip()), usage
            except json.JSONDecodeError:
                pass
        
        logger.error(f"Failed to parse JSON from content: {content[:100]}...")
        return None, usage

    except Exception as e:
        logger.error(f"OpenAI Error: {e}")
        return None, 0

def generate_math_problems(topic: str, count: int, difficulty: str, grade: str = "", context: str = "") -> Tuple[List[Dict[str, str]], int]:
    user_prompt = f"""
    Generate {count} math problems.
    Topic: {topic}
    Difficulty: {difficulty}
    Grade Level: {grade}
    Class Context/Description: {context} (Use this style/theme if applicable)
    
    Return ONLY a JSON array of objects with 'q' and 'a' keys.
    Example: [{{"q": "2 + 2 = ?", "a": "4"}}, {{"q": "Solve for x: 2x = 10", "a": "x = 5"}}]
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
    
    DO NOT include the answer, hint, or correct letter embedded within the question text itself. Keep questions and answers strictly separated.

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
    
    DO NOT include the answer, hint, or correct letter embedded within the question text itself. Keep questions and answers strictly separated.

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
    return _get_completion([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ])
def generate_jeopardy(topic: str, grade: str = "", context: str = "") -> Tuple[Dict, int]:
    """Generates a full Jeopardy game board"""
    user_prompt = f"""
    Create a Jeopardy game board.
    Topic: {topic}
    Grade: {grade}
    Context: {context}
    
    DO NOT include the answer, hint, or correct letter embedded within the question text itself. Keep questions and answers strictly separated.

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
    ])
