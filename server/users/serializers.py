from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from rest_framework import serializers
from users.validators import (
    validate_username,
    validate_email,
    validate_role,
    validate_department,
)


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["url", "username", "email", "role", "department", "date_joined", "updated_at"]
        read_only_fields = ['updated_at', 'date_joined', 'url']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        """
        Validate only the fields that are being updated.
        """
        instance = getattr(self, 'instance', None)
        errors = {}

        if 'username' in data:
            try:
                if instance:
                    if get_user_model().objects.filter(username=data['username']).exclude(pk=instance.pk).exists():
                        errors['username'] = "A user with that username already exists."
                else:
                    validate_username(data['username'])
            except Exception as e:
                errors['username'] = str(e)

        if 'email' in data:
            try:
                if instance:
                    if get_user_model().objects.filter(email=data['email']).exclude(pk=instance.pk).exists():
                        errors['email'] = "A user with that email already exists."
                else:
                    validate_email(data['email'])
            except Exception as e:
                errors['email'] = str(e)

        if 'role' in data:
            try:
                validate_role(data['role'])
            except Exception as e:
                errors['role'] = str(e)

        if 'department' in data:
            try:
                validate_department(data['department'])
            except Exception as e:
                errors['department'] = str(e)

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def update(self, instance, validated_data):
        """
        Update a user instance with validated data.
        """
        request = self.context.get('request')

        if 'role' in validated_data and validated_data['role'] != instance.role:
            if not request or request.user.role != 'admin':
                raise serializers.ValidationError({"role": "Only admins can change roles."})

            if request and instance == request.user:
                raise serializers.ValidationError({"role": "Users cannot change their own role."})

        if 'password' in validated_data:
            instance.set_password(validated_data.pop('password'))

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance