"""Import student users from an XLSX workbook into MongoDB.

Rules:
- Only rows with @nitsri.ac.in email addresses are imported
- Semester is fixed to 8 for all imported students
- Odd enrollment-number suffix -> Section A
- Even enrollment-number suffix -> Section B
- One shared password is assigned to every imported student
"""

from __future__ import annotations

import asyncio
import os
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient


ALLOWED_DOMAIN = "nitsri.ac.in"
DEFAULT_PASSWORD = "Nitsri123"
DEFAULT_SEMESTER = 8
WORKBOOK_PATH = Path(r"c:\Users\karmahes\Documents\Merged_Students_With_Emails.xlsx")

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pr": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def load_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []

    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    return [
        "".join(node.text or "" for node in si.iterfind(".//a:t", NS))
        for si in root.findall("a:si", NS)
    ]


def get_first_sheet_target(zf: zipfile.ZipFile) -> str:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels.findall("pr:Relationship", NS)}
    sheets = workbook.find("a:sheets", NS)
    if sheets is None or not list(sheets):
        raise ValueError("Workbook does not contain any sheets")

    first_sheet = list(sheets)[0]
    rel_id = first_sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
    return "xl/" + rel_map[rel_id]


def parse_cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    value = cell.find("a:v", NS)
    if value is None:
        return ""

    parsed = value.text or ""
    if cell.attrib.get("t") == "s":
        return shared_strings[int(parsed)]
    return parsed


def read_students_from_workbook(path: Path) -> list[dict[str, str]]:
    with zipfile.ZipFile(path) as zf:
        shared_strings = load_shared_strings(zf)
        worksheet = ET.fromstring(zf.read(get_first_sheet_target(zf)))
        rows = worksheet.findall(".//a:sheetData/a:row", NS)

        data = []
        for row in rows[1:]:
            cells = {cell.attrib.get("r", "")[:1]: parse_cell_value(cell, shared_strings) for cell in row.findall("a:c", NS)}
            data.append(
                {
                    "roll_number": (cells.get("A") or "").strip().upper(),
                    "full_name": (cells.get("B") or "").strip(),
                    "email": normalize_email(cells.get("C") or ""),
                }
            )
        return data


def get_section(roll_number: str) -> str:
    match = re.search(r"(\d+)$", roll_number)
    if not match:
        raise ValueError(f"Could not determine odd/even suffix from enrollment number: {roll_number}")
    return "A" if int(match.group(1)) % 2 == 1 else "B"


async def import_students() -> None:
    load_dotenv()

    if not WORKBOOK_PATH.exists():
        raise FileNotFoundError(f"Workbook not found: {WORKBOOK_PATH}")

    client = AsyncIOMotorClient(
        os.getenv("MONGODB_URL"),
        tls=True,
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=30000,
    )
    db = client[os.getenv("MONGODB_DATABASE", "academic_system")]

    rows = read_students_from_workbook(WORKBOOK_PATH)
    password_hash = bcrypt.hashpw(DEFAULT_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    created = 0
    skipped_non_domain = 0
    skipped_missing_data = 0
    skipped_existing_email = 0
    skipped_existing_roll = 0

    for row in rows:
        email = row["email"]
        full_name = row["full_name"]
        roll_number = row["roll_number"]

        if not email or not full_name or not roll_number:
            skipped_missing_data += 1
            continue

        if not email.endswith(f"@{ALLOWED_DOMAIN}"):
            skipped_non_domain += 1
            continue

        if await db.users.find_one({"email": email}):
            skipped_existing_email += 1
            continue

        if await db.users.find_one({"roll_number": roll_number, "role": "student"}):
            skipped_existing_roll += 1
            continue

        now = datetime.utcnow()
        await db.users.insert_one(
            {
                "email": email,
                "password_hash": password_hash,
                "full_name": full_name,
                "role": "student",
                "is_active": True,
                "semester": DEFAULT_SEMESTER,
                "section": get_section(roll_number),
                "roll_number": roll_number,
                "created_at": now,
                "updated_at": now,
            }
        )
        created += 1

    client.close()

    print(f"Workbook rows read: {len(rows)}")
    print(f"Students created: {created}")
    print(f"Skipped (non-{ALLOWED_DOMAIN}): {skipped_non_domain}")
    print(f"Skipped (missing data): {skipped_missing_data}")
    print(f"Skipped (existing email): {skipped_existing_email}")
    print(f"Skipped (existing enroll no): {skipped_existing_roll}")
    print(f"Shared password set for imported students: {DEFAULT_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(import_students())
