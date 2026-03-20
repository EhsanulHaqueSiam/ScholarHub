"""Field-level diff computation for change tracking.

Compares two record dicts and returns a list of field-level changes
for storage in the change_log table.
"""

from __future__ import annotations

# Fields to compare for change detection.
DIFF_FIELDS: list[str] = [
    "title",
    "description",
    "host_country",
    "application_deadline",
    "award_amount",
    "source_url",
    "provider_organization",
    "application_url",
]


def compute_diff(
    old: dict[str, object],
    new: dict[str, object],
) -> list[tuple[str, str | None, str | None]]:
    """Compute field-level differences between two records.

    Only compares fields in DIFF_FIELDS. Values are stringified for
    comparison (None stays None).

    Args:
        old: The previous version of the record.
        new: The current version of the record.

    Returns:
        List of (field_name, old_value, new_value) tuples for changed fields.
        Empty list if records are identical in all tracked fields.
    """
    changes: list[tuple[str, str | None, str | None]] = []

    for field in DIFF_FIELDS:
        old_val = str(old[field]) if old.get(field) is not None else None
        new_val = str(new[field]) if new.get(field) is not None else None
        if old_val != new_val:
            changes.append((field, old_val, new_val))

    return changes
