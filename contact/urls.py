"""
Resolve URLs for the contact form.

The first is used to view the form, the second is used to post the contents.
"""

from django.conf.urls import url
from contact import views

urlpatterns = [ #pylint: disable=invalid-name
    url(r'^$', views.contact, name='contact'),
    url(r'^send$', views.send, name='send'),
]
