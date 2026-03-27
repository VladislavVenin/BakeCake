from django.urls import path
from . import views


urlpatterns = [
    path('api/auth/', views.auth_by_email, name='auth_by_email'),
    path('api/logout/', views.logout_user, name='logout'),
    path('api/profile/', views.get_profile, name='profile'),
    path('api/profile/update/', views.update_profile, name='update_profile'),
    path('api/orders/', views.get_orders, name='orders'),
]
