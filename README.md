# HomeAI Functional Specification

This document serves as the master reference and functional specification for building the HomeAI Mobile Application, derived strictly from the existing HomeAI Angular web platform and ASP.NET Core backend.

## 1. Project Overview
The mobile app is an extension of the existing HomeAI Web Platform, consuming the existing REST APIs. The application serves two user roles: **Customer** and **Vendor**. The app automatically determines the user experience after login based on the authenticated role. There is no Admin mobile application.

---

## 2. Authentication & Authorization
**Business Logic:**
- Authentication is handled via JWT tokens.
- **Role Detection:** Determined by the presence of a `workshopId` claim in the JWT payload. If `workshopId` exists, the user is routed to the Vendor experience; otherwise, to the Customer experience.
- Guest users have access to the Home, Catalog, Product Details, and local Favorites.

**API Endpoints:**
- `POST /api/Auth/login` (Request: `LoginDto`, Response: `AuthResponseDto` with token)
- `POST /api/Auth/register` (Request: `RegisterDto`)
- `POST /api/VendorAuth/register` (Vendor specific registration)

**Error States:** Invalid credentials, Email already exists (400/422).
**Loading States:** Button loading spinner during API call.
**Validation Rules:** Valid email format, Password minimum length and complexity rules.

---

## 3. Customer Screens & Workflows

### 3.1 Home Screen
- **Purpose:** Main landing page for discovery.
- **Route:** `/`
- **User Role:** Customer / Guest
- **UI Sections & Components:** HeroSection, InteriorCategoriesShowcase, LatestCollections, AiRoomShowcase, WhyChooseUs, CategoryStrip, FeaturedProducts, TestimonialsStats, AiHowItWorks.
- **API Endpoints:**
  - `GET /api/Products/featured`
  - `GET /api/Categories`
  - *Showcase API endpoints (Unknown exact URL from current view, relies on ShowcaseService).*
- **Interactions:** Scroll reveals (IntersectionObserver trigger at 5% threshold). Click categories or products to navigate.
- **Loading States:** Skeleton loaders for featured products and categories.

### 3.2 Product Catalog (List)
- **Purpose:** Browse and search products with filtering.
- **Route:** `/products`
- **User Role:** Customer / Guest
- **UI Sections:** Search Bar, Filter Sidebar (Accordion style: Categories, Subcategories, Vendors, Price Range), Product Grid/List, Pagination.
- **Components:** `ProductCard`, `FilterSidebar`, `PaginationComponent`, `EmptyStateComponent`.
- **API Endpoints:**
  - `GET /api/Products` (with query params: `query`, `categoryId`, `subCategoryId`, `workshopId`, `minPrice`, `maxPrice`, `sortBy`, `pageNumber`, `pageSize`)
  - `GET /api/Categories`
  - `GET /api/Categories/{id}/subcategories`
- **Interactions:** View mode toggle (Large Grid, Compact Grid, List). Change filters triggers route update and API call.
- **Validation:** Minimum price cannot exceed maximum price.
- **Empty States:** "No products found matching your criteria" if results are empty.

### 3.3 Product Details
- **Purpose:** View full product information, configure options, and add to cart.
- **Route:** `/products/{id}`
- **User Role:** Customer / Guest
- **UI Sections:** Image Gallery (Carousel), 3D Viewer toggle, Title/Price, Configuration Options (Materials/Attributes), Quantity Selector, Add to Cart Button, Favorite Toggle, Description (Expandable), Related Products, Reviews.
- **Components:** `ThreeDViewerComponent`, `ProductReviewsComponent`.
- **API Endpoints:**
  - `GET /api/Products/{id}`
  - `GET /api/Reviews/product/{id}`
  - `GET /api/Reviews/product/{id}/rating`
- **Interactions:** Select swatches updates `finalPrice`. Swipe/click gallery images. Toggle 3D AR mode. Add to cart updates local state and triggers sync.
- **Error States:** 404 sets `notFound` state (shows "Product Not Found").

### 3.4 Shopping Cart
- **Purpose:** Review selected items before checkout.
- **Route:** `/cart`
- **User Role:** Customer (Guest data syncs upon login)
- **UI Sections:** Cart Items List, Order Summary (Subtotal, Shipping, Tax, Discount, Total), Checkout Button.
- **API Endpoints:**
  - `GET /api/Cart`
  - `POST /api/Cart/items`
  - `PUT /api/Cart/items/{id}`
  - `DELETE /api/Cart/items/{id}`
  - `DELETE /api/Cart` (Clear)
