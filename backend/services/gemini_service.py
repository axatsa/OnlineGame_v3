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
import collections
import json
import time
import logging
import re
import traceback
from typing import Optional
import threading
import httpx

logger = logging.getLogger(__name__)

# ─── Math formatting instruction ─────────────────────────────────────────────
# Instruct the model to output proper mathematical notation
MATH_FORMAT_INSTRUCTION = (
    "For ALL mathematical expressions use proper notation:\n"
    "- Fractions: LaTeX inline \\(\\frac{numerator}{denominator}\\)  e.g. \\(\\frac{2}{3}\\)\n"
    "- Powers: Unicode superscripts for simple cases (x², x³, x⁴) or \\(x^{n}\\)\n"
    "- Square roots: \\(\\sqrt{x}\\)\n"
    "- Subscripts: Unicode (x₁, x₂) or \\(x_{n}\\)\n"
    "- Equations: \\( ... \\) for inline, \\[ ... \\] for block display\n"
    "Never write 2/3 as plain text — always use \\(\\frac{2}{3}\\). "
    "Never write x^2 as plain text — always use x² or \\(x^{2}\\).\n"
)

# ─── Model discovery cache ────────────────────────────────────────────────────
_MODEL_CACHE_TTL = 3 * 3600  # refresh every 3 hours
_model_cache: list[str] = []
_model_cache_ts: float = 0
_model_cache_lock = threading.Lock()

# Fallback order used when discovery is unavailable
_FALLBACK_TEXT_MODELS = [
    "gemini-2.5-flash",
    "gemma-4-31b-it",
    "gemma-4-26b-a4b-it",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

def _model_priority(name: str) -> int:
    """Lower = higher priority."""
    if name == "gemini-2.5-flash":                                          return 0
    if name.startswith("gemma-4-31b"):                                      return 1
    if name.startswith("gemma-4"):                                           return 2
    if "2.5" in name and "pro" in name and "preview" not in name:           return 3
    if "2.5" in name and "preview" not in name:                             return 4
    if "2.0-flash" in name and "lite" not in name and "exp" not in name:    return 5
    if "2.0-flash-lite" in name:                                            return 6
    return 9

async def _discover_text_models(api_key: str) -> list[str]:
    """Fetch generateContent-capable models from Gemini API, cached for 3 h."""
    global _model_cache, _model_cache_ts
    now = time.time()
    with _model_cache_lock:
        if _model_cache and (now - _model_cache_ts) < _MODEL_CACHE_TTL:
            return list(_model_cache)

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}&pageSize=100"
            )
        if resp.status_code == 200:
            raw_models = resp.json().get("models", [])
            discovered = []
            for m in raw_models:
                name = m.get("name", "").replace("models/", "")
                methods = m.get("supportedGenerationMethods", [])
                if "generateContent" in methods and name not in discovered:
                    # Skip image-only and embedding models
                    if any(x in name for x in ("embedding", "aqa", "image-generation")):
                        continue
                    discovered.append(name)

            if discovered:
                discovered.sort(key=_model_priority)
                with _model_cache_lock:
                    _model_cache = discovered
                    _model_cache_ts = now
                logger.info(f"Model discovery: {len(discovered)} models, top5={discovered[:5]}")
                return discovered
    except Exception as e:
        logger.warning(f"Model discovery failed: {e}")

    return list(_FALLBACK_TEXT_MODELS)

from config import GEMINI_API_KEYS_LIST, OPENAI_API_KEY, get_env_int

_COOLDOWN_SECONDS = get_env_int("GEMINI_KEY_COOLDOWN_SECONDS", 900)
_GLOBAL_RPM_LIMIT = get_env_int("GLOBAL_RPM_LIMIT", 70)

