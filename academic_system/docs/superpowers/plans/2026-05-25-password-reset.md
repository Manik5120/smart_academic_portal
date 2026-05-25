# Password Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OTP-based password reset feature with 3-step modal, Redis storage, and Gmail SMTP

**Architecture:** Frontend modal (3 steps) → FastAPI endpoints → Redis for OTP storage → Gmail SMTP for email

**Tech Stack:** React, Radix UI Dialog, Redis, aiosmtplib, FastAPI

---

## File Structure

```
Backend:
├── app/infrastructure/config.py          [MODIFY]  Add Redis & email settings
├── app/infrastructure/redis.py           [NEW]     Redis client setup
├── app/infrastructure/email.py           [NEW]     Gmail SMTP service
├── app/use_cases/password_reset.py       [NEW]     Password reset business logic
├── app/domain/entities/otp.py            [NEW]     OTP request/response models
└── app/adapters/controllers/auth_controller.py  [MODIFY]  Add 3 endpoints

Frontend:
├── frontend/src/services/auth.js         [MODIFY]  Add 3 API functions
├── frontend/src/components/auth/ForgotPasswordModal.jsx  [NEW]  3-step modal
└── frontend/src/pages/login.jsx          [MODIFY]  Add "Forgot Password?" link
```

---

## Backend Implementation

### Task 1: Add Configuration Settings

**Files:**
- Modify: `app/infrastructure/config.py`

- [ ] **Step 1: Add Redis and email configuration fields**

Add these fields to the `Settings` class in `app/infrastructure/config.py` after the JWT section (around line 58):

```python
# Redis
redis_url: str = Field(default="redis://localhost:6379", description="Redis connection URL")
redis_password: str | None = Field(default=None, description="Redis password (optional)")
redis_db: int = Field(default=0, description="Redis database number")
redis_password_reset_ttl: int = Field(default=600, description="Password reset OTP TTL in seconds (10 minutes)")

# Email (Gmail SMTP)
email_enabled: bool = Field(default=True, description="Enable email sending")
email_host: str = Field(default="smtp.gmail.com", description="SMTP host")
email_port: int = Field(default=587, description="SMTP port")
email_username: str = Field(default="", description="Email username")
email_password: str = Field(default="", description="Email app password")
email_from: str = Field(default="Academic Portal <noreply@nitsri.ac.in>", description="From email address")
email_from_name: str = Field(default="NIT Srinagar Academic Portal", description="From name")
```

- [ ] **Step 2: Commit changes**

```bash
git add app/infrastructure/config.py
git commit -m "feat: add Redis and email configuration settings"
```

---

### Task 2: Create Redis Client

**Files:**
- Create: `app/infrastructure/redis.py`

- [ ] **Step 1: Write the Redis client module**

Create `app/infrastructure/redis.py`:

```python
"""Redis client for OTP and cache storage."""

import redis.asyncio as aioredis
from typing import Optional
from .config import settings


class RedisClient:
    """Async Redis client wrapper."""

    def __init__(self):
        self._pool: Optional[aioredis.ConnectionPool] = None
        self._client: Optional[aioredis.Redis] = None

    async def connect(self):
        """Create Redis connection pool."""
        if self._pool is None:
            self._pool = aioredis.ConnectionPool.from_url(
                settings.redis_url,
                db=settings.redis_db,
                password=settings.redis_password,
                decode_responses=True
            )
            self._client = aioredis.Redis(connection_pool=self._pool)

    async def disconnect(self):
        """Close Redis connection pool."""
        if self._pool:
            await self._pool.disconnect()
            self._pool = None
            self._client = None

    @property
    def client(self) -> aioredis.Redis:
        """Get Redis client (call connect() first)."""
        if self._client is None:
            raise RuntimeError("Redis client not connected. Call connect() first.")
        return self._client

    async def set_with_ttl(self, key: str, value: str, ttl_seconds: int) -> bool:
        """Set a key with expiration time."""
        return await self.client.setex(key, ttl_seconds, value)

    async def get(self, key: str) -> Optional[str]:
        """Get a value by key."""
        return await self.client.get(key)

    async def delete(self, key: str) -> int:
        """Delete a key."""
        return await self.client.delete(key)

    async def exists(self, key: str) -> bool:
        """Check if a key exists."""
        return await self.client.exists(key) > 0


# Global Redis client instance
redis_client = RedisClient()


async def get_redis() -> RedisClient:
    """Dependency to get Redis client."""
    if redis_client._client is None:
        await redis_client.connect()
    return redis_client
```

