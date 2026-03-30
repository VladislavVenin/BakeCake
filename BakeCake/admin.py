from django.contrib import admin
from .models import (
    OrderedCake,
    Order,
    Cake,
    Client,
    Layer,
    Shape,
    Topping,
    Berry,
    Inscription,
    Decor,
    PromoCode
)
from django.utils.html import format_html


class OrderedCakeInline(admin.TabularInline):
    model = OrderedCake
    extra = 1


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['client', 'order_price', 'status']
    list_filter = ['status']
    list_editable = ['status']
    inlines = [OrderedCakeInline]


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['fio', 'phone', 'email', 'user']
    list_display_links = ['fio']


@admin.register(Cake)
class CakeAdmin(admin.ModelAdmin):
    list_display = ['title', 'image_preview', 'get_price']
    list_display_links = ['title', 'image_preview']

    def image_preview(self, obj):
        if obj.picture:
            return format_html('<img src="{}" width="200" />', obj.picture.url)
        return "Нет изображения"
    image_preview.short_description = "Фото"


@admin.register(Layer)
class LayerAdmin(admin.ModelAdmin):
    list_display = ['quantity', 'price']


@admin.register(Shape)
class ShapeAdmin(admin.ModelAdmin):
    list_display = ['shape', 'price']


@admin.register(Topping)
class ToppingAdmin(admin.ModelAdmin):
    list_display = ['title', 'price']


@admin.register(Berry)
class BerryAdmin(admin.ModelAdmin):
    list_display = ['title', 'price']


@admin.register(Inscription)
class InscriptionAdmin(admin.ModelAdmin):
    list_display = ['title', 'price']


@admin.register(Decor)
class DecorAdmin(admin.ModelAdmin):
    list_display = ['title', 'price']

admin.site.register(PromoCode)