class GeminiKeyManager:
    def __init__(self, keys: list[str]):
        self.keys = keys
        self.current_index = 0
        self.cooldowns = {}  # key -> timestamp when it becomes available
        self.lock = threading.Lock()
        self.COOLDOWN_DURATION = _COOLDOWN_SECONDS
        self._rpm_window: collections.deque = collections.deque()
        self.GLOBAL_RPM_LIMIT = _GLOBAL_RPM_LIMIT

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

    def is_rpm_available(self) -> bool:
        """Check if global RPM limit has not been reached."""
        now = time.time()
        with self.lock:
            while self._rpm_window and self._rpm_window[0] < now - 60:
                self._rpm_window.popleft()
            return len(self._rpm_window) < self.GLOBAL_RPM_LIMIT

    def record_request(self) -> None:
        """Record a Gemini API request for RPM tracking."""
        with self.lock:
            self._rpm_window.append(time.time())

    def mark_limited(self, key: str):
        """Mark a key as rate-limited for 15 minutes."""
        with self.lock:
            until = time.time() + self.COOLDOWN_DURATION
            self.cooldowns[key] = until
            available_count = sum(1 for k in self.keys if time.time() >= self.cooldowns.get(k, 0))
            logger.warning(
                f"Key {key[:8]}... LIMITED. Available keys: {available_count}/{len(self.keys)}"
            )
            if available_count == 0:
                logger.critical("ALL GEMINI KEYS IN COOLDOWN! System falling back to OpenAI or returning errors.")

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
    custom_api_key: Optional[str] = None,
) -> Optional[dict]:
    """
    Two-step generation:
      1. Generate 10-page story text with gemini-2.0-flash
      2. Generate 10 illustrations in parallel (tries gemini-2.0-flash-exp first)
    Returns dict with pages list, each page has image_base64 (or None).
    If custom_api_key is provided (org's own key), it bypasses the shared key pool.
    """
    if custom_api_key:
        # Use org's dedicated key — bypass shared pool
        max_retries = 1
        _get_key = lambda: custom_api_key
        _mark_limited = lambda k: None
    elif key_manager.keys:
        max_retries = len(key_manager.keys)
        _get_key = key_manager.get_next_key
        _mark_limited = key_manager.mark_limited
    else:
        logger.error("No Gemini API keys configured")
        return None

    story_data = None

    # ── STEP 1: Generate story text (key + model rotation) ───────────────
    if custom_api_key:
        story_models = ["gemma-3-27b-it", "gemini-2.0-flash", "gemini-1.5-flash"]
    else:
        first_key = key_manager.keys[0] if key_manager.keys else None
        story_models = (await _discover_text_models(first_key)) if first_key else list(_FALLBACK_TEXT_MODELS)

    for attempt in range(max_retries):
        api_key = _get_key()
        if not api_key:
            break
        client = genai.Client(api_key=api_key)
        all_exhausted = True

        for s_model in story_models:
            logger.info(f"Story text with {s_model} (attempt {attempt+1}/{max_retries})...")
            try:
                story_response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=s_model,
                    contents=_story_prompt(title, topic, age_group, language, genre),
                    config=genai_types.GenerateContentConfig(
                        system_instruction=STORY_SYSTEM,
                        temperature=0.9,
                        max_output_tokens=8192,
                    ),
                )
                raw = story_response.text.strip()
                story_data = _parse_json(raw)
                if not story_data or "pages" not in story_data:
                    logger.error(f"JSON parse failed from {s_model}.")
                    story_data = None
                    all_exhausted = False
                    break
                break  # success
            except Exception as e:
                error_msg = str(e).lower()
                if "429" in error_msg or "quota" in error_msg or "exhausted" in error_msg or "too many requests" in error_msg:
                    logger.warning(f"Rate limit on {s_model} attempt {attempt+1}, trying next model...")
                    continue
                else:
                    logger.error(f"Story gen failed {s_model} attempt {attempt+1}: {e}")
                    all_exhausted = False
                    break

        if story_data:
            break
        if all_exhausted:
            _mark_limited(api_key)

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
        tasks.append(_generate_image(prompt, custom_api_key=custom_api_key))

    # Run all image generations concurrently
    image_results = await asyncio.gather(*tasks)

    for i, img_b64 in enumerate(image_results):
        story_data["pages"][i]["image_base64"] = img_b64

    return story_data


async def _generate_image(prompt: str, custom_api_key: Optional[str] = None) -> Optional[str]:
    """Try each image model in order, with key rotation on 429 limit errors. Returns base64 PNG string or None."""
    if custom_api_key:
        max_retries = 1
        _get_key = lambda: custom_api_key
        _mark_limited = lambda k: None
    else:
        max_retries = max(1, len(key_manager.keys))
        _get_key = key_manager.get_next_key
        _mark_limited = key_manager.mark_limited

    for attempt in range(max_retries):
        api_key = _get_key()
        if not api_key:
            break
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
                    _mark_limited(api_key)
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
    use_math_format: bool = False,
) -> tuple:
    """
    Generic content generation with full key × model rotation and OpenAI fallback.
    - Discovers all available models every 3 hours via API
    - On 429: tries next model (separate quota) before switching key
    - Gemma models are highest priority (large output, free quota)
    Returns (json_data, estimated_tokens).
    """
    if not key_manager.keys:
        logger.error("No Gemini API keys configured")
        return None, 0

    if use_math_format:
        system_instruction = system_instruction + "\n\n" + MATH_FORMAT_INSTRUCTION

    if not key_manager.is_rpm_available():
        logger.warning("Global RPM limit reached, backing off 5s...")
        await asyncio.sleep(5)
    key_manager.record_request()

    # Discover models using first available key; cache 3 h
    first_key = key_manager.get_next_key() or key_manager.keys[0]
    all_models = await _discover_text_models(first_key)
    # Preferred model always first, rest follow discovery order
    models_to_try = [model] + [m for m in all_models if m != model]

    for attempt in range(len(key_manager.keys)):
        api_key = key_manager.get_next_key()
        if not api_key:
            break

        client = genai.Client(api_key=api_key)
        all_models_exhausted = True

        for current_model in models_to_try:
            try:
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=current_model,
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
                    logger.info(f"Generated with {current_model} (attempt {attempt+1})")
                    tokens = len(raw) // 4 + len(prompt) // 4
                    return result_data, tokens
                logger.error(f"JSON parse failed from {current_model} (attempt {attempt+1})")
                all_models_exhausted = False
                break  # JSON error — not a quota issue, try next key
            except Exception as e:
                error_msg = str(e).lower()
                if "429" in error_msg or "quota" in error_msg or "exhausted" in error_msg or "too many requests" in error_msg:
                    logger.warning(f"Rate limit on {current_model} attempt {attempt+1}, trying next model...")
                    continue  # quota: try next model (different quota pool)
                else:
                    logger.error(f"Gemini {current_model} failed attempt {attempt+1}: {e}")
                    all_models_exhausted = False
                    break  # non-quota error: skip to next key

        if all_models_exhausted:
            key_manager.mark_limited(api_key)

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