- **Interactions:** Change quantity (+/-), Remove item, Clear cart.
- **Empty States:** "Your cart is empty" with "Continue Shopping" button.

### 3.5 Checkout Form
- **Purpose:** Provide shipping and billing info to place an order.
- **Route:** `/checkout`
- **User Role:** Customer (Auth Required)
- **UI Sections:** Contact Info Form, Address Selection/Creation, Order Summary, Payment Method (Paymob).
- **API Endpoints:**
  - `GET /api/Profile` (Load existing addresses/contact info)
  - `PUT /api/Profile/update` (Save new address)
  - `POST /api/Orders` (Submit checkout payload)
- **Validation Rules:** First/Last name (min 2 chars), Valid Email, Valid Phone, Building/Street/City/Country required for new address.
- **Interactions:** Select existing address or add new (saves to profile). Submit redirects to Paymob secure iFrame (`paymentUrl`).
- **Success/Error:** On success, clears cart and redirects to `/payment/success` or `/orders/{id}`. On failure, shows network/validation alert.

### 3.6 Orders History
- **Purpose:** Track past and current orders.
- **Route:** `/orders`
- **User Role:** Customer
- **UI Sections:** Order List, Status Badges, Share Transformation Button.
- **API Endpoints:** `GET /api/Orders` (via OrdersFacade)
- **Interactions:** View details, Share transformation (navigates to `/share-transformation?orderId={id}`).

### 3.7 Favorites
- **Purpose:** Manage saved products.
- **Route:** `/favorites`
- **User Role:** Customer / Guest (Local Storage)
- **API Endpoints:**
  - `GET /api/Favorites`
  - `POST /api/Favorites/{productId}`
  - `DELETE /api/Favorites/{productId}`
- **Behavior:** Fetches latest product details (price/name/stock) overriding backend snapshot. Syncs local storage to backend upon login.

### 3.8 Profile
- **Purpose:** Manage user details and addresses.
- **Route:** `/profile`
- **User Role:** Customer
- **UI Sections:** Personal Details, Address Book, Change Password.
- **API Endpoints:**
  - `GET /api/Profile`
  - `PUT /api/Profile/update`
  - `PUT /api/Profile/change-password`
  - `PUT /api/Profile/image` (Multipart upload)

### 3.9 AI Design Workflow
#### 3.9.1 Room Upload
- **Purpose:** Initiate the AI design session.
- **Route:** `/ai/rooms` -> `/ai/room-upload`
- **User Role:** Customer (Requires Room Session Guard)
- **UI Sections:** Drag & Drop Upload Zone, Dimension Inputs (Width, Length, Height).
- **API Endpoints:** `POST /api/RoomDesign/upload` (Multipart with image, w, l, h)
- **Validation:** Dimensions >= 1. File size <= 10MB. Must be image.
- **Navigation:** On success, stores `roomId` and `imageUrl` in session state, routes to `/ai/ai-chat`.

#### 3.9.2 AI Chat Interface
- **Purpose:** Interact with AI and view generated designs.
- **Route:** `/ai/ai-chat`
- **UI Sections:**
  - **Chat Panel:** Text/Voice input, Message history.
  - **Generated Room:** Shows uploaded image. Once AI responds with `imageUrl`, shows Before/After Slider.
  - **Product Sidebar:** (Appears dynamically based on AI recommendations).
  - **Modals:** Design Summary, Inspiration Analysis.
- **API Endpoints:**
  - `POST /api/Ai/chat` (Request: `userId, message, conversationId`)
  - `POST /api/Ai/chat/voice` (Multipart audio upload)
- **Interactions:** AI responds with `reply` and optional `imageUrl`. Updating `imageUrl` triggers the Before/After slider automatically. Voice sends `.wav` blob.

---

## 4. Vendor Screens & Workflows

### 4.1 Vendor Dashboard
- **Purpose:** Overview of store performance.
- **Route:** `/vendor/dashboard`
- **User Role:** Vendor
- **UI Sections:** KPI Cards, Revenue/Orders Line Chart (Chart.js), Active/Archived Doughnut Chart, Recent Reviews List.
- **API Endpoints:**
  - `GET /api/VendorOrders/orders/filter` (Aggregates live KPIs/Charts locally to ensure accuracy)
  - `GET /api/Products/my-products/stats`
  - `GET /api/Products/my-products/top`
  - `GET /api/VendorReviews`
