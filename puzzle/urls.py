"""
Map puzzle URLs to views. Also maps the root URL to the latest puzzle.
"""

from django.urls import include, re_path
from django.contrib.auth import views as auth_views
from puzzle import views
from puzzle.feeds import PuzzleFeed

urlpatterns = [
    re_path(r'^$', views.latest, name='latest'),
    re_path(r'^login/$', auth_views.LoginView.as_view(template_name='puzzle/login.html'),
            name='login'),
    re_path(r'^logout/$', views.logout_user, name='logout'),
    re_path(r'^create/$', views.create, name='create'),
    re_path(r'^save/$', views.save, name='save'),
    re_path(r'^rss/$', PuzzleFeed(), name='rss'),
    re_path(r'^archive/$', views.users, name='users'),
    re_path(r'^profile/$', views.profile, name='profile'),
    re_path(r'^puzzle/(?P<number>\d+)/$', views.puzzle_redirect),
    re_path(r'^setter/(?P<author>\w+)/(?P<number>\d+)/', include([
        re_path(r'^$', views.puzzle, name='puzzle'),
        re_path(r'^solution/$', views.solution, name='solution'),
        re_path(r'^edit/$', views.edit, name='edit'),
    ])),
]
