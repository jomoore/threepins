"""
WSGI config for three_pins project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.7/howto/deployment/wsgi/
"""
#pylint: disable=invalid-name,wrong-import-position

import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "three_pins.settings")

from django.core.wsgi import get_wsgi_application
from whitenoise.django import DjangoWhiteNoise

application = DjangoWhiteNoise(get_wsgi_application())