- **Interactions:** Toggle Revenue/Orders chart tabs. Inline reply to reviews, report reviews.

### 4.2 Vendor Orders
- **Purpose:** Manage customer orders.
- **Route:** `/vendor/orders`
- **User Role:** Vendor
- **API Endpoints:**
  - `POST /api/VendorOrders/orders/filter`
  - `GET /api/VendorOrders/orders/{orderId}`
  - `PUT /api/VendorOrders/orders/{orderId}/status`
  - `PUT /api/VendorOrders/orders/{orderId}/propose-date`
- **Business Logic (Status Transitions):** Enforces strict state machine:
  `Pending` -> `AwaitingCustomerApproval` -> `PendingPayment` -> `Confirmed` -> `InProgress` -> `Shipped` -> `Delivered`.

### 4.3 Vendor Products
- **Purpose:** Manage product catalog.
- **Route:** `/vendor/products`
- **User Role:** Vendor
- **API Endpoints:**
  - `GET /api/Products/my-products`
  - `POST /api/Products`
  - `PUT /api/Products/{id}`
  - `DELETE /api/Products/{id}`
  - `POST /api/Products/{productId}/images` (Uploads sequentially, single file per request)
  - `PUT /api/Products/{productId}/images/{imageId}/primary`
  - `PUT /api/Products/{id}/status` (Toggle Active)
  - `POST /api/Products/{productId}/3d-model`

### 4.4 Vendor Materials/Options
- **API Endpoints:**
  - `GET /api/VendorMaterials`
  - `POST /api/VendorMaterials/Groups`
  - `POST /api/VendorMaterials/Groups/{groupId}/Options`

---

## 5. State Management & Services
- **Signals:** The application relies heavily on Angular Signals (`signal`, `computed`, `effect`) for state (e.g., `CartService`, `RoomDesignSessionService`, `ProductService`).
- **Cart Sync:** Local storage is used to cache cart items. The application syncs `PendingSyncs` to the backend when a user authenticates.
- **Translations:** Managed by `TranslationService` with `en` / `ar` support, driving RTL/LTR layout changes dynamically.
- **Notifications:** SignalR Hub (`NotificationHubService`) integration for real-time alerts.

---

## 6. Development Rules
- **No Inventions:** Only implement features, screens, and fields explicitly documented above and present in the Angular web app.
- **API as Source of Truth:** Use ASP.NET Core request/response schemas exactly as they are defined.
- **Unknowns:** Any granular detail not verifiable (e.g., specific Push Notification payloads) is marked as *Unknown*.

---

## 7. Mobile Development (Capacitor)

This project has been configured to build as a native Android application using Capacitor without modifying the existing Angular Server-Side Rendering (SSR) architecture.

### Automatic File Copy (`index.csr.html` → `index.html`)

**Why it is required:**
The Angular SSR builder (`@angular/build:application`) outputs `index.csr.html` as the Client-Side Rendering fallback. Capacitor, running in a native WebView, has no Node.js server and must boot from a standard `index.html`. 

**How it works:**
Instead of altering the global Angular architecture (which would break web SSR), we automated a file copy step using Node.js. The `build:mobile` script compiles the app and seamlessly copies `index.csr.html` to `index.html` within the build output directory so Capacitor can consume it immediately.

### Mobile Npm Scripts

Use the following dedicated scripts for mobile development:

- **Build the web version:**
  ```bash
  npm run build
  ```
  *(Standard Angular build. Does not prepare Capacitor).*

- **Build the mobile version:**
  ```bash
  npm run build:mobile
  ```
  *(Compiles the Angular project and automatically handles the `index.html` file copy).*

- **Build and Sync Capacitor:**
  ```bash
  npm run mobile:sync
  ```
  *(Runs `build:mobile`, then syncs the generated assets into the Android native project folder).*

- **Open Android Studio:**
  ```bash
  npm run mobile:open
  ```
  *(Opens the `android/` directory in Android Studio so you can manage native configurations or SDKs).*

- **Run on a physical Android device:**
  ```bash
  npm run mobile:run
  ```
  *(Runs `build:mobile`, compiles the native Android APK using Gradle, and launches the app on a connected physical device or emulator).*
