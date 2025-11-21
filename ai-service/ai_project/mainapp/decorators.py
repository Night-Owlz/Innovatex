from functools import wraps
from django.http import JsonResponse
import requests
import os
from .models import UserBase

BASE_URL = os.getenv("BACKEND_BASE_URL",)

def authenticate_user(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return JsonResponse(
                {'error': 'Invalid authorization header'}, 
                status=401
            )
        
        user_token = auth_header.replace('Bearer ', '')
        # Authenticate user
        response = requests.get(
            f"{BASE_URL}/api/v1/profile/",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        print (f"response from decorators : {response}")
        
        if response.status_code != 200:
            return JsonResponse(
                {'error': 'Authentication failed'}, 
                status=401
            )
        
        response_data = response.json()
        user_data = response_data.get('data', {})
        user_id = user_data.get('id')
        
        # Check if user exists in database, if not create new record
        user, created = UserBase.objects.get_or_create(
            user_id=user_id,
            defaults={
                'email': user_data.get('email'),
                'name': user_data.get('full_name'),
            }
        )
        
        # Attach user object to request
        request.user = user
        request.user_data = user_data
        request.user_token = user_token
        
        # Call the original view function
        return view_func(request, *args, **kwargs)
    
    return wrapper

def AuthenticateUser(user_token):
    response = requests.get(
        f"{BASE_URL}/api/v1/profile/",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    if response.status_code != 200:
        return None
        
    response_data = response.json()
    user_data = response_data.get('data', {})
    user_id = user_data.get('id')
    
    # Check if user exists in database, if not create new record
    user, created = UserBase.objects.get_or_create(
        user_id=user_id,
        defaults={
            'email': user_data.get('email'),
            'name': user_data.get('full_name'),
        }
    )
    
    return user