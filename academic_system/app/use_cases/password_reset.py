"""Password reset use cases."""

import secrets
import string
from typing import Optional

from app.domain.entities.otp import (
    ForgotPasswordRequest,
    VerifyOtpRequest,
    ResetPasswordRequest,
    OtpResponse
)
from app.domain.interfaces.repositories import IUserRepository
from app.infrastructure.redis import RedisClient
from app.infrastructure.email import email_service
from app.infrastructure.config import settings
from app.infrastructure.security import hash_password


class PasswordResetUseCase:
    """Use case for password reset operations."""

    # Redis key prefix for password reset OTPs
    OTP_KEY_PREFIX = "password_reset:"
    OTP_LENGTH = 6

    def __init__(self, user_repository: IUserRepository, redis_client: RedisClient):
        self.user_repository = user_repository
        self.redis = redis_client

    def _generate_otp(self) -> str:
        """Generate a 6-digit numeric OTP."""
        return "".join(secrets.choice(string.digits) for _ in range(self.OTP_LENGTH))

    async def request_otp(self, request: ForgotPasswordRequest) -> OtpResponse:
        """
        Generate and send OTP for password reset.

        Args:
            request: Forgot password request with email

        Returns:
            OTP response with message and expiry time

        Raises:
            ValueError: If email is not found in system
        """
        # Check if user exists
        user = await self.user_repository.find_by_email(request.email)
        if not user:
            raise ValueError("No account found with this email")

        # Generate OTP
        otp = self._generate_otp()

        # Store in Redis with TTL
        key = f"{self.OTP_KEY_PREFIX}{request.email}"
        await self.redis.set_with_ttl(key, otp, settings.redis_password_reset_ttl)

        # Send email
        await email_service.send_otp_email(request.email, otp)

        return OtpResponse(
            message="OTP sent to your email",
            expiry_seconds=settings.redis_password_reset_ttl
        )

    async def verify_otp(self, request: VerifyOtpRequest) -> bool:
        """
        Verify OTP for password reset.

        Args:
            request: Verify OTP request with email and OTP

        Returns:
            True if OTP is valid

        Raises:
            ValueError: If OTP is invalid or expired
        """
        key = f"{self.OTP_KEY_PREFIX}{request.email}"
        stored_otp = await self.redis.get(key)

        if stored_otp is None:
            raise ValueError("OTP has expired. Please request a new one")

        if stored_otp != request.otp:
            raise ValueError("Invalid OTP. Please try again")

        return True

    async def reset_password(self, request: ResetPasswordRequest) -> bool:
        """
        Reset user password using OTP.

        Args:
            request: Reset password request with email, OTP, and new password

        Returns:
            True if password reset successful

        Raises:
            ValueError: If OTP is invalid, expired, or user not found
        """
        # Verify OTP first
        key = f"{self.OTP_KEY_PREFIX}{request.email}"
        stored_otp = await self.redis.get(key)

        if stored_otp is None:
            raise ValueError("OTP has expired. Please request a new one")

        if stored_otp != request.otp:
            raise ValueError("Invalid OTP. Please try again")

        # Find user
        user = await self.user_repository.find_by_email(request.email)
        if not user:
            raise ValueError("No account found with this email")

        # Update password
        user.password_hash = hash_password(request.new_password)
        await self.user_repository.save(user)

        # Delete OTP from Redis (one-time use)
        await self.redis.delete(key)

        return True
