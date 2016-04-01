from django.db import models
from django.utils import timezone
from ipware.ip import get_real_ip
from re import sub

def save_request(request):
    v = Visitor()
    ip = get_real_ip(request)
    v.ip_addr = sub(r'[0-9a-fA-F]+$', 'x', ip) if ip is not None else ''
    v.user_agent = request.META.get('HTTP_USER_AGENT', '')
    v.path = request.path
    v.referrer = request.META.get('HTTP_REFERER', '')
    v.date = timezone.now()
    v.save()
    for v in Visitor.objects.order_by('-date')[100:]:
        v.delete()

class Visitor(models.Model):
    ip_addr = models.CharField('IP address', max_length=40)
    user_agent = models.CharField(max_length=256)
    path = models.CharField(max_length=256)
    referrer = models.CharField(max_length=256)
    date = models.DateTimeField()
    def __str__(self):
        return self.ip_addr
