# Vendor Marketplace API Documentation

> **Target Audience:** Frontend Development Team  
> **Version:** 1.0.0

---

## 1. INTRODUCTION

Welcome to the Vendor Marketplace API Documentation. This system is a **Vendor-Driven Marketplace** built using ASP.NET Core Web API with an Onion Architecture. 

### Architecture Summary
The backend follows Onion Architecture principles, ensuring a clean separation of concerns among the Domain, Application, Infrastructure, and Presentation (API/MVC) layers. However, as frontend consumers, you only interact with the Presentation layer (the RESTful APIs).

### Marketplace Behavior (Vendor-Driven & Instant Publish)
The marketplace is designed to empower vendors. A critical feature of this system is **instant publishing**:
- When a vendor creates a product, it is immediately live and visible to customers.
- There is **no approval workflow** or pending status.
- Administrators perform **post-moderation** only (they can hide/unhide products if they violate platform policies).
- Pricing is highly dynamic, calculated as `BasePrice + Options (PriceDelta)`.

---

## 2. AUTHENTICATION & AUTHORIZATION

All protected endpoints require a standard JSON Web Token (JWT) provided in the `Authorization` header.

**Header Format:**
```http
Authorization: Bearer <your_jwt_token>
```

### Roles
The system utilizes Role-Based Access Control (RBAC) with three primary roles:
1. **Customer**: Can browse products, manage their cart, and place orders.
2. **Vendor**: Can manage their own products, materials, and options.
3. **Admin**: Can perform post-moderation (hide/unhide) and view all platform data.

---

## 3. PRODUCT APIs

Products are the core entities in the system. **Remember: Products are instantly visible to the public upon creation.**

### `POST /api/Products`
Creates a new product. (Requires **Vendor** role).

**Request Body:**
```json
{
  "productTypeId": 45,
  "categoryId": 1,
  "subCategoryId": 11,
  "nameAr": "كرسي مكتب مريح",
  "nameEn": "Ergonomic Office Chair",
  "descriptionAr": "كرسي قابل للتعديل مع دعم للظهر.",
  "descriptionEn": "Adjustable chair with lumbar support.",
  "basePrice": 199.99,
  "isActive": true,
  "materialOptions": [
    { "vendorMaterialOptionId": 301, "priceOption": 0.00 },
    { "vendorMaterialOptionId": 302, "priceOption": 50.00 }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": 101,
  "productTypeId": 45,
  "productTypeNameAr": "كراسي",
  "productTypeNameEn": "Chairs",
  "subCategoryId": 11,
  "subCategoryNameAr": "مكتب",
  "subCategoryNameEn": "Office",
  "categoryId": 1,
  "categoryNameAr": "أثاث",
  "categoryNameEn": "Furniture",
  "nameAr": "كرسي مكتب مريح",
  "nameEn": "Ergonomic Office Chair",
  "descriptionAr": "كرسي قابل للتعديل مع دعم للظهر.",
  "descriptionEn": "Adjustable chair with lumbar support.",
  "isActive": true,
  "basePrice": 199.99,
  "workshopId": 5,
  "isHidden": false,
  "materialGroups": [
    {
      "id": 2,
      "nameAr": "نوع القماش",
      "nameEn": "Fabric Type",
      "options": [
        {
          "id": 301,
          "vendorMaterialGroupId": 2,
          "valueAr": "شبك قياسي",
          "valueEn": "Standard Mesh",
          "priceOption": 0.00
        },
        {
          "id": 302,
          "vendorMaterialGroupId": 2,
          "valueAr": "جلد طبيعي فاخر",
          "valueEn": "Premium Leather",
          "priceOption": 50.00
        }
      ]
    }
  ]
}
```

### `GET /api/Products`
Retrieves a paginated list of public products. (Publicly accessible).

