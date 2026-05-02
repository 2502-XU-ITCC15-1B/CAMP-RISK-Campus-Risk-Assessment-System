from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Notification


def _serialize(n: Notification) -> dict:
    return {
        'id': n.pk,
        'created_at': n.created_at.isoformat(),
        'read': n.read_at is not None,
        'report_id': n.report_public_id or '',
        'kind': n.kind,
        'title': n.title,
        'body': n.body,
    }


@csrf_exempt
@require_http_methods(['GET', 'HEAD'])
def notifications_list(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    limit = 50
    try:
        limit = min(max(int(request.GET.get('limit', '50')), 1), 100)
    except (TypeError, ValueError):
        limit = 50
    qs = Notification.objects.filter(recipient=request.user).order_by('-created_at')[:limit]
    rows = [_serialize(n) for n in qs]
    unread = Notification.objects.filter(recipient=request.user, read_at__isnull=True).count()
    return JsonResponse({'notifications': rows, 'unread_count': unread})


@csrf_exempt
@require_http_methods(['POST'])
def notifications_mark_all_read(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    now = timezone.now()
    updated = Notification.objects.filter(recipient=request.user, read_at__isnull=True).update(read_at=now)
    return JsonResponse({'ok': True, 'marked': updated})


@csrf_exempt
@require_http_methods(['POST'])
def notifications_mark_read(request, notification_id: int):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    try:
        n = Notification.objects.get(pk=notification_id, recipient=request.user)
    except Notification.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
    if n.read_at is None:
        n.read_at = timezone.now()
        n.save(update_fields=['read_at'])
    return JsonResponse({'ok': True})
