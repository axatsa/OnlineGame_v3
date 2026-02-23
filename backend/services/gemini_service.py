"""
Gemini Storybook Service
========================
Text  : gemini-2.0-flash        → high-quality story, 10 pages × 60-70 words
Images: gemini-2.0-flash-exp    → native image generation (fallback friendly)
SDK   : google-genai (pip install google-genai)
"""

from google import genai
from google.genai import types as genai_types

import base64
import json
import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Image models to try in order ────────────────────────────────────────────
# gemini-2.5-flash-image is newest; fall back to gemini-2.0-flash-exp if unavailable
IMAGE_MODELS = [
    "gemini-2.0-flash-exp",        # widely available, good quality
    "gemini-2.5-flash-image",      # newest (may not be on all API tiers)
]

# ─── Prompts ─────────────────────────────────────────────────────────────────

STORY_SYSTEM = (
    "You are an award-winning children's storybook author. "
    "You write warm, engaging, imaginative stories with a natural narrative arc. "
    "Output ONLY valid JSON, no markdown fences, no extra text."
)


def _story_prompt(title, topic, age_group, language, genre):
    return f"""Write a children's {genre} storybook in {language}.

Title: "{title}"
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
  "title": "{title}",
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


def _image_prompt(illustration_prompt: str, age_group: str) -> str:
    """Build a high-quality image generation prompt."""
    return (
        f"{illustration_prompt} "
        f"Children's storybook, ages {age_group}. "
        "Soft watercolor illustration, warm pastel palette, "
        "professional children's book art, highly detailed, "
        "no text, no words, no letters."
    )


# ─── Main generator ───────────────────────────────────────────────────────────

def generate_storybook(
    title: str,
    topic: str,
    age_group: str = "7-10",
    language: str = "Russian",
    genre: str = "fairy tale",
    gemini_api_key: str = "",
) -> Optional[dict]:
    """
    Two-step generation:
      1. Generate 10-page story text with gemini-2.0-flash
      2. Generate 10 illustrations (tries gemini-2.0-flash-exp first)
    Returns dict with pages list, each page has image_base64 (or None).
    """
    if not gemini_api_key:
        logger.error("GEMINI_API_KEY is not set")
        return None

    client = genai.Client(api_key=gemini_api_key)

    # ── STEP 1: Generate story text ──────────────────────────────────────
    logger.info("Generating story text with gemini-2.0-flash...")
    try:
        story_response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=_story_prompt(title, topic, age_group, language, genre),
            config=genai_types.GenerateContentConfig(
                system_instruction=STORY_SYSTEM,
                temperature=0.9,
                max_output_tokens=8192,
            ),
        )
        raw = story_response.text.strip()
    except Exception as e:
        logger.error(f"Story generation failed: {e}")
        return None

    # Parse story JSON
    story_data = _parse_json(raw)
    if not story_data or "pages" not in story_data:
        logger.error(f"Could not parse story JSON. Raw:\n{raw[:500]}")
        return None

    logger.info(f"Story parsed: {len(story_data['pages'])} pages")

    # ── STEP 2: Generate illustrations ───────────────────────────────────
    pages_with_images = []
    for i, page in enumerate(story_data["pages"]):
        prompt = _image_prompt(
            page.get("illustration_prompt", f"Scene from page {page['page_number']}"),
            age_group,
        )
        logger.info(f"Generating image {i+1}/10...")
        img_b64 = _generate_image(client, prompt)
        page["image_base64"] = img_b64   # None if all models failed
        pages_with_images.append(page)

    story_data["pages"] = pages_with_images
    return story_data


def _generate_image(client: genai.Client, prompt: str) -> Optional[str]:
    """Try each image model in order. Returns base64 PNG string or None."""
    for model_name in IMAGE_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                    temperature=1.0,
                ),
            )
            for part in response.parts:
                if part.inline_data is not None:
                    raw = part.inline_data.data
                    if isinstance(raw, bytes):
                        logger.info(f"Image generated with {model_name}")
                        return base64.b64encode(raw).decode("utf-8")
                    if isinstance(raw, str):
                        logger.info(f"Image generated with {model_name}")
                        return raw          # already base64 string
        except Exception as e:
            logger.warning(f"Model {model_name} failed: {e}. Trying next...")

    logger.error("All image models failed — returning None")
    return None


def _parse_json(text: str) -> Optional[dict]:
    """Try multiple strategies to extract valid JSON from model output."""
    # 1. Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # 2. Markdown code block
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass
    # 3. First JSON object
    m = re.search(r"(\{.*\})", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass
    return None
