"""Email policy helpers for institutional access control."""

ALLOWED_EMAIL_DOMAIN = "nitsri.ac.in"


def normalize_email(email: str) -> str:
    """Normalize user email input for consistent comparisons."""
    return (email or "").strip().lower()


def ensure_allowed_institution_email(email: str, action: str = "use this portal") -> str:
    """Ensure the email belongs to the allowed institutional domain."""
    normalized_email = normalize_email(email)

    if not normalized_email.endswith(f"@{ALLOWED_EMAIL_DOMAIN}"):
        raise ValueError(
            f"Only {ALLOWED_EMAIL_DOMAIN} email addresses can {action}."
        )

    return normalized_email
