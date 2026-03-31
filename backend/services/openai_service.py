import asyncio
import base64
import json
import re
import traceback
from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_MODEL
import logging
logger = logging.getLogger(__name__)
from typing import List, Dict, Any, Tuple, Optional

client = OpenAI(api_key=OPENAI_API_KEY)

def get_system_prompt(language: str) -> str:
    """Returns a system prompt that enforces content in the target language."""
    return (
        f"You are a helpful education assistant. All content MUST be in {language}. "
        "Header keys (q, a, title, word, clue, options, answer, categories, name, questions, points) are reserved, "
        "but their values must be translated. Output valid JSON only."
    )

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
            return json.loads(content), usage
        except json.JSONDecodeError:
            pass
            
        json_match = re.search(r"```(?:json)?\s*(.*?)```", content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1).strip()), usage
            except json.JSONDecodeError:
                pass
                
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

def generate_math_problems(topic: str, count: int, difficulty: str, grade: str = "", context: str = "", language: str = "Russian") -> Tuple[List[Dict[str, str]], int]:
    user_prompt = f"""
    Generate {count} math problems in {language}.
    Topic: {topic}
    Difficulty: {difficulty}
    Grade Level: {grade}
    Class Context/Description: {context} (Use this style/theme if applicable)
    
    Return ONLY a JSON array of objects with 'q' and 'a' keys.
    Example: [{{"q": "2 + 2 = ?", "a": "4"}}, {{"q": "Solve for x: 2x = 10", "a": "x = 5"}}]
    """
    return _get_completion([
        {"role": "system", "content": get_system_prompt(language)},
        {"role": "user", "content": user_prompt}
    ])

def generate_crossword_words(topic: str, count: int, language: str = "Russian", grade: str = "", context: str = "") -> tuple:
    user_prompt = f"""
    Generate exactly {count} words and clues related to the topic "{topic}" in {language}.
    Grade Level: {grade}
    Class Context: {context}
    
    RULES:
    - Words must be single words only (no spaces, no hyphens)
    - Words should be 4-12 characters long
    - Clues should be short (max 8 words)
    - The 'word' must be in UPPERCASE
    - Language for words AND clues: {language}
    
    Return ONLY a JSON array (no extra text):
    [{{"word": "APPLE", "clue": "A red or green fruit"}}]
    """
    return _get_completion([
        {"role": "system", "content": get_system_prompt(language)},
        {"role": "user", "content": user_prompt}
    ])

def generate_quiz(topic: str, count: int, grade: str = "", context: str = "", language: str = "Russian") -> Tuple[List[Dict], int]:
    user_prompt = f"""
    Generate {count} multiple-choice quiz questions in {language}.
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
        {"role": "system", "content": get_system_prompt(language)},
        {"role": "user", "content": user_prompt}
    ])

def generate_assignment(subject: str, topic: str, count: int, grade: str = "", context: str = "", language: str = "Russian") -> Tuple[Dict, int]:
    user_prompt = f"""
    Create a detailed school assignment/worksheet in {language}.
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
        {"role": "system", "content": get_system_prompt(language)},
        {"role": "user", "content": user_prompt}
    ])

def generate_jeopardy(topic: str, grade: str = "", context: str = "", language: str = "Russian") -> Tuple[Dict, int]:
    user_prompt = f"""
    Create a Jeopardy game board in {language}.
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
        {"role": "system", "content": get_system_prompt(language)},
        {"role": "user", "content": user_prompt}
    ])


# ─── Storybook generation (OpenAI fallback) ──────────────────────────────────

_STORY_SYSTEM_OAI = (
    "You are an award-winning children's storybook author. "
    "You write warm, engaging, imaginative stories with a natural narrative arc. "
    "Output ONLY valid JSON, no markdown fences, no extra text."
)


def _story_prompt_oai(title, topic, age_group, language, genre) -> str:
    title_instruction = f'Title: "{title}"' if title else "Generate a creative and catchy title for this story."
    return f"""Write a children's {genre} storybook in {language}.

{title_instruction}
Topic / educational theme: {topic}
Target age: {age_group} years old
Number of story pages: 10
Words per page: exactly 60-70 words (count carefully!)

