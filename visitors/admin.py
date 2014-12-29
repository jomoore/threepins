from django.contrib import admin
from visitors.models import Visitor

class VisitorAdmin(admin.ModelAdmin):
    list_display = ('date', 'ip_addr', 'user_agent', 'path', 'referrer')

admin.site.register(Visitor, VisitorAdmin)
