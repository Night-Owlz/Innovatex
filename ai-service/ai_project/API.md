# Night-Owlz API Documentation

> [!NOTE]
> This documentation provides comprehensive details about the Night-Owlz REST API, including all available endpoints, request/response formats, authentication mechanisms, and usage examples.

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Auth Endpoints](#auth-endpoints)
   - [User Profile Endpoints](#user-profile-endpoints)
   - [Inventory Endpoints](#inventory-endpoints)
   - [Consumption Logs Endpoints](#consumption-logs-endpoints)
   - [Food Items Endpoints](#food-items-endpoints)
   - [Resources Endpoints](#resources-endpoints)
   - [Dashboard Endpoints](#dashboard-endpoints)
   - [Image Upload Endpoints](#image-upload-endpoints)
4. [Error Handling](#error-handling)
5. [Constants & Enums](#constants--enums)
6. [Pagination](#pagination)
7. [Code Examples](#code-examples)

---

## API Overview

**Base URL:** `${NEXT_PUBLIC_API_URL}/api/v1`

**Content Type:** `application/json`

**Authentication:** Bearer Token (JWT)

### Request Headers

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
```

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header. The token is obtained through the login endpoint and stored in cookies.

### Token Management

- **Storage:** Cookies (`token`, `user`)
- **Header Format:** `Authorization: Bearer {token}`
- **Auto-logout:** Tokens are automatically cleared on 401 Unauthorized responses

---

## API Endpoints

### Auth Endpoints

#### 1. Register User

**Endpoint:** `POST /api/v1/auth/register`

**Description:** Create a new user account

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "password_confirmation": "SecurePassword123!",
  "household_size": 4,
  "budget_range": "medium",
  "dietary_preferences": ["Vegetarian", "Gluten-Free"]
}
```

**Demo Request (cURL):**

```bash
curl -X POST ${NEXT_PUBLIC_API_URL}/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "password_confirmation": "SecurePassword123!",
    "household_size": 4,
    "budget_range": "medium",
    "dietary_preferences": ["Vegetarian", "Gluten-Free"]
  }'
```

**Demo Response (Success - 201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "household_size": 4,
      "budget_range": "medium",
      "dietary_preferences": ["Vegetarian", "Gluten-Free"],
      "profile_image": null,
      "created_at": "2025-11-21T15:30:00.000000Z",
      "updated_at": "2025-11-21T15:30:00.000000Z"
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

---

#### 2. Login User

**Endpoint:** `POST /api/v1/auth/login`

**Description:** Authenticate user and receive access token

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Demo Request (cURL):**

```bash
curl -X POST ${NEXT_PUBLIC_API_URL}/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }'
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "household_size": 4,
      "budget_range": "medium",
      "dietary_preferences": ["Vegetarian", "Gluten-Free"],
      "profile_image": "https://example.com/storage/profiles/user_1.jpg",
      "created_at": "2025-11-21T15:30:00.000000Z",
      "updated_at": "2025-11-21T15:30:00.000000Z"
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

**Demo Response (Error - 401):**

```json
{
  "success": false,
  "message": "Invalid credentials",
  "errors": {
    "email": ["The provided credentials are incorrect."]
  }
}
```

---

#### 3. Logout User

**Endpoint:** `POST /api/v1/auth/logout`

**Description:** Invalidate user's access token

**Request Headers:**

```http
Authorization: Bearer {token}
```

**Demo Request (cURL):**

```bash
curl -X POST ${NEXT_PUBLIC_API_URL}/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### User Profile Endpoints

#### 1. Get User Profile

**Endpoint:** `GET /api/v1/profile`

**Description:** Retrieve authenticated user's profile information

**Request Headers:**

```http
Authorization: Bearer {token}
```

**Demo Request (cURL):**

```bash
curl -X GET ${NEXT_PUBLIC_API_URL}/api/v1/profile \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "household_size": 4,
    "budget_range": "medium",
    "dietary_preferences": ["Vegetarian", "Gluten-Free"],
    "profile_image": "https://example.com/storage/profiles/user_1.jpg",
    "created_at": "2025-11-21T15:30:00.000000Z",
    "updated_at": "2025-11-21T15:30:00.000000Z"
  }
}
```

---

#### 2. Update User Profile (JSON)

**Endpoint:** `PUT /api/v1/profile`

**Description:** Update user profile information

**Request Headers:**

```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "John Smith",
  "household_size": 5,
  "budget_range": "high",
  "dietary_preferences": ["Vegetarian", "Gluten-Free", "Dairy-Free"]
}
```

**Demo Request (cURL):**

```bash
curl -X PUT ${NEXT_PUBLIC_API_URL}/api/v1/profile \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -d '{
    "name": "John Smith",
    "household_size": 5,
    "budget_range": "high",
    "dietary_preferences": ["Vegetarian", "Gluten-Free", "Dairy-Free"]
  }'
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "name": "John Smith",
    "email": "john.doe@example.com",
    "household_size": 5,
    "budget_range": "high",
    "dietary_preferences": ["Vegetarian", "Gluten-Free", "Dairy-Free"],
    "profile_image": "https://example.com/storage/profiles/user_1.jpg",
    "created_at": "2025-11-21T15:30:00.000000Z",
    "updated_at": "2025-11-21T16:45:00.000000Z"
  }
}
```

---

#### 3. Update User Profile with Image

**Endpoint:** `POST /api/v1/profile`

**Description:** Update user profile with profile image

**Request Headers:**

```http
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (FormData):**

```
name: John Smith
household_size: 5
budget_range: high
dietary_preferences[]: Vegetarian
dietary_preferences[]: Gluten-Free
profile_image: (binary file data)
```

**Demo Request (cURL):**

```bash
curl -X POST ${NEXT_PUBLIC_API_URL}/api/v1/profile \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -F "name=John Smith" \
  -F "household_size=5" \
  -F "budget_range=high" \
  -F "dietary_preferences[]=Vegetarian" \
  -F "dietary_preferences[]=Gluten-Free" \
  -F "profile_image=@/path/to/profile.jpg"
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "name": "John Smith",
    "email": "john.doe@example.com",
    "household_size": 5,
    "budget_range": "high",
    "dietary_preferences": ["Vegetarian", "Gluten-Free"],
    "profile_image": "https://example.com/storage/profiles/user_1_updated.jpg",
    "created_at": "2025-11-21T15:30:00.000000Z",
    "updated_at": "2025-11-21T16:50:00.000000Z"
  }
}
```

---

### Inventory Endpoints

#### 1. Get Inventory List

**Endpoint:** `GET /api/v1/inventory`

**Description:** Retrieve paginated list of inventory items

**Request Headers:**

```http
Authorization: Bearer {token}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| per_page | integer | No | Items per page (default: 10) |
| search | string | No | Search by item name |
| category | string | No | Filter by category |
| sort_by | string | No | Sort field (name, quantity, expiry_date) |
| sort_order | string | No | Sort direction (asc, desc) |

**Demo Request (cURL):**

```bash
curl -X GET "${NEXT_PUBLIC_API_URL}/api/v1/inventory?page=1&per_page=10&category=fruit&sort_by=expiry_date&sort_order=asc" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "food_item_id": 15,
      "food_item": {
        "id": 15,
        "name": "Apple",
        "category": "fruit",
        "default_unit": "kg"
      },
      "quantity": 2.5,
      "unit": "kg",
      "purchase_date": "2025-11-20",
      "expiry_date": "2025-11-30",
      "storage_location": "Refrigerator",
      "notes": "Organic apples from local market",
      "created_at": "2025-11-20T10:00:00.000000Z",
      "updated_at": "2025-11-20T10:00:00.000000Z"
    },
    {
      "id": 2,
      "user_id": 1,
      "food_item_id": 18,
      "food_item": {
        "id": 18,
        "name": "Banana",
        "category": "fruit",
        "default_unit": "pieces"
      },
      "quantity": 12,
      "unit": "pieces",
      "purchase_date": "2025-11-19",
      "expiry_date": "2025-11-26",
      "storage_location": "Counter",
      "notes": null,
      "created_at": "2025-11-19T14:30:00.000000Z",
      "updated_at": "2025-11-19T14:30:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 10,
    "to": 10,
    "total": 47
  }
}
```

---

#### 2. Create Inventory Item

**Endpoint:** `POST /api/v1/inventory`

**Description:** Add new item to inventory

**Request Headers:**

```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "food_item_id": 15,
  "quantity": 2.5,
  "unit": "kg",
  "purchase_date": "2025-11-20",
  "expiry_date": "2025-11-30",
  "storage_location": "Refrigerator",
  "notes": "Organic apples from local market"
}
```

**Demo Request (cURL):**

```bash
curl -X POST ${NEXT_PUBLIC_API_URL}/api/v1/inventory \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -d '{
    "food_item_id": 15,
    "quantity": 2.5,
    "unit": "kg",
    "purchase_date": "2025-11-20",
    "expiry_date": "2025-11-30",
    "storage_location": "Refrigerator",
    "notes": "Organic apples from local market"
  }'
```

**Demo Response (Success - 201):**

```json
{
  "success": true,
  "message": "Inventory item created successfully",
  "data": {
    "id": 48,
    "user_id": 1,
    "food_item_id": 15,
    "food_item": {
      "id": 15,
      "name": "Apple",
      "category": "fruit",
      "default_unit": "kg"
    },
    "quantity": 2.5,
    "unit": "kg",
    "purchase_date": "2025-11-20",
    "expiry_date": "2025-11-30",
    "storage_location": "Refrigerator",
    "notes": "Organic apples from local market",
    "created_at": "2025-11-21T15:45:00.000000Z",
    "updated_at": "2025-11-21T15:45:00.000000Z"
  }
}
```

---

#### 3. Update Inventory Item

**Endpoint:** `PUT /api/v1/inventory/{id}`

**Description:** Update existing inventory item

**Request Headers:**

```http
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Inventory item ID |

**Request Body:**

```json
{
  "quantity": 1.5,
  "expiry_date": "2025-12-05",
  "notes": "Reduced quantity after consumption"
}
```

**Demo Request (cURL):**

```bash
curl -X PUT ${NEXT_PUBLIC_API_URL}/api/v1/inventory/48 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -d '{
    "quantity": 1.5,
    "expiry_date": "2025-12-05",
    "notes": "Reduced quantity after consumption"
  }'
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "message": "Inventory item updated successfully",
  "data": {
    "id": 48,
    "user_id": 1,
    "food_item_id": 15,
    "food_item": {
      "id": 15,
      "name": "Apple",
      "category": "fruit",
      "default_unit": "kg"
    },
    "quantity": 1.5,
    "unit": "kg",
    "purchase_date": "2025-11-20",
    "expiry_date": "2025-12-05",
    "storage_location": "Refrigerator",
    "notes": "Reduced quantity after consumption",
    "created_at": "2025-11-21T15:45:00.000000Z",
    "updated_at": "2025-11-21T16:00:00.000000Z"
  }
}
```

---

#### 4. Delete Inventory Item

**Endpoint:** `DELETE /api/v1/inventory/{id}`

**Description:** Remove item from inventory

**Request Headers:**

```http
Authorization: Bearer {token}
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Inventory item ID |

**Demo Request (cURL):**

```bash
curl -X DELETE ${NEXT_PUBLIC_API_URL}/api/v1/inventory/48 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "message": "Inventory item deleted successfully"
}
```

---

#### 5. Get Expiring Inventory

**Endpoint:** `GET /api/v1/inventory/expiring`

**Description:** Get items expiring within specified days

**Request Headers:**

```http
Authorization: Bearer {token}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | integer | No | Days threshold (default: 3) |

**Demo Request (cURL):**

```bash
curl -X GET "${NEXT_PUBLIC_API_URL}/api/v1/inventory/expiring?days=7" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "user_id": 1,
      "food_item_id": 18,
      "food_item": {
        "id": 18,
        "name": "Banana",
        "category": "fruit",
        "default_unit": "pieces"
      },
      "quantity": 12,
      "unit": "pieces",
      "purchase_date": "2025-11-19",
      "expiry_date": "2025-11-26",
      "days_until_expiry": 5,
      "storage_location": "Counter",
      "notes": null,
      "created_at": "2025-11-19T14:30:00.000000Z",
      "updated_at": "2025-11-19T14:30:00.000000Z"
    }
  ],
  "meta": {
    "days_threshold": 7,
    "total_expiring": 1
  }
}
```

---

#### 6. Get Expiring Inventory Count

**Endpoint:** `GET /api/v1/inventory/expiring/count`

**Description:** Get count of items expiring within specified days

**Request Headers:**

```http
Authorization: Bearer {token}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | integer | No | Days threshold (default: 3) |

**Demo Request (cURL):**

```bash
curl -X GET "${NEXT_PUBLIC_API_URL}/api/v1/inventory/expiring/count?days=3" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "count": 5,
    "days_threshold": 3
  }
}
```

---

#### 7. Get Total Inventory Count

**Endpoint:** `GET /api/v1/inventory/count`

**Description:** Get total count of inventory items

**Request Headers:**

```http
Authorization: Bearer {token}
```

**Demo Request (cURL):**

```bash
curl -X GET ${NEXT_PUBLIC_API_URL}/api/v1/inventory/count \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "total_count": 47
  }
}
```

---

### Consumption Logs Endpoints

#### 1. Get Consumption Logs

**Endpoint:** `GET /api/v1/consumption-logs`

**Description:** Retrieve paginated list of consumption logs

**Request Headers:**

```http
Authorization: Bearer {token}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| per_page | integer | No | Items per page (default: 10) |
| start_date | date | No | Filter from date (YYYY-MM-DD) |
| end_date | date | No | Filter to date (YYYY-MM-DD) |
| food_item_id | integer | No | Filter by food item |

**Demo Request (cURL):**

```bash
curl -X GET "${NEXT_PUBLIC_API_URL}/api/v1/consumption-logs?page=1&per_page=10&start_date=2025-11-01&end_date=2025-11-30" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "food_item_id": 15,
      "food_item": {
        "id": 15,
        "name": "Apple",
        "category": "fruit",
        "default_unit": "kg"
      },
      "quantity": 0.5,
      "unit": "kg",
      "consumed_at": "2025-11-21T12:30:00.000000Z",
      "notes": "Breakfast fruit salad",
      "created_at": "2025-11-21T12:35:00.000000Z",
      "updated_at": "2025-11-21T12:35:00.000000Z"
    },
    {
      "id": 2,
      "user_id": 1,
      "food_item_id": 22,
      "food_item": {
        "id": 22,
        "name": "Milk",
        "category": "dairy",
        "default_unit": "liters"
      },
      "quantity": 0.25,
      "unit": "liters",
      "consumed_at": "2025-11-21T08:00:00.000000Z",
      "notes": "Morning coffee",
      "created_at": "2025-11-21T08:15:00.000000Z",
      "updated_at": "2025-11-21T08:15:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "per_page": 10,
    "to": 10,
    "total": 28
  }
}
```

---

#### 2. Create Consumption Log

**Endpoint:** `POST /api/v1/consumption-logs`

**Description:** Log food consumption

**Request Headers:**

```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "food_item_id": 15,
  "quantity": 0.5,
  "unit": "kg",
  "consumed_at": "2025-11-21T12:30:00Z",
  "notes": "Breakfast fruit salad"
}
```

**Demo Request (cURL):**

```bash
curl -X POST ${NEXT_PUBLIC_API_URL}/api/v1/consumption-logs \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -d '{
    "food_item_id": 15,
    "quantity": 0.5,
    "unit": "kg",
    "consumed_at": "2025-11-21T12:30:00Z",
    "notes": "Breakfast fruit salad"
  }'
```

**Demo Response (Success - 201):**

```json
{
  "success": true,
  "message": "Consumption log created successfully",
  "data": {
    "id": 29,
    "user_id": 1,
    "food_item_id": 15,
    "food_item": {
      "id": 15,
      "name": "Apple",
      "category": "fruit",
      "default_unit": "kg"
    },
    "quantity": 0.5,
    "unit": "kg",
    "consumed_at": "2025-11-21T12:30:00.000000Z",
    "notes": "Breakfast fruit salad",
    "created_at": "2025-11-21T15:50:00.000000Z",
    "updated_at": "2025-11-21T15:50:00.000000Z"
  }
}
```

---

#### 3. Delete Consumption Log

**Endpoint:** `DELETE /api/v1/consumption-logs/{id}`

**Description:** Remove consumption log entry

**Request Headers:**

```http
Authorization: Bearer {token}
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Consumption log ID |

**Demo Request (cURL):**

```bash
curl -X DELETE ${NEXT_PUBLIC_API_URL}/api/v1/consumption-logs/29 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "message": "Consumption log deleted successfully"
}
```

---

### Food Items Endpoints

#### 1. Get Food Items

**Endpoint:** `GET /api/v1/food-items`

**Description:** Retrieve list of available food items

**Request Headers:**

```http
Authorization: Bearer {token}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | No | Search by food name |
| category | string | No | Filter by category |

**Demo Request (cURL):**

```bash
curl -X GET "${NEXT_PUBLIC_API_URL}/api/v1/food-items?search=apple&category=fruit" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "name": "Apple",
      "category": "fruit",
      "default_unit": "kg",
      "typical_shelf_life_days": 14,
      "storage_tips": "Store in refrigerator crisper drawer",
      "created_at": "2025-11-01T00:00:00.000000Z",
      "updated_at": "2025-11-01T00:00:00.000000Z"
    },
    {
      "id": 16,
      "name": "Pineapple",
      "category": "fruit",
      "default_unit": "pieces",
      "typical_shelf_life_days": 5,
      "storage_tips": "Store at room temperature until ripe, then refrigerate",
      "created_at": "2025-11-01T00:00:00.000000Z",
      "updated_at": "2025-11-01T00:00:00.000000Z"
    }
  ]
}
```

---

### Resources Endpoints

#### 1. Get Resources

**Endpoint:** `GET /api/v1/resources`

**Description:** Retrieve educational resources

**Request Headers:**

```http
Authorization: Bearer {token}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter by resource category |
| type | string | No | Filter by resource type |