- [ ] **Step 2: Create the __init__ export**

Add to `app/infrastructure/__init__.py`:

```python
from .redis import redis_client, get_redis
```

- [ ] **Step 3: Add redis to requirements**

Add to `requirements.txt`:

```
redis[hiredis]==5.0.8
```

- [ ] **Step 4: Install and verify**

```bash
pip install redis[hiredis]==5.0.8
python -c "import redis; print(redis.__version__)"
```

Expected output: `5.0.8`

- [ ] **Step 5: Commit**

```bash
git add app/infrastructure/redis.py app/infrastructure/__init__.py requirements.txt
git commit -m "feat: add Redis client for OTP storage"
```

---

### Task 3: Create Email Service

**Files:**
- Create: `app/infrastructure/email.py`

- [ ] **Step 1: Write the email service module**

Create `app/infrastructure/email.py`:

```python
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
                use_tls=True
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


# Global email service instance
email_service = EmailService()
```

- [ ] **Step 2: Add to __init__**

Add to `app/infrastructure/__init__.py`:

```python
from .email import email_service
```

- [ ] **Step 3: Add aiosmtplib to requirements**

Add to `requirements.txt`:

```
aiosmtplib==3.0.2
```

- [ ] **Step 4: Install and verify**

```bash
pip install aiosmtplib==3.0.2
python -c "import aiosmtplib; print(aiosmtplib.__version__)"
```

Expected output: `3.0.2`

- [ ] **Step 5: Commit**

```bash
git add app/infrastructure/email.py app/infrastructure/__init__.py requirements.txt
git commit -m "feat: add Gmail SMTP email service"
```

---

### Task 4: Create OTP Entity Models

**Files:**
- Create: `app/domain/entities/otp.py`

- [ ] **Step 1: Write OTP entity models**

Create `app/domain/entities/otp.py`:

```python
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
```

- [ ] **Step 2: Export from entities**

Add to `app/domain/entities/__init__.py`:

```python
from .otp import (
    ForgotPasswordRequest,
    VerifyOtpRequest,
    ResetPasswordRequest,
    OtpResponse,
    ForgotPasswordSchema,
    VerifyOtpSchema,
    ResetPasswordSchema
)
```

- [ ] **Step 3: Commit**

```bash
git add app/domain/entities/otp.py app/domain/entities/__init__.py
git commit -m "feat: add OTP entity models and validation schemas"
```

---

### Task 5: Create Password Reset Use Cases

**Files:**
- Create: `app/use_cases/password_reset.py`

- [ ] **Step 1: Write password reset use cases**

Create `app/use_cases/password_reset.py`:

```python
"""Password reset use cases."""

import random
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
        return "".join(random.choices(string.digits, k=self.OTP_LENGTH))

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
```

- [ ] **Step 2: Export from use_cases**

Add to `app/use_cases/__init__.py`:

```python
from .password_reset import PasswordResetUseCase
```

- [ ] **Step 3: Commit**

```bash
git add app/use_cases/password_reset.py app/use_cases/__init__.py
git commit -m "feat: add password reset use cases with OTP logic"
```

---

### Task 6: Add Auth Controller Endpoints

**Files:**
- Modify: `app/adapters/controllers/auth_controller.py`

- [ ] **Step 1: Add imports and dependency**

