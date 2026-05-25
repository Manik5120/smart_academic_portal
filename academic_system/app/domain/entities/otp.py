"""OTP-related request/response models."""

from dataclasses import dataclass
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


@dataclass
class ForgotPasswordRequest:
    """Forgot password request DTO."""
    email: str


@dataclass
class VerifyOtpRequest:
    """OTP verification request DTO."""
    email: str
    otp: str


@dataclass
class ResetPasswordRequest:
    """Reset password request DTO."""
    email: str
    otp: str
    new_password: str


@dataclass
class OtpResponse:
    """OTP response DTO."""
    message: str
    expiry_seconds: int = 600


class ForgotPasswordSchema(BaseModel):
    """Pydantic schema for forgot password."""
    email: EmailStr


class VerifyOtpSchema(BaseModel):
    """Pydantic schema for OTP verification."""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        """Ensure OTP is exactly 6 digits."""
        if not re.match(r"^\d{6}$", v):
            raise ValueError("OTP must be exactly 6 digits")
        return v


class ResetPasswordSchema(BaseModel):
    """Pydantic schema for password reset."""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    new_password: str = Field(..., min_length=8, max_length=20)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 20:
            raise ValueError("Password must be at most 20 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one capital letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v
