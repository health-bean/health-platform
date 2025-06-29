# API Reference

## Overview

The Health Platform API provides endpoints for managing health protocols, timeline entries, and user data.

**Base URL:** `https://9ob6wg0l1e.execute-api.us-east-1.amazonaws.com/dev`
**Current Status:** Active Development

## Authentication

**Current:** Development phase - mixed authentication requirements
**Production Plan:** JWT Bearer token authentication

## Working Endpoints (4)


### GET /api/v1/protocols

**Description:** Get available health protocols  
**Response Time:** 1318ms  
**Status:** 200

**Response Example:**
```json
{
  "protocols": [
    {
      "id": "1495844a-19de-404c-a288-7660eda0cbe1",
      "name": "AIP Core",
      "description": "Autoimmune Protocol - Elimination Phase. Removes nightshades, grains, legumes, dairy, eggs, nuts, seeds, and certain spices.",
      "category": null,
      "phases": null,
      "official": true,
      "version": "1.0"
    },
    {
      "id": "34236e47-3e54-49fa-99a4-797dbcf66c2d",
      "name": "AIP Modified",
      "description": "Modified Autoimmune Protocol with selective reintroductions and personalized modifications.",
      "category": "aip",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "b0c3b21c-f32c-4ac4-8afa-251d2819c3c0",
      "name": "Elimination Diet",
      "description": "Systematic food elimination and reintroduction",
      "category": "elimination",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "a80be547-6db1-4722-a5a4-60930143a2d9",
      "name": "Low FODMAP",
      "description": "Eliminates fermentable carbohydrates to manage IBS and digestive symptoms.",
      "category": "low_fodmap",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "51ca7a24-4691-4629-8ee5-c20876e68c29",
      "name": "Low Histamine",
      "description": "Reduces histamine-rich foods to manage histamine intolerance and allergic reactions.",
      "category": "low_histamine",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "fd2c2435-48ea-4d5d-9d04-6fe5b8ac3b0c",
      "name": "Low Lectin",
      "description": "Avoids lectin-rich foods to reduce digestive inflammation and autoimmune triggers.",
      "category": "low_lectin",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "12f1d4f1-f56a-48a3-b936-41026014656b",
      "name": "Low Oxalate",
      "description": "Limits oxalate-containing foods to prevent kidney stones and reduce inflammation.",
      "category": "low_oxalate",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "40b6955c-fd3b-4aba-846b-03caa7119ff9",
      "name": "No Nightshades",
      "description": "Removes nightshade vegetables to reduce inflammation in sensitive individuals.",
      "category": "no_nightshades",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "46de08fb-03bf-4032-b507-122bb934ecb9",
      "name": "Paleo",
      "description": "Paleolithic diet focusing on whole foods, excluding grains, legumes, and processed foods.",
      "category": "paleo",
      "phases": null,
      "official": false,
      "version": "1.0"
    },
    {
      "id": "5cd8f8c7-3cbb-4405-ab88-a253ff7c907b",
      "name": "Whole30",
      "description": "30-day elimination program removing sugar, alcohol, grains, legumes, and dairy.",
      "category": "whole30",
      "phases": null,
      "official": false,
      "version": "1.0"
    }
  ],
  "total": 10
}
```

**Data Structure:**
- `protocols`: array[10]
- `total`: number


### GET /api/v1/timeline/entries

**Description:** Get timeline entries  
**Response Time:** 113ms  
**Status:** 200

