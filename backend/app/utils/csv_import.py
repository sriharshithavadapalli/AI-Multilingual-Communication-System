"""
Bulk import helper: parses uploaded CSV/XLSX files into Audience rows.
Expected (flexible) column headers - case-insensitive, extra columns ignored:
  full_name, email, phone, whatsapp_number, age_group, gender, state, district,
  city, pincode, preferred_language, occupation, organization, department,
  designation, tags
Only 'full_name' is required per row; everything else is optional.
"""
import io
from typing import Tuple, List

import pandas as pd

from app.models.audience import Audience

REQUIRED_COLUMN = "full_name"

ALLOWED_COLUMNS = {
    "full_name", "email", "phone", "whatsapp_number", "age_group", "gender",
    "state", "district", "city", "pincode", "preferred_language", "occupation",
    "organization", "department", "designation", "tags",
}


def parse_audience_file(filename: str, file_bytes: bytes) -> Tuple[pd.DataFrame, List[str]]:
    """Reads CSV or XLSX bytes into a normalized DataFrame. Returns (df, warnings)."""
    warnings: List[str] = []
    lower = filename.lower()

    if lower.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(file_bytes))
    elif lower.endswith(".xlsx") or lower.endswith(".xls"):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        raise ValueError("Unsupported file type. Please upload a .csv or .xlsx file.")

    # Normalize headers: lowercase, strip, replace spaces with underscores
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    if REQUIRED_COLUMN not in df.columns:
        raise ValueError(f"Uploaded file must contain a '{REQUIRED_COLUMN}' column.")

    unknown_cols = set(df.columns) - ALLOWED_COLUMNS
    if unknown_cols:
        warnings.append(f"Ignored unrecognized columns: {sorted(unknown_cols)}")
        df = df.drop(columns=list(unknown_cols))

    # Drop fully empty rows
    df = df.dropna(how="all")

    return df, warnings


def dataframe_to_audience_objects(df, created_by_id: int) -> Tuple[List[Audience], List[str]]:
    """Converts validated dataframe rows into Audience ORM objects."""
    objects: List[Audience] = []
    errors: List[str] = []

    for idx, row in df.iterrows():
        name = row.get("full_name")
        if pd.isna(name) or str(name).strip() == "":
            errors.append(f"Row {idx + 2}: missing full_name, skipped.")
            continue

        def clean(val):
            if pd.isna(val):
                return None
            return str(val).strip()

        obj = Audience(
            full_name=clean(name),
            email=clean(row.get("email")),
            phone=clean(row.get("phone")),
            whatsapp_number=clean(row.get("whatsapp_number")),
            age_group=clean(row.get("age_group")),
            gender=clean(row.get("gender")),
            state=clean(row.get("state")),
            district=clean(row.get("district")),
            city=clean(row.get("city")),
            pincode=clean(row.get("pincode")),
            preferred_language=clean(row.get("preferred_language")),
            occupation=clean(row.get("occupation")),
            organization=clean(row.get("organization")),
            department=clean(row.get("department")),
            designation=clean(row.get("designation")),
            tags=clean(row.get("tags")),
            created_by_id=created_by_id,
        )
        objects.append(obj)

    return objects, errors
