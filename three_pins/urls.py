"""
Base URL resolution handler for the site.

Passes the URL along to the app responsible for it.
"""

from django.conf.urls import include, url
from django.contrib import admin
from puzzle.views import latest

admin.autodiscover()

urlpatterns = [ #pylint: disable=invalid-name
    url(r'^contact/', include('contact.urls')),
    url(r'^admin/', admin.site.urls),
    url(r'^', include('puzzle.urls')),
]
