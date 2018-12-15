from django.conf.urls import url
from django.contrib import admin

from . import views

urlpatterns = [
    url(r'^(?P<backend>[A-Za-z0-9\+@:%\-_]+|)$', views.index, name='index'),
    url(r'^suggest$', views.getSuggestions, name='getSuggestions'),
]
