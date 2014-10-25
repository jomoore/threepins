from django.conf.urls import patterns, url

from puzzle import views

urlpatterns = patterns('',
    url(r'^$', views.latest, name='latest'),
    url(r'archive/$', views.index, name='index'),
    url(r'^(?P<number>\d+)/$', views.puzzle, name='puzzle'),
    url(r'^(?P<number>\d+)/solution/$', views.solution, name='solution'),
)
