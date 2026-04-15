"""
Gemini Storybook Service
========================
Text  : gemini-2.0-flash        → high-quality story, 10 pages × 60-70 words
Images: gemini-2.0-flash-exp    → native image generation (fallback friendly)
SDK   : google-genai (pip install google-genai)
"""

from google import genai
from google.genai import types as genai_types

import asyncio
import base64
import json
import time
import logging
import re
import traceback
from typing import Optional
import threading

logger = logging.getLogger(__name__)

from config import GEMINI_API_KEYS_LIST, OPENAI_API_KEY

class GeminiKeyManager:
    def __init__(self, keys: list[str]):
        self.keys = keys
        self.current_index = 0
        self.cooldowns = {} # key -> timestamp when it becomes available
        self.lock = threading.Lock()
        self.COOLDOWN_DURATION = 15 * 60 # 15 minutes

    def get_next_key(self) -> Optional[str]:
        if not self.keys:
            return None
        
        with self.lock:
            now = time.time()
            num_keys = len(self.keys)
            
            # Try each key once, starting from current_index
            for i in range(num_keys):
                idx = (self.current_index + i) % num_keys
                key = self.keys[idx]
                until = self.cooldowns.get(key, 0)
                if now >= until:
                    # Found an available key — advance pointer past it for next call
                    self.current_index = (idx + 1) % num_keys
                    return key
            
            # All keys are in cooldown
            return None

    def mark_limited(self, key: str):
        """Mark a key as rate-limited for 15 minutes."""
        with self.lock:
            until = time.time() + self.COOLDOWN_DURATION
            self.cooldowns[key] = until
            logger.warning(f"Key {key[:8]}... marked as LIMITED until {time.strftime('%H:%M:%S', time.localtime(until))}")

    def has_available_keys(self) -> bool:
        if not self.keys: return False
        now = time.time()
        with self.lock:
            return any(now >= self.cooldowns.get(k, 0) for k in self.keys)

key_manager = GeminiKeyManager(GEMINI_API_KEYS_LIST)

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
    title_instruction = f'Title: "{title}"' if title else 'Generate a creative and catchy title for this story.'
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

async def generate_storybook(
    title: Optional[str] = "",
    topic: str = "",
    age_group: str = "7-10",
    language: str = "Russian",
    genre: str = "fairy tale",
) -> Optional[dict]:
    """
    Two-step generation:
      1. Generate 10-page story text with gemini-2.0-flash
      2. Generate 10 illustrations in parallel (tries gemini-2.0-flash-exp first)
    Returns dict with pages list, each page has image_base64 (or None).
    """
    if not key_manager.keys:
        logger.error("No Gemini API keys configured")
        return None

    max_retries = len(key_manager.keys)
    story_data = None

    # ── STEP 1: Generate story text (with retries) ───────────────────────
    for attempt in range(max_retries):
        api_key = key_manager.get_next_key()
        client = genai.Client(api_key=api_key)
        
        logger.info(f"Generating story text with gemini-2.0-flash (attempt {attempt + 1}/{max_retries})...")
        try:
            story_response = await asyncio.to_thread(
                client.models.generate_content,
                model="gemini-2.0-flash",
                contents=_story_prompt(title, topic, age_group, language, genre),
                config=genai_types.GenerateContentConfig(
                    system_instruction=STORY_SYSTEM,
                    temperature=0.9,
                    max_output_tokens=8192,
                ),
            )
            raw = story_response.text.strip()
            
            # Parse story JSON
            story_data = _parse_json(raw)
            if not story_data or "pages" not in story_data:
                logger.error(f"Could not parse story JSON. Raw output was likely not JSON.")
                story_data = None
                continue # Try another key or just fail? Usually JSON failure is not a 429, but could retry just in case.
                
            break # Success!
        except Exception as e:
            error_msg = str(e).lower()
            if "429" in error_msg or "quota" in error_msg or "exhausted" in error_msg or "too many requests" in error_msg:
                logger.warning(f"Rate limit exceeded (429) on attempt {attempt + 1}.")
                key_manager.mark_limited(api_key)
                continue
            else:
                logger.error(f"Story generation failed on attempt {attempt + 1}: {e}")
                continue

    if not story_data:
        if OPENAI_API_KEY:
            logger.warning("All Gemini keys exhausted. FALLING BACK TO OPENAI for story text...")
            from services.openai_service import generate_storybook as generate_storybook_oai
            return await generate_storybook_oai(
                title=title,
                topic=topic,
                age_group=age_group,
                language=language,
                genre=genre,
                openai_api_key=OPENAI_API_KEY
            )
        else:
            logger.error("Story generation failed after all retries and NO OpenAI key available.")
            return None

    logger.info(f"Story parsed: {len(story_data['pages'])} pages")

    # ── STEP 2: Generate illustrations in parallel ───────────────────────
    logger.info(f"Generating 10 images in parallel...")
    tasks = []
    for i, page in enumerate(story_data["pages"]):
        prompt = _image_prompt(
            page.get("illustration_prompt", f"Scene from page {page['page_number']}"),
            age_group,
        )
        tasks.append(_generate_image(prompt))

    # Run all image generations concurrently
    image_results = await asyncio.gather(*tasks)

    for i, img_b64 in enumerate(image_results):
        story_data["pages"][i]["image_base64"] = img_b64

    return story_data


