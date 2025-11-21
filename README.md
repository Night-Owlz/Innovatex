# INNOVATEX Food Management & Sustainability Platform

A full-stack web application addressing **UN Sustainable Development Goal 2 (Zero Hunger)** and **Goal 12 (Responsible Consumption and Production)** through intelligent food tracking, inventory management, and actionable sustainability insights.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [AI Service Setup](#ai-service-setup-optional)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [License](#license)

## Overview

INNOVATEX is a comprehensive food management platform that empowers individuals and households to reduce food waste, optimize budgets, and make informed decisions about food consumption. By combining modern web technologies with sustainability-focused features, the platform provides users with tools to track their food inventory, log consumption patterns, and receive personalized recommendations for reducing waste and improving food management practices.

### Problem Statement

Food waste and inefficient food management contribute to global hunger, environmental degradation, and household budget strain. According to the UN, approximately one-third of all food produced globally is wasted, while millions face food insecurity.

### Our Solution

INNOVATEX addresses this challenge by providing:

- **Real-time inventory tracking** with expiration monitoring to prevent food waste
- **Consumption pattern analysis** to help users understand their food usage habits
- **Smart recommendations** based on user behavior and inventory status
- **Educational resources** on food storage, meal planning, and waste reduction
- **Budget-conscious features** to help households optimize food spending
- **Extensible AI architecture** ready for advanced features like receipt scanning and predictive analytics

### Impact Alignment

**SDG 2 - Zero Hunger**: By helping users manage food more efficiently, we contribute to better food utilization and reduced waste, making more food available for those in need.

**SDG 12 - Responsible Consumption and Production**: The platform promotes sustainable consumption patterns through waste reduction, informed purchasing decisions, and educational content on responsible food management.

## Key Features

## Key Features

### User Management
- Secure user registration and authentication with Laravel Sanctum
- Comprehensive profile management including household size, dietary preferences, and budget range
- Multi-user support with data isolation and privacy protection
- Persistent session management across devices

### Food Inventory Management
- Add, edit, and delete food items with detailed information (quantity, unit, category, dates)
- Visual expiration alerts with color-coded indicators (red for critical, yellow for warning)
- Category-based organization (fruits, vegetables, dairy, grains, protein, beverages)
- Search and filter capabilities for quick item location
- Integration with predefined food items database for standardized data entry
- Purchase date tracking for freshness monitoring

### Consumption Logging
- Record daily food consumption with date, quantity, and category
- Historical data tracking with advanced filtering options
- Date range filters (today, last 7 days, last 30 days, custom range)
- Category-based filtering for pattern analysis
- Notes field for additional context (meal type, preparation method, etc.)
- Bulk delete and export capabilities

### Smart Recommendation System
- Rule-based recommendation engine analyzing user behavior
- Personalized resource suggestions based on:
  - Items expiring within 3 days (triggers waste reduction resources)
  - Recent consumption categories (matches relevant educational content)
  - Inventory patterns (suggests storage and meal planning tips)
- Dynamic recommendation updates as user data changes
- Contextual explanations for why each resource is recommended

### Educational Resources Library
- 20+ curated resources covering:
  - **Waste Reduction**: Composting guides, leftover recipes, zero-waste tips
  - **Budget Tips**: Meal planning, bulk buying strategies, seasonal eating
  - **Meal Planning**: Weekly prep guides, balanced meal templates, quick recipes
  - **Storage Tips**: Refrigerator organization, freezing guides, container selection
  - **Nutrition**: Balanced diet information, vitamin guides, healthy eating on a budget
- Multiple content formats (articles, videos, guides, tools)
- Filterable by category, type, and tags
- External links to detailed resources

### Image Upload System
- Upload receipts and food labels for future AI processing
- Associate images with specific inventory items or consumption logs
- File type validation (JPEG, PNG)
- File size limits (5MB maximum)
- Secure storage with organized file structure
- Prepared for Part 2 OCR and label recognition features

### Dashboard Analytics
- Real-time summary statistics:
  - Total inventory items count
  - Items expiring within 7 days
  - Consumption logs in last 7 days
- Quick access to recent activities
- Personalized recommendations display
- Visual indicators for urgent actions needed
- Responsive cards with key metrics

### Responsive Design
- Mobile-first approach optimized for all screen sizes
- Touch-friendly interfaces for mobile devices
- Adaptive layouts for tablet and desktop viewing
- Accessible navigation with hamburger menu on mobile
- Progressive enhancement for optimal performance

## Part 2: AI-Powered Features (Implemented)

### Features

✅ **AI Consumption Pattern Analyzer**: Analyzes weekly trends, detects over/under consumption, predicts waste risks

✅ **Meal Optimization Engine**: Generates budget-friendly meal plans using inventory items, creates shopping lists

✅ **OCR Receipt Scanning**: Extracts food items from receipts (simulated for demo, ready for Tesseract integration)

✅ **Expiration Risk Prediction**: Scores inventory items by waste risk, provides recommendations

✅ **Waste Estimation Model**: Calculates waste metrics, compares to community averages, projects yearly impact

✅ **NourishBot Chatbot**: AI assistant powered by OpenRouter API (meta-llama/llama-3.2-3b-instruct:free) for personalized advice

✅ **SDG Impact Scoring**: Evaluates user progress on SDG 2 & 12, provides actionable insights

### New Pages

- `/insights` - AI consumption pattern analysis with weekly trends, over/under consumption alerts, waste risk items
- `/meal-planner` - Weekly meal plan generator with FIFO inventory usage, shopping list, and nutrition summary
- `/nourishbot` - AI chatbot for food advice with persistent chat sessions
- `/ocr-scan` - Receipt scanning and automatic item extraction to inventory
- `/impact` - SDG impact score dashboard with breakdown by category and action steps
- `/alerts` - Expiration risk alerts with filtering and quick actions

### Technical Implementation

- All AI logic implemented in Laravel controllers (no separate AI service required for demo)
- OpenRouter API integration for chatbot using meta-llama/llama-3.2-3b-instruct:free model
- Rule-based algorithms for pattern analysis, waste prediction, and impact scoring
- Extensible architecture ready for ML model integration
- Real-time calculations based on actual user data (no dummy data)

### Setup - Part 2 Additions

#### Environment Variables

Add to `backend/.env`:

```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME=InnovateX FoodFlow
```

#### Database Migrations

Run new Part 2 migrations:

```bash
cd backend
php artisan migrate  # This will create: consumption_patterns, meal_plans, chat_sessions, impact_scores, waste_predictions tables
```

#### External APIs

**OpenRouter API**: Used for NourishBot chatbot
- Get API key: https://openrouter.ai/keys
- Model: meta-llama/llama-3.2-3b-instruct:free (no cost)
- Features: Context-aware responses, conversation history, inventory integration


## Technology Stack

### Frontend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Next.js | 14+ | React framework with App Router for server-side rendering and routing |
| Language | JavaScript | ES6+ | Primary development language with JSX syntax |
| Styling | Tailwind CSS | 3.x | Utility-first CSS framework for responsive design |
| State Management | React Hooks | 18+ | useState, useEffect, useContext for local and global state |
| HTTP Client | Fetch API | Native | API communication with custom wrapper and error handling |
| Authentication | Context API | - | Global authentication state management with token storage |
| Form Handling | Controlled Components | - | Native React form state management with validation |

### Backend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Laravel | 10.x | PHP framework for robust API development |
| Language | PHP | 8.1+ | Server-side programming with modern features |
| Database | SQLite | 3.x | Embedded database (MySQL compatible schema) |
| ORM | Eloquent | - | Object-relational mapping for database interactions |
| Authentication | Laravel Sanctum | - | Token-based API authentication for SPAs |
| API Architecture | RESTful | - | Standard REST conventions with resource controllers |
| Validation | Form Requests | - | Dedicated validation classes for input sanitization |
| File Storage | Laravel Storage | - | Abstracted file system with local and cloud support |
| Response Transformation | API Resources | - | Consistent JSON response formatting |

### AI Service (Part 2 Preparation)

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Flask | 2.3+ | Lightweight Python web framework for microservices |
| Language | Python | 3.10+ | Primary language for AI/ML implementations |
| Data Processing | Pandas | 2.0+ | Data manipulation and analysis |
| Numerical Computing | NumPy | 1.24+ | Array operations and mathematical functions |
| Machine Learning | scikit-learn | 1.3+ | ML algorithms for future predictive features |

### Development Tools

- **Version Control**: Git
- **Package Managers**: Composer (PHP), npm (JavaScript), pip (Python)
- **Code Quality**: ESLint (JavaScript), PHP CodeSniffer
- **API Testing**: Postman, Thunder Client
- **Database Management**: SQLite Browser, TablePlus

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│                     (Next.js Frontend)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │ REST API Calls
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     Laravel Backend API                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Controllers → Services → Models → Database            │ │
│  │  (API Resources, Validation, Business Logic)           │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐    ┌────────▼─────────┐
        │  SQLite Database│    │  File Storage    │
        │  (User Data,    │    │  (Images,        │
        │   Inventory,    │    │   Receipts)      │
        │   Logs, etc.)   │    │                  │
        └─────────────────┘    └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Python AI Service (Future)                      │
│  (Receipt OCR, Label Recognition, ML Predictions)            │
└─────────────────────────────────────────────────────────────┘
```

### Application Flow

1. **User Authentication**: User registers/logs in → Laravel Sanctum issues token → Token stored in frontend context
2. **Data Operations**: Frontend makes authenticated API calls → Laravel validates and processes → Returns JSON response
3. **Inventory Management**: User adds/edits items → Backend stores in database → Updates reflected in frontend
4. **Recommendations**: Backend analyzes user data → Rule-based engine generates suggestions → Displayed on dashboard
5. **File Uploads**: User uploads image → Laravel validates and stores → File path saved in database

## Project Structure

```
Night-Owlz/
├── backend/                              # Laravel 10.x API Backend
│   ├── app/
│   │   ├── Exceptions/                   # Custom exception handlers
│   │   │   ├── ConsumptionLogNotFoundException.php
│   │   │   ├── InventoryNotFoundException.php
│   │   │   └── UnauthorizedActionException.php
│   │   ├── Helpers/                      # Utility helper classes
│   │   │   ├── DateHelper.php
│   │   │   └── ResponseHelper.php
│   │   ├── Http/
│   │   │   ├── Controllers/Api/          # RESTful API controllers
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── ConsumptionLogController.php
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── FoodItemController.php
│   │   │   │   ├── ImageUploadController.php
│   │   │   │   ├── InventoryController.php
│   │   │   │   ├── ProfileController.php
│   │   │   │   └── ResourceController.php
│   │   │   ├── Middleware/               # Custom middleware
│   │   │   ├── Requests/                 # Form request validation classes
│   │   │   │   ├── LoginRequest.php
│   │   │   │   ├── RegisterRequest.php
│   │   │   │   ├── StoreConsumptionLogRequest.php
│   │   │   │   ├── StoreInventoryRequest.php
│   │   │   │   ├── UpdateInventoryRequest.php
│   │   │   │   └── UpdateProfileRequest.php
│   │   │   └── Resources/                # API resource transformers
│   │   │       ├── ConsumptionLogResource.php
│   │   │       ├── FoodItemResource.php
│   │   │       ├── InventoryResource.php
│   │   │       ├── ResourceResource.php
│   │   │       └── UserResource.php
│   │   ├── Models/                       # Eloquent ORM models
│   │   │   ├── ConsumptionLog.php
│   │   │   ├── FoodItem.php
│   │   │   ├── ImageUpload.php
│   │   │   ├── Inventory.php
│   │   │   ├── Resource.php
│   │   │   └── User.php
│   │   ├── Observers/                    # Model observers
│   │   │   ├── ConsumptionLogObserver.php
│   │   │   └── InventoryObserver.php
│   │   ├── Providers/                    # Service providers
│   │   ├── Services/                     # Business logic layer
│   │   │   ├── AuthService.php
│   │   │   ├── ConsumptionLogService.php
│   │   │   ├── DashboardService.php
│   │   │   ├── InventoryService.php
│   │   │   └── RecommendationService.php
│   │   └── Traits/                       # Reusable traits
│   │       └── ApiResponse.php
│   ├── config/                           # Configuration files
│   │   ├── app.php
│   │   ├── cors.php
│   │   ├── database.php
│   │   ├── food_management.php
│   │   └── sanctum.php
│   ├── database/
│   │   ├── database.sqlite               # SQLite database file
│   │   ├── migrations/                   # Database migrations
│   │   └── seeders/                      # Database seeders
│   │       ├── FoodItemSeeder.php
│   │       └── ResourceSeeder.php
│   ├── routes/
│   │   ├── api.php                       # API route definitions
│   │   └── web.php
│   ├── storage/
│   │   ├── app/public/                   # Public file storage
│   │   └── logs/                         # Application logs
│   ├── .env.example                      # Environment configuration template
│   ├── composer.json                     # PHP dependencies
│   └── artisan                           # Laravel command-line tool
│
├── frontend/                             # Next.js 14 Frontend
│   ├── app/
│   │   ├── (auth)/                       # Authentication pages
│   │   │   ├── login/page.jsx
│   │   │   └── register/page.jsx
│   │   ├── (dashboard)/                  # Protected dashboard pages
│   │   │   ├── dashboard/page.jsx
│   │   │   ├── inventory/page.jsx
│   │   │   ├── logs/page.jsx
│   │   │   ├── profile/page.jsx
│   │   │   └── resources/page.jsx
│   │   ├── globals.css                   # Global styles
│   │   ├── layout.js                     # Root layout with navigation
│   │   └── page.js                       # Landing page
│   ├── components/
│   │   ├── common/                       # Reusable components
│   │   │   ├── Footer.jsx
│   │   │   └── Navbar.jsx
│   │   └── ui/                           # UI components
│   ├── context/
│   │   ├── AuthContext.jsx               # Authentication context provider
│   │   └── ThemeContext.jsx              # Theme management
│   ├── lib/
│   │   ├── api.js                        # API client with all endpoints
│   │   ├── apiMiddleware.js              # API middleware
│   │   ├── constants.js                  # Application constants
│   │   ├── utils.js                      # Utility functions
│   │   └── utils-cn.js                   # Classname utilities
│   ├── public/                           # Static assets
│   ├── .env.example                      # Environment configuration template
│   ├── next.config.mjs                   # Next.js configuration
│   ├── package.json                      # Node dependencies
│   └── tailwind.config.js                # Tailwind CSS configuration
│
├── ai-service/                           # Python AI Service (Part 2)
│   ├── src/
│   │   ├── main.py                       # Flask application entry point
│   │   └── utils.py                      # Utility functions
│   └── requirements.txt                  # Python dependencies
│
├── copilot_instructions.json             # Development guidelines
└── README.md                             # Project documentation (this file)
```

## Getting Started

### Prerequisites

Before setting up the project, ensure you have the following installed:

| Software | Version | Download Link | Purpose |
|----------|---------|---------------|---------|
| Node.js | 18.0 or higher | [nodejs.org](https://nodejs.org/) | Frontend runtime environment |
| npm | 9.0 or higher | Included with Node.js | Frontend package manager |
| PHP | 8.1 or higher | [php.net](https://www.php.net/) | Backend runtime |
| Composer | 2.0 or higher | [getcomposer.org](https://getcomposer.org/) | PHP dependency manager |
| Python | 3.10 or higher | [python.org](https://www.python.org/) | AI service runtime (optional for Part 1) |
| SQLite | 3.35 or higher | Usually pre-installed | Database system |

#### Verification Commands

Run these commands to verify your installations:

```bash
node --version          # Should show v18.0.0 or higher
npm --version           # Should show 9.0.0 or higher
php --version           # Should show 8.1.0 or higher
composer --version      # Should show 2.0.0 or higher
python --version        # Should show 3.10.0 or higher
sqlite3 --version       # Should show 3.35.0 or higher
```

### Backend Setup

- **Node.js** 18+ and npm
- **PHP** 8.1+ and Composer
- **Python** 3.10+ and pip
- **SQLite** (or MySQL 8.0+)

### Backend Setup

The backend is a Laravel 10.x application that provides RESTful API endpoints for the frontend.

#### Step 1: Navigate to Backend Directory

```bash
cd backend
```

#### Step 2: Install PHP Dependencies

Install all required Laravel packages using Composer:

```bash
composer install
```

This will install Laravel framework, Sanctum for authentication, and all other dependencies defined in `composer.json`.

#### Step 3: Environment Configuration

Create your environment configuration file:

```bash
cp .env.example .env
```

**On Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

Edit the `.env` file and configure the following essential variables:

```env
APP_NAME="INNOVATEX Food Management"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
SESSION_DRIVER=cookie

FILESYSTEM_DISK=public
```

#### Step 4: Generate Application Key

Generate a unique application encryption key:

```bash
php artisan key:generate
```

This key is used for encrypting session data and other sensitive information.

#### Step 5: Create Database

For SQLite (recommended for development):

```bash
touch database/database.sqlite
```

**On Windows PowerShell:**
```powershell
New-Item -Path database\database.sqlite -ItemType File
```

For MySQL, update your `.env` file with database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=innovatex_food
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

#### Step 6: Run Database Migrations

Create all necessary database tables:

```bash
php artisan migrate
```

This creates the following tables:
- `users` - User accounts and profiles
- `food_items` - Predefined food items catalog
- `inventories` - User's food inventory
- `consumption_logs` - Food consumption history
- `resources` - Educational resources
- `image_uploads` - Uploaded images metadata

#### Step 7: Seed Database with Sample Data

Populate the database with initial data:

```bash
php artisan db:seed
```

This will seed:
- **27 Food Items** across all categories
- **20+ Educational Resources** on sustainability and food management

To refresh and reseed the database at any time:
```bash
php artisan migrate:fresh --seed
```

#### Step 8: Create Storage Symlink

Link the storage directory for public file access:

```bash
php artisan storage:link
```

This creates a symbolic link from `public/storage` to `storage/app/public`, allowing uploaded images to be accessed via HTTP.

#### Step 9: Start Development Server

Launch the Laravel development server:

```bash
php artisan serve
```

The backend API will be available at: **http://localhost:8000**

You should see:
```
Starting Laravel development server: http://localhost:8000
```

#### Optional: Run on Different Port

```bash
php artisan serve --port=8080
```

### Frontend Setup

The frontend is a Next.js 14 application using the App Router and Tailwind CSS.

#### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

#### Step 2: Install Node.js Dependencies

Install all required packages:

```bash
npm install
```

This installs Next.js, React, Tailwind CSS, and all other dependencies from `package.json`.

#### Step 3: Environment Configuration

Create your environment configuration file:

```bash
cp .env.example .env.local
```

**On Windows PowerShell:**
```powershell
Copy-Item .env.example .env.local
```

Edit the `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Important**: The `NEXT_PUBLIC_` prefix makes this variable available to the browser. Update the port if your backend runs on a different port.

#### Step 4: Start Development Server

Launch the Next.js development server:

```bash
npm run dev
```

The frontend will be available at: **http://localhost:3000**

You should see:
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

#### Optional: Build for Production

To create an optimized production build:

```bash
npm run build
npm start
```

### AI Service Setup (Optional)

The AI service is prepared for Part 2 implementation. Basic setup is provided here.

#### Step 1: Navigate to AI Service Directory

```bash
cd ai-service
```

#### Step 2: Create Virtual Environment

Create an isolated Python environment:

```bash
python -m venv venv
```

#### Step 3: Activate Virtual Environment

**On Linux/Mac:**
```bash
source venv/bin/activate
```

**On Windows PowerShell:**
```powershell
.\venv\Scripts\Activate.ps1
```

**On Windows Command Prompt:**
```cmd
venv\Scripts\activate.bat
```

You should see `(venv)` prefix in your terminal.

#### Step 4: Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs Flask, NumPy, Pandas, and other dependencies.

#### Step 5: Start Flask Server

```bash
python src/main.py
```

The AI service will be available at: **http://localhost:5000**

**Note**: This service is a placeholder for Part 2. No AI functionality is implemented in Part 1.

### Verification

After completing all setup steps, verify the installation:

1. **Backend Health Check**:
   ```bash
   curl http://localhost:8000/api/food-items
   ```
   Should return JSON array of food items.

2. **Frontend Access**:
   Open browser and navigate to `http://localhost:3000`
   You should see the landing page.

3. **Full Integration Test**:
   - Register a new account
   - Log in
   - Add an inventory item
   - Create a consumption log
   - View dashboard

## Usage Guide

### Creating Your Account

1. Navigate to `http://localhost:3000`
2. Click **"Get Started"** or **"Create Account"** button
3. Fill in the registration form with the following information:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| Full Name | Yes | Your complete name | John Doe |
| Email | Yes | Valid email address | john@example.com |
| Password | Yes | Minimum 8 characters | SecurePass123 |
| Household Size | No | Number of people | 4 |
| Dietary Preferences | No | Multiple selections allowed | Vegetarian, Gluten-Free |
| Budget Range | No | Low, Medium, or High | Medium |
| Location | No | City or region | New York |

4. Click **"Create Account"**
5. Upon successful registration, you'll be automatically logged in and redirected to the dashboard

### Managing Your Inventory

The inventory system helps you track all food items in your household.

#### Adding New Items

1. Navigate to **Inventory** from the navigation bar
2. Click the **"Add Item"** button
3. Fill in the item details:
   - **Item Name**: Name of the food item (e.g., "Milk", "Chicken Breast")
   - **Quantity**: Numeric value (e.g., 2, 1.5)
   - **Unit**: Select from dropdown (kg, liters, pieces, etc.)
   - **Category**: Select category (vegetable, fruit, dairy, grain, protein, beverage)
   - **Purchase Date**: When the item was purchased
   - **Expiration Date**: When the item expires (optional but recommended)
4. Click **"Add to Inventory"**

#### Understanding Expiration Alerts

Items are color-coded based on expiration status:
- **Red Background**: Expires within 3 days (urgent)
- **Yellow Background**: Expires within 7 days (warning)
- **Green Background**: Expires after 7 days (good)
- **Gray Background**: No expiration date set

#### Editing Items

1. Click the **"Edit"** button on any inventory item
2. Modify the fields as needed
3. Click **"Save Changes"**

#### Deleting Items

1. Click the **"Delete"** button on the item
2. Confirm the deletion in the popup dialog
3. Item will be removed immediately

#### Filtering Inventory

Use the filter options to find items quickly:
- **By Category**: Select a specific category from dropdown
- **Expiring Soon**: Toggle to show only items expiring within 7 days
- **Search**: Type item name to search (real-time filtering)

### Logging Food Consumption

Track what food you consume to identify patterns and reduce waste.

#### Creating a New Log

1. Navigate to **Logs** from the navigation bar
2. Click **"Add Log"** button
3. Enter consumption details:
   - **Item Name**: What you consumed (e.g., "Apple", "Leftover Pasta")
   - **Quantity**: How much (e.g., 2, 0.5)
   - **Unit**: Measurement unit
   - **Category**: Food category
   - **Consumption Date**: When it was consumed
   - **Notes**: Optional notes (e.g., "breakfast", "too much salt")
4. Click **"Add Log"**

#### Viewing Consumption History

Logs are displayed in reverse chronological order (newest first) with the following information:
- Item name and quantity
- Category badge
- Consumption date
- Notes (if provided)
- Delete option

#### Filtering Logs

Use powerful filtering options:

**Date Presets**:
- **Today**: Show only today's logs
- **Last 7 Days**: Show logs from the past week
- **Last 30 Days**: Show logs from the past month
- **This Month**: Show logs from current calendar month

**Custom Date Range**:
- Select **Date From** and **Date To** for custom ranges

**Category Filter**:
- Select specific category to view only those logs

**Clear Filters**:
- Click **"Clear Filters"** to reset all filters

### Using the Dashboard

The dashboard provides an overview of your food management activity.

#### Dashboard Sections

1. **Welcome Message**: Personalized greeting with your name

2. **Quick Statistics**:
   - Total inventory items count
   - Items expiring within 7 days (with warning indicator)
   - Consumption logs in the last 7 days

3. **Items Expiring Soon**:
   - List of up to 5 items expiring within 7 days
   - Color-coded by urgency
   - Quick view of expiration dates

4. **Recent Consumption Logs**:
   - Last 5 consumption entries
   - Shows item name, quantity, and date
   - Link to view all logs

5. **Personalized Recommendations**:
   - 5 recommended educational resources
   - Based on your inventory and consumption patterns
   - Reasons displayed for each recommendation
   - Direct links to learn more

### Exploring Educational Resources

Access a curated library of food sustainability resources.

#### Browsing Resources

1. Navigate to **Resources** from the navigation bar
2. View all 20+ resources displayed as cards

#### Resource Card Information

Each resource shows:
- Title
- Description
- Category badge (color-coded)
- Type badge (article, video, guide, tool)
- Related tags
- "Learn More" button linking to external content

#### Filtering Resources

Use filters to find relevant content:

**By Category**:
- Waste Reduction
- Budget Tips
- Meal Planning
- Storage Tips
- Nutrition

**By Type**:
- Article
- Video
- Guide
- Tool

**Search**:
- Real-time search by title, description, or tags

### Managing Your Profile

Update your personal information and preferences.

#### Viewing Profile

1. Navigate to **Profile** from the navigation bar
2. View your current information:
   - Full name
   - Email address
   - Household size
   - Dietary preferences
   - Budget range
   - Location

#### Editing Profile

1. Click **"Edit Profile"** button
2. Modify any fields (except email)
3. Update dietary preferences (multiple selections)
4. Click **"Save Changes"**
5. Success message will confirm the update

### Uploading Images

Upload receipts and food labels for future processing.

#### From Inventory Page

1. When adding or editing an inventory item
2. Look for the **"Upload Image"** section
3. Click **"Choose File"** or drag and drop an image
4. Select a JPEG or PNG file (max 5MB)
5. Click **"Upload"**
6. Image will be associated with the inventory item

#### From Logs Page

Similar process when creating consumption logs.

#### Supported Formats

- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **Maximum size**: 5MB

### Logging Out

1. Click your name or profile icon in the navigation bar
2. Select **"Logout"**
3. You'll be redirected to the landing page
4. Your data remains secure in the database


## API Reference

All API endpoints follow RESTful conventions and return JSON responses. The base URL for all endpoints is `http://localhost:8000/api`.

### Authentication

Most endpoints require authentication using Laravel Sanctum. Include the Bearer token in the Authorization header:

```
Authorization: Bearer {your_token_here}
```

Tokens are obtained from the `/login` or `/register` endpoints.

### Response Format

All responses follow a consistent JSON structure:

**Success Response:**
```json
{
  "data": { ...resource data... },
  "message": "Success message"
}
```

**Error Response:**
```json
{
  "message": "Error message",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

### Endpoints

#### Authentication Endpoints

##### POST /api/register
Create a new user account.

**Authentication:** Not required

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "household_size": 4,
  "dietary_preferences": ["Vegetarian", "Gluten-Free"],
  "budget_range": "medium",
  "location": "New York"
}
```

**Validation Rules:**
- `full_name`: required, string, max 255 characters
- `email`: required, email format, unique
- `password`: required, minimum 8 characters
- `household_size`: optional, integer, minimum 1
- `dietary_preferences`: optional, array of strings
- `budget_range`: optional, string (low, medium, high)
- `location`: optional, string, max 255 characters

**Success Response (201 Created):**
```json
{
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "household_size": 4,
    "dietary_preferences": ["Vegetarian", "Gluten-Free"],
    "budget_range": "medium",
    "location": "New York"
  },
  "token": "1|AbCdEfGh..."
}
```

##### POST /api/login
Authenticate a user and receive access token.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200 OK):**
```json
{
  "user": { ...user object... },
  "token": "2|XyZ123..."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

##### POST /api/logout
Revoke current authentication token.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

#### Profile Endpoints

##### GET /api/profile
Get authenticated user's profile information.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "household_size": 4,
    "dietary_preferences": ["Vegetarian", "Gluten-Free"],
    "budget_range": "medium",
    "location": "New York",
    "created_at": "2024-01-15T10:30:00.000000Z"
  }
}
```

