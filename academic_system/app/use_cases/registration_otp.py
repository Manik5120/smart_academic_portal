"""Registration OTP use case."""

import string
import secrets
from typing import Optional
from email.message import EmailMessage

from app.domain.interfaces.repositories import IUserRepository
from app.infrastructure.email import email_service
from app.infrastructure.redis import RedisClient


class RegistrationOTPUseCase:
    """Handle OTP generation and verification for user registration."""

    OTP_LENGTH = 6
    OTP_TTL_SECONDS = 600  # 10 minutes
    OTP_PREFIX = "registration_otp:"

    def __init__(self, user_repository: IUserRepository, redis: RedisClient):
        self.user_repository = user_repository
        self.redis = redis

    def _generate_otp(self) -> str:
        """Generate a cryptographically secure random OTP."""
        return "".join(secrets.choice(string.digits) for _ in range(self.OTP_LENGTH))

    async def send_registration_otp(self, email: str) -> dict:
        """
        Send OTP for registration.

        Args:
            email: User's email address

        Returns:
            Dict with message and expiry time

        Raises:
            ValueError: If email is already registered
        """
        # Check if email is already registered
        existing_user = await self.user_repository.find_by_email(email)
        if existing_user:
            raise ValueError(
                "This email is already registered. "
                "Please use a different email or login to your account."
            )

        # Generate OTP
        otp = self._generate_otp()

        # Store OTP in Redis with TTL
        otp_key = f"{self.OTP_PREFIX}{email}"
        await self.redis.set_with_ttl(otp_key, otp, self.OTP_TTL_SECONDS)

        # Send OTP email
        await email_service.send_registration_otp_email(email, otp)

        return {
            "message": "OTP sent to your email for registration",
            "expiry_seconds": self.OTP_TTL_SECONDS
        }

    async def verify_registration_otp(self, email: str, otp: str) -> bool:
        """
        Verify OTP for registration.

        Args:
            email: User's email address
            otp: OTP to verify

        Returns:
            True if OTP is valid

        Raises:
            ValueError: If OTP is invalid or expired
        """
        otp_key = f"{self.OTP_PREFIX}{email}"
        stored_otp = await self.redis.get(otp_key)

        if not stored_otp:
            raise ValueError(
                "OTP has expired or is invalid. "
                "Please request a new OTP."
            )

        if stored_otp != otp:
            raise ValueError("Invalid OTP. Please check and try again.")

        # Delete OTP after successful verification
        await self.redis.delete(otp_key)

        return True