**Request Parameters:**
- `search` (string, optional - Searches product titles and descriptions)
- `categoryId` (int, optional)
- `subCategoryId` (int, optional)
- `productTypeId` (int, optional)
- `minPrice` (decimal, optional)
- `maxPrice` (decimal, optional)
- `material` (string, optional)
- `workshopId` (int, optional)
- `isActive` (bool, optional)
- `pageNumber` (int, optional, default: 1)
- `pageSize` (int, optional, default: 10)

**Response (200 OK):**
```json
{
  "totalItems": 150,
  "pageNumber": 1,
  "pageSize": 10,
  "data": [
    {
      "id": 101,
      "nameAr": "كرسي مكتب مريح",
      "nameEn": "Ergonomic Office Chair",
      "descriptionAr": "كرسي قابل للتعديل مع دعم للظهر.",
      "descriptionEn": "Adjustable chair with lumbar support.",
      "basePrice": 199.99,
      "isHidden": false,
      "productTypeId": 45,
      "productTypeNameAr": "كراسي",
      "productTypeNameEn": "Chairs",
      "subCategoryId": 11,
      "subCategoryNameAr": "مكتب",
      "subCategoryNameEn": "Office",
      "categoryId": 1,
      "categoryNameAr": "أثاث",
      "categoryNameEn": "Furniture",
      "workshopId": 5,
      "workshopNameAr": "ورشة النجارة الحديثة",
      "workshopNameEn": "Modern Carpentry Workshop",
      "createdAt": "2026-06-16T12:00:00Z",
      "isActive": true,
      "mainImageUrl": "/images/products/chair.jpg"
    }
  ]
}
```

### `GET /api/Products/{id}`
Retrieves detailed information about a specific product, including available options. (Publicly accessible).

**Response (200 OK):**
```json
{
  "id": 101,
  "nameAr": "كرسي مكتب مريح",
  "nameEn": "Ergonomic Office Chair",
  "descriptionAr": "كرسي قابل للتعديل مع دعم للظهر.",
  "descriptionEn": "Adjustable chair with lumbar support.",
  "productTypeId": 45,
  "productTypeNameAr": "كراسي",
  "productTypeNameEn": "Chairs",
  "subCategoryId": 11,
  "subCategoryNameAr": "مكتب",
  "subCategoryNameEn": "Office",
  "categoryId": 1,
  "categoryNameAr": "أثاث",
  "categoryNameEn": "Furniture",
  "createdAt": "2026-06-16T12:00:00Z",
  "isActive": true,
  "isHidden": false,
  "basePrice": 199.99,
  "workshopId": 5,
  "workshopNameAr": "ورشة النجارة الحديثة",
  "workshopNameEn": "Modern Carpentry Workshop",
  "workshopLogoUrl": "/images/logos/workshop5.jpg",
  "workshopRating": 4.5,
  "workshopIsVerified": true,
  "images": [
    {
      "id": 201,
      "imageUrl": "/images/products/chair.jpg",
      "isPrimary": true
    }
  ],
  "attributes": [
    {
      "id": 10,
      "nameAr": "نوع القماش",
      "nameEn": "Fabric Type",
      "values": [
        { "id": 301, "valueAr": "شبك قياسي", "valueEn": "Standard Mesh", "priceDelta": 0 },
        { "id": 302, "valueAr": "جلد طبيعي فاخر", "valueEn": "Premium Leather", "priceDelta": 50.00 }
      ]
    }
  ],
  "materialGroups": [
    {
      "id": 2,
      "nameAr": "نوع القماش",
      "nameEn": "Fabric Type",
      "options": [
        {
          "id": 301,
          "vendorMaterialGroupId": 2,
          "valueAr": "شبك قياسي",
          "valueEn": "Standard Mesh",
          "priceOption": 0.00
        },
        {
          "id": 302,
          "vendorMaterialGroupId": 2,
          "valueAr": "جلد طبيعي فاخر",
          "valueEn": "Premium Leather",
          "priceOption": 50.00
        }
      ]
    }
  ]
}
```

### `PUT /api/Products/{id}`
Updates an existing product's details. (Requires **Vendor** role, must own the product).

