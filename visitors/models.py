"""
Database storage for visitor logs.

Proper analytics all seem kind of evil in the way they track individual
visitors. This is the poor man's version which just records page requests
and where they came from. Usually, the answer is "robots".
"""

from re import sub
from django.db import models
from django.utils import timezone
from ipware.ip import get_real_ip

def save_request(request):
    """Record a page request's context in the database."""
    log = Visitor()
    ip_addr = get_real_ip(request)
    log.ip_addr = sub(r'[0-9a-fA-F]+$', 'x', ip_addr) if ip_addr is not None else ''
    log.user_agent = request.META.get('HTTP_USER_AGENT', '')
    log.path = request.path
    log.referrer = request.META.get('HTTP_REFERER', '')
    log.date = timezone.now()
    log.save()
    for old_log in Visitor.objects.order_by('-date')[100:]:
        old_log.delete()

class Visitor(models.Model):
    """Visitor log."""
    ip_addr = models.CharField('IP address', max_length=40)
    user_agent = models.CharField(max_length=256)
    path = models.CharField(max_length=256)
    referrer = models.CharField(max_length=256)
    date = models.DateTimeField()
    def __str__(self):
        return self.ip_addr
