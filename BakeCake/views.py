from django.shortcuts import render, redirect
from .models import (
    Cake,
    Layer,
    Shape,
    Topping,
    Berry,
    Decor,
    Inscription,
    PromoCode
)
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import (
    LayerSerializer, ShapeSerializer, ToppingSerializer,
    BerrySerializer, DecorSerializer, InscriptionSerializer
)
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from decimal import Decimal
import json


def index(request):
    cakes = Cake.objects.filter(default=True)
    layers = Layer.objects.all()
    shapes = Shape.objects.all()
    toppings = Topping.objects.all()
    berries = Berry.objects.all()
    decors = Decor.objects.all()

    context = {
        'cakes': cakes,
        'layers': layers,
        'shapes': shapes,
        'toppings': toppings,
        'berries': berries,
        'decors': decors,
    }
    return render(request, "index.html", context)


def lk(request):
    return render(request, "lk.html")


@api_view(['GET'])
def get_cake_data(request):
    try:
        # Получаем данные из БД
        layers = Layer.objects.all()
        shapes = Shape.objects.all()
        toppings = Topping.objects.all()
        berries = Berry.objects.all()
        decors = Decor.objects.all()
        words_price_obj = Inscription.objects.get(title="Цена надписи")

        data = {
            'layers': LayerSerializer(layers, many=True).data,
            'shapes': ShapeSerializer(shapes, many=True).data,
            'toppings': ToppingSerializer(toppings, many=True).data,
            'berries': BerrySerializer(berries, many=True).data,
            'decors': DecorSerializer(decors, many=True).data,
            'words_price': words_price_obj.price,
        }

        return Response(data, status=status.HTTP_200_OK)

    except Inscription.DoesNotExist:
        return Response(
            {'error': 'Цена надписи не найдена'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def check_promo_code(request):
    code = request.data.get('code', '').strip().upper()
    total_price = request.data.get('total_price', 0)
    
    if not code:
        return Response({'error': 'Введите промокод'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        promo = PromoCode.objects.get(code=code)
        user = request.user if request.user.is_authenticated else None
        
        if promo.is_valid(user):
            discount = promo.apply_discount(float(total_price))
            return Response({
                'valid': True,
                'discount_percent': promo.discount_percent,
                'discount_amount': discount,
                'final_price': float(total_price) - discount,
                'message': f'Промокод "{code}" активирован! Скидка {promo.discount_percent}%'
            })
        else:
            return Response({
                'valid': False,
                'error': 'Промокод недействителен или уже использован'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except PromoCode.DoesNotExist:
        return Response({
            'valid': False,
            'error': 'Промокод не найден'
        }, status=status.HTTP_400_BAD_REQUEST)
    

@csrf_exempt
def create_order(request):
    if request.method != 'POST':
        return redirect('/')
    
    try:
        levels_id = request.POST.get('LEVELS')
        form_id = request.POST.get('FORM')
        topping_id = request.POST.get('TOPPING')
        berries_id = request.POST.get('BERRIES')
        decor_id = request.POST.get('DECOR')
        words = request.POST.get('WORDS', '').strip()
        comment = request.POST.get('COMMENTS', '').strip()

        name = request.POST.get('NAME', '').strip()
        phone = request.POST.get('PHONE', '').strip()
        email = request.POST.get('EMAIL', '').strip()
        address = request.POST.get('ADDRESS', '').strip()
        delivery_date = request.POST.get('DATE', '')
        delivery_time = request.POST.get('TIME', '')
        delivery_comment = request.POST.get('DELIVCOMMENTS', '').strip()
        promo_code = request.POST.get('PROMO_CODE', '').strip()

        if not all([name, phone, email, address, delivery_date, delivery_time]):
            messages.error(request, 'Заполните все обязательные поля')
            return redirect('/#step4')

        client, created = Client.objects.get_or_create(
            email=email,
            defaults={
                'fio': name,
                'phone': phone,
                'address': address,
            }
        )

        if not created:
            client.fio = name
            client.phone = phone
            client.address = address
            client.save()

        cake = Cake.objects.create(
            title=f"Кастомный торт для {name}",
            description=f"Уровни: {levels_id}, Форма: {form_id}, Топпинг: {topping_id}",
            default=False,
            layers_id=levels_id if levels_id and levels_id != 'null' else None,
            shape_id=form_id if form_id and form_id != 'null' else None,
        )

        if topping_id and topping_id != 'null':
            cake.toppings.add(topping_id)

        if berries_id and berries_id != 'null':
            cake.berries.add(berries_id)

        if decor_id and decor_id != 'null':
            cake.decor.add(decor_id)

        if words:
            inscription = Inscription.objects.create(
                title=words,
                price=500
            )
            cake.inscription.add(inscription)
        

        cake.save()
        

        total_price = calculate_cake_price(levels_id, form_id, topping_id, berries_id, decor_id, words)
        

        discount_amount = Decimal('0')
        promo_obj = None
        
        if promo_code:
            try:
                promo_obj = PromoCode.objects.get(code=promo_code.upper())
                if promo_obj.is_valid(request.user if request.user.is_authenticated else None):
                    discount_amount = total_price * Decimal(str(promo_obj.discount_percent)) / Decimal('100')
                    promo_obj.used_count += 1
                    if request.user.is_authenticated:
                        promo_obj.users_who_used.add(request.user)
                    promo_obj.save()
            except PromoCode.DoesNotExist:
                pass
        
        final_price = total_price - discount_amount

        order = Order.objects.create(
            client=client,
            order_price=final_price,
            comment=comment,
            status='accepted',
        )
        
        OrderedCake.objects.create(
            order=order,
            cake=cake,
            quantity=1
        )
        
        order.comment = f"{comment}\n\nДоставка: {delivery_date} {delivery_time}\nАдрес: {address}\nКомментарий курьеру: {delivery_comment}"
        if promo_code:
            order.comment += f"\nПромокод: {promo_code} (скидка {discount_amount}₽)"
        order.save()
        
        messages.success(request, f'Заказ #{order.id} успешно создан! Сумма: {final_price}₽')

        if request.user.is_authenticated:
            return redirect('/lk/')
        else:
            return redirect('/')
            
    except Exception as e:
        print(f"Ошибка создания заказа: {e}")
        messages.error(request, f'Ошибка при создании заказа: {str(e)}')
        return redirect('/#step4')


def calculate_cake_price(levels_id, form_id, topping_id, berries_id, decor_id, words):
    total = Decimal('0')

    if levels_id and levels_id != 'null':
        try:
            layer = Layer.objects.get(quantity=int(levels_id))
            total += layer.price
        except Layer.DoesNotExist:
            pass

    if form_id and form_id != 'null':
        try:
            shape = Shape.objects.get(id=int(form_id))
            total += shape.price
        except Shape.DoesNotExist:
            pass

    if topping_id and topping_id != 'null':
        try:
            topping = Topping.objects.get(id=int(topping_id))
            total += topping.price
        except Topping.DoesNotExist:
            pass

    if berries_id and berries_id != 'null':
        try:
            berry = Berry.objects.get(id=int(berries_id))
            total += berry.price
        except Berry.DoesNotExist:
            pass

    if decor_id and decor_id != 'null':
        try:
            decor = Decor.objects.get(id=int(decor_id))
            total += decor.price
        except Decor.DoesNotExist:
            pass

    if words:
        total += Decimal('500')
    
    return total