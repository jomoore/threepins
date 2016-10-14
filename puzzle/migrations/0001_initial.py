# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import puzzle.models


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Author',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=15)),
                ('description', models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Entry',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', primary_key=True, serialize=False)),
                ('clue', models.CharField(max_length=200)),
                ('answer', models.CharField(max_length=30)),
                ('x', models.IntegerField()),
                ('y', models.IntegerField()),
                ('down', models.BooleanField(choices=[(True, 'Down'), (False, 'Across')], verbose_name='direction', default=False)),
            ],
        ),
        migrations.CreateModel(
            name='Puzzle',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', primary_key=True, serialize=False)),
                ('number', models.IntegerField(default=puzzle.models.default_number)),
                ('pub_date', models.DateTimeField(verbose_name='publication date', default=puzzle.models.default_pub_date)),
                ('size', models.IntegerField(editable=False, default=15)),
                ('type', models.IntegerField(choices=[(0, 'Blocked'), (1, 'Barred')], editable=False, default=0)),
                ('instructions', models.TextField(blank=True, null=True, editable=False)),
                ('comments', models.TextField(blank=True)),
                ('author', models.ForeignKey(to='puzzle.Author', on_delete=models.CASCADE, null=True)),
            ],
        ),
        migrations.AddField(
            model_name='entry',
            name='puzzle',
            field=models.ForeignKey(to='puzzle.Puzzle', on_delete=models.CASCADE),
        ),
    ]
