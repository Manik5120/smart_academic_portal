"""Email service using Gmail SMTP."""

import asyncio
from email.message import EmailMessage
import aiosmtplib
from typing import List

from .config import settings


class EmailService:
    """Async email service using SMTP."""

    def __init__(self):
        self.host = settings.email_host
        self.port = settings.email_port
        self.username = settings.email_username
        self.password = settings.email_password
        self.from_email = settings.email_from
        self.from_name = settings.email_from_name
        self.enabled = settings.email_enabled

    async def send_email(
        self,
        to_email: str | List[str],
        subject: str,
        plain_text: str,
        html_text: str | None = None
    ) -> bool:
        """Send an email via SMTP."""
        if not self.enabled:
            print(f"Email disabled. Would send to {to_email}: {subject}")
            print(f"Body: {plain_text}")
            return True

        if not self.username or not self.password:
            print("Email credentials not configured. Skipping email send.")
            return False

        message = EmailMessage()
        message["From"] = f"{self.from_name} <{self.username}>"
        message["To"] = to_email if isinstance(to_email, str) else ", ".join(to_email)
        message["Subject"] = subject
        message.set_content(plain_text)

        if html_text:
            message.add_alternative(html_text, subtype="html")

        try:
            async with aiosmtplib.SMTP(
                hostname=self.host,
                port=self.port,
                start_tls=True,
                timeout=10  # 10 second timeout
            ) as smtp:
                await smtp.login(self.username, self.password)
                await smtp.send_message(message)
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    async def send_otp_email(self, email: str, otp: str) -> bool:
        """Send password reset OTP email."""
        subject = "Password Reset OTP - Academic Portal"

        plain_text = f"""Your password reset OTP for academic portal is: {otp}

This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.

- NIT Srinagar Academic Portal"""

        html_text = f"""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 30px; border-radius: 10px;">
        <h2 style="color: #1266f1;">Password Reset OTP</h2>
        <p>Your password reset OTP for academic portal is:</p>
        <div style="background-color: #1266f1; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; letter-spacing: 5px;">
            {otp}
        </div>
        <p style="margin-top: 20px;">This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px;">NIT Srinagar Academic Portal</p>
    </div>
</body>
</html>"""

        return await self.send_email(email, subject, plain_text, html_text)

    async def send_registration_otp_email(self, email: str, otp: str) -> bool:
        """Send registration OTP email."""
        subject = "Registration OTP - Academic Portal"

        plain_text = f"""Your OTP for registration on NIT Srinagar Academic Portal is: {otp}

This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.

- NIT Srinagar Academic Portal"""

        html_text = f"""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 30px; border-radius: 10px;">
        <h2 style="color: #1266f1;">Registration OTP - Academic Portal</h2>
        <p>Your OTP for registration on NIT Srinagar Academic Portal is:</p>
        <div style="background-color: #1266f1; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; letter-spacing: 5px;">
            {otp}
        </div>
        <p style="margin-top: 20px;">This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px;">NIT Srinagar Academic Portal</p>
    </div>
</body>
</html>"""

        return await self.send_email(email, subject, plain_text, html_text)


# Global email service instance
email_service = EmailService()
