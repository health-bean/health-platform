# CustomFoodForm Component

A comprehensive form component for creating custom foods when users can't find what they're looking for in the standard food database.

## Features

- **Required Fields**: Food name (displayName) is required
- **Optional Fields**: Category, subcategory
- **Trigger Properties**: All 14 trigger properties with level selectors
  - Nightshade (boolean checkbox)
  - 13 level-based properties (none, low, moderate, high, very_high, unknown)
- **Form Validation**: Client-side validation for required fields
- **API Integration**: Calls POST /api/foods/custom endpoint
- **Success/Error Handling**: Displays success and error messages
- **Auto-clear**: Form clears after successful submission
- **Responsive Design**: Mobile-first responsive layout

## Props

```typescript
interface CustomFoodFormProps {
  onSuccess?: (food: any) => void;  // Callback when food is created successfully
  onCancel?: () => void;             // Callback for cancel action (shows cancel button if provided)
  className?: string;                // Additional CSS classes
}
```

## Usage

### Basic Usage

```tsx
import { CustomFoodForm } from "@/components/foods/CustomFoodForm";

function MyComponent() {
  return (
    <CustomFoodForm
      onSuccess={(food) => {
        console.log("Created food:", food);
      }}
    />
  );
}
```

### With Cancel Button

```tsx
<CustomFoodForm
  onSuccess={(food) => {
    console.log("Created:", food);
    // Close modal, refresh list, etc.
  }}
  onCancel={() => {
    // Handle cancel action
    closeModal();
  }}
/>
```

### In a Modal

```tsx
import { Modal } from "@/components/ui/Modal";
import { CustomFoodForm } from "@/components/foods/CustomFoodForm";

function AddCustomFoodModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <CustomFoodForm
        onSuccess={(food) => {
          onClose();
          refreshFoodList();
        }}
        onCancel={onClose}
      />
    </Modal>
  );
}
```

### Integration with Food Search

```tsx
function FoodSearch() {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  if (searchResults.length === 0 && searchQuery) {
    return (
      <div>
        <p>No foods found. Create a custom food?</p>
        <button onClick={() => setShowCustomForm(true)}>
          Add Custom Food
        </button>
        {showCustomForm && (
          <CustomFoodForm
            onSuccess={(food) => {
              setSearchResults([food]);
              setShowCustomForm(false);
            }}
            onCancel={() => setShowCustomForm(false)}
          />
        )}
      </div>
    );
  }

  return <FoodSearchResults results={searchResults} />;
}
```

## Form Fields

### Required Fields

- **Food Name** (`displayName`): Text input, required

### Optional Fields

- **Category**: Dropdown with predefined categories
  - Vegetables, Fruits, Proteins, Grains, Dairy, Nuts & Seeds, Legumes, Oils & Fats, Beverages, Herbs & Spices, Other
- **Subcategory**: Free text input for more specific categorization

### Trigger Properties

All properties default to "unknown" and can be set to specific levels:

1. **Nightshade**: Boolean checkbox (Yes/No)
2. **Histamine**: Level selector (unknown, none, low, moderate, high, very_high)
3. **Oxalate**: Level selector
4. **Lectin**: Level selector
5. **FODMAP**: Level selector
6. **Salicylate**: Level selector
7. **Amines**: Level selector
8. **Glutamates**: Level selector
9. **Sulfites**: Level selector
10. **Goitrogens**: Level selector
11. **Purines**: Level selector
12. **Phytoestrogens**: Level selector
13. **Phytates**: Level selector
14. **Tyramine**: Level selector

## API Integration

The component calls the `/api/foods/custom` endpoint:

**Request:**
```json
{
  "displayName": "Homemade Bone Broth",
  "category": "Proteins",
  "subcategory": "Beef",
  "properties": {
    "nightshade": false,
    "histamine": "low",
    "oxalate": "none",
    "lectin": "unknown",
    // ... other properties
  }
}
```

**Response:**
```json
{
  "success": true,
  "food": {
    "id": "uuid",
    "userId": "uuid",
    "displayName": "Homemade Bone Broth",
    "category": "Proteins",
    "subcategory": "Beef",
    "isArchived": false,
    "properties": { /* ... */ },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Validation

- **Client-side**: Food name is required (enforced by HTML5 required attribute and button disabled state)
- **Server-side**: API validates displayName is not empty
- **Error Display**: Errors are shown in a red alert box above the form

## Success Handling

After successful creation:
1. Success message is displayed in a green alert box
2. Form is cleared and reset to default values
3. `onSuccess` callback is called with the created food object
4. User can immediately create another food or close the form

## Styling

- Uses Tailwind CSS for styling
- Mobile-first responsive design
- Consistent with other Pico Health components
- Color-coded form sections (trigger properties in slate-50 background)
- Focus states and hover effects for accessibility

## Accessibility

- Proper label associations with `htmlFor` attributes
- Required field indicators with asterisks
- Keyboard navigation support
- Focus states on all interactive elements
- Semantic HTML structure

## Related Components

- **FoodPropertyCard**: Displays trigger properties for existing foods
- **FoodSearchInput**: Search component that can integrate with CustomFoodForm
- **ProtocolComplianceWarning**: Shows warnings for non-compliant foods

## Requirements Satisfied

- **Requirement 18.1**: Offers custom food creation when search returns no matches
- **Requirement 18.2**: Collects food name (required), category, and optional properties
- **Requirement 18.3**: Saves custom foods with user_id to database
- **Requirement 18.5**: Allows users to manage custom foods (creation part)

## Future Enhancements

- Add image upload for custom foods
- Suggest similar foods during creation
- Bulk import from CSV
- Share custom foods with community (opt-in)
- Nutritional information fields (calories, macros, etc.)