Add these imports at the top of `app/adapters/controllers/auth_controller.py`:

```python
from app.domain.entities.otp import ForgotPasswordSchema, VerifyOtpSchema, ResetPasswordSchema
from app.use_cases.password_reset import PasswordResetUseCase
from app.infrastructure.redis import get_redis
```

Add this new function after `get_auth_use_case()` (around line 29):

```python
async def get_password_reset_use_case(
    db: AsyncIOMotorDatabase = Depends(get_database),
    redis = Depends(get_redis)
) -> PasswordResetUseCase:
    """Dependency to get password reset use case."""
    user_repo = UserRepository(db)
    return PasswordResetUseCase(user_repo, redis)
```

- [ ] **Step 2: Add forgot-password endpoint**

Add this endpoint after the `/refresh` endpoint (before the file ends):

```python
@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordSchema,
    password_reset_use_case: PasswordResetUseCase = Depends(get_password_reset_use_case)
):
    """Request password reset OTP via email."""
    try:
        from app.domain.entities.otp import ForgotPasswordRequest
        req = ForgotPasswordRequest(email=request.email)
        response = await password_reset_use_case.request_otp(req)
        return {
            "message": response.message,
            "expiry_seconds": response.expiry_seconds
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
```

- [ ] **Step 3: Add verify-otp endpoint**

Add after the `/forgot-password` endpoint:

```python
@router.post("/verify-otp")
async def verify_otp(
    request: VerifyOtpSchema,
    password_reset_use_case: PasswordResetUseCase = Depends(get_password_reset_use_case)
):
    """Verify OTP for password reset."""
    try:
        from app.domain.entities.otp import VerifyOtpRequest
        req = VerifyOtpRequest(email=request.email, otp=request.otp)
        await password_reset_use_case.verify_otp(req)
        return {"message": "OTP verified successfully", "valid": True}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
```

- [ ] **Step 4: Add reset-password endpoint**

Add after the `/verify-otp` endpoint:

```python
@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordSchema,
    password_reset_use_case: PasswordResetUseCase = Depends(get_password_reset_use_case)
):
    """Reset password using verified OTP."""
    try:
        from app.domain.entities.otp import ResetPasswordRequest
        req = ResetPasswordRequest(
            email=request.email,
            otp=request.otp,
            new_password=request.new_password
        )
        await password_reset_use_case.reset_password(req)
        return {"message": "Password reset successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
```

- [ ] **Step 5: Commit**

```bash
git add app/adapters/controllers/auth_controller.py
git commit -m "feat: add password reset endpoints (forgot-password, verify-otp, reset-password)"
```

---

### Task 7: Update Main App for Redis Lifecycle

**Files:**
- Modify: `main.py` (or wherever FastAPI app is initialized)

- [ ] **Step 1: Find and read main.py**

```bash
find . -name "main.py" -type f | grep -v venv | head -1
```

Read the file to understand the app structure.

- [ ] **Step 2: Add Redis startup/shutdown events**

Add these event handlers to the FastAPI app:

```python
from app.infrastructure.redis import redis_client


@app.on_event("startup")
async def startup_redis():
    """Connect to Redis on startup."""
    await redis_client.connect()


@app.on_event("shutdown")
async def shutdown_redis():
    """Disconnect from Redis on shutdown."""
    await redis_client.disconnect()
```

- [ ] **Step 3: Commit**

```bash
git add main.py
git commit -m "feat: add Redis lifecycle management to FastAPI app"
```

---

## Frontend Implementation

### Task 8: Add Auth Service Functions

**Files:**
- Modify: `frontend/src/services/auth.js`

- [ ] **Step 1: Add password reset functions to authService**

Add these functions to `authService` in `frontend/src/services/auth.js` (after the `changePassword` function, around line 36):

