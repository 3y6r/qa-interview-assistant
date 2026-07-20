import pytest

from app.exceptions.base import ValidationError
from app.services import gemini_question_generator as module
from app.services.gemini_question_generator import GeminiQuestionGenerator


def test_post_generate_content_timeout_returns_validation_error(monkeypatch):
    calls = []

    def raise_timeout(*args, **kwargs):
        calls.append((args, kwargs))
        raise TimeoutError

    monkeypatch.setattr(module.settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(module.settings, "gemini_timeout_seconds", 60)
    monkeypatch.setattr(module.urllib.request, "urlopen", raise_timeout)

    generator = GeminiQuestionGenerator()

    with pytest.raises(ValidationError, match="Gemini service is unavailable"):
        generator.generate_questions(
            category="Backend",
            level="Junior",
            tags=[],
            num_questions=1,
        )

    assert calls[0][1]["timeout"] == 60


def test_generate_questions_requires_api_key(monkeypatch):
    monkeypatch.setattr(module.settings, "gemini_api_key", None)

    generator = GeminiQuestionGenerator()

    with pytest.raises(ValidationError, match="GEMINI_API_KEY is not configured"):
        generator.generate_questions(
            category="Backend",
            level="Junior",
            tags=[],
            num_questions=1,
        )
