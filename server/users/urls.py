from django.urls import path

from users.views import *


app_name='users'

urlpatterns = [
    path('dashboard/',Dashboard.as_view(),name='dashboard'),
    path('admin/dashboard/',AdminDashboard.as_view(),name='admin_dashboard'),
    path('admin/users/<int:user_id>/role/',ChangeUserRole.as_view(),name='change_user_role'),
    path('admin/users',ListUsers.as_view(),name='list_users')
]
