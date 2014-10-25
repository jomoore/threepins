from django.conf.urls import patterns, include, url
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', include('puzzle.urls')),
    url(r'^puzzle/', include('puzzle.urls')),
    url(r'^admin/', include(admin.site.urls)),
)