##### PUT /api/profile
Update authenticated user's profile.

**Authentication:** Required

**Request Body:**
```json
{
  "full_name": "John Smith",
  "household_size": 5,
  "dietary_preferences": ["Vegan"],
  "budget_range": "high",
  "location": "Boston"
}
```

All fields are optional. Email cannot be changed via this endpoint.

**Success Response (200 OK):**
```json
{
  "data": { ...updated user object... },
  "message": "Profile updated successfully"
}
```

#### Consumption Log Endpoints

##### GET /api/consumption-logs
Retrieve paginated list of user's consumption logs.

**Authentication:** Required

**Query Parameters:**
- `page`: integer (default: 1)
- `per_page`: integer (default: 15, max: 100)
- `date_from`: date format YYYY-MM-DD
- `date_to`: date format YYYY-MM-DD
- `category`: string

**Example Request:**
```
GET /api/consumption-logs?page=1&per_page=20&date_from=2024-01-01&category=vegetable
```

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "item_name": "Carrot",
      "quantity": 2,
      "unit": "pieces",
      "category": "vegetable",
      "consumption_date": "2024-01-15",
      "notes": "Lunch salad",
      "created_at": "2024-01-15T12:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 73
  }
}
```

##### POST /api/consumption-logs
Create a new consumption log entry.

**Authentication:** Required

**Request Body:**
```json
{
  "item_name": "Apple",
  "quantity": 2,
  "unit": "pieces",
  "category": "fruit",
  "consumption_date": "2024-01-15",
  "notes": "Afternoon snack"
}
```

**Validation Rules:**
- `item_name`: required, string, max 255 characters
- `quantity`: required, numeric, minimum 0.01
- `unit`: required, string, max 50 characters
- `category`: required, string, max 100 characters
- `consumption_date`: required, date format YYYY-MM-DD
- `notes`: optional, string, max 1000 characters

**Success Response (201 Created):**
```json
{
  "data": { ...created log object... },
  "message": "Consumption log created successfully"
}
```

##### GET /api/consumption-logs/{id}
Retrieve a specific consumption log.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "data": { ...log object... }
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Consumption log not found"
}
```

