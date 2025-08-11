"""
Base URL resolution handler for the site.

Passes the URL along to the app responsible for it.
"""

from django.urls import include, re_path
from django.contrib import admin

admin.autodiscover()

urlpatterns = [ #pylint: disable=invalid-name
    re_path(r'^contact/', include('contact.urls')),
    re_path(r'^admin/', admin.site.urls),
    re_path(r'^', include('puzzle.urls')),
]