**Demo Request (cURL):**

```bash
curl -X GET "${NEXT_PUBLIC_API_URL}/api/v1/resources?category=waste_reduction&type=article" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "10 Simple Tips to Reduce Food Waste at Home",
      "description": "Practical strategies for minimizing food waste in your household",
      "category": "waste_reduction",
      "type": "article",
      "url": "https://example.com/resources/reduce-food-waste",
      "image_url": "https://example.com/images/waste-reduction.jpg",
      "created_at": "2025-11-01T00:00:00.000000Z",
      "updated_at": "2025-11-01T00:00:00.000000Z"
    },
    {
      "id": 2,
      "title": "How to Store Vegetables Properly",
      "description": "Complete guide to extending the shelf life of your vegetables",
      "category": "storage_tips",
      "type": "article",
      "url": "https://example.com/resources/store-vegetables",
      "image_url": "https://example.com/images/storage-tips.jpg",
      "created_at": "2025-11-01T00:00:00.000000Z",
      "updated_at": "2025-11-01T00:00:00.000000Z"
    }
  ]
}
```

---

### Dashboard Endpoints

#### 1. Get Dashboard Summary

**Endpoint:** `GET /api/v1/dashboard/summary`

**Description:** Retrieve comprehensive dashboard statistics

**Request Headers:**

