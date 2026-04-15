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
        f"You are an expert educational content creator. "
        f"CRITICAL RULE: ALL generated text values MUST be written in {language}. "
        f"This includes questions, answers, clues, titles, descriptions, options — everything. "
        f"JSON key names stay in English (q, a, title, word, clue, options, answer, categories, "
        f"name, questions, points) but every VALUE must be in {language}. "
        f"Do NOT mix languages. Output ONLY valid JSON, no markdown fences, no extra text."
    )

def build_class_context_block(grade: str, context: str) -> str:
    if not grade and not context:
        return ""

    parts = []
    if grade:
        parts.append(
            f"TARGET GRADE: {grade}. "
            f"You MUST calibrate difficulty, vocabulary, and examples "
            f"exactly for grade {grade} students. "
            f"Do not use concepts they have not yet studied."
        )
    if context:
        parts.append(
            f"CLASS PROFILE: {context}. "
            f"You MUST incorporate this profile — adapt themes, examples, "
            f"and complexity to match this specific class."
        )
    return "\n".join(parts)

async def _get_completion(messages: List[Dict[str, str]], model=OPENAI_MODEL) -> Tuple[Any, int]:
    """
    Improved helper: Tries Gemini first (free with rotation), then falls back to OpenAI.
    """
    system_prompt = next((m["content"] for m in messages if m["role"] == "system"), "")
    user_prompt = next((m["content"] for m in messages if m["role"] == "user"), "")

    # ── TRY GEMINI FIRST (Optimization) ──────────────────────────────────────
    from services import gemini_service
    if gemini_service.key_manager.has_available_keys():
        try:
            logger.info("Universal AI Service: Trying Gemini first...")
            result, tokens = await gemini_service.generate_content(
                prompt=user_prompt,
                system_instruction=system_prompt,
                temperature=0.7
            )
            if result:
                return result, tokens
        except Exception as e:
            logger.warning(f"Gemini pre-check failed, falling back to OpenAI: {e}")

    # ── FALLBACK TO OPENAI ───────────────────────────────────────────────────
    try:
        logger.info(f"Using OpenAI ({model}) as primary or fallback provider...")
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

def _sanitize_quiz_questions(questions: Any) -> List[Dict]:
    """
    Validate and auto-fix quiz questions to ensure 'a' is always an exact
    match of one of the 'options'. Drops invalid questions that can't be fixed.
    """
    if not isinstance(questions, list):
        return []
    
    sanitized = []
    for q in questions:
        if not isinstance(q, dict):
            continue
        question_text = q.get("q", "")
        options = q.get("options", [])
        answer = q.get("a", "")
        
        if not question_text or not options or len(options) < 2:
            logger.warning(f"Dropping question with missing fields: {q}")
            continue
        
        # Check if answer is already an exact match
        if answer in options:
            sanitized.append(q)
            continue
        
        # Try case-insensitive match
        answer_lower = answer.strip().lower()
        fixed = False
        for opt in options:
            if opt.strip().lower() == answer_lower:
                q["a"] = opt  # Fix to exact option string
                sanitized.append(q)
                logger.info(f"Fixed quiz answer by case-insensitive match: '{answer}' -> '{opt}'")
                fixed = True
                break
        
        if fixed:
            continue
        
        # Try substring match — if answer is contained in an option or vice-versa
        for opt in options:
            if answer_lower in opt.strip().lower() or opt.strip().lower() in answer_lower:
                q["a"] = opt
                sanitized.append(q)
                logger.warning(f"Fixed quiz answer by substring match: '{answer}' -> '{opt}'")
                fixed = True
                break
        
        if not fixed:
            logger.error(f"Dropping question because answer '{answer}' doesn't match any option: {options}")
            # Still include it but fix by using first option (so game doesn't break)
            # The question will just be harder to answer correctly
    
    return sanitized


async def generate_math_problems(topic: str, count: int, difficulty: str, grade: str = "", context: str = "", language: str = "Russian") -> Tuple[List[Dict[str, str]], int]:
    user_prompt = f"""
    Generate {count} math problems.
    Topic: {topic}
    Difficulty: {difficulty}
    {build_class_context_block(grade, context)}

    STRICT FORMATTING RULES:
    - The "q" field must contain ONLY the mathematical expression itself — NO introductory phrases like "How much is", "Find", "Solve", "Calculate", "Сколько будет", "Найдите" etc.
    - Write fractions using the format [FRAC:numerator:denominator]. Example: two-fifths MUST be written as [FRAC:2:5], not 2/5.
    - Example of correct "q": "[FRAC:2:5] + [FRAC:1:5] = ?" (NOT "Сколько будет 2/5 + 1/5?")
    - Example of correct "q": "3 × 7 = ?" (NOT "Найдите произведение 3 и 7")
    - The "a" field must contain ONLY the numeric answer. Example: "[FRAC:3:5]" or "21" or "x = 5".
    - Do NOT add any text explanations in "q" or "a" fields.

    Return ONLY a JSON array of objects with 'q' and 'a' keys.
    Example: [{{"q": "[FRAC:2:5] + [FRAC:1:5] = ?", "a": "[FRAC:3:5]"}}, {{"q": "3 × 7 = ?", "a": "21"}}]
    """
    return await _get_completion([
        {"role": "system", "content": get_system_prompt(language)},
        {"role": "user", "content": user_prompt}
    ])

