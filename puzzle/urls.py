"""
Map puzzle URLs to views. Also maps the root URL to the latest puzzle.
"""

from django.conf.urls import include, url
from django.contrib.auth import views as auth_views
from puzzle import views
from puzzle.feeds import PuzzleFeed

urlpatterns = [ #pylint: disable=invalid-name
    url(r'^$', views.latest, name='latest'),
    url(r'^login/$', auth_views.LoginView.as_view(template_name='puzzle/login.html'), name='login'),
    url(r'^logout/$', auth_views.LogoutView.as_view(next_page='latest'), name='logout'),
    url(r'^create/$', views.create, name='create'),
    url(r'^save/$', views.save, name='save'),
    url(r'^rss/$', PuzzleFeed(), name='rss'),
    url(r'^archive/$', views.users, name='users'),
    url(r'^profile/$', views.profile, name='profile'),
    url(r'^puzzle/(?P<number>\d+)/$', views.puzzle_redirect),
    url(r'^setter/(?P<author>\w+)/(?P<number>\d+)/', include([
        url(r'^$', views.puzzle, name='puzzle'),
        url(r'^solution/$', views.solution, name='solution'),
        url(r'^edit/$', views.edit, name='edit'),
    ])),
]
