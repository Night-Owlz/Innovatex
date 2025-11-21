# Backend API Documentation

**Base URL**: https://igac.revoluon.net/  
**API Version**: v1  
**Authentication**: Laravel Sanctum (Bearer Token)

---

## Table of Contents

1. [Authentication](#authentication)  
2. [User Profile](#user-profile)  
3. [Consumption Logs](#consumption-logs)  
4. [Inventory Management](#inventory-management)  
5. [Food Items](#food-items)  
6. [Resources](#resources)  
7. [Dashboard](#dashboard)  
8. [Image Uploads](#image-uploads)  
9. [Response Format](#response-format)  
10. [Error Codes](#error-codes)

---

## Authentication

### Register User

Create a new user account.

**Endpoint**: `POST /api/v1/auth/register`  
**Authentication**: Not required

**Request Body**:

{

  "full\_name": "John Doe",

  "email": "john@example.com",

  "password": "password123",

  "household\_size": 4,

  "dietary\_preferences": \["vegetarian", "gluten-free"\],

  "budget\_range": "medium",

  "location": "New York, NY"

}

**Validation Rules**:

- `full_name`: required, string, max 255 characters  
- `email`: required, valid email, unique  
- `password`: required, minimum 8 characters  
- `household_size`: optional, integer, minimum 1  
- `dietary_preferences`: optional, array  
- `budget_range`: optional, one of: `low`, `medium`, `high`  
- `location`: optional, string, max 255 characters

**Success Response** (201):

{

  "success": true,

  "message": "User registered successfully",

  "data": {

    "user": {

      "id": 1,

      "full\_name": "John Doe",

      "email": "john@example.com",

      "household\_size": 4,

      "dietary\_preferences": \["vegetarian", "gluten-free"\],

      "budget\_range": "medium",

      "location": "New York, NY",

      "profile\_image": null,

      "created\_at": "2025-11-21T00:00:00.000Z",

      "updated\_at": "2025-11-21T00:00:00.000Z"

    },

    "token": "1|abcdef123456..."

  }

}

---

### Login

Authenticate a user and receive an access token.

**Endpoint**: `POST /api/v1/auth/login`  
**Authentication**: Not required

**Request Body**:

{

  "email": "john@example.com",

  "password": "password123"

}

**Validation Rules**:

- `email`: required, valid email  
- `password`: required, string

**Success Response** (200):

{

  "success": true,

  "message": "Login successful",

  "data": {

    "user": {

      "id": 1,

      "full\_name": "John Doe",

      "email": "john@example.com",

      "household\_size": 4,

      "dietary\_preferences": \["vegetarian", "gluten-free"\],

      "budget\_range": "medium",

      "location": "New York, NY",

      "profile\_image": null,

      "created\_at": "2025-11-21T00:00:00.000Z",

      "updated\_at": "2025-11-21T00:00:00.000Z"

    },

    "token": "2|ghijkl789012..."

  }

}

**Error Response** (401):

{

  "success": false,

  "message": "Invalid credentials"

}

---

### Logout

Revoke the current access token.

**Endpoint**: `POST /api/v1/auth/logout`  
**Authentication**: Required

**Headers**:

Authorization: Bearer {token}

**Success Response** (200):

{

  "success": true,

  "message": "Logged out successfully",

  "data": null

}

---

## User Profile

### Get Profile

Retrieve the authenticated user's profile data.

**Endpoint**: `GET /api/v1/profile/`  
**Authentication**: Required  
**Rate Limit**: 60 requests/minute

**Headers**:

Authorization: Bearer {token}

Accept: application/json

**Success Response** (200):

{

  "success": true,

  "message": "Profile retrieved successfully",

  "data": {

    "id": 2,

    "full\_name": "Shakib Bin Kabir",

    "email": "shakibbinkabir@gmail.com",

    "household\_size": 3,

    "dietary\_preferences": \["Halal", "Keto"\],

    "budget\_range": null,

    "location": null,

    "profile\_image": "/storage/profile-images/1732163686517\_2.jpg",

    "created\_at": "2025-11-21T00:54:46.000Z",

    "updated\_at": "2025-11-21T00:55:17.000Z"

  }

}

**Error Response** (401):

{

  "message": "Unauthenticated."

}

---

### Update Profile

Update the authenticated user's profile information.

**Endpoint**: `PUT /api/v1/profile/` or `POST /api/v1/profile/` (for FormData)  
**Authentication**: Required

**Headers**:

Authorization: Bearer {token}

Content-Type: multipart/form-data  (if uploading image)

**Request Body** (JSON):

{

  "full\_name": "John Updated",

  "household\_size": 5,

  "dietary\_preferences": \["vegan"\],

  "budget\_range": "high",

  "location": "Los Angeles, CA"

}

**Request Body** (FormData with image):

full\_name: John Updated

household\_size: 5

dietary\_preferences: \["vegan"\]

budget\_range: high

location: Los Angeles, CA

profile\_image: \[file\]

**Validation Rules**:

- `full_name`: optional, string, max 255 characters  
- `household_size`: optional, integer, minimum 1  
- `dietary_preferences`: optional, can be array or JSON string  
- `budget_range`: optional, one of: `low`, `medium`, `high`  
- `location`: optional, string, max 255 characters  
- `profile_image`: optional, image file (jpeg, jpg, png, gif, webp), max 2MB

**Success Response** (200):

{

  "success": true,

  "message": "Profile updated successfully",

  "data": {

    "id": 1,

    "full\_name": "John Updated",

    "email": "john@example.com",

    "household\_size": 5,

    "dietary\_preferences": \["vegan"\],

    "budget\_range": "high",

    "location": "Los Angeles, CA",

    "profile\_image": "/storage/profile-images/1234567890\_1.jpg",

    "created\_at": "2025-11-21T00:00:00.000Z",

    "updated\_at": "2025-11-21T01:00:00.000Z"

  }

}

---

## Consumption Logs

### List Consumption Logs

Get a paginated list of consumption logs with optional filters.

**Endpoint**: `GET /api/v1/consumption-logs`  
**Authentication**: Required

**Query Parameters**:

- `category` (optional): Filter by category  
- `date_from` (optional): Start date (YYYY-MM-DD)  
- `date_to` (optional): End date (YYYY-MM-DD)  
- `per_page` (optional): Items per page (default: 15\)

**Example Request**:

GET /api/v1/consumption-logs?category=vegetables\&per\_page=10

**Success Response** (200):

{

  "success": true,

  "message": "Consumption logs retrieved successfully",

  "data": \[

    {

      "id": 1,

      "user\_id": 1,

      "item\_name": "Tomatoes",

      "quantity": 2.5,

      "unit": "kg",

      "category": "vegetables",

      "consumption\_date": "2025-11-20",

      "notes": "Used in salad",

      "created\_at": "2025-11-21T00:00:00.000Z",

      "updated\_at": "2025-11-21T00:00:00.000Z"

    }

  \],

  "pagination": {

    "total": 25,

    "per\_page": 10,

    "current\_page": 1,

    "last\_page": 3,

    "from": 1,

    "to": 10

  }

}

---

### Create Consumption Log

Record a new consumption entry.

**Endpoint**: `POST /api/v1/consumption-logs`  
**Authentication**: Required

**Request Body**:

{

  "item\_name": "Tomatoes",

  "quantity": 2.5,

  "unit": "kg",

  "category": "vegetables",

  "consumption\_date": "2025-11-20",

  "notes": "Used in salad"

}

**Validation Rules**:

- `item_name`: required, string, max 255 characters  
- `quantity`: required, numeric, minimum 0  
- `unit`: required, string, max 50 characters  
- `category`: required, string, max 100 characters  
- `consumption_date`: required, valid date  
- `notes`: optional, string

**Success Response** (201):

{

  "success": true,

  "message": "Consumption log created successfully",

  "data": {

    "id": 1,

    "user\_id": 1,

    "item\_name": "Tomatoes",

    "quantity": 2.5,

    "unit": "kg",

    "category": "vegetables",

    "consumption\_date": "2025-11-20",

    "notes": "Used in salad",

    "created\_at": "2025-11-21T00:00:00.000Z",

    "updated\_at": "2025-11-21T00:00:00.000Z"

  }

}

---

### Get Single Consumption Log

Retrieve details of a specific consumption log.

**Endpoint**: `GET /api/v1/consumption-logs/{id}`  
**Authentication**: Required

**Success Response** (200):

{

  "success": true,

  "message": "Consumption log retrieved successfully",

  "data": {

    "id": 1,

    "user\_id": 1,

    "item\_name": "Tomatoes",

    "quantity": 2.5,

    "unit": "kg",

    "category": "vegetables",

    "consumption\_date": "2025-11-20",

    "notes": "Used in salad",

    "created\_at": "2025-11-21T00:00:00.000Z",

    "updated\_at": "2025-11-21T00:00:00.000Z"

  }

}

**Error Response** (404):

{

  "message": "No query results for model \[App\\\\Models\\\\ConsumptionLog\] {id}"

}

---

### Delete Consumption Log

Remove a consumption log entry.

**Endpoint**: `DELETE /api/v1/consumption-logs/{id}`  
**Authentication**: Required

**Success Response** (200):

{

  "success": true,

  "message": "Consumption log deleted successfully",

  "data": null

}

---

## Inventory Management

### List Inventory Items

Get a paginated list of inventory items with optional filters.

**Endpoint**: `GET /api/v1/inventory`  
**Authentication**: Required

**Query Parameters**:

- `category` (optional): Filter by category  
- `expiring_soon` (optional): Boolean, filter items expiring soon  
- `days_threshold` (optional): Days threshold for expiring soon (default: 7\)  
- `per_page` (optional): Items per page (default: 15\)

**Example Request**:

GET /api/v1/inventory?expiring\_soon=true\&days\_threshold=5

**Success Response** (200):

{

  "success": true,

  "message": "Inventory retrieved successfully",

  "data": \[

    {

      "id": 1,

      "user\_id": 1,

      "food\_item\_id": 5,

      "item\_name": "Milk",

      "quantity": 2,

      "unit": "liters",

      "category": "dairy",

      "purchase\_date": "2025-11-15",

      "expiration\_date": "2025-11-25",

      "is\_expiring": true,

      "is\_expired": false,

      "days\_until\_expiration": 4,

      "created\_at": "2025-11-21T00:00:00.000Z",

      "updated\_at": "2025-11-21T00:00:00.000Z"

    }

  \],

  "pagination": {

    "total": 15,

    "per\_page": 15,

    "current\_page": 1,

    "last\_page": 1,

    "from": 1,

    "to": 15

  }

}

---

### Create Inventory Item

Add a new item to inventory.

**Endpoint**: `POST /api/v1/inventory`  
**Authentication**: Required

**Request Body**:

{

  "food\_item\_id": 5,

  "item\_name": "Milk",

  "quantity": 2,

  "unit": "liters",

  "category": "dairy",

  "purchase\_date": "2025-11-15",

  "expiration\_date": "2025-11-25"

}

**Validation Rules**:

- `food_item_id`: optional, must exist in food\_items table  
- `item_name`: required, string, max 255 characters  
- `quantity`: required, numeric, minimum 0  
- `unit`: required, string, max 50 characters  
- `category`: required, string, max 100 characters  
- `purchase_date`: required, valid date  
- `expiration_date`: optional, valid date, must be after purchase\_date

**Success Response** (201):

{

  "success": true,

  "message": "Inventory item created successfully",

  "data": {

    "id": 1,

    "user\_id": 1,

    "food\_item\_id": 5,

    "item\_name": "Milk",

    "quantity": 2,

    "unit": "liters",

    "category": "dairy",

    "purchase\_date": "2025-11-15",

    "expiration\_date": "2025-11-25",

    "is\_expiring": true,

    "is\_expired": false,

    "days\_until\_expiration": 4,

    "created\_at": "2025-11-21T00:00:00.000Z",

    "updated\_at": "2025-11-21T00:00:00.000Z"

  }

}

---

### Get Single Inventory Item

Retrieve details of a specific inventory item.

**Endpoint**: `GET /api/v1/inventory/{id}`  
**Authentication**: Required

**Success Response** (200):

{

  "success": true,

  "message": "Inventory item retrieved successfully",

  "data": {

    "id": 1,

    "user\_id": 1,

    "food\_item\_id": 5,

    "food\_item": {

      "id": 5,

      "name": "Milk",

      "category": "dairy",

      "typical\_expiration\_days": 10,

      "cost\_per\_unit": 2.5,

      "unit": "liters",

      "created\_at": "2025-11-01T00:00:00.000Z",

      "updated\_at": "2025-11-01T00:00:00.000Z"

    },

    "item\_name": "Milk",

    "quantity": 2,

    "unit": "liters",

    "category": "dairy",

    "purchase\_date": "2025-11-15",

    "expiration\_date": "2025-11-25",

    "is\_expiring": true,

    "is\_expired": false,

    "days\_until\_expiration": 4,

    "created\_at": "2025-11-21T00:00:00.000Z",

    "updated\_at": "2025-11-21T00:00:00.000Z"

  }

}

---

### Update Inventory Item

Modify an existing inventory item.

**Endpoint**: `PUT /api/v1/inventory/{id}`  
**Authentication**: Required

**Request Body**:

{

  "quantity": 1.5,

  "expiration\_date": "2025-11-26"

}

**Validation Rules**:

- `food_item_id`: optional, must exist in food\_items table  
- `item_name`: optional, string, max 255 characters  
- `quantity`: optional, numeric, minimum 0  
- `unit`: optional, string, max 50 characters  
- `category`: optional, string, max 100 characters  
- `purchase_date`: optional, valid date  
- `expiration_date`: optional, valid date

**Success Response** (200):

{

  "success": true,

  "message": "Inventory item updated successfully",

  "data": {

    "id": 1,

    "user\_id": 1,

    "food\_item\_id": 5,

    "item\_name": "Milk",

    "quantity": 1.5,

    "unit": "liters",

    "category": "dairy",

    "purchase\_date": "2025-11-15",

    "expiration\_date": "2025-11-26",

    "is\_expiring": true,

    "is\_expired": false,

    "days\_until\_expiration": 5,

    "created\_at": "2025-11-21T00:00:00.000Z",

    "updated\_at": "2025-11-21T01:00:00.000Z"

  }

}

---

### Delete Inventory Item

Remove an inventory item.

**Endpoint**: `DELETE /api/v1/inventory/{id}`  
**Authentication**: Required

**Success Response** (200):

{

  "success": true,

  "message": "Inventory item deleted successfully",

  "data": null

}

---

## Food Items

### List Food Items

Get all food items with optional filters. This endpoint is public and cached.

**Endpoint**: `GET /api/v1/food-items`  
**Authentication**: Not required

**Query Parameters**:

- `category` (optional): Filter by category  
- `search` (optional): Search by name

**Example Request**:

GET /api/v1/food-items?category=dairy\&search=milk

**Success Response** (200):

{

  "success": true,

  "message": "Food items retrieved successfully",

  "data": \[

    {

      "id": 5,

      "name": "Milk",

      "category": "dairy",

      "typical\_expiration\_days": 10,

      "cost\_per\_unit": 2.5,

      "unit": "liters",

      "created\_at": "2025-11-01T00:00:00.000Z",

      "updated\_at": "2025-11-01T00:00:00.000Z"

    }

  \]

}

---

### Get Single Food Item

Retrieve details of a specific food item.

**Endpoint**: `GET /api/v1/food-items/{id}`  
**Authentication**: Not required

**Success Response** (200):

{

  "success": true,

  "message": "Food item retrieved successfully",

  "data": {

    "id": 5,

    "name": "Milk",

    "category": "dairy",

    "typical\_expiration\_days": 10,

    "cost\_per\_unit": 2.5,

    "unit": "liters",

    "created\_at": "2025-11-01T00:00:00.000Z",

    "updated\_at": "2025-11-01T00:00:00.000Z"

  }

}

---

## Resources

### List Resources

Get educational resources with pagination and filtering.

**Endpoint**: `GET /api/v1/resources`  
**Authentication**: Not required

**Query Parameters**:

- `category` (optional): Filter by category  
- `type` (optional): Filter by type  
- `tags` (optional): Comma-separated tags  
- `per_page` (optional): Items per page (default: 9\)

**Example Request**:

GET /api/v1/resources?category=food-waste\&type=article\&per\_page=10

**Success Response** (200):

{

  "success": true,

  "message": "Resources retrieved successfully",

  "data": \[

    {

      "id": 1,

      "title": "How to Reduce Food Waste",

      "description": "Practical tips for minimizing food waste at home",

      "url": "https://example.com/food-waste-tips",

      "category": "food-waste",

      "type": "article",

      "tags": \["tips", "sustainability"\],

      "created\_at": "2025-11-01T00:00:00.000Z",

      "updated\_at": "2025-11-01T00:00:00.000Z"

    }

  \],

  "pagination": {

    "current\_page": 1,

    "last\_page": 5,

    "per\_page": 10,

    "total": 50,

    "from": 1,

    "to": 10

  }

}

---

### Get Single Resource

Retrieve details of a specific resource.

**Endpoint**: `GET /api/v1/resources/{id}`  
**Authentication**: Not required

**Success Response** (200):

{

  "success": true,

  "message": "Resource retrieved successfully",

  "data": {

    "id": 1,

    "title": "How to Reduce Food Waste",

    "description": "Practical tips for minimizing food waste at home",

    "url": "https://example.com/food-waste-tips",

    "category": "food-waste",

    "type": "article",

    "tags": \["tips", "sustainability"\],

    "created\_at": "2025-11-01T00:00:00.000Z",

    "updated\_at": "2025-11-01T00:00:00.000Z"

  }

}

---

## Dashboard

### Get Dashboard Summary

Get a comprehensive dashboard summary for the authenticated user.

**Endpoint**: `GET /api/v1/dashboard/summary`  
**Authentication**: Required

**Success Response** (200):

{

  "success": true,

  "message": "Dashboard summary retrieved successfully",

  "data": {

    "total\_inventory\_items": 25,

    "items\_expiring\_soon": 5,

    "recent\_logs\_count": 12,

    "recent\_logs": \[

      {

        "id": 10,

        "user\_id": 1,

        "item\_name": "Tomatoes",

        "quantity": 2.5,

        "unit": "kg",

        "category": "vegetables",

        "consumption\_date": "2025-11-20",

        "notes": "Used in salad",

        "created\_at": "2025-11-21T00:00:00.000Z",

        "updated\_at": "2025-11-21T00:00:00.000Z"

      }

    \],

    "expiring\_inventory": \[

      {

        "id": 1,

        "user\_id": 1,

        "food\_item\_id": 5,

        "item\_name": "Milk",

        "quantity": 2,

        "unit": "liters",

        "category": "dairy",

        "purchase\_date": "2025-11-15",

        "expiration\_date": "2025-11-25",

        "is\_expiring": true,

        "is\_expired": false,

        "days\_until\_expiration": 4,

        "created\_at": "2025-11-21T00:00:00.000Z",

        "updated\_at": "2025-11-21T00:00:00.000Z"

      }

    \],

    "recommended\_resources": \[

      {

        "id": 5,

        "title": "Meal Planning Tips",

        "description": "Efficient meal planning strategies",

        "url": "https://example.com/meal-planning",

        "category": "meal-planning",

        "type": "video",

        "tags": \["planning", "efficiency"\],

        "created\_at": "2025-11-01T00:00:00.000Z",

        "updated\_at": "2025-11-01T00:00:00.000Z"

      }

    \]

  }

}

---

### Get Recommendations

Get personalized recommendations based on user preferences.

**Endpoint**: `GET /api/v1/dashboard/recommendations`  
**Authentication**: Required

**Success Response** (200):

{

  "success": true,

  "message": "Recommendations generated successfully",

  "data": {

    "resources": \[

      {

        "id": 3,

        "title": "Vegetarian Recipe Ideas",

        "description": "Creative vegetarian meals for the whole family",

        "url": "https://example.com/vegetarian-recipes",

        "category": "recipes",

        "type": "article",

        "tags": \["vegetarian", "recipes"\],

        "created\_at": "2025-11-01T00:00:00.000Z",

        "updated\_at": "2025-11-01T00:00:00.000Z"

      }

    \]

  }

}

---

## Image Uploads

### Upload Image

Upload an image (receipt, food label, or other).

**Endpoint**: `POST /api/v1/images/upload`  
**Authentication**: Required

**Headers**:

Authorization: Bearer {token}

Content-Type: multipart/form-data

**Request Body** (FormData):

image: \[file\]

upload\_type: receipt

related\_inventory\_id: 5  (optional)

related\_log\_id: 3  (optional)

**Validation Rules**:

- `image`: required, image file (jpeg, png, jpg, gif), max 5MB  
- `upload_type`: required, one of: `receipt`, `food_label`, `other`  
- `related_inventory_id`: optional, must exist in inventories table  
- `related_log_id`: optional, must exist in consumption\_logs table

**Success Response** (201):

{

  "success": true,

  "message": "Image uploaded successfully",

  "data": {

    "id": 1,

    "user\_id": 1,

    "file\_path": "/storage/uploads/images/550e8400-e29b-41d4-a716-446655440000.jpg",

    "file\_name": "receipt.jpg",

    "file\_type": "image/jpeg",

    "file\_size": 245678,

    "upload\_type": "receipt",

    "related\_inventory\_id": 5,

    "related\_log\_id": null,

    "created\_at": "2025-11-21T00:00:00.000Z",

    "updated\_at": "2025-11-21T00:00:00.000Z"

  }

}

---

### List Uploaded Images

Get user's uploaded images with pagination.

**Endpoint**: `GET /api/v1/images/`  
**Authentication**: Required

**Query Parameters**:

- `per_page` (optional): Items per page (default: 15\)

**Success Response** (200):

{

  "success": true,

  "message": "Images retrieved successfully",

  "data": \[

    {

      "id": 1,

      "user\_id": 1,

      "file\_path": "/storage/uploads/images/550e8400-e29b-41d4-a716-446655440000.jpg",

      "file\_name": "receipt.jpg",

      "file\_type": "image/jpeg",

      "file\_size": 245678,

      "upload\_type": "receipt",

      "related\_inventory\_id": 5,

      "related\_log\_id": null,

      "created\_at": "2025-11-21T00:00:00.000Z",

      "updated\_at": "2025-11-21T00:00:00.000Z"

    }

  \],

  "pagination": {

    "total": 8,

    "per\_page": 15,

    "current\_page": 1,

    "last\_page": 1,

    "from": 1,

    "to": 8

  }

}

---

## Response Format

All API responses follow a consistent structure:

### Success Response

{

  "success": true,

  "message": "Success message here",

  "data": { /\* response data \*/ }

}

### Error Response

{

  "success": false,

  "message": "Error message here",

  "errors": { /\* validation errors or additional error details \*/ }

}

### Paginated Response

{

  "success": true,

  "message": "Success message here",

  "data": \[ /\* array of items \*/ \],

  "pagination": {

    "total": 100,

    "per\_page": 15,

    "current\_page": 1,

    "last\_page": 7,

    "from": 1,

    "to": 15

  }

}

---

## Error Codes

| HTTP Code | Description |
| :---- | :---- |
| `200` | Success \- Request completed successfully |
| `201` | Created \- Resource created successfully |
| `400` | Bad Request \- Invalid request data |
| `401` | Unauthorized \- Missing or invalid authentication token |
| `403` | Forbidden \- Authenticated but not authorized |
| `404` | Not Found \- Resource not found |
| `422` | Unprocessable Entity \- Validation failed |
| `429` | Too Many Requests \- Rate limit exceeded |
| `500` | Internal Server Error \- Server error |

### Common Error Responses

**Validation Error** (422):

{

  "success": false,

  "message": "Validation failed",

  "errors": {

    "email": \["The email field is required."\],

    "password": \["The password must be at least 8 characters."\]

  }

}

**Unauthenticated** (401):

{

  "message": "Unauthenticated."

}

**Not Found** (404):

{

  "message": "No query results for model \[App\\\\Models\\\\Inventory\] 123"

}

**Rate Limit Exceeded** (429):

{

  "message": "Too Many Attempts."

}

---

## Legacy API Endpoints

For backward compatibility, all endpoints are also available without the `/v1` prefix:

- `POST /api/register` → `POST /api/v1/auth/register`  
- `POST /api/login` → `POST /api/v1/auth/login`  
- `POST /api/logout` → `POST /api/v1/auth/logout`  
- `GET /api/profile` → `GET /api/v1/profile/`  
- `PUT /api/profile` → `PUT /api/v1/profile/`  
- `GET /api/consumption-logs` → `GET /api/v1/consumption-logs`  
- `GET /api/inventory` → `GET /api/v1/inventory`  
- `GET /api/food-items` → `GET /api/v1/food-items`  
- `GET /api/resources` → `GET /api/v1/resources`  
- `GET /api/dashboard/summary` → `GET /api/v1/dashboard/summary`  
- `GET /api/recommendations` → `GET /api/v1/dashboard/recommendations`  
- `POST /api/images/upload` → `POST /api/v1/images/upload`  
- `GET /api/images` → `GET /api/v1/images/`

**Note**: Legacy endpoints do not have rate limiting applied.

---

## Authentication Flow

1. **Register** or **Login** to receive an access token  
2. **Store the token** securely on the client side  
3. **Include the token** in the `Authorization` header for all protected endpoints:  
     
   Authorization: Bearer {your\_token\_here}  
     
4. **Logout** to revoke the token when done

### Example Authentication with cURL

\# 1\. Login

curl \-X POST http://192.168.70.232:8000/api/v1/auth/login \\

  \-H "Content-Type: application/json" \\

  \-d '{"email":"user@example.com","password":"password123"}'

\# Response: { "data": { "token": "21|abc..." } }

\# 2\. Use the token

curl \-X GET http://192.168.70.232:8000/api/v1/profile/ \\

  \-H "Authorization: Bearer 21|abc..." \\

  \-H "Accept: application/json"

---

## Rate Limiting

The **v1 API** has rate limiting enabled:

- **60 requests per minute** per user for authenticated endpoints  
- Exceeding this limit will return a `429 Too Many Requests` error

Legacy endpoints do not have rate limiting.

---

## Notes

- All dates are in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`  
- All date inputs should be in `YYYY-MM-DD` format  
- Timestamps are in UTC  
- File uploads use `multipart/form-data` content type  
- JSON requests should use `Content-Type: application/json`  
- Always include `Accept: application/json` header for consistent responses

---

**Documentation Version**: 1.0  
**Last Updated**: 2025-11-21  
