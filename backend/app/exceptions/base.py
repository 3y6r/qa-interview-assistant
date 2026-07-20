class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class NotFoundError(AppError):
    def __init__(self, message: str = "Not found"):
        super().__init__(message, status_code=404)


class ConflictError(AppError):
    def __init__(self, message: str = "Conflict"):
        super().__init__(message, status_code=409)


class ValidationError(AppError):
    def __init__(self, message: str = "Validation error"):
        super().__init__(message, status_code=400)