##### DELETE /api/consumption-logs/{id}
Delete a consumption log.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "message": "Consumption log deleted successfully"
}
```

#### Inventory Endpoints

##### GET /api/inventory
Retrieve user's inventory items with pagination and filtering.

**Authentication:** Required

**Query Parameters:**
- `page`: integer (default: 1)
- `per_page`: integer (default: 15, max: 100)
- `category`: string
- `expiring_soon`: boolean (true returns items expiring within 7 days)
- `search`: string (searches in item_name)

**Example Request:**
```
GET /api/inventory?expiring_soon=true&category=dairy
```

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "item_name": "Milk",
      "quantity": 2,
      "unit": "liters",
      "category": "dairy",
      "purchase_date": "2024-01-10",
      "expiration_date": "2024-01-20",
      "days_until_expiration": 5,
      "food_item_id": 15,
      "created_at": "2024-01-10T08:00:00.000000Z"
    }
  ],
  "meta": { ...pagination... }
}
```

##### POST /api/inventory
Add a new item to inventory.

**Authentication:** Required

**Request Body:**
```json
{
  "food_item_id": 15,
  "item_name": "Milk",
  "quantity": 2,
  "unit": "liters",
  "category": "dairy",
  "purchase_date": "2024-01-15",
  "expiration_date": "2024-01-25"
}
```

