from django.shortcuts import render

# Create your views here.

from django.contrib.auth import get_user_model
from rest_framework import permissions,viewsets
from rest_framework.views import APIView
from users.permissions import *
from rest_framework.response import Response
from rest_framework import status,serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from articles.models import Article, Category
from django.db.models import Count, Sum, Q, Avg
from django.db.models.functions import TruncMonth
from django.utils import timezone
from analytics.models import ArticleViewLog
from datetime import timedelta
from analytics.models import Feedback, AuditLog
from utils.get_ip import _get_client_ip
from ..serializers.user_serializers import UserSerializer
from ..serializers.password_reset_serializer import PasswordResetConfirmSerializer,PasswordResetRequestSerializer

import cloudinary.uploader

User=get_user_model()
class UserViewSet(viewsets.ModelViewSet):
    """
        API endpoint that allows users to be viewed or edited
    """
    
    queryset = get_user_model().objects.all().order_by("-date_joined")
    serializer_class=UserSerializer
    
    
    def get_permissions(self):
        if self.action in ['list']:
            permission_classes=[CanListUsers]
        elif self.action in ['retrieve']:
            permission_classes=[permissions.IsAuthenticated]        
        elif self.action =='create' :
            permission_classes=[permissions.AllowAny]
        elif self.action in ['update','partial_update']:
            permission_classes=[IsOwnerOrReadOnly|IsAdmin]
        elif self.action=='destroy':
            permission_classes=[IsAdmin]
        else: 
            permission_classes=[permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_update(self, serializer): 
        if 'password' in  self.request.data:
            instance=self.get_object()
            instance.set_password(self.request.data.get('password'))
            self.request.data._mutable=True
            del self.request.data['password']
            self.request.data._mutable=False
        serializer.save()
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def dashboard(self, request):
        """
        GET /api/v1/users/dashboard/  Dashboard stats for the current user.
        """
        user = request.user
        articles = Article.objects.filter(author=user)

        # Counts by status
        draft_count = articles.filter(status='draft').count()
        pending_review_count = articles.filter(status='pending_review').count()
        published_count = articles.filter(status='published').count()
        total_views = articles.aggregate(total=Sum('views'))['total'] or 0

        # Recent articles (last 5)
        recent_articles = articles.order_by('-updated_at')[:5]
        recent_data = []
        for a in recent_articles:
            recent_data.append({
                'id': a.id,
                'slug': a.slug,
                'title': a.title,
                'status': a.status,
                'views': a.views,
                'updated_at': a.updated_at.isoformat(),
                'category': {'name': a.category.name} if a.category else None,
            })

        # Views by month (using ArticleViewLog for time-series)
        # Aggregate views for the user's articles grouped by month
        now = timezone.now()
        start_date = now - timedelta(days=365)  # last 12 months
        view_logs = ArticleViewLog.objects.filter(
            article__author=user,
            timestamp__gte=start_date
        ).annotate(
            month=TruncMonth('timestamp')
        ).values('month').annotate(
            views=Count('id')
        ).order_by('month')

        # Build a list of last 12 months with zero padding
        views_by_month = []
        current = start_date.replace(day=1)
        while current <= now:
            month_str = current.strftime('%b %Y')
            # find matching month
            matched = next((v for v in view_logs if v['month'].date() == current.date()), None)
            views_by_month.append({
                'month': month_str,
                'views': matched['views'] if matched else 0
            })
            # move to next month
            if current.month == 12:
                current = current.replace(year=current.year+1, month=1)
            else:
                current = current.replace(month=current.month+1)

        # Also include the user profile data (the serializer already does that, but we add stats)
        serializer = UserSerializer(user)

        return Response({
            'user': serializer.data,
            'draft_count': draft_count,
            'pending_review_count': pending_review_count,
            'published_count': published_count,
            'total_views': total_views,
            'recent_articles': recent_data,
            'views_by_month': views_by_month,
        })
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """GET /api/v1/u/users/me/  Current user's profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def admin_dashboard(self, request):
        """GET /api/v1/users/admin_dashboard/  Admin stats"""
        #article related counts / editor
        total_articles=Article.objects.count()
        published_count=Article.objects.filter(status='published').count()
        pending_review_count=Article.objects.filter(status='pending_review').count()
        draft_count=Article.objects.filter(status='draft').count()
        archived_count=Article.objects.filter(status='archived').count()
        editor_count=User.objects.filter(role='editor').count()
        
        #views category
        category_views=Category.objects.annotate(
            total_views=Sum('articles__views')
        ).values(
            'name','total_views'
        ).filter(
            total_views__gt=0
        ).order_by(
            '-total_views'
        )
        total_all_views=sum(item['total_views'] for item in category_views) or 1
        views_by_category=[]
        for cat in category_views:
            views_by_category.append({
                'name': cat['name'],
                'percentage': round((cat['total_views'] / total_all_views) * 100, 1)  # ✅ * 100
            })
        
        #article creation trend
        now=timezone.now()
        start_date=now-timedelta(days=365)
        creation_qs=Article.objects.filter(
            created_at__gte=start_date
        ).annotate(
            month=TruncMonth('created_at')
        ).values(
            'month'
        ).annotate(
            count=Count('id')
        ).order_by('month')
        
        #pad moths with zero
        creation_trend=[]
        current=start_date.replace(day=1)
        while current <= now:
            month_str=current.strftime('%b %Y')
            mathched=next((v for v in creation_qs if v['month'].date()==current.date()),None)
            creation_trend.append({
                'month':month_str,
                'count':mathched['count'] if mathched else 0
            })
            
            if current.month==12:
                current=current.replace(year=current.year+1, month=1)
            else:
                current=current.replace(month=current.month+1)
        
        #most viewed articles
        most_viewed=Article.objects.filter(status='published').order_by('-views')[:10]
        most_viewed_data=[]
        for a in most_viewed:
            rating_avg = Feedback.objects.filter(
                content_type='article',
                object_id=str(a.id),
                rating__isnull=False
            ).aggregate(
                Avg('rating')
            )['rating__avg']
            
            most_viewed_data.append({
                'id': a.id,
                'slug': a.slug,
                'title': a.title,
                'views': a.views,
                'category': {'name': a.category.name} if a.category else None,
                'rating': round(rating_avg, 1) if rating_avg else None
            })
            
        return Response({
            'total_articles': total_articles,
            'published_count': published_count,
            'pending_review_count': pending_review_count,
            'draft_count': draft_count,
            'archived_count': archived_count,
            'editor_count': editor_count,
            'views_by_category': views_by_category,
            'article_creation_trend': creation_trend,
            'most_viewed_articles': most_viewed_data,
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def admin_users(self, request):
        """ List all users (admin only)"""
        users = get_user_model().objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch', 'post'], permission_classes=[IsAdmin])
    def change_role(self, request,pk=None):
        """PATCH /api/v1/users/{id}/change_role/  Change user role"""
        try:
            user=User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error':'User not found'},status=status.HTTP_404_NOT_FOUND)
        
        old_role=user.role
        new_role=request.data.get('role')
        
        if new_role not in ['admin','editor','viewer']:
            return Response({'error':'Invaild role'},status=status.HTTP_400_BAD_REQUEST)
        
        user.role=new_role
        user.save()
        AuditLog.log_action(
            user=request.user,
            action=AuditLog.ACTION_ROLE_CHANGE,
            obj=user,
            changes={'role': {'old': old_role, 'new': new_role}},
            user_ip=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        return Response({'message':f'User role Updated to {new_role}'},status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        """
        POST /api/v1/u/users/{id}/set-password/
        Change password for a logged-in user.
        """
        user = self.get_object()
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {'error': 'Current password and new password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:
            return Response(
                {'error': 'New password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {'message': 'Password updated successfully.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['patch'], url_path='update_avatar')
    def update_avatar(self, request, pk=None):
        user = self.get_object()
        avatar_file = request.FILES.get('avatar')
        
        if not avatar_file:
            return Response(
                {"error": "No avatar file provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not avatar_file.content_type.startswith('image/'):
            return Response(
                {"error": "File must be an image."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if avatar_file.size > 3 * 1024 * 1024:  
            return Response(
                {"error": "Image must be less than 3MB."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                avatar_file,
                folder="avatars",
            )
            avatar_url = result.get('secure_url')
            
            # Update user
            user.avatar = avatar_url
            user.save()
            
            serializer = UserSerializer(user)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


