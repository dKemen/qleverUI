# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2018-09-09 09:01
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0028_auto_20180817_1122'),
    ]

    operations = [
        migrations.AddField(
            model_name='backend',
            name='objectName',
            field=models.CharField(blank=True, default=None, help_text='Relation that tells QLever UI the name of a object.', max_length=100, null=True, verbose_name='Object name relation'),
        ),
        migrations.AddField(
            model_name='backend',
            name='predicateName',
            field=models.CharField(blank=True, default=None, help_text='Relation that tells QLever UI the name of a predicate.', max_length=100, null=True, verbose_name='Predicate name relation'),
        ),
        migrations.AddField(
            model_name='backend',
            name='subjectName',
            field=models.CharField(blank=True, default=None, help_text='Relation that tells QLever UI the name of a subject.', max_length=100, null=True, verbose_name='Subject name relation'),
        ),
    ]
