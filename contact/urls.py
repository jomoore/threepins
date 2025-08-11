"""
Resolve URLs for the contact form.
"""

from django.urls import re_path
from contact import views

urlpatterns = [ #pylint: disable=invalid-name
    re_path(r'^$', views.contact, name='contact'),
]