**Request Body:**
```json
{
  "productTypeId": 45,
  "categoryId": 1,
  "subCategoryId": 11,
  "nameAr": "كرسي مكتب مريح V2",
  "nameEn": "Ergonomic Office Chair V2",
  "descriptionAr": "كرسي قابل للتعديل مع دعم أفضل للظهر.",
  "descriptionEn": "Updated adjustable chair with better lumbar support.",
  "basePrice": 219.99,
  "isActive": true,
  "materialOptions": [
    { "vendorMaterialOptionId": 301, "priceOption": 0.00 }
  ],
  "attributes": [
    {
      "nameAr": "نوع القماش",
      "nameEn": "Fabric Type",
      "values": [
        { "valueAr": "شبك قياسي", "valueEn": "Standard Mesh", "priceDelta": 0 }
      ]
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "id": 101,
  "productTypeId": 45,
  "productTypeNameAr": "كراسي",
  "productTypeNameEn": "Chairs",
  "subCategoryId": 11,
  "subCategoryNameAr": "مكتب",
  "subCategoryNameEn": "Office",
  "categoryId": 1,
  "categoryNameAr": "أثاث",
  "categoryNameEn": "Furniture",
  "nameAr": "كرسي مكتب مريح V2",
  "nameEn": "Ergonomic Office Chair V2",
  "descriptionAr": "كرسي قابل للتعديل مع دعم أفضل للظهر.",
  "descriptionEn": "Updated adjustable chair with better lumbar support.",
  "isActive": true,
  "basePrice": 219.99,
  "workshopId": 5,
  "isHidden": false,
  "materialGroups": [
    {
      "id": 2,
      "nameAr": "نوع القماش",
      "nameEn": "Fabric Type",
      "options": [
        {
          "id": 301,
          "vendorMaterialGroupId": 2,
          "valueAr": "شبك قياسي",
          "valueEn": "Standard Mesh",
          "priceOption": 0.00
        }
      ]
    }
  ]
}
```

### `DELETE /api/Products/{id}`
Deactivates or deletes a product. (Requires **Vendor** role, must own the product).

**Response (200 OK):**
```json
{
  "message": "Product deleted successfully"
}
```

---

## 4. VENDOR MATERIAL / OPTIONS APIs

Vendors can manage reusable attributes or materials that act as customizable options for their products. These options can alter the final price using a `PriceDelta`.

### `POST /api/VendorMaterials/Groups`
Creates a new material group (e.g., "Wood Type", "Fabric Color"). (Requires **Vendor** role).

**Request Body:**
```json
{
  "nameAr": "نوع الخشب",
  "nameEn": "Wood Type"
}
```

**Response (200 OK):**
```json
{
  "id": 40,
  "workshopId": 5,
  "nameAr": "نوع الخشب",
  "nameEn": "Wood Type",
  "options": []
}
```

### `POST /api/VendorMaterials/Groups/{groupId}/Options`
Adds a specific option to a material group. (Requires **Vendor** role).

**Request Body:**
```json
{
  "valueAr": "خشب جوز فاخر",
  "valueEn": "Premium Walnut Finish",
  "priceDelta": 150.00
}
```

**Response (200 OK):**
```json
{
  "id": 305,
  "vendorMaterialGroupId": 40,
  "valueAr": "خشب جوز فاخر",
  "valueEn": "Premium Walnut Finish",
  "priceDelta": 150.00
}
```

### `GET /api/VendorMaterials`
Retrieves all materials and options for the currently logged-in vendor's workshop. (Requires **Vendor** role).

**Response (200 OK):**
```json
[
  {
    "id": 40,
    "workshopId": 5,
    "nameAr": "نوع الخشب",
    "nameEn": "Wood Type",
    "options": [
      {
        "id": 305,
        "vendorMaterialGroupId": 40,
        "valueAr": "خشب جوز فاخر",
        "valueEn": "Premium Walnut Finish",
        "priceDelta": 150.00
      },
      {
        "id": 306,
        "vendorMaterialGroupId": 40,
        "valueAr": "سنديان قياسي",
        "valueEn": "Standard Oak",
        "priceDelta": 0
      }
    ]
  }
]
```