async def generate_crossword_words(topic: str, count: int, language: str = "Russian", grade: str = "", context: str = "") -> tuple:
    user_prompt = f"""
    Generate exactly {count} words and clues related to the topic "{topic}" in {language}.
    {build_class_context_block(grade, context)}
    
    RULES:
    - Words must be single words only (no spaces, no hyphens)
    - Words should be 4-12 characters long
    - Clues should be short (max 8 words)
    - The 'word' must be in UPPERCASE
    - Language for words AND clues: {language}
    
    Return ONLY a JSON array (no extra text):
    [{{"word": "APPLE", "clue": "A red or green fruit"}}]
    """
    return await _get_completion([
        {"role": "system", "content": get_system_prompt(language)},
        {"role": "user", "content": user_prompt}
    ])

async def generate_quiz(topic: str, count: int, grade: str = "", context: str = "", language: str = "Russian") -> Tuple[List[Dict], int]:
    user_prompt = f"""
    Generate {count} multiple-choice quiz questions in {language}.
    Topic: {topic}
    {build_class_context_block(grade, context)}

    CRITICAL RULES — VIOLATIONS WILL BREAK THE GAME:
    1. If the topic is MATH: the "q" field MUST be a bare expression (e.g., "[FRAC:1:2] + [FRAC:1:2] = ?"). NO words like "Solve", "Calculate".
    2. USE [FRAC:numerator:denominator] for ALL fractions.
    3. The "a" field MUST be an EXACT CHARACTER-FOR-CHARACTER COPY of one of the strings in "options". No paraphrasing, no extra words, no punctuation differences.
    4. Do NOT include the answer, hint, correct letter, or any indicator inside the "q" (question) text.
    5. Every question MUST have exactly 4 options in the "options" array.
    6. All 4 options must be plausible — avoid obviously wrong distractors.
    7. Double-check: copy the correct option string into "a" EXACTLY as it appears in "options".

    VERIFICATION STEP (do this mentally before outputting):
    - For each question, check: does options array contain a string that is identical to "a"? If not, fix it.

    Return ONLY a JSON array of objects with this exact structure:
    [
      {{
        "q": "Question text here",
        "options": ["First option", "Second option", "Third option", "Fourth option"],
        "a": "Second option"
      }}
    ]

    IMPORTANT: "a" must be one of the options copied verbatim. Example:
    WRONG: {{"options": ["Paris", "London", "Berlin", "Madrid"], "a": "Paris is correct"}}
    CORRECT: {{"options": ["Paris", "London", "Berlin", "Madrid"], "a": "Paris"}}
    """
    result, tokens = await _get_completion([
        {"role": "system", "content": get_system_prompt(language)},
        {"role": "user", "content": user_prompt}
    ])
    if result is not None:
        result = _sanitize_quiz_questions(result)
        if not result:
            logger.error("All quiz questions were invalid after sanitization")
            return None, tokens
    return result, tokens


async def generate_assignment(subject: str, topic: str, count: int, grade: str = "", context: str = "", language: str = "Russian") -> Tuple[Dict, int]:
    user_prompt = f"""
    Create a detailed school assignment/worksheet.
    Subject: {subject}
    Topic: {topic}
    Target language: {language}
    {build_class_context_block(grade, context)}
    Question Count: {count}
    
    CRITICAL RULES:
    1. For math topics: "text" field must contain ONLY the mathematical expression. NO words like "Calculate", "Find".
    2. Use [FRAC:numerator:denominator] for ALL fractions.
    3. The "answer" MUST match one of the "options" exactly.
    4. EVERY question MUST have 4 options.

    Return ONLY a JSON object:
    {{
        "title": "Creative Title",
        "subject": "{subject}",
        "grade": "{grade}",
        "intro": "Brief instructions",
        "questions": [
            {{ 
                "num": 1, 
                "text": "Question or math expression", 
                "options": ["A", "B", "C", "D"], 
                "answer": "B" 
            }}
        ]
    }}
    """
    return await _get_completion([
        {"role": "system", "content": get_system_prompt(language)},
        {"role": "user", "content": user_prompt}
    ])

async def generate_jeopardy(topic: str, grade: str = "", context: str = "", language: str = "Russian") -> Tuple[Dict, int]:
    user_prompt = f"""
    Create a Jeopardy game board.
    Topic: {topic}
    Target language: {language}
    {build_class_context_block(grade, context)}
    
    STRICT RULES:
    1. For math: "q" must be a bare expression (e.g. "1/2 + [FRAC:1:4] = ?"). Use [FRAC:N:D] for fractions.
    2. Answer "a" should be short and direct.
    3. NO introductory text in "q".

    Generate 5 distinct categories related to the topic.
    For each category, generate 5 questions with increasing difficulty (100 to 500 points).
    
    Return ONLY a JSON object:
    {{
        "categories": [
            {{
                "name": "Category Name",
                "questions": [
                    {{ "points": 100, "q": "Question or expression", "a": "Short Answer" }},
                    ...
                ]
            }}
        ]
    }}
    """
    return await _get_completion([
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
