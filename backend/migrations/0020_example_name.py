# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2018-03-16 11:26
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0019_example'),
    ]

    operations = [
        migrations.AddField(
            model_name='example',
            name='name',
            field=models.CharField(default='', max_length=100),
            preserve_default=False,
        ),
    ]
