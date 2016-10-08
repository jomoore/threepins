"""
Map /puzzle/* URLs to views. Also maps the root URL to the latest puzzle.
"""

from django.conf.urls import url
from puzzle import views
from puzzle.feeds import PuzzleFeed

urlpatterns = [ #pylint: disable=invalid-name
    url(r'archive/$', views.index, name='index'),
    url(r'^(?P<number>\d+)/$', views.puzzle, name='puzzle'),
    url(r'^(?P<number>\d+)/solution/$', views.solution, name='solution'),
    url(r'^preview/(?P<number>\d+)/$', views.preview, name='preview'),
    url(r'^preview/(?P<number>\d+)/solution/$', views.preview_solution, name='preview_solution'),
    url(r'^create/$', views.create, name='create'),
    url(r'^rss/$', PuzzleFeed(), name='rss'),
]
