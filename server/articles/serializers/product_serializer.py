from rest_framework import serializers
from articles.models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model=Product
        fields=[
            'name', 'slug', 'description', 'is_active', 'updated_at'
        ]
        read_only_fields=[
            'name', 'description', 'is_active'
        ]