### `DELETE /api/VendorMaterials/Groups/{groupId}`
Deletes an entire material group. (Requires **Vendor** role).

**Response (204 No Content):**
*(No body returned)*

### `DELETE /api/VendorMaterials/Options/{optionId}`
Deletes a specific option. (Requires **Vendor** role).

**Response (204 No Content):**
*(No body returned)*

---

## 5. CATEGORY APIs

The platform uses a strict hierarchy for categorization to facilitate AI suggestions and precise filtering.

**Hierarchy:** `Category` ➔ `SubCategory` ➔ `ProductType` ➔ `Product`

### `GET /api/Categories`
Retrieves top-level categories.

**Response (200 OK):**
```json
[
  { 
    "id": 1, 
    "nameAr": "أثاث", 
    "nameEn": "Furniture",
    "imageUrl": "/images/categories/furniture.jpg"
  },
  { 
    "id": 2, 
    "nameAr": "إلكترونيات", 
    "nameEn": "Electronics",
    "imageUrl": "/images/categories/electronics.jpg"
  }
]
```

### `GET /api/SubCategories/category/{categoryId}`
Retrieves subcategories belonging to a specific category.

**Response (200 OK):**
```json
[
  { 
    "id": 10, 
    "nameAr": "غرفة المعيشة", 
    "nameEn": "Living Room",
    "categoryId": 1,
    "categoryNameAr": "أثاث",
    "categoryNameEn": "Furniture"
  },
  { 
    "id": 11, 
    "nameAr": "مكتب", 
    "nameEn": "Office",
    "categoryId": 1,
    "categoryNameAr": "أثاث",
    "categoryNameEn": "Furniture"
  }
]
```

### `GET /api/ProductTypes/subcategory/{subCategoryId}`
Retrieves product types belonging to a specific subcategory.

**Response (200 OK):**
```json
[
  { 
    "id": 45, 
    "nameAr": "مكاتب", 
    "nameEn": "Desks",
    "subCategoryId": 11,
    "subCategoryNameAr": "مكتب",
    "subCategoryNameEn": "Office",
    "categoryId": 1,
    "categoryNameAr": "أثاث",
    "categoryNameEn": "Furniture"
  },
  { 
    "id": 46, 
    "nameAr": "كراسي", 
    "nameEn": "Chairs",
    "subCategoryId": 11,
    "subCategoryNameAr": "مكتب",
    "subCategoryNameEn": "Office",
    "categoryId": 1,
    "categoryNameAr": "أثاث",
    "categoryNameEn": "Furniture"
  }
]
```

---

## 6. CART APIs

The shopping cart relies on dynamic pricing based on the selected options. The cart stores references (`OptionIds`) and calculates the total price on the fly.

### `GET /api/Cart`
Retrieves the user's current cart, including computed dynamic prices. (Requires authenticated user).

**Response (200 OK):**
```json
{
  "id": 99,
  "userId": "user-guid-xyz",
  "totalPrice": 599.97,
  "items": [
    {
      "id": 501,
      "productId": 101,
      "productNameAr": "كرسي مكتب مريح",
      "productNameEn": "Ergonomic Office Chair",
      "vendorNameEn": "Modern Carpentry Workshop",
      "vendorNameAr": "ورشة النجارة الحديثة",
      "cachedPrice": 199.99,
      "livePrice": 199.99,
      "isPriceStale": false,
      "quantity": 3,
      "totalPrice": 599.97,
      "variantImageUrl": "/images/products/chair.jpg",
      "selectedAttributes": [
        {
          "attributeNameAr": "نوع القماش",
          "attributeNameEn": "Fabric Type",
          "valueAr": "شبك قياسي",
          "valueEn": "Standard Mesh"
        }
      ],
      "productImages": ["/images/products/chair.jpg"]
    }
  ]
}
```

### `POST /api/Cart/items`
Adds a product to the cart with the user's chosen options. (Requires authenticated user).

