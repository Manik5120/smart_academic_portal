# Password Reset Feature - Design Specification

**Date:** 2026-05-25
**Status:** Approved
**Author:** Claude Code

## Overview

Add a secure, OTP-based password reset feature to the academic portal login page. Users can request a password reset via email, verify with a time-limited OTP, and set a new password.

## Requirements

- Password reset accessible only from login page
- OTP sent via Gmail SMTP to user's email
- OTP valid for 10 minutes (stored in Redis)
- 6-digit numeric OTP format
- 60-second resend cooldown
- Must validate email domain (@nitsri.ac.in)
- Same password validation as registration (8-20 chars, 1 capital, 1 number)

## Architecture

### Frontend Components

| Component | Location | Responsibility |
|-----------|----------|-----------------|
| ForgotPasswordModal | `frontend/src/components/auth/ForgotPasswordModal.jsx` | 3-step modal (Request OTP → Verify OTP → Reset Password) |
| login.jsx | `frontend/src/pages/login.jsx` | Add "Forgot Password?" link + modal trigger |
| auth.js | `frontend/src/services/auth.js` | API functions for password reset flow |

### Backend Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/forgot-password` | POST | Generate OTP, store in Redis, send email |
| `/auth/verify-otp` | POST | Verify OTP from Redis |
| `/auth/reset-password` | POST | Verify OTP, update password in MongoDB |

### Data Flow

```
User enters email
  ↓
Backend generates 6-digit OTP
  ↓
Store in Redis: password_reset:{email} = {otp} (TTL: 600s)
  ↓
Send email via Gmail SMTP
  ↓
User enters OTP
  ↓
Backend verifies from Redis
  ↓
If valid: User enters new password
  ↓
Backend updates MongoDB, clears OTP from Redis
  ↓
Redirect to login with success message
```

### Storage

**Redis:**
- Key format: `password_reset:{email}`
- Value: OTP string (6 digits)
- TTL: 600 seconds (10 minutes)

**MongoDB:**
- User password updated in `users` collection
- Uses existing bcrypt hashing

## UI Design

### Modal Structure

```
┌─────────────────────────────────────────┐
│  Reset Password              [X]        │
├─────────────────────────────────────────┤
│  ● ○ ○  Step indicator                 │
│                                          │
│  [Step content changes here]            │
│                                          │
│  [Action buttons]                       │
└─────────────────────────────────────────┘
```

### Step 1: Request OTP

- Email input field (pre-filled from login if available)
- "Send OTP" button with loading state
- "Back to login" link
- Validation: @nitsri.ac.in domain required

### Step 2: Verify OTP

- 6-digit OTP input (individual boxes or single field)
- "Resend OTP" link with countdown timer
  - Disabled for 60 seconds after sending
  - Shows "Resend OTP in 45s" during countdown
  - Shows "Resend OTP" when countdown completes
- "Verify" button with loading state
- "Change email" link to return to Step 1

### Step 3: New Password

- New password input with show/hide toggle
- Confirm password input with show/hide toggle
- Real-time validation matching registration rules:
  - 8-20 characters
  - At least 1 capital letter
  - At least 1 number
  - Passwords match
- "Reset Password" button with loading state

### Success State

- Green checkmark animation
- "Password reset successful! Redirecting to login..."
- Auto-redirect after 2 seconds

## State Management

```javascript
{
  isOpen: boolean,           // Modal open/closed
  currentStep: 1 | 2 | 3,    // Current step number
  email: string,             // User's email
  otp: string,               // Entered OTP
  newPassword: string,       // New password
  confirmPassword: string,   // Confirmed password
  loading: boolean,          // Loading state for async operations
  error: string,             // Error message to display
  canResendOtp: boolean,     // Controls resend button enablement
  resendCountdown: number    // Seconds until resend available (0-60)
}
```

## Error Handling

| Scenario | Error Message |
|----------|---------------|
| Email not found | "No account found with this email" |
| OTP expired | "OTP has expired. Please request a new one" |
| OTP invalid | "Invalid OTP. Please try again" |
| OTP already used | "This OTP has already been used" |
| Passwords don't match | "Passwords do not match" |
| Network error | "Connection failed. Please check your internet" |

## Email Configuration

### Gmail SMTP Settings

| Setting | Value |
|---------|-------|
| Host | smtp.gmail.com |
| Port | 587 (TLS) |
| Username | {EMAIL_USERNAME} |
| Password | {EMAIL_PASSWORD} (App Password) |
| From | {EMAIL_FROM} |

### Email Template

```
Subject: Password Reset OTP - Academic Portal

Your password reset OTP for academic portal is: {OTP}

This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.

- NIT Srinagar Academic Portal
```

## Environment Variables

```bash
# Redis
REDIS_URL=redis://localhost:6379

# Gmail SMTP
EMAIL_USERNAME=your-email@nitsri.ac.in
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="NIT Srinagar Academic Portal <your-email@nitsri.ac.in>"
```

## Python Dependencies

```
aiosmtplib  # Async SMTP client for sending emails
redis       # Redis client for OTP storage
```

## Validation Rules

| Field | Rules |
|-------|-------|
| Email | Valid email format, must end with @nitsri.ac.in |
| OTP | Exactly 6 digits, numeric only |
| New Password | 8-20 characters, at least 1 uppercase letter, at least 1 digit |

## Files to Create/Modify

### Frontend

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/components/auth/ForgotPasswordModal.jsx` | CREATE | Modal component with 3-step flow |
| `frontend/src/services/auth.js` | MODIFY | Add forgotPassword, verifyOtp, resetPassword functions |
| `frontend/src/pages/login.jsx` | MODIFY | Add "Forgot Password?" link and modal integration |

### Backend

| File | Action | Description |
|------|--------|-------------|
| `app/domain/entities/otp.py` | CREATE | OTP request/response models |
| `app/use_cases/password_reset.py` | CREATE | Password reset business logic |
| `app/adapters/controllers/auth_controller.py` | MODIFY | Add 3 new endpoints |
| `app/infrastructure/email.py` | CREATE | Gmail SMTP service |
| `app/infrastructure/redis.py` | CREATE | Redis client setup |
| `app/core/config.py` | MODIFY | Add Redis and email config |

## Security Considerations

1. **OTP Expiration**: 10-minute hard limit via Redis TTL
2. **One-time Use**: OTP deleted after successful password reset
3. **Rate Limiting**: Consider adding rate limiting for OTP requests (future enhancement)
4. **Password Hashing**: Uses existing bcrypt implementation
5. **Email Security**: Gmail app password (not regular password)
6. **No Password Echo**: New password never logged or echoed

## Future Enhancements

- Rate limiting for OTP requests (prevent abuse)
- SMS OTP as alternative to email
- Password strength meter in reset form
- Remember device after successful reset
- Audit log for password reset events