```http
Authorization: Bearer {token}
```

**Demo Request (cURL):**

```bash
curl -X GET ${NEXT_PUBLIC_API_URL}/api/v1/dashboard/summary \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "total_inventory_items": 47,
    "expiring_soon_count": 5,
    "expiring_soon_items": [
      {
        "id": 2,
        "food_item": {
          "name": "Banana",
          "category": "fruit"
        },
        "quantity": 12,
        "unit": "pieces",
        "expiry_date": "2025-11-26",
        "days_until_expiry": 5
      }
    ],
    "total_consumption_logs": 128,
    "consumption_this_week": 23,
    "consumption_this_month": 94,
    "top_consumed_items": [
      {
        "food_item_id": 22,
        "food_item_name": "Milk",
        "category": "dairy",
        "total_quantity": 15.5,
        "unit": "liters"
      },
      {
        "food_item_id": 15,
        "food_item_name": "Apple",
        "category": "fruit",
        "total_quantity": 8.0,
        "unit": "kg"
      }
    ],
    "waste_prevention_score": 87,
    "money_saved_estimate": 245.50,
    "category_distribution": {
      "fruit": 12,
      "vegetable": 18,
      "dairy": 7,
      "grain": 5,
      "protein": 3,
      "beverage": 2
    }
  }
}
```

