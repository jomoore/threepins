"""
Base URLresolution handler for the site.

Passes the URL along to the app responsible for it.
"""

from django.conf.urls import include, url
from django.contrib import admin

admin.autodiscover()

urlpatterns = [ #pylint: disable=invalid-name
    url(r'^$', include('puzzle.urls')),
    url(r'^puzzle/', include('puzzle.urls')),
    url(r'^contact/', include('contact.urls')),
    url(r'^admin/', include(admin.site.urls)),
]
