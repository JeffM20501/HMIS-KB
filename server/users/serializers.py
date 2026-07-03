from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from rest_framework import serializers
from users.forms.user_form import UserForm



class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["url", "username", "email","role","department","date_loined", "updated_at"]
        read_only_fields=['updated_at','date_joined']
    
    def validate(self, data):
        form =UserForm(data)
        
        if not form.is_valid():
            raise serializers.ValidationError(form.errors)
        
        return data


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ["url", "name"]