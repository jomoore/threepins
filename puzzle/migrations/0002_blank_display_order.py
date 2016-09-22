# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import puzzle.models


class Migration(migrations.Migration):

    dependencies = [
        ('puzzle', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Blank',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', primary_key=True, serialize=False)),
                ('size', models.IntegerField(editable=False, default=15)),
                ('display_order', models.IntegerField(default=100)),
            ],
        ),
        migrations.CreateModel(
            name='Block',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', primary_key=True, serialize=False)),
                ('x', models.IntegerField()),
                ('y', models.IntegerField()),
                ('blank', models.ForeignKey(to='puzzle.Blank')),
            ],
        ),
    ]
