import json
import http.client
import socket
import urllib.error
import urllib.request

from pydantic import (
    BaseModel,
    Field,
    ValidationError as PydanticValidationError,
    model_validator,
)

from app.core.config import settings
from app.exceptions.base import ValidationError


class GeminiQuestionItem(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    answer: str = Field(min_length=1, max_length=2000)
    category: str = Field(min_length=1)
    level: str = Field(min_length=1)
    tags: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def trim_fields(self):
        self.question = self.question.strip()
        self.answer = self.answer.strip()
        self.category = self.category.strip()
        self.level = self.level.strip()
        self.tags = [tag.strip() for tag in self.tags if tag.strip()]
        if not self.question or not self.answer or not self.category or not self.level:
            raise ValueError("Generated question fields cannot be empty")
        return self


class GeminiQuestionsResponse(BaseModel):
    questions: list[GeminiQuestionItem] = Field(min_length=1)


class GeminiQuestionGenerator:
    def generate_questions(
        self,
        *,
        category: str,
        num_questions: int,
        level: str | None = None,
        tags: list[str] | None = None,
        existing_questions: list[str] | None = None,
        additional_text: str | None = None,
    ) -> GeminiQuestionsResponse:
        if not settings.gemini_api_key:
            raise ValidationError("GEMINI_API_KEY is not configured")

        prompt = self._build_prompt(
            category=category,
            num_questions=num_questions,
            level=level,
            tags=tags or [],
            existing_questions=existing_questions or [],
            additional_text=additional_text,
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": self._system_instruction()}]},
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": self._response_schema(),
            },
        }
        response_text = self._post_generate_content(payload)
        try:
            return GeminiQuestionsResponse.model_validate_json(response_text)
        except PydanticValidationError as exc:
            raise ValidationError("Gemini response has invalid format") from exc

    def _post_generate_content(self, payload: dict) -> str:
        model = settings.gemini_model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": settings.gemini_api_key,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(
                request, timeout=settings.gemini_timeout_seconds
            ) as response:
                raw_body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise ValidationError(
                f"Gemini request failed: {detail or exc.reason}"
            ) from exc
        except (
            urllib.error.URLError,
            TimeoutError,
            socket.timeout,
            http.client.HTTPException,
            OSError,
        ) as exc:
            raise ValidationError("Gemini service is unavailable") from exc

        try:
            body = json.loads(raw_body)
            return body["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            raise ValidationError("Gemini response has invalid format") from exc

    def _build_prompt(
        self,
        *,
        category: str,
        num_questions: int,
        level: str | None,
        tags: list[str],
        existing_questions: list[str],
        additional_text: str | None,
    ) -> str:
        parts = [
            "Представь, что ты QA тимлид и принимаешь на работу тестировщика.",
            "Твоя задача придумать вопросы по заданным критериям.",
            f"Сгенерируй {num_questions} вопросов.",
            f"Обязательная категория для всех вопросов: '{category}'.",
        ]
        if level:
            parts.append(f"Целевой уровень сложности: {level}.")
        if tags:
            parts.append(f"Специфика и теги подкатегорий: {', '.join(tags)}.")
        else:
            parts.append("Теги не переданы. В поле tags верни пустой массив [].")
        if additional_text:
            parts.append(f"Контекст и дополнительные требования: {additional_text}.")
        if existing_questions:
            formatted_existing = "\n- ".join(existing_questions)
            parts.append(
                "КРИТИЧЕСКИ ВАЖНО: В базе уже есть следующие вопросы. "
                f"Не повторяй их и не делай слишком похожими:\n- {formatted_existing}"
            )
        return "\n".join(parts)

    def _system_instruction(self) -> str:
        return (
            "Ты специализированный ИИ для генерации вопросов QA-собеседования. "
            "Отвечай только JSON по схеме. Не добавляй пояснений и markdown. "
            "Для каждого вопроса продублируй category, level и tags ровно по входным критериям. "
            "Вопрос и ответ должны быть краткими, точными и полезными."
        )

    def _response_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "questions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string"},
                            "answer": {"type": "string"},
                            "category": {"type": "string"},
                            "level": {"type": "string"},
                            "tags": {"type": "array", "items": {"type": "string"}},
                        },
                        "required": ["question", "answer", "category", "level", "tags"],
                    },
                }
            },
            "required": ["questions"],
        }