```javascript
forgotPassword: async (email) => {
  const data = await api('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return data;
},

verifyOtp: async (email, otp) => {
  const data = await api('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
  return data;
},

resetPassword: async (email, otp, newPassword) => {
  const data = await api('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, new_password: newPassword }),
  });
  return data;
},
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/auth.js
git commit -m "feat: add password reset API functions to auth service"
```

---

### Task 9: Create ForgotPasswordModal Component

**Files:**
- Create: `frontend/src/components/auth/ForgotPasswordModal.jsx`

- [ ] **Step 1: Create the modal component**

Create `frontend/src/components/auth/ForgotPasswordModal.jsx`:

```javascript
import { useState, useEffect, useCallback } from 'react';
import { X, Mail, Key, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/auth';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input, Label } from '../ui/input';

const ALLOWED_EMAIL_DOMAIN = 'nitsri.ac.in';

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '' }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setEmail(initialEmail);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
      setCanResendOtp(false);
      setResendCountdown(60);
    }
  }, [isOpen, initialEmail]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval;
    if (currentStep === 2 && resendCountdown > 0 && !canResendOtp) {
      interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, resendCountdown, canResendOtp]);

  const passwordCriteria = [
    {
      label: '8 to 20 characters',
      met: newPassword.length >= 8 && newPassword.length <= 20,
    },
    {
      label: 'At least one capital letter',
      met: /[A-Z]/.test(newPassword),
    },
    {
      label: 'At least one number',
      met: /\d/.test(newPassword),
    },
  ];

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      return 'Please enter a valid email address';
    }
    if (!email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
      return `Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`;
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password.length > 20) return 'Password must be less than 20 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one capital letter';
    if (!/\d/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setCurrentStep(2);
      setResendCountdown(60);
      setCanResendOtp(false);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setResendCountdown(60);
      setCanResendOtp(false);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyOtp(email, otp);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setCurrentStep(1);
    setOtp('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 w-2 rounded-full transition-all ${
                  step <= currentStep ? 'bg-[#1266f1]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <div
              role="alert"
              className="mb-4 p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              {error}
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Password Reset Successful!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
            </div>
          )}

          {!success && (
            <>
              {/* Step 1: Request OTP */}
              {currentStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="text-center mb-4">
                    <Mail className="h-12 w-12 text-[#1266f1] mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Enter your email to receive a password reset OTP
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder={`your.email@${ALLOWED_EMAIL_DOMAIN}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#1266f1] hover:bg-[#0d52d1]"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </Button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  >
                    Back to login
                  </button>
                </form>
              )}

              {/* Step 2: Verify OTP */}
              {currentStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center mb-4">
                    <Key className="h-12 w-12 text-[#1266f1] mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Enter the 6-digit OTP sent to your email
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp">OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                      }}
                      className="w-full text-center text-2xl tracking-widest"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#1266f1] hover:bg-[#0d52d1]"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={handleChangeEmail}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResendOtp || loading}
                      className={`font-medium ${
                        canResendOtp
                          ? 'text-[#1266f1] hover:text-[#0d52d1]'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {canResendOtp ? 'Resend OTP' : `Resend OTP in ${resendCountdown}s`}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: New Password */}
              {currentStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="text-center mb-4">
                    <Lock className="h-12 w-12 text-[#1266f1] mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Enter your new password
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="8-20 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value.slice(0, 20))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value.slice(0, 20))}
                      className="w-full"
                    />
                  </div>

                  {newPassword && (
                    <div className="space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                        Password must have:
                      </p>
                      <div className="space-y-2">
                        {passwordCriteria.map((criterion) => {
                          const Icon = criterion.met ? CheckCircle2 : X;
                          return (
                            <div
                              key={criterion.label}
                              className={`flex items-center gap-2 text-xs font-medium ${
                                criterion.met
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span>{criterion.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[#1266f1] hover:bg-[#0d52d1]"
                    disabled={loading}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="inline h-4 w-4 mr-1" />
                    Back
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/auth/ForgotPasswordModal.jsx
git commit -m "feat: add ForgotPasswordModal component with 3-step flow"
```

---

### Task 10: Integrate Modal with Login Page

**Files:**
- Modify: `frontend/src/pages/login.jsx`

- [ ] **Step 1: Add modal state and import**

Add the import at the top of `login.jsx`:

```javascript
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
```

Add state after `useState(false)` (around line 34):

```javascript
const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
```

- [ ] **Step 2: Add "Forgot Password?" link**

Add this link in the password section, after the password input but before the confirm password section (around line 589, after the closing `</div>` of the password field and before the `{!isLogin &&` block):

```javascript
{/* Forgot Password Link - Only for login mode */}
{isLogin && (
  <div className="text-right">
    <button
      type="button"
      onClick={() => setIsForgotPasswordOpen(true)}
      className="text-sm text-[#1266f1] dark:text-[#5a9fff] hover:text-[#0d52d1] dark:hover:text-[#7ab3ff] font-medium transition-colors"
    >
      Forgot Password?
    </button>
  </div>
)}
```

- [ ] **Step 3: Add modal at end of JSX**

Add the modal component before the closing `</div>` of the main container (before the footer, around line 661):

```javascript
{/* Forgot Password Modal */}
<ForgotPasswordModal
  isOpen={isForgotPasswordOpen}
  onClose={() => setIsForgotPasswordOpen(false)}
  initialEmail={formData.email}
/>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/login.jsx
git commit -m "feat: integrate ForgotPasswordModal with login page"
```

---

## Environment Configuration

### Task 11: Setup Environment Variables

**Files:**
- Modify: `.env` (create if doesn't exist)

- [ ] **Step 1: Create or update .env file**

Create or update `.env` file in the project root:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Email Configuration (Gmail SMTP)
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@nitsri.ac.in
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM=NIT Srinagar Academic Portal <your-email@nitsri.ac.in>
EMAIL_FROM_NAME=NIT Srinagar Academic Portal
```

- [ ] **Step 2: Add .env.example**

Create `.env.example` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Email Configuration (Gmail SMTP)
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@nitsri.ac.in
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=NIT Srinagar Academic Portal <your-email@nitsri.ac.in>
EMAIL_FROM_NAME=NIT Srinagar Academic Portal
```

- [ ] **Step 3: Commit .env.example only**

```bash
git add .env.example
git commit -m "feat: add environment configuration template for Redis and email"
```

---

## Final Steps

### Task 12: Test and Verify

- [ ] **Step 1: Install Python dependencies**

```bash
pip install -r requirements.txt
```

- [ ] **Step 2: Install frontend dependencies**

```bash
cd frontend && npm install && cd ..
```

- [ ] **Step 3: Start Redis**

```bash
redis-server
```

- [ ] **Step 4: Run backend**

```bash
uvicorn main:app --reload
```

- [ ] **Step 5: Run frontend**

```bash
cd frontend && npm run dev
```

- [ ] **Step 6: Test the flow**

1. Navigate to login page
2. Click "Forgot Password?"
3. Enter valid @nitsri.ac.in email
4. Check console for OTP (if email not configured)
5. Enter OTP
6. Set new password
7. Verify redirect to login

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "feat: complete password reset feature implementation"
```

---

## Spec Coverage Verification

- ✅ Password reset accessible only from login page (Task 10)
- ✅ OTP sent via Gmail SMTP (Task 3, 5)
- ✅ OTP valid for 10 minutes in Redis (Task 2, 5)
- ✅ 6-digit numeric OTP format (Task 4, 9)
- ✅ 60-second resend cooldown (Task 9)
- ✅ Email domain validation @nitsri.ac.in (Task 4, 9)
- ✅ Password validation (8-20 chars, 1 capital, 1 number) (Task 4, 9)
- ✅ 3-step modal UI (Task 9)
- ✅ Backend endpoints (Task 6)
- ✅ Environment configuration (Task 11)