async def _generate_image(prompt: str) -> Optional[str]:
    """Try each image model in order, with key rotation on 429 limit errors. Returns base64 PNG string or None."""
    max_retries = max(1, len(key_manager.keys))
    
    for attempt in range(max_retries):
        api_key = key_manager.get_next_key()
        client = genai.Client(api_key=api_key)
        
        for model_name in IMAGE_MODELS:
            try:
                logger.info(f"Attempting image generation with {model_name} (key attempt {attempt + 1})...")
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=model_name,
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        response_modalities=["IMAGE"],
                        temperature=1.0,
                    ),
                )
                
                if not response.candidates:
                    logger.warning(f"No candidates returned from {model_name}")
                    continue
                    
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        raw = part.inline_data.data
                        mime = part.inline_data.mime_type
                        logger.info(f"Image generated with {model_name} (MIME: {mime})")
                        if isinstance(raw, bytes):
                            return base64.b64encode(raw).decode("utf-8")
                        return str(raw) # already base64
            except Exception as e:
                error_msg = str(e).lower()
                if "429" in error_msg or "quota" in error_msg or "exhausted" in error_msg or "too many requests" in error_msg:
                    logger.warning(f"Rate limit exceeded (429) for {model_name}.")
                    key_manager.mark_limited(api_key)
                    break # Break inner model loop, try outer loop (next key)
                else:
                    logger.warning(f"Model {model_name} failed: {e}")
                    # traceback.print_exc()

    if OPENAI_API_KEY:
        logger.warning(f"All Gemini keys and models failed for one image. FALLING BACK TO DALL-E 3...")
        from services.openai_service import _generate_dalle_image, client as oai_client
        return await _generate_dalle_image(oai_client, prompt)

    logger.error("All image generation keys and models failed and No OpenAI fallback — returning None")
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

async def generate_content(
    prompt: str,
    system_instruction: str = "You are a helpful educational assistant. Output ONLY valid JSON.",
    model: str = "gemini-2.0-flash",
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> tuple:
    """
    Generic content generation with rotation and OpenAI fallback.
    Returns (json_data, estimated_tokens).
    """
    if not key_manager.keys:
        logger.error("No Gemini API keys configured")
        return None, 0

    max_retries = len(key_manager.keys)
    result_data = None
    
    for attempt in range(max_retries):
        api_key = key_manager.get_next_key()
        if not api_key: break
        
        client = genai.Client(api_key=api_key)
        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=model,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )
            raw = response.text.strip()
            result_data = _parse_json(raw)
            if result_data:
                # Estimate tokens (simplistic: chars / 4)
                tokens = len(raw) // 4 + len(prompt) // 4
                return result_data, tokens
            
            logger.error(f"Failed to parse JSON from Gemini response (attempt {attempt+1})")
            continue
        except Exception as e:
            error_msg = str(e).lower()
            if "429" in error_msg or "quota" in error_msg or "exhausted" in error_msg or "too many requests" in error_msg:
                logger.warning(f"Rate limit exceeded (429) for Gemini on attempt {attempt+1}.")
                key_manager.mark_limited(api_key)
                continue
            else:
                logger.error(f"Gemini generation failed on attempt {attempt+1}: {e}")
                continue

    # ── FALLBACK TO OPENAI (direct call, no circular import) ─────────────────
    if OPENAI_API_KEY:
        logger.warning("All Gemini keys exhausted. FALLING BACK TO OPENAI for generic content...")
        try:
            from openai import OpenAI
            import json as _json
            oai = OpenAI(api_key=OPENAI_API_KEY)
            response = await asyncio.to_thread(
                oai.chat.completions.create,
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
            )
            content = response.choices[0].message.content
            usage = response.usage.total_tokens if response.usage else 0
            # Try to parse JSON from the response
            try:
                return _json.loads(content), usage
            except _json.JSONDecodeError:
                import re as _re
                m = _re.search(r"(\{.*\}|\[.*\])", content, _re.DOTALL)
                if m:
                    try:
                        return _json.loads(m.group(1).strip()), usage
                    except _json.JSONDecodeError:
                        pass
                logger.error("OpenAI fallback: could not parse JSON from response")
                return None, usage
        except Exception as e:
            logger.error(f"OpenAI fallback failed: {e}")
            return None, 0

    return None, 0
