import io
import zipfile
from typing import List, Dict, Any

def create_batch_zip(variants: List[Dict[str, Any]], tool_type: str) -> io.BytesIO:
    """
    Создает ZIP-архив в памяти, содержащий несколько вариантов заданий.
    """
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for i, variant in enumerate(variants):
            content = format_variant_content(variant, tool_type)
            file_name = f"variant_{i+1}.txt"
            zip_file.writestr(file_name, content)
    
    buffer.seek(0)
    return buffer

def format_variant_content(variant: Dict[str, Any], tool_type: str) -> str:
    """
    Форматирует данные варианта в текстовый вид для файла.
    В будущем здесь может быть генерация PDF или DOCX.
    """
    lines = []
    lines.append(f"--- Variant ---")
    
    if tool_type == "math":
        problems = variant.get("problems", [])
        for p in problems:
            lines.append(f"{p.get('problem')} = ______")
    
    elif tool_type == "quiz":
        questions = variant.get("questions", [])
        for q in questions:
            lines.append(f"Q: {q.get('question')}")
            for opt in q.get("options", []):
                lines.append(f"  [ ] {opt}")
            lines.append("")
            
    elif tool_type == "assignment":
        lines.append(variant.get("content", ""))
        
    else:
        # Fallback для других типов
        lines.append(str(variant))
        
    return "\n".join(lines)
