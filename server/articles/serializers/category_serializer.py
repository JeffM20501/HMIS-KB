from rest_framework import serializers
from articles.models.category import Category
from articles.validators.category_validator import validate_name, validate_slug


class CategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.ReadOnlyField(source='parent.name')
    article_count = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    full_path = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description',
            'parent', 'parent_name', 'icon', 'sort_order',
            'article_count', 'children', 'full_path',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_article_count(self, obj):
        return obj.articles.filter(status='published').count()
    
    def get_children(self, obj):
        children = obj.children.all()
        return CategorySerializer(children, many=True, context=self.context).data
    
    def get_full_path(self, obj):
        return obj.get_full_path()
    
    def validate_name(self, value):
        return validate_name(value)
    
    def validate_slug(self, value):
        return validate_slug(value)
    
    def validate(self, data):
        parent = data.get('parent')
        instance = getattr(self, 'instance', None)
        
        if parent and instance:
            if parent == instance:
                raise serializers.ValidationError({
                    'parent': 'A category cannot be its own parent.'
                })
        
        return data
    
    def create(self, validated_data):
        if 'slug' not in validated_data or not validated_data['slug']:
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'name' in validated_data and 'slug' not in validated_data:
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        return super().update(instance, validated_data)


class CategoryListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views."""
    
    article_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'article_count']  # ✅ REMOVED 'url'
    
    def get_article_count(self, obj):
        return obj.get_article_count()