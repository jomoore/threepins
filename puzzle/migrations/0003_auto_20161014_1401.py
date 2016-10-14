# -*- coding: utf-8 -*-
# Generated by Django 1.10.2 on 2016-10-14 13:01
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import puzzle.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('puzzle', '0002_blank_display_order'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='puzzle',
            name='author',
        ),
        migrations.AddField(
            model_name='puzzle',
            name='user',
            field=models.ForeignKey(default=puzzle.models.default_user, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.DeleteModel(
            name='Author',
        ),
    ]