**Validation Rules:**
- `food_item_id`: optional, integer, exists in food_items table
- `item_name`: required, string, max 255 characters
- `quantity`: required, numeric, minimum 0.01
- `unit`: required, string, max 50 characters
- `category`: required, string, max 100 characters
- `purchase_date`: required, date format YYYY-MM-DD
- `expiration_date`: optional, date format YYYY-MM-DD

**Success Response (201 Created):**
```json
{
  "data": { ...created inventory item... },
  "message": "Inventory item created successfully"
}
```

##### PUT /api/inventory/{id}
Update an existing inventory item.

**Authentication:** Required

**Request Body:** Same as POST (all fields optional)

**Success Response (200 OK):**
```json
{
  "data": { ...updated inventory item... },
  "message": "Inventory item updated successfully"
}
```

##### DELETE /api/inventory/{id}
Remove an item from inventory.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "message": "Inventory item deleted successfully"
}
```

#### Food Items Endpoints

##### GET /api/food-items
Retrieve all predefined food items.

**Authentication:** Not required

**Query Parameters:**
- `category`: string (fruit, vegetable, dairy, grain, protein, beverage, other)
- `search`: string (searches in name)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Apple",
      "category": "fruit",
      "typical_expiration_days": 7,
      "cost_per_unit": 2.50,
      "unit": "kg"
    }
  ]
}
```

