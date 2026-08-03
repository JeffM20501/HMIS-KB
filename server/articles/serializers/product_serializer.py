from rest_framework import serializers
from articles.models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model=Product
        fields=[
            'name', 'slug', 'description', 'is_active','created_at', 'updated_at'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at']