**Request Body:**
```json
{
  "productId": 101,
  "selectedOptionIds": [302],
  "quantity": 2
}
```

**Response (200 OK):**
```json
{
  "message": "Item added to cart",
  "data": {
    "id": 501,
    "productId": 101,
    "productNameAr": "كرسي مكتب مريح",
    "productNameEn": "Ergonomic Office Chair",
    "vendorNameEn": "Modern Carpentry Workshop",
    "vendorNameAr": "ورشة النجارة الحديثة",
    "cachedPrice": 249.99,
    "livePrice": 249.99,
    "isPriceStale": false,
    "quantity": 2,
    "totalPrice": 499.98,
    "variantImageUrl": "/images/products/chair.jpg",
    "selectedAttributes": [
      {
        "attributeNameAr": "نوع القماش",
        "attributeNameEn": "Fabric Type",
        "valueAr": "جلد طبيعي فاخر",
        "valueEn": "Premium Leather"
      }
    ],
    "productImages": ["/images/products/chair.jpg"]
  }
}
```

### `PUT /api/Cart/items`
Updates the quantity for an existing cart item. Note: This updates the item by its ID directly.

**Request Body:**
```json
{
  "cartItemId": 501,
  "quantity": 3
}
```

**Response (200 OK):**
```json
{
  "message": "Cart item updated"
}
```

### `DELETE /api/Cart/items/{id}`
Removes an item from the cart by its CartItem ID.

**Response (200 OK):**
```json
{
  "message": "Item removed from cart"
}
```

---

## 7. ORDER APIs

When a cart is checked out, an order is created. 
**Crucial Concept - Snapshots:** Orders are immutable. The system takes a permanent snapshot of the product's `BasePrice`, the selected options' `PriceDelta`, and the final calculated total at the exact moment of checkout. Future changes to vendor prices will *not* affect past orders.

### `POST /api/Order`
Converts the active cart into a confirmed order. (Requires authenticated user).

**Request Body:**
```json
{
  "address": "123 Main St, Cairo, Egypt",
  "phoneNumber": "+201234567890",
  "notes": "Deliver during weekdays"
}
```

**Response (200 OK):**
```json
{
  "message": "Order created successfully",
  "data": {
    "id": 9001,
    "userId": "user-guid-xyz",
    "totalPrice": 599.97,
    "status": "Pending",
    "address": "123 Main St, Cairo, Egypt",
    "phoneNumber": "+201234567890",
    "notes": "Deliver during weekdays",
    "createdAt": "2026-06-16T12:00:00Z",
    "paymentStatus": "Unpaid",
    "paymentUrl": "https://stripe.com/checkout/pay/xyz",
    "items": [
      {
        "id": 801,
        "productId": 101,
        "productNameAr": "كرسي مكتب مريح",
        "productNameEn": "Ergonomic Office Chair",
        "vendorName": "ورشة النجارة الحديثة",
        "unitPrice": 199.99,
        "quantity": 3,
        "totalPrice": 599.97,
        "attributes": [
          {
            "nameAr": "نوع القماش",
            "nameEn": "Fabric Type",
            "valueAr": "شبك قياسي",
            "valueEn": "Standard Mesh"
          }
        ]
      }
    ],
    "statusHistory": [
      {
        "id": 12,
        "oldStatus": "None",
        "newStatus": "Pending",
        "createdAt": "2026-06-16T12:00:00Z"
      }
    ]
  }
}
```

### `GET /api/Order/my-orders`
Retrieves the logged-in user's order history. (Requires authenticated user).

