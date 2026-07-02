from django.urls import path

from . import views

app_name='users'

urlpatterns = [
    path('',views.index,name='index'), 
    path('dashboard/',views.dashboard,name='dashboard'),
    path('admin/dashboard/',views.admin_dashboard,name='admin_dashboard'),
    path('admin/users/<int:user_id>/role/',views.change_user_role,name='change_user_role'),
]
