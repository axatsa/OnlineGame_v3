import json
from openai import OpenAI
from config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

def generate_math_problems(topic: str, count: int, difficulty: str, class_description: str = ""):
    prompt = f"""
    Generate {count} math problems for a class.
    Topic: {topic}
    Difficulty: {difficulty}
    Class Context: {class_description}
    
    Return ONLY a JSON array of strings, where each string is a problem.
    Example: ["2 + 2 = ?", "5 * 5 = ?"]
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful education assistant that outputs valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Error generating math: {e}")
        return []

def generate_crossword_words(topic: str, count: int, language: str):
    prompt = f"""
    Generate {count} words related to the topic "{topic}" in {language}.
    Return ONLY a JSON array of strings.
    Example: ["Apple", "Banana"]
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful education assistant that outputs valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Error generating crossword: {e}")
        return []
