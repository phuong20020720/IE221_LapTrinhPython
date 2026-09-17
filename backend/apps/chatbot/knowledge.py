from pathlib import Path


KNOWLEDGE_DIR = Path(__file__).resolve().parent / "knowledge"


def load_approved_knowledge() -> str:
    """Load only version-controlled, approved public knowledge documents."""
    documents = sorted(KNOWLEDGE_DIR.glob("*.md"))
    return "\n\n".join(document.read_text(encoding="utf-8") for document in documents)