---

#### 2. Get Recommendations

**Endpoint:** `GET /api/v1/dashboard/recommendations`

**Description:** Get AI-powered recommendations for food management

**Request Headers:**

```http
Authorization: Bearer {token}
```

**Demo Request (cURL):**

```bash
curl -X GET ${NEXT_PUBLIC_API_URL}/api/v1/dashboard/recommendations \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "urgent_actions": [
      {
        "type": "expiring_soon",
        "priority": "high",
        "title": "Use Bananas Soon",
        "message": "You have 12 bananas expiring in 5 days",
        "suggested_action": "Make banana bread or smoothies",
        "item_id": 2
      }
    ],
    "meal_suggestions": [
      {
        "meal_name": "Fruit Salad",
        "ingredients_available": ["Apple", "Banana", "Orange"],
        "dietary_match": true,
        "difficulty": "easy"
      }
    ],
    "shopping_suggestions": [
      {
        "item": "Eggs",
        "reason": "Running low on protein items",
        "last_purchase": "2025-11-10"
      }
    ],
    "waste_reduction_tips": [
      {
        "tip": "Store bananas separately from other fruits",
        "category": "storage_tips",
        "impact": "medium"
      }
    ]
  }
}
```

---

### Image Upload Endpoints

#### 1. Upload Image