Narrative requirements:
- Page 1: introduce characters and setting
- Pages 2-8: story unfolds with a small challenge or adventure
- Page 9: problem is resolved
- Page 10: warm, hopeful ending that reinforces the topic/theme
- Language: {language} (all story text must be in {language})
- Style: simple sentences, vivid imagery, child-friendly vocabulary

For each page also include an illustration_prompt in English (max 25 words):
  Format: "Children's storybook illustration, [scene description], watercolor style, soft warm colors, detailed."

Return ONLY this JSON (no markdown, no extra text):
{{
  "title": "{title if title else 'Generated Title'}",
  "description": "One engaging summary sentence in {language}",
  "age_group": "{age_group}",
  "genre": "{genre}",
  "language": "{language}",
  "pages": [
    {{
      "page_number": 1,
      "text": "Story text in {language}, exactly 60-70 words.",
      "illustration_prompt": "Children's storybook illustration, [scene], watercolor style, soft warm colors, detailed."
    }}
  ]
}}"""


def _parse_json_oai(text: str) -> Optional[dict]:
    """Несколько стратегий извлечения JSON из ответа модели."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass
    m = re.search(r"(\{.*\})", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass
    return None


async def _generate_dalle_image(oai_client: OpenAI, prompt: str) -> Optional[str]:
    """Генерирует одну иллюстрацию через DALL-E 3, возвращает base64 или None."""
    full_prompt = (
        f"{prompt} "
        "Children's storybook, soft watercolor illustration, warm pastel palette, "
        "professional children's book art, highly detailed, no text, no words, no letters."
    )
    try:
        response = await asyncio.to_thread(
            oai_client.images.generate,
            model="dall-e-3",
            prompt=full_prompt[:4000],
            size="1024x1024",
            quality="standard",
            response_format="b64_json",
            n=1,
        )
        b64 = response.data[0].b64_json
        logger.info("DALL-E 3 image generated successfully")
        return b64
    except Exception as e:
        logger.warning(f"DALL-E 3 image generation failed: {e}")
        traceback.print_exc()
        return None


async def generate_storybook(
    title: str = "",
    topic: str = "",
    age_group: str = "7-10",
    language: str = "Russian",
    genre: str = "fairy tale",
    openai_api_key: str = "",
) -> Optional[dict]:
    """
    Генерирует сторибук через OpenAI (fallback при недоступности Gemini):
      1. Текст 10 страниц — gpt-4o-mini
      2. 10 иллюстраций параллельно — DALL-E 3
    Возвращает dict с pages (каждая страница содержит image_base64 или None).
    """
    if not openai_api_key:
        logger.error("OPENAI_API_KEY is not set")
        return None

    oai_client = OpenAI(api_key=openai_api_key)

    # ── Шаг 1: Генерация текста ──────────────────────────────────────────────
    logger.info("OpenAI fallback: generating story text with gpt-4o-mini...")
    try:
        response = await asyncio.to_thread(
            oai_client.chat.completions.create,
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _STORY_SYSTEM_OAI},
                {"role": "user", "content": _story_prompt_oai(title, topic, age_group, language, genre)},
            ],
            temperature=0.9,
            max_tokens=4096,
        )
        raw = response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"OpenAI story generation failed: {e}")
        return None

    story_data = _parse_json_oai(raw)
    if not story_data or "pages" not in story_data:
        logger.error("Could not parse story JSON from OpenAI response")
        return None

    logger.info(f"OpenAI story parsed: {len(story_data['pages'])} pages")

    # ── Шаг 2: Параллельная генерация иллюстраций ────────────────────────────
    logger.info("OpenAI fallback: generating 10 illustrations with DALL-E 3...")
    tasks = [
        _generate_dalle_image(
            oai_client,
            page.get("illustration_prompt", f"Scene from page {page['page_number']}"),
        )
        for page in story_data["pages"]
    ]
    image_results = await asyncio.gather(*tasks)

    for i, img_b64 in enumerate(image_results):
        story_data["pages"][i]["image_base64"] = img_b64

    return story_data
