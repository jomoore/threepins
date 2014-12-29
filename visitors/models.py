from django.db import models
from django.utils import timezone

def save_request(request):
    if Visitor.objects.count() >= 100:
        Visitor.objects.earliest('date').delete()
    v = Visitor()
    v.path = request.path
    v.date = timezone.now()
    meta = request.META
    if 'REMOTE_ADDR' in meta:
        v.ip_addr = request.META['REMOTE_ADDR']
    if 'HTTP_USER_AGENT' in meta:
        v.user_agent = request.META['HTTP_USER_AGENT']
    if 'HTTP_REFERER' in meta:
        v.referrer = request.META['HTTP_REFERER']
    v.save()

class Visitor(models.Model):
    ip_addr = models.CharField('IP address', max_length=40)
    user_agent = models.CharField(max_length=256)
    path = models.CharField(max_length=256)
    referrer = models.CharField(max_length=256)
    date = models.DateTimeField()
    def __str__(self):
        return self.ip_addr
