from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_article_tag_relationship(article, tag):
    """
    Validate that the article and tag exist and are valid.
    """
    if not article:
        raise ValidationError(_("Article is required."))
    
    if not tag:
        raise ValidationError(_("Tag is required."))
    
    return True


def validate_unique_article_tag(article, tag, exclude_pk=None):
    """
    Validate that a tag is not already added to an article.
    """
    from articles.models.article_tag import ArticleTag
    
    queryset = ArticleTag.objects.filter(article=article, tag=tag)
    
    if exclude_pk:
        queryset = queryset.exclude(pk=exclude_pk)
    
    if queryset.exists():
        raise ValidationError(
            _("Tag '%(tag)s' is already added to article '%(article)s'."),
            params={'tag': tag.name, 'article': article.title}
        )