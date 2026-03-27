from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    """User profile associated with User and Client."""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    client = models.OneToOneField(
        'BakeCake.Client',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='profile',
    )

    def __str__(self):
        return f'Profile for {self.user.email}'
    

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()