##### GET /api/food-items/{id}
Retrieve a specific food item.

**Authentication:** Not required

**Success Response (200 OK):**
```json
{
  "data": { ...food item object... }
}
```

#### Resources Endpoints

##### GET /api/resources
Retrieve educational resources.

**Authentication:** Not required

**Query Parameters:**
- `category`: string (waste_reduction, budget_tips, meal_planning, storage_tips, nutrition, other)
- `type`: string (article, video, guide, tool)
- `tags`: string (comma-separated tags to match)

**Example Request:**
```
GET /api/resources?category=waste_reduction&type=article
```

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Complete Guide to Composting at Home",
      "description": "Learn how to turn food scraps into nutrient-rich compost",
      "url": "https://example.com/composting-guide",
      "category": "waste_reduction",
      "type": "guide",
      "tags": ["composting", "waste", "garden"]
    }
  ]
}
```

##### GET /api/resources/{id}
Retrieve a specific resource.

**Authentication:** Not required

**Success Response (200 OK):**
```json
{
  "data": { ...resource object... }
}
```

#### Dashboard Endpoints

##### GET /api/dashboard/summary
Get comprehensive dashboard summary with statistics and recommendations.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "data": {
    "statistics": {
      "total_inventory_items": 25,
      "items_expiring_soon": 3,
      "recent_logs_count": 15
    },
    "expiring_items": [
      { ...inventory item... }
    ],
    "recent_logs": [
      { ...consumption log... }
    ],
    "recommendations": [
      {
        "id": 5,
        "title": "Food Storage Tips",
        "description": "...",
        "category": "storage_tips",
        "reason": "You have items expiring soon"
      }
    ]
  }
}
```

