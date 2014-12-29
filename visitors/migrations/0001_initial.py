# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Visitor',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('ip_addr', models.CharField(max_length=40, verbose_name=b'IP address')),
                ('user_agent', models.CharField(max_length=256)),
                ('path', models.CharField(max_length=256)),
                ('referrer', models.CharField(max_length=256)),
                ('date', models.DateTimeField()),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