**Endpoint:** `POST /api/v1/images/upload`

**Description:** Upload an image (for OCR processing or profile pictures)

**Request Headers:**

```http
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (FormData):**

```
image: (binary file data)
type: receipt | product | profile
```

**Demo Request (cURL):**

```bash
curl -X POST ${NEXT_PUBLIC_API_URL}/api/v1/images/upload \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -F "image=@/path/to/receipt.jpg" \
  -F "type=receipt"
```

**Demo Response (Success - 201):**

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "filename": "receipt_20251121_155530.jpg",
    "url": "https://example.com/storage/uploads/receipt_20251121_155530.jpg",
    "type": "receipt",
    "processed": false,
    "ocr_data": null,
    "created_at": "2025-11-21T15:55:30.000000Z",
    "updated_at": "2025-11-21T15:55:30.000000Z"
  }
}
```

---

#### 2. Get Uploaded Images

**Endpoint:** `GET /api/v1/images`

**Description:** Retrieve list of uploaded images

**Request Headers:**

```http
Authorization: Bearer {token}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by image type |
| processed | boolean | No | Filter by processing status |

**Demo Request (cURL):**

```bash
curl -X GET "${NEXT_PUBLIC_API_URL}/api/v1/images?type=receipt&processed=true" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Demo Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "filename": "receipt_20251121_155530.jpg",
      "url": "https://example.com/storage/uploads/receipt_20251121_155530.jpg",
      "type": "receipt",
      "processed": true,
      "ocr_data": {
        "items": [
          {
            "name": "Apples",
            "quantity": "2.5 kg",
            "price": 7.50
          },
          {
            "name": "Milk",
            "quantity": "2 liters",
            "price": 5.00
          }
        ],
        "total": 12.50,
        "date": "2025-11-21"
      },
      "created_at": "2025-11-21T15:55:30.000000Z",
      "updated_at": "2025-11-21T15:56:15.000000Z"
    }
  ]
}
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation errors |
| 500 | Internal Server Error - Server error |