#### Image Upload Endpoints

##### POST /api/images/upload
Upload an image file.

**Authentication:** Required

**Request:** multipart/form-data

**Form Fields:**
- `image`: file (required, JPEG or PNG, max 5MB)
- `upload_type`: string (required, receipt | food_label | other)
- `related_inventory_id`: integer (optional)
- `related_log_id`: integer (optional)

**Success Response (201 Created):**
```json
{
  "data": {
    "id": 1,
    "file_path": "/storage/uploads/2024/01/abc123.jpg",
    "file_name": "receipt.jpg",
    "file_type": "image/jpeg",
    "file_size": 245678,
    "upload_type": "receipt",
    "created_at": "2024-01-15T14:30:00.000000Z"
  },
  "message": "Image uploaded successfully"
}
```

##### GET /api/images
Retrieve user's uploaded images.

**Authentication:** Required

**Query Parameters:**
- `page`: integer
- `per_page`: integer
- `upload_type`: string

**Success Response (200 OK):**
```json
{
  "data": [ ...array of image objects... ],
  "meta": { ...pagination... }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE requests |
| 201 | Created | Successful POST requests creating resources |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Authenticated but not authorized for action |
| 404 | Not Found | Resource does not exist |
| 422 | Unprocessable Entity | Validation errors in request data |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Rate Limiting

API requests are limited to prevent abuse:
- **Authentication endpoints**: 5 requests per minute
- **Other endpoints**: 60 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642251600
```

## Database Schema

### Tables Overview

| Table | Records | Purpose |
|-------|---------|---------|
| users | User-generated | User accounts and profiles |
| food_items | 27 (seeded) | Predefined food catalog |
| inventories | User-generated | User's current food inventory |
| consumption_logs | User-generated | Food consumption history |
| resources | 20+ (seeded) | Educational resources |
| image_uploads | User-generated | Uploaded image metadata |

### Table Structures

#### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Unique user identifier |
| full_name | varchar(255) | NOT NULL | User's full name |
| email | varchar(255) | UNIQUE, NOT NULL | Email address (login) |
| password | varchar(255) | NOT NULL | Bcrypt hashed password |
| household_size | integer | DEFAULT 1 | Number of people in household |
| dietary_preferences | json | NULLABLE | Array of dietary preferences |
| budget_range | varchar(50) | NULLABLE | low, medium, or high |
| location | varchar(255) | NULLABLE | City or region |
| created_at | timestamp | | Account creation date |
| updated_at | timestamp | | Last profile update |

#### food_items
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Unique food item identifier |
| name | varchar(255) | NOT NULL | Food item name |
| category | enum | NOT NULL | fruit, vegetable, dairy, etc. |
| typical_expiration_days | integer | NULLABLE | Average shelf life |
| cost_per_unit | decimal(10,2) | NULLABLE | Typical cost |
| unit | varchar(50) | NULLABLE | Measurement unit |
| created_at | timestamp | | Record creation |
| updated_at | timestamp | | Last update |

#### inventories
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Unique inventory item identifier |
| user_id | bigint | FOREIGN KEY | References users.id |
| food_item_id | bigint | FOREIGN KEY, NULLABLE | References food_items.id |
| item_name | varchar(255) | NOT NULL | Food item name |
| quantity | decimal(10,2) | NOT NULL | Amount in stock |
| unit | varchar(50) | NOT NULL | Measurement unit |
| category | varchar(100) | NOT NULL | Food category |
| purchase_date | date | NULLABLE | When item was purchased |
| expiration_date | date | NULLABLE | When item expires |
| created_at | timestamp | | Record creation |
| updated_at | timestamp | | Last update |

**Indexes:**
- `inventories_user_id_index` on user_id
- `inventories_category_index` on category
- `inventories_expiration_date_index` on expiration_date

#### consumption_logs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Unique log identifier |
| user_id | bigint | FOREIGN KEY | References users.id |
| item_name | varchar(255) | NOT NULL | Food item consumed |
| quantity | decimal(10,2) | NOT NULL | Amount consumed |
| unit | varchar(50) | NOT NULL | Measurement unit |
| category | varchar(100) | NOT NULL | Food category |
| consumption_date | date | NOT NULL | When item was consumed |
| notes | text | NULLABLE | Additional notes |
| created_at | timestamp | | Record creation |
| updated_at | timestamp | | Last update |

**Indexes:**
- `consumption_logs_user_id_index` on user_id
- `consumption_logs_consumption_date_index` on consumption_date
- `consumption_logs_category_index` on category

#### resources
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Unique resource identifier |
| title | varchar(255) | NOT NULL | Resource title |
| description | text | NOT NULL | Description |
| url | varchar(500) | NULLABLE | External link |
| category | enum | NOT NULL | Resource category |
| type | enum | NOT NULL | article, video, guide, tool |
| tags | json | NULLABLE | Array of tags |
| created_at | timestamp | | Record creation |
| updated_at | timestamp | | Last update |

#### image_uploads
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Unique image identifier |
| user_id | bigint | FOREIGN KEY | References users.id |
| file_path | varchar(500) | NOT NULL | Storage path |
| file_name | varchar(255) | NOT NULL | Original filename |
| file_type | varchar(50) | NULLABLE | MIME type |
| file_size | bigint | NULLABLE | File size in bytes |
| upload_type | enum | NOT NULL | receipt, food_label, other |
| related_inventory_id | bigint | FOREIGN KEY, NULLABLE | References inventories.id |
| related_log_id | bigint | FOREIGN KEY, NULLABLE | References consumption_logs.id |
| created_at | timestamp | | Upload timestamp |
| updated_at | timestamp | | Last update |

### Relationships

- User **has many** Inventories (one-to-many)
- User **has many** ConsumptionLogs (one-to-many)
- User **has many** ImageUploads (one-to-many)
- Inventory **belongs to** User (many-to-one)
- Inventory **belongs to** FoodItem (many-to-one, optional)
- ConsumptionLog **belongs to** User (many-to-one)
- ImageUpload **belongs to** User (many-to-one)
- ImageUpload **belongs to** Inventory (many-to-one, optional)
- ImageUpload **belongs to** ConsumptionLog (many-to-one, optional)

## Configuration

### Backend Environment Variables

Edit `backend/.env` file:

```env
APP_NAME="INNOVATEX Food Management"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
# For MySQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=innovatex_food
# DB_USERNAME=root
# DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
SESSION_DRIVER=cookie
SESSION_LIFETIME=120

FILESYSTEM_DISK=public

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug
```

### Frontend Environment Variables

Edit `frontend/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### CORS Configuration

Configure allowed origins in `backend/config/cors.php`:

```php
'allowed_origins' => [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
],
'supports_credentials' => true,
```

### File Upload Limits

Configure in `backend/config/food_management.php`:

```php
'max_upload_size' => 5 * 1024 * 1024, // 5MB
'allowed_mime_types' => ['image/jpeg', 'image/png'],
```

## Troubleshooting

### Common Issues and Solutions

#### Backend Issues

**Issue**: `Class 'PDO' not found`
**Solution**: Enable PHP PDO extension
```bash
# On Ubuntu/Debian
sudo apt-get install php8.1-sqlite3
# On Windows: Uncomment extension=pdo_sqlite in php.ini
```

**Issue**: `Permission denied` on storage directory
**Solution**: Set proper permissions
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

**Issue**: `SQLSTATE[HY000]: General error: 1 no such table`
**Solution**: Run migrations
```bash
php artisan migrate
```

**Issue**: Storage link not working
**Solution**: Recreate symlink
```bash
php artisan storage:unlink
php artisan storage:link
```

**Issue**: CORS errors from frontend
**Solution**: Check `config/cors.php` and ensure frontend URL is in `allowed_origins`

#### Frontend Issues

**Issue**: `Failed to fetch` API calls
**Solution**: Verify `NEXT_PUBLIC_API_URL` in `.env.local` matches backend URL

**Issue**: `Module not found` errors
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Styles not loading
**Solution**: Restart development server
```bash
npm run dev
```

**Issue**: Authentication not persisting
**Solution**: Clear browser cache and cookies, ensure backend SESSION_DOMAIN matches

#### Database Issues

**Issue**: `Database file not found`
**Solution**: Create database file
```bash
touch database/database.sqlite
php artisan migrate
```

**Issue**: `Integrity constraint violation`
**Solution**: Refresh database
```bash
php artisan migrate:fresh --seed
```

### Debugging Tools

#### Backend Logging

Laravel logs are stored in `backend/storage/logs/laravel.log`

View live logs:
```bash
tail -f storage/logs/laravel.log
```

#### Frontend Debugging

Open browser DevTools (F12) and check:
- Console tab for JavaScript errors
- Network tab for API call responses
- Application tab for stored tokens

#### Database Inspection

Use SQLite Browser or command line:
```bash
sqlite3 backend/database/database.sqlite
.tables
SELECT * FROM users;
.exit
```

## Development

### Code Structure Best Practices

#### Backend (Laravel)

- **Controllers**: Keep thin, delegate to services
- **Services**: Business logic layer
- **Models**: Database interactions, relationships
- **Requests**: Input validation
- **Resources**: API response formatting
- **Observers**: Model event listeners

#### Frontend (Next.js)

- **Pages**: Route handlers in app directory
- **Components**: Reusable UI elements
- **Context**: Global state management
- **lib/api.js**: Centralized API calls
- **lib/utils.js**: Helper functions

### Adding New Features

#### Backend: New API Endpoint

1. Create migration if database changes needed:
```bash
php artisan make:migration create_new_table
```

2. Create model:
```bash
php artisan make:model NewModel
```

3. Create controller:
```bash
php artisan make:controller Api/NewController
```

4. Create form request for validation:
```bash
php artisan make:request StoreNewRequest
```

5. Create API resource:
```bash
php artisan make:resource NewResource
```

6. Add routes in `routes/api.php`:
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('new-endpoint', NewController::class);
});
```

