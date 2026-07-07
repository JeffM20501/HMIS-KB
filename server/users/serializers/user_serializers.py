from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from rest_framework import serializers
from users.validators import (
    validate_role,
    validate_department,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = [ "password","username", "email", "role", "department", "date_joined", "updated_at"]
        read_only_fields = ['updated_at', 'date_joined', 'url']
        extra_kwargs = {
            'password': {'write_only': True, 'required':True}
        }

    def validate_username(self, value):
        """Validate username uniqueness, excluding the current instance."""
        instance = getattr(self, 'instance', None)
        
        if not value:
            raise serializers.ValidationError("Username is required.")
        
        # Check uniqueness, excluding current instance if updating
        if instance:
            if get_user_model().objects.filter(username=value).exclude(pk=instance.pk).exists():
                raise serializers.ValidationError("A user with that username already exists.")
        else:
            if get_user_model().objects.filter(username=value).exists():
                raise serializers.ValidationError("A user with that username already exists.")
        
        return value

    def validate_email(self, value):
        """Validate email uniqueness, excluding the current instance."""
        instance = getattr(self, 'instance', None)
        
        if not value:
            raise serializers.ValidationError("Email is required.")
        
        if '@' not in value:
            raise serializers.ValidationError("Enter a valid email address.")
        
        # Check uniqueness, excluding current instance if updating
        if instance:
            if get_user_model().objects.filter(email=value).exclude(pk=instance.pk).exists():
                raise serializers.ValidationError("A user with that email already exists.")
        else:
            if get_user_model().objects.filter(email=value).exists():
                raise serializers.ValidationError("A user with that email already exists.")
        
        return value

    def validate_role(self, value):
        """Validate role is valid."""
        return validate_role(value)

    def validate_department(self, value):
        """Validate department is provided."""
        return validate_department(value)
    
    def validate_password(self,value):
        """Validate password"""
        if not value:
            raise serializers.ValidationError('Password required')
        
        if len(value)<8:
            raise serializers.ValidationError('Password needs to be at least 8 characters long')
        
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError('Password} must contain at least one digit')
        
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError('Password must contain at least 1 uppercase letter')
        
        if not any(char.islower() for char in value):
            raise serializers.ValidationError('Password must contain at least 1 lowercase letter')
        
        return value

    def validate(self, data):
        """
        Cross-field validation for the entire object.
        """
        instance = getattr(self, 'instance', None)
        errors = {}
        
        role = data.get('role', instance.role if instance else None)
        department = data.get('department', instance.department if instance else None)
        
        if role == 'admin' and department != 'Management':
            errors['department'] = "Admin users must be in the Management department."
        
        if role != 'admin' and department == 'Management':
            errors['department'] = "Regular users cannot be in the Management department."
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return data

    def update(self, instance, validated_data):
        """
        Update a user instance with validated data.
        """

        if 'password' in validated_data:
            instance.set_password(validated_data.pop('password'))

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
    
    def create(self, validated_data):
        """
        Create user hashed password
        """
        
        password=validated_data.pop('password',None)
        user=super().create(validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        return user


# class GroupSerializer(serializers.HyperlinkedModelSerializer):
#     class Meta:
#         model = Group
#         fields = [ "name"]