### Common Error Examples

#### Validation Error (422)

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

#### Authentication Error (401)

```json
{
  "success": false,
  "message": "Unauthenticated.",
  "errors": {
    "token": ["Token is invalid or expired"]
  }
}
```

#### Not Found Error (404)

```json
{
  "success": false,
  "message": "Resource not found",
  "errors": {
    "id": ["The requested inventory item does not exist."]
  }
}
```

#### Server Error (500)

```json
{
  "success": false,
  "message": "Cannot connect to server. Please make sure the backend server is running on http://localhost:8000"
}
```

---

## Constants & Enums

### Food Categories

```javascript
const FOOD_CATEGORIES = [
  'fruit',
  'vegetable',
  'dairy',
  'grain',
  'protein',
  'beverage',
  'other'
];
```

### Units

```javascript
const UNITS = [
  'kg',
  'g',
  'liters',
  'ml',
  'pieces',
  'dozen'
];
```

### Budget Ranges

```javascript
const BUDGET_RANGES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];
```

### Dietary Preferences

```javascript
const DIETARY_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Halal',
  'Kosher'
];
```

### Resource Categories

```javascript
const RESOURCE_CATEGORIES = {
  waste_reduction: 'Waste Reduction',
  budget_tips: 'Budget Tips',
  meal_planning: 'Meal Planning',
  storage_tips: 'Storage Tips',
  nutrition: 'Nutrition',
  other: 'Other'
};
```