#### Frontend: New Page

1. Create page file:
```bash
touch app/(dashboard)/new-page/page.jsx
```

2. Implement page component with 'use client' directive if needed

3. Add navigation link in `components/common/Navbar.jsx`

4. Add API call in `lib/api.js` if needed

### Testing

#### Manual Testing Checklist

- [ ] User registration with valid data
- [ ] User registration with invalid data (test validation)
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials
- [ ] View and update profile
- [ ] Add inventory item
- [ ] Edit inventory item
- [ ] Delete inventory item
- [ ] Filter inventory by category
- [ ] View expiring items
- [ ] Add consumption log
- [ ] Delete consumption log
- [ ] Filter logs by date range
- [ ] View dashboard summary
- [ ] Check recommendations appear
- [ ] Browse resources
- [ ] Filter resources by category
- [ ] Upload image
- [ ] Logout
- [ ] Test on mobile viewport
- [ ] Test on tablet viewport

## Deployment

### Production Checklist

- [ ] Set `APP_ENV=production` in backend `.env`
- [ ] Set `APP_DEBUG=false` in backend `.env`
- [ ] Generate new `APP_KEY` for production
- [ ] Use MySQL instead of SQLite for better performance
- [ ] Configure proper database credentials
- [ ] Set up HTTPS/SSL certificates
- [ ] Update CORS allowed origins to production domain
- [ ] Configure email service (SMTP credentials)
- [ ] Set up proper file storage (S3 or similar)
- [ ] Configure CDN for static assets
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Optimize images and assets
- [ ] Enable caching (Redis recommended)
- [ ] Run `php artisan optimize` for route and config caching
- [ ] Build frontend with `npm run build`
- [ ] Set up process manager (PM2, Supervisor)
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up firewall rules
- [ ] Configure domain DNS
- [ ] Test all features in production environment

### Recommended Hosting

**Backend:**
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Heroku
- Laravel Vapor (serverless)

**Frontend:**
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Cloudflare Pages

**Database:**
- AWS RDS (MySQL)
- DigitalOcean Managed Databases
- PlanetScale (MySQL)

## Security

### Implemented Security Measures

1. **Authentication**
   - Bcrypt password hashing (cost factor: 10)
   - Laravel Sanctum token-based authentication
   - Token expiration after specified lifetime
   - Secure token storage

2. **Authorization**
   - User ownership verification on all data operations
   - Middleware protection on authenticated routes
   - Resource-level access control

3. **Input Validation**
   - Form Request validation classes
   - Type checking and sanitization
   - Maximum length constraints
   - Format validation (email, dates, etc.)

4. **Data Protection**
   - SQL injection prevention via Eloquent ORM
   - XSS protection (React escaping, Laravel Blade escaping)
   - CSRF protection on state-changing operations
   - Parameter binding in queries

5. **File Security**
   - File type validation (JPEG, PNG only)
   - File size limits (5MB maximum)
   - Unique filename generation
   - Secure storage location
   - MIME type verification

6. **Network Security**
   - CORS configuration limiting allowed origins
   - HTTPS enforcement in production
   - Secure cookie flags (httpOnly, secure, sameSite)
   - Rate limiting on API endpoints

7. **Error Handling**
   - Generic error messages to users
   - Detailed logging for developers
   - No sensitive data in error responses
   - Stack traces disabled in production

### Security Best Practices for Production

- Keep all dependencies updated
- Use environment variables for secrets
- Enable HTTPS/TLS encryption
- Implement rate limiting
- Set up Web Application Firewall (WAF)
- Regular security audits
- Monitor for suspicious activity
- Implement backup and recovery procedures
- Use strong password policies
- Enable two-factor authentication (future feature)

## License

This project is developed for the INNOVATEX Hackathon and educational purposes. All rights reserved.

## Credits

**Developed for:** INNOVATEX Hackathon - Part 1

**Team:** Night-Owlz

**Focus Areas:** 
- UN Sustainable Development Goal 2: Zero Hunger
- UN Sustainable Development Goal 12: Responsible Consumption and Production

**Technologies:** Laravel, Next.js, React, Tailwind CSS, SQLite

## Support

For technical issues, feature requests, or questions about the project:

1. Check this README for answers
2. Review the troubleshooting section
3. Check browser console and Laravel logs
4. Verify all setup steps were completed correctly

---

**Version:** 1.0.0 (Part 1)

**Last Updated:** November 2024

**Note:** This is Part 1 of the INNOVATEX platform focusing on core food management features. Part 2 will introduce AI-powered capabilities including receipt OCR, food label recognition, and machine learning-based predictions for waste reduction and meal planning.