**Response (200 OK):**
```json
[
  {
    "id": 9001,
    "userId": "user-guid-xyz",
    "totalPrice": 599.97,
    "status": "Pending",
    "address": "123 Main St, Cairo, Egypt",
    "phoneNumber": "+201234567890",
    "notes": "Deliver during weekdays",
    "createdAt": "2026-06-16T12:00:00Z",
    "paymentStatus": "Unpaid",
    "paymentUrl": "https://stripe.com/checkout/pay/xyz",
    "items": [
      {
        "id": 801,
        "productId": 101,
        "productNameAr": "كرسي مكتب مريح",
        "productNameEn": "Ergonomic Office Chair",
        "vendorName": "ورشة النجارة الحديثة",
        "unitPrice": 199.99,
        "quantity": 3,
        "totalPrice": 599.97,
        "attributes": [
          {
            "nameAr": "نوع القماش",
            "nameEn": "Fabric Type",
            "valueAr": "شبك قياسي",
            "valueEn": "Standard Mesh"
          }
        ]
      }
    ],
    "statusHistory": [
      {
        "id": 12,
        "oldStatus": "None",
        "newStatus": "Pending",
        "createdAt": "2026-06-16T12:00:00Z"
      }
    ]
  }
]
```

### `GET /api/Order/{id}`
Retrieves detailed snapshot data for a specific order. (Requires authenticated user).

**Response (200 OK):**
*(Returns a single Order object matching the structure of `data` in the POST response)*

---

## 8. ADMIN APIs

Administrators monitor the marketplace and handle violations via post-moderation. They do not approve products beforehand.

### `PATCH /api/admin/products/{id}/hide`
Hides a product from public view. (Requires **Admin** role).

**Response (200 OK):**
```json
{
  "id": 101,
  "isHidden": true
}
```

### `PATCH /api/admin/products/{id}/unhide`
Restores a hidden product to public view. (Requires **Admin** role).

**Response (200 OK):**
```json
{
  "id": 101,
  "isHidden": false
}
```

### `GET /api/admin/products`
Retrieves all products on the platform, including hidden ones, for moderation purposes. (Requires **Admin** role).

**Request Parameters:**
- `search` (string, optional)
- `categoryId` (int, optional)
- `subCategoryId` (int, optional)
- `productTypeId` (int, optional)
- `vendorId` (string, optional)
- `isHidden` (bool, optional)
- `pageNumber` (int, optional, default: 1)
- `pageSize` (int, optional, default: 10)

**Response (200 OK):**
```json
{
  "totalItems": 1000,
  "pageNumber": 1,
  "pageSize": 10,
  "data": [
    {
      "id": 101,
      "nameAr": "كرسي مكتب مريح",
      "nameEn": "Ergonomic Office Chair",
      "categoryName": "Furniture",
      "vendorName": "John Doe",
      "price": 199.99,
      "isHidden": true,
      "isActive": true,
      "createdAt": "2026-06-16T12:00:00Z",
      "mainImageUrl": "/images/products/chair.jpg"
    }
  ]
}
```

---

## 9. FILTERING & SEARCH

The `GET /api/Products` endpoint supports extensive filtering via query parameters. 

**Supported Query Parameters:**
- `categoryId` (int) - Filter by category
- `subCategoryId` (int) - Filter by subcategory
- `productTypeId` (int) - Filter by product type
- `minPrice` (decimal) - Minimum price
- `maxPrice` (decimal) - Maximum price
- `material` (string) - Filters by description contents matching the material name
- `workshopId` (int) - Filter by workshop
- `isActive` (bool) - Filter by active status
- `search` (string) - Searches product titles (`NameAr`, `NameEn`) and descriptions.

**Filtering Strategy:** Provide these parameters in the query string. The backend uses an intersection (`AND` logic) for disparate filter types. 

---

## 10. BUSINESS RULES SUMMARY

To ensure frontend logic aligns perfectly with the backend, adhere to these business rules:

1. **Instant Publishing:** Never show a "Pending Approval" UI state for vendors. Products are live instantly.
2. **Post-Moderation:** Only admins can hide products. Vendors cannot see a "Waiting for Admin" status.
3. **Dynamic Pricing:** Always display the price dynamically based on `BasePrice + SUM(Option PriceDeltas)`.
4. **Order Immutability:** When viewing order history, display the snapshot prices returned by the Order API; do not attempt to recalculate prices using current product data.
5. **Categorization:** Force users/vendors to navigate the hierarchy: Category ➔ SubCategory ➔ ProductType.
