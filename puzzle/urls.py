"""
Map puzzle URLs to views. Also maps the root URL to the latest puzzle.
"""

from django.conf.urls import include, url
from puzzle import views
from puzzle.feeds import PuzzleFeed

urlpatterns = [ #pylint: disable=invalid-name
    url(r'^$', views.latest, name='latest'),
    url(r'^create/$', views.create, name='create'),
    url(r'^rss/$', PuzzleFeed(), name='rss'),
    url(r'^users/$', views.users, name='users'),
    url(r'^users/(?P<user>\w+)/', include([
        url(r'^(?P<number>\d+)/$', views.puzzle, name='puzzle'),
        url(r'^(?P<number>\d+)/solution/$', views.solution, name='solution'),
    ])),
]
