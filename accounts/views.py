from django.contrib.auth import login, logout
from django.contrib.auth.models import User

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from BakeCake.models import Client


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_by_email(request):
    """
    Email authentication: if there is an email, we will log in,
    if not, create a new user and log in.
    """
    email = request.data.get('email')

    if not email:
        return Response(
            {'error': 'Email обязателен'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    email = email.lower().strip()
    user = User.objects.filter(email=email).first()

    if user:
        login(request, user)
        return Response({
            'message': 'Вход выполнен',
            'user': {
                'email': user.email,
                'is_authenticated': True
            }
        })
    else:
        user = User.objects.create_user(
            username=email,
            email=email,
            password=None
        )
        login(request, user)

        return Response({
            'message': 'Пользователь создан и выполонен вход',
            'user': {
                'email': user.email,
                'is_authenticated': True,
            }
        }, status=status.HTTP_201_CREATED)
    
@api_view(['POST'])
def logout_user(request):
    """Exit from system."""
    logout(request)
    return Response({'message': 'Вы вышли из системы'})

@api_view(['GET'])
def get_profile(request):
    """Getting the current user's profile."""
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Не авторизован'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    
    try:
        client = request.user.client_data
        return Response({
            'fio': client.fio or '',
            'phone': client.phone or '',
            'email': request.user.email,
            'address': client.address or '',
        })
    except Client.DoesNotExist:
        return Response({
            'email': request.user.email,
            'fio': '',
            'phone': '',
            'address': '',
        })
    
@api_view(['POST'])
def update_profile(request):
    """Update profile (fio, phone, address)."""
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Не авторизован'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    
    fio = request.data.get('fio', '')
    phone = request.data.get('phone', '')
    address = request.data.get('address', '')

    client, created = Client.objects.get_or_create(
        user=request.user,
        defaults={
            'fio': fio,
            'phone': phone,
            'address': address,
            'email': request.user.email,
        }
    )

    if not created:
        client.fio = fio
        client.phone = phone
        client.address = address
        client.email = request.user.email
        client.save()

    return Response({
        'fio': client.fio,
        'phone': client.phone,
        'email': request.user.email,
        'address': client.address,
    })

@api_view(['GET'])
def get_orders(request):
    """Receiving user orders."""
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Не авторизован'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        client = request.user.client_data
        orders = client.orders.all().prefetch_related(
            'ordered_cakes__cake',
            'ordered_cakes__cake__toppings',
            'ordered_cakes__cake__berries',
            'ordered_cakes__cake__decor',
            'ordered_cakes__cake__inscription'
        ).order_by('-order_time')
        
        orders_data = []
        for order in orders:
            cakes = []
            for ordered_cake in order.ordered_cakes.all():
                cake = ordered_cake.cake
                cakes.append({
                    'id': cake.id,
                    'title': cake.title,
                    'quantity': ordered_cake.quantity,
                    'price': float(cake.get_price()),
                    'layers': str(cake.layers) if cake.layers else None,
                    'shape': str(cake.shape) if cake.shape else None,
                    'toppings': [t.title for t in cake.toppings.all()],
                    'berries': [b.title for b in cake.berries.all()],
                    'decor': [d.title for d in cake.decor.all()],
                    'inscription': [i.title for i in cake.inscription.all()],
                })
            
            orders_data.append({
                'id': order.id,
                'order_time': order.order_time.strftime('%d.%m.%Y %H:%M'),
                'order_price': float(order.order_price),
                'status': order.get_status_display(),
                'status_code': order.status,
                'comment': order.comment,
                'cakes': cakes
            })
        
        return Response(orders_data)
        
    except Client.DoesNotExist:
        return Response([])
    
