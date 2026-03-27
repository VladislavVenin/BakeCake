from django.db import models
from django.contrib.auth.models import User


class OrderedCake(models.Model):
    order = models.ForeignKey(
        'Order',
        related_name='ordered_cakes',
        verbose_name='заказы',
        null=True,
        on_delete=models.SET_NULL,
    )
    cake = models.ForeignKey(
        'Cake',
        related_name='ordered_cakes',
        verbose_name='торты',
        null=True,
        on_delete=models.SET_NULL,
    )
    quantity = models.IntegerField(verbose_name='Количество тортов', default=1)


class Order(models.Model):
    STATUS_CHOICES = [
        ("accepted", "Заказ принят"),
        ("in_delivery", "В доставке"),
        ("completed", "Завершен"),
        ("cancelled", "Отменен"),
    ]

    client = models.ForeignKey(
        'Client',
        verbose_name='клиент',
        related_name='orders',
        null=True,
        on_delete=models.SET_NULL,
    )
    cakes = models.ManyToManyField(
        'Cake',
        through='OrderedCake',
        verbose_name='торты',
        related_name='orders',
    )
    comment = models.TextField(
        'комментарий к заказу',
        blank=True,
    )
    order_price = models.DecimalField(max_digits=19, verbose_name='Сумма заказа', decimal_places=2)
    order_time = models.DateTimeField(verbose_name='время создания', auto_now_add=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="accepted", verbose_name="Статус"
    )

    class Meta:
        ordering = ('order_time',)
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'

    def __str__(self):
        return f'{str(self.order_time)}'


class Client(models.Model):
    fio = models.CharField('клиент', max_length=200)
    phone = models.CharField('клиент', max_length=12)
    email = models.EmailField('Email', unique=True, null=True, blank=True)
    address = models.TextField(
        'Адрес квартиры',
        help_text='ул. Подольских курсантов д.5 кв.4'
    )
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='client_data',
    )

    class Meta:
        ordering = ('id',)
        verbose_name = 'Клиент'
        verbose_name_plural = 'Клиенты'

    def __str__(self):
        return self.fio or self.email or str(self.id)


class Cake(models.Model):
    title = models.CharField('название торта', max_length=200, blank=True)
    description = models.TextField(
        'описание торта',
        blank=True,
    )
    picture = models.ImageField(
        verbose_name='изображение торта',
        blank=True,
        null=True,
    )
    default = models.BooleanField('торт в ассортименте', default=False)
    layers = models.ForeignKey(
        'Layer',
        verbose_name='слои',
        related_name='cakes',
        null=True,
        on_delete=models.SET_NULL,
    )
    shape = models.ForeignKey(
        'Shape',
        verbose_name='форма',
        related_name='cakes',
        null=True,
        on_delete=models.SET_NULL,
    )
    toppings = models.ManyToManyField(
        'Topping',
        verbose_name='топинги',
        related_name='cakes',
    )
    berries = models.ManyToManyField(
        'Berry',
        verbose_name='ягоды',
        related_name='cakes',
    )
    inscription = models.ManyToManyField(
        'Inscription',
        verbose_name='надпись',
        related_name='cakes',
    )
    decor = models.ManyToManyField(
        'Decor',
        verbose_name='декор',
        related_name='cakes',
    )

    class Meta:
        verbose_name = 'Торт'
        verbose_name_plural = 'Торты'

    def __str__(self):
        return self.title

    def get_price(self):
        total = 0
        total += self.layers.price
        total += self.shape.price
        for berry in Berry.objects.filter(cakes__id=self.id):
            total += berry.price
        for topping in Topping.objects.filter(cakes__id=self.id):
            total += topping.price
        for inscription in Inscription.objects.filter(cakes__id=self.id):
            total += inscription.price
        for decor in Decor.objects.filter(cakes__id=self.id):
            total += decor.price
        return total


class Layer(models.Model):
    quantity = models.IntegerField(verbose_name='Количество слоев')
    price = models.DecimalField(
        max_digits=19,
        verbose_name='Цена',
        decimal_places=2,
    )

    class Meta:
        ordering = ('quantity',)
        verbose_name = 'Количество уровней'
        verbose_name_plural = 'Количество уровней'

    def __str__(self):
        return f'{str(self.quantity)}'


class Shape(models.Model):
    shape = models.CharField(verbose_name='Форма коржа', max_length=32)
    price = models.DecimalField(
        max_digits=19,
        verbose_name='Цена',
        decimal_places=2
    )

    class Meta:
        ordering = ('id',)
        verbose_name = 'Форма'
        verbose_name_plural = 'Формы'

    def __str__(self):
        return self.shape


class Topping(models.Model):
    title = models.CharField(verbose_name='Топпинг', max_length=32)
    price = models.DecimalField(
        max_digits=19,
        verbose_name='Цена',
        decimal_places=2
    )

    class Meta:
        ordering = ('id',)
        verbose_name = 'Топпинг'
        verbose_name_plural = 'Топпинг'

    def __str__(self):
        return self.title


class Berry(models.Model):
    title = models.CharField(verbose_name='Ягода', max_length=32)
    price = models.DecimalField(
        max_digits=19,
        verbose_name='Цена',
        decimal_places=2
    )

    class Meta:
        ordering = ('id',)
        verbose_name = 'Ягоды'
        verbose_name_plural = 'Ягоды'

    def __str__(self):
        return self.title


class Inscription(models.Model):
    title = models.TextField(verbose_name='Надпись')
    price = models.DecimalField(
        max_digits=19,
        verbose_name='Цена',
        decimal_places=2
    )

    class Meta:
        ordering = ('id',)
        verbose_name = 'Надпись'
        verbose_name_plural = 'Надписи'

    def __str__(self):
        return self.title


class Decor(models.Model):
    title = models.CharField(verbose_name='Декор', max_length=32)
    price = models.DecimalField(
        max_digits=19,
        verbose_name='Цена',
        decimal_places=2
    )

    class Meta:
        ordering = ('id',)
        verbose_name = 'Декор'
        verbose_name_plural = 'Декор'

    def __str__(self):
        return self.title