**Response Example:**
```json
{
  "entries": [
    {
      "id": "8c3aa9d0-c77d-4a79-baff-78d63c7999b7",
      "entry_time": "23:10:00",
      "entry_type": "food",
      "content": "bell peppers",
      "severity": null,
      "protocol_compliant": true,
      "created_at": "2025-06-29T03:10:38.187Z",
      "entry_date": "2025-06-29T00:00:00.000Z"
    },
    {
      "id": "569773b6-2d9a-4e69-ac1f-83223e5a3016",
      "entry_time": "11:26:00",
      "entry_type": "food",
      "content": "bell peppers",
      "severity": null,
      "protocol_compliant": true,
      "created_at": "2025-06-25T15:27:33.117Z",
      "entry_date": "2025-06-25T00:00:00.000Z"
    },
    {
      "id": "a3aaeee9-b4e3-408d-9581-f10923553124",
      "entry_time": "22:13:00",
      "entry_type": "food",
      "content": "spinach",
      "severity": null,
      "protocol_compliant": true,
      "created_at": "2025-06-24T02:14:29.362Z",
      "entry_date": "2025-06-24T00:00:00.000Z"
    },
    {
      "id": "859b401a-1aba-4651-b035-d7d2645685a9",
      "entry_time": "12:01:00",
      "entry_type": "food",
      "content": "bell peppers",
      "severity": null,
      "protocol_compliant": true,
      "created_at": "2025-06-24T16:01:42.791Z",
      "entry_date": "2025-06-24T00:00:00.000Z"
    },
    {
      "id": "f276261e-639b-4873-b7e7-2733422092da",
      "entry_time": "18:12:00",
      "entry_type": "food",
      "content": "bell peppers, chicken",
      "severity": null,
      "protocol_compliant": true,
      "created_at": "2025-06-24T00:52:01.206Z",
      "entry_date": "2025-06-23T00:00:00.000Z"
    },
    {
      "id": "41407a3d-2361-427a-9a3c-2f5ccade110f",
      "entry_time": "17:03:00",
      "entry_type": "food",
      "content": "chicken",
      "severity": null,
      "protocol_compliant": true,
      "created_at": "2025-06-23T21:05:21.273Z",
      "entry_date": "2025-06-23T00:00:00.000Z"
    },
    {
      "id": "58aa9ffe-619d-4fda-a11f-85869508685d",
      "entry_time": "14:12:00",
      "entry_type": "food",
      "content": "chicken",
      "severity": null,
      "protocol_compliant": true,
      "created_at": "2025-06-23T18:12:54.061Z",
      "entry_date": "2025-06-23T00:00:00.000Z"
    },
    {
      "id": "59b262b0-ee30-4140-b250-66ca92fd6db8",
      "entry_time": "10:30:00",
      "entry_type": "food",
      "content": "test food entry",
      "severity": null,
      "protocol_compliant": true,
      "created_at": "2025-06-23T01:32:42.162Z",
      "entry_date": "2025-06-23T00:00:00.000Z"
    }
  ],
  "total": 8
}
```

**Data Structure:**
- `entries`: array[8]
- `total`: number


### GET /api/v1/users

**Description:** Get user data  
**Response Time:** 52ms  
**Status:** 200

**Response Example:**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "patient@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient",
    "tenantId": "123e4567-e89b-12d3-a456-426614174001"
  }
}
```

**Data Structure:**
- `user`: object


### GET /api/v1/timeline/entries?date=2025-06-29

**Description:** Get timeline entries with date filter  
**Response Time:** 56ms  
**Status:** 200

**Response Example:**
```json
{
  "entries": [
    {
      "id": "8c3aa9d0-c77d-4a79-baff-78d63c7999b7",
      "entry_time": "23:10:00",
      "entry_type": "food",
      "content": "bell peppers",
      "severity": null,
      "protocol_compliant": true,
      "created_at": "2025-06-29T03:10:38.187Z",
      "entry_date": "2025-06-29T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Data Structure:**
- `entries`: array[1]
- `total`: number


## Protected Endpoints (5)

These endpoints require authentication in production:

- **GET /api/v1/foods** - Get food database
- **GET /api/v1/journal** - Get journal entries
- **GET /api/v1/user-preferences** - Get user preferences
- **GET /api/v1/exposure-types** - Get exposure types
- **GET /api/v1/detox-types** - Get detox types

## Performance Metrics

- **Average Response Time:** 385ms
- **Success Rate:** 44%

## Error Handling

### Common HTTP Status Codes
- **200:** Success
- **400:** Bad Request - Invalid parameters
- **401:** Unauthorized - Authentication required
- **403:** Forbidden - Access denied
- **404:** Not Found - Endpoint or resource not found
- **500:** Internal Server Error

### Error Response Format
```json
{
  "error": "Human readable error message",
  "code": "ERROR_CODE", 
  "status": "error"
}
```

## Rate Limiting

- **Development:** No rate limiting
- **Production:** 1000 requests per hour per authenticated user

## Testing

### Automated Testing
```bash
# Test all endpoints
npm run analyze-api
```

### Manual Testing
```bash
# Test working endpoints
curl https://9ob6wg0l1e.execute-api.us-east-1.amazonaws.com/dev/api/v1/protocols

# Test with authentication (when available)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://9ob6wg0l1e.execute-api.us-east-1.amazonaws.com/dev/api/v1/user-preferences
```

---

*API documentation is automatically generated from live endpoint testing.*
