"""Email service using Resend API."""

from typing import List
import httpx

from .config import settings


class EmailService:
    """Async email service using Resend API."""

    def __init__(self):
        self.api_key = settings.resend_api_key
        self.from_email = settings.email_from
        self.from_name = settings.email_from_name
        self.enabled = settings.email_enabled
        self.api_url = "https://api.resend.com/emails"

    async def send_email(
        self,
        to_email: str | List[str],
        subject: str,
        plain_text: str,
        html_text: str | None = None
    ) -> bool:
        """Send an email via Resend API."""
        if not self.enabled:
            print(f"Email disabled. Would send to {to_email}: {subject}")
            print(f"Body: {plain_text}")
            return True

        if not self.api_key:
            print("Resend API key not configured. Skipping email send.")
            return False

        # Prepare recipients
        to_list = [to_email] if isinstance(to_email, str) else to_email

        # Prepare email payload
        payload = {
            "from": f"{self.from_name} <{self.from_email}>",
            "to": to_list,
            "subject": subject,
            "text": plain_text,
        }

        if html_text:
            payload["html"] = html_text

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )

                if response.status_code in (200, 202):
                    return True
                else:
                    print(f"Resend API error: {response.status_code} - {response.text}")
                    return False
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
