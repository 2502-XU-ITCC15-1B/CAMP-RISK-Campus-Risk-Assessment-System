from __future__ import annotations

from typing import Iterable, Optional

from django.contrib.auth import get_user_model

from accounts.models import UserProfile

from .models import IncidentReport, Notification

User = get_user_model()


def _submitter_pk(report: IncidentReport) -> Optional[int]:
    raw = (report.submitted_by_user_id or '').strip()
    if not raw.isdigit():
        return None
    return int(raw)


def _bulk_notify(
    user_ids: Iterable[int],
    *,
    report_public_id: str,
    kind: str,
    title: str,
    body: str = '',
) -> None:
    ids = sorted({int(i) for i in user_ids if i})
    if not ids:
        return
    pid = (report_public_id or '')[:48]
    kd = kind[:48]
    ttl = title[:255]
    b = (body or '')[:4000]
    Notification.objects.bulk_create(
        [
            Notification(
                recipient_id=uid,
                report_public_id=pid,
                kind=kd,
                title=ttl,
                body=b,
            )
            for uid in ids
        ]
    )


def notify_admins(
    *,
    report: IncidentReport,
    kind: str,
    title: str,
    body: str = '',
    exclude_user_id: Optional[int] = None,
) -> None:
    qs = User.objects.filter(profile__role=UserProfile.Role.ADMIN)
    if exclude_user_id is not None:
        qs = qs.exclude(pk=exclude_user_id)
    _bulk_notify(
        qs.values_list('id', flat=True),
        report_public_id=report.public_id(),
        kind=kind,
        title=title,
        body=body,
    )


def notify_submitting_guard(
    report: IncidentReport,
    *,
    kind: str,
    title: str,
    body: str = '',
) -> None:
    pk = _submitter_pk(report)
    if pk is None or not User.objects.filter(pk=pk).exists():
        return
    _bulk_notify(
        [pk],
        report_public_id=report.public_id(),
        kind=kind,
        title=title,
        body=body,
    )