### Resource Types

```javascript
const RESOURCE_TYPES = {
  article: 'Article',
  video: 'Video',
  guide: 'Guide',
  tool: 'Tool'
};
```

---

## Pagination

All list endpoints support pagination with the following meta structure:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 10,
    "to": 10,
    "total": 47
  }
}
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10, max: 100)

---

## Code Examples

### JavaScript/Axios Example

```javascript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const token = 'your_jwt_token_here';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

// Example: Get inventory
async function getInventory() {
  try {
    const response = await apiClient.get('/inventory', {
      params: {
        page: 1,
        per_page: 10,
        category: 'fruit'
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Example: Create inventory item
async function createInventoryItem() {
  try {
    const response = await apiClient.post('/inventory', {
      food_item_id: 15,
      quantity: 2.5,
      unit: 'kg',
      purchase_date: '2025-11-20',
      expiry_date: '2025-11-30',
      storage_location: 'Refrigerator'
    });
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Example: Upload image
async function uploadImage(file) {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'receipt');

    const response = await apiClient.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

### Using the API Client (from lib/api.js)

```javascript
import { api } from '@/lib/api';

// Authentication
const loginResponse = await api.login({
  email: 'john.doe@example.com',
  password: 'SecurePassword123!'
});

// Get profile
const profile = await api.getProfile();

// Inventory operations
const inventory = await api.getInventory({ category: 'fruit' });
const newItem = await api.createInventory({
  food_item_id: 15,
  quantity: 2.5,
  unit: 'kg',
  purchase_date: '2025-11-20',
  expiry_date: '2025-11-30'
});
await api.updateInventory(48, { quantity: 1.5 });
await api.deleteInventory(48);

// Consumption logs
const logs = await api.getConsumptionLogs();
await api.createConsumptionLog({
  food_item_id: 15,
  quantity: 0.5,
  unit: 'kg',
  consumed_at: new Date().toISOString()
});

// Dashboard
const summary = await api.getDashboardSummary();
const recommendations = await api.getRecommendations();

// Images
const uploadResult = await api.uploadImage(formData);
```

---

## Rate Limiting

> [!IMPORTANT]
> Rate limiting information should be confirmed with your backend implementation. The following is a suggested structure:

- **Default:** 60 requests per minute per user
- **Authentication endpoints:** 5 requests per minute
- **Image upload:** 10 requests per minute

**Rate limit headers:**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1700582400
```

---

## API Versioning

The API uses URL-based versioning:
- Current version: `v1`
- Base path: `/api/v1/`

Future versions will be accessible via `/api/v2/`, etc.

---

## Notes

> [!TIP]
> **Best Practices:**
> - Always include the Authorization header for protected endpoints
> - Handle errors gracefully using try-catch blocks
> - Use appropriate HTTP methods (GET, POST, PUT, DELETE)
> - Validate data before sending requests
> - Store tokens securely in httpOnly cookies

> [!WARNING]
> **Security Considerations:**
> - Never store tokens in localStorage (use httpOnly cookies)
> - Always use HTTPS in production
> - Implement CSRF protection for state-changing operations
> - Validate and sanitize all user inputs on the backend

---

**Last Updated:** November 21, 2025  
**API Version:** 1.0.0  
**Backend Framework:** Laravel (assumed based on error format)
