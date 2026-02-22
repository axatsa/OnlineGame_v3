import google.generativeai as genai
from config import GEMINI_API_KEY
import logging
import json
import re

logger = logging.getLogger(__name__)

genai.configure(api_key=GEMINI_API_KEY)

STORYBOOK_SYSTEM = """You are a creative children's storybook author writing for classroom use.
You write warm, engaging, educational stories suitable for the specified age group.
Always output ONLY valid JSON, no extra text."""


def generate_storybook(
    title: str,
    topic: str,
    age_group: str = "7-10",
    language: str = "Russian",
    pages: int = 6,
    genre: str = "fairy tale"
) -> dict:
    """
    Generate a children's storybook with multiple pages.
    Returns dict with title, description, pages (each with text + illustration_prompt).
    """
    prompt = f"""
Create a children's {genre} storybook in {language} language.

Title: "{title}"
Topic/Theme: {topic}
Target age: {age_group} years old
Number of pages: {pages}
Genre: {genre}

Requirements:
- Each page has 3-5 sentences of story text appropriate for age {age_group}
- Each page has a short illustration_prompt in English (for image generation)
- The story must be educational and relate to the topic
- Language for story text: {language}
- Make it engaging, warm, and fun for children

Return ONLY valid JSON in this exact format:
{{
  "title": "{title}",
  "description": "One sentence summary of the book",
  "age_group": "{age_group}",
  "genre": "{genre}",
  "language": "{language}",
  "pages": [
    {{
      "page_number": 1,
      "text": "Story text for this page in {language}...",
      "illustration_prompt": "Cute cartoon illustration of [description], children's book style, colorful, warm"
    }}
  ]
}}
"""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.9,
                max_output_tokens=4096,
            )
        )
        content = response.text

        # Robust JSON extraction
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass

        # Try markdown code block
        json_match = re.search(r"```(?:json)?\s*(.*?)```", content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1).strip())
            except json.JSONDecodeError:
                pass

        # Try raw JSON object
        obj_match = re.search(r"(\{.*\})", content, re.DOTALL)
        if obj_match:
            try:
                return json.loads(obj_match.group(1).strip())
            except json.JSONDecodeError:
                pass

        logger.error(f"Could not parse Gemini response: {content[:500]}")
        return None

    except Exception as e:
        logger.error(f"Gemini storybook generation failed: {e}")
        return None
