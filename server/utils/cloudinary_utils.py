import cloudinary.uploader
import cloudinary.api
from django.core.files.uploadedfile import UploadedFile
from articles.validators.media_validator import get_media_type_from_filename


def upload_to_cloudinary(file_obj, folder='articles'):
    """
    Upload a file to Cloudinary.
    
    Returns:
        dict: {
            'url': str,
            'public_id': str,
            'type': str,
            'filename': str
        }
    """
    media_type = get_media_type_from_filename(file_obj.name) #check type
    
    # Resource type mapping for Cloudinary
    resource_type_map = {
        'image': 'image',
        'video': 'video',
        'pdf': 'raw',
        'other': 'raw'
    }
    resource_type = resource_type_map.get(media_type, 'raw')
    
    result = cloudinary.uploader.upload( #upload
        file_obj,
        folder=folder,
        resource_type=resource_type,
        use_filename=True,
        unique_filename=True,
        overwrite=False
    )
    
    return {
        'url': result.get('secure_url'),
        'public_id': result.get('public_id'),
        'type': media_type,
        'filename': file_obj.name
    }


def delete_from_cloudinary(public_id, resource_type='image'):
    """
    Delete a file from Cloudinary.
    """
    resource_type_map = {
        'image': 'image',
        'video': 'video',
        'pdf': 'raw',
        'other': 'raw'
    }
    resource_type = resource_type_map.get(resource_type, 'raw')
    
    return cloudinary.uploader.destroy(public_id, resource_type=resource_type)