# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('visitors', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='visitor',
            name='ip_addr',
            field=models.CharField(max_length=40, verbose_name='IP address'),
        ),
    ]
