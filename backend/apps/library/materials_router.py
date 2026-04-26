import io
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from apps.auth.models import User
from apps.auth.dependencies import get_current_user
from apps.library.models import UserMaterial
from apps.generator.services import get_user_plan

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/materials", tags=["materials"])

PLAN_FILE_LIMITS = {"free": 5, "pro": 30, "school": 100}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_CONTEXT_CHARS = 12000        # ~3k tokens of context injected into prompt
ALLOWED_TYPES = {"pdf", "docx", "txt"}


def _extract_text(filename: str, content: bytes) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()

    if ext == "txt":
        return content.decode("utf-8", errors="replace")

    if ext == "pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            parts = [page.extract_text() or "" for page in reader.pages]
            return "\n".join(parts)
        except ImportError:
            raise HTTPException(status_code=422, detail="PDF parsing not available on this server.")
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Could not read PDF: {e}")

    if ext == "docx":
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs)
        except ImportError:
            raise HTTPException(status_code=422, detail="DOCX parsing not available on this server.")
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Could not read DOCX: {e}")

    raise HTTPException(status_code=422, detail=f"Unsupported file type: {ext}")


@router.post("/upload")
async def upload_material(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    filename = file.filename or "file"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=422, detail="Allowed formats: PDF, DOCX, TXT")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum 5 MB.")

    plan = get_user_plan(user, db)
    limit = PLAN_FILE_LIMITS.get(plan, 5)
    existing = db.query(UserMaterial).filter(UserMaterial.user_id == user.id).count()
    if existing >= limit:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "material_limit",
                "message": f"Лимит файлов для тарифа «{plan}»: {limit}. Удалите старые или обновите тариф.",
                "limit": limit,
                "current": existing,
            },
        )

    text = _extract_text(filename, content)
    text = text[:MAX_CONTEXT_CHARS]  # keep context manageable

    material = UserMaterial(
        user_id=user.id,
        filename=filename,
        file_type=ext,
        extracted_text=text,
        char_count=len(text),
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    return {
        "id": material.id,
        "filename": material.filename,
        "file_type": material.file_type,
        "char_count": material.char_count,
        "created_at": material.created_at.isoformat(),
    }


@router.get("/")
def list_materials(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    materials = (
        db.query(UserMaterial)
        .filter(UserMaterial.user_id == user.id)
        .order_by(UserMaterial.created_at.desc())
        .all()
    )
    return [
        {
            "id": m.id,
            "filename": m.filename,
            "file_type": m.file_type,
            "char_count": m.char_count,
            "created_at": m.created_at.isoformat(),
        }
        for m in materials
    ]


@router.delete("/{material_id}")
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    material = db.query(UserMaterial).filter(
        UserMaterial.id == material_id,
        UserMaterial.user_id == user.id,
    ).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found.")
    db.delete(material)
    db.commit()
    return {"ok": True}
