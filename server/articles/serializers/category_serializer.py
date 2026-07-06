from rest_framework import serializers
from articles.models.category import Category
from articles.validators.category_validator import validate_name, validate_slug


class CategorySerializer(serializers.HyperlinkedModelSerializer):
    """PRD FR-8.1: Category structure for organizing articles."""
    
    parent_name = serializers.ReadOnlyField(source='parent.name')
    article_count = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    full_path = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'url', 'id', 'name', 'slug', 'description',
            'parent', 'parent_name', 'icon', 'sort_order',
            'article_count', 'children', 'full_path',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_article_count(self, obj):
        """Get the number of articles in this category."""
        return obj.get_article_count()
    
    def get_children(self, obj):
        """Get child categories for nested display."""
        children = obj.children.all()
        return CategorySerializer(children, many=True, context=self.context).data
    
    def get_full_path(self, obj):
        """Get the full category path."""
        return obj.get_full_path()
    
    def validate_name(self, value):
        """Validate category name."""
        return validate_name(value)
    
    def validate_slug(self, value):
        """Validate category slug."""
        return validate_slug(value)
    
    def validate(self, data):
        """Cross-field validation."""
        # Prevent circular references
        parent = data.get('parent')
        instance = getattr(self, 'instance', None)
        
        if parent and instance:
            if parent == instance:
                raise serializers.ValidationError({
                    'parent': 'A category cannot be its own parent.'
                })
        
        return data
    
    def create(self, validated_data):
        """Create category with auto-generated slug if missing."""
        if 'slug' not in validated_data or not validated_data['slug']:
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update category with slug handling."""
        if 'name' in validated_data and 'slug' not in validated_data:
            # Only auto-generate slug if name changed and slug wasn't provided
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        
        return super().update(instance, validated_data)


class CategoryListSerializer(serializers.HyperlinkedModelSerializer):
    """Simplified serializer for list views."""
    
    class Meta:
        model = Category
        fields = ['url', 'id', 'name', 'slug', 'icon', 'article_count']
    
    article_count = serializers.SerializerMethodField()
    
    def get_article_count(self, obj):
        return obj.get_article_count()