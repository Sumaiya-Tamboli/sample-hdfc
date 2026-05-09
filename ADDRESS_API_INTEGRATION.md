# Address Details API Integration Guide

This guide explains how to fetch and populate address details from Aadhaar API in your AEM Forms.

## Overview

The address integration system automatically fetches Aadhaar address details and populates form fields based on user selection. It includes:

1. **Utility Functions** (`functions.js`) - API calls and data formatting
2. **Form Decorator** (`form.js`) - UI integration and event handling
3. **Automatic Population** - Maps API data to form fields

## Features

✅ Fetch address from Aadhaar API  
✅ Display formatted address  
✅ Radio button selection for address type  
✅ Auto-populate permanent/current address fields  
✅ Support for "Both" or "None" options  
✅ Loading states and error handling  
✅ Mutation observer for dynamic forms

## Implementation

### 1. HTML Structure Required

Your form must have these elements with specific CSS classes:

```html
<fieldset class="field-address-details panel-wrapper" 
          data-id="panelcontainer-f9019d4306" 
          data-visible="true" 
          id="panelcontainer-f9019d4306" 
          name="address_details">
  
  <legend class="field-label">Address Details</legend>
  
  <!-- Display area for address -->
  <div class="field-aadhaar-address-display plain-text-wrapper" 
       data-id="text-2416fb0f1c" 
       id="text-2416fb0f1c">
    <p>Address as per Aadhaar records<br></p>
  </div>
  
  <!-- Radio group for address type selection -->
  <fieldset class="field-aadhaar-address-type radio-group-wrapper" 
            data-id="radiobutton-343c5172e8" 
            id="radiobutton-343c5172e8" 
            name="aadhaar_address_type">
    
    <legend class="field-label">Is the customer's Aadhaar address:</legend>
    
    <div class="radio-wrapper">
      <input type="radio" value="permanent_address" name="aadhaar_address_type">
      <label>Permanent Address</label>
    </div>
    
    <div class="radio-wrapper">
      <input type="radio" value="current_address" name="aadhaar_address_type">
      <label>Current Address</label>
    </div>
    
    <div class="radio-wrapper">
      <input type="radio" value="both" name="aadhaar_address_type">
      <label>Both</label>
    </div>
    
    <div class="radio-wrapper">
      <input type="radio" value="none" name="aadhaar_address_type">
      <label>None</label>
    </div>
  </fieldset>
</fieldset>
```

### 2. Form Fields for Address Population

The system expects fields with these naming conventions:

**For Permanent Address:**
- `permanent_address_line_1`
- `permanent_address_line_2`
- `permanent_landmark`
- `permanent_city`
- `permanent_state`
- `permanent_pincode`

**For Current Address:**
- `current_address_line_1`
- `current_address_line_2`
- `current_landmark`
- `current_city`
- `current_state`
- `current_pincode`

Example:
```html
<input type="text" name="permanent_address_line_1" />
<input type="text" name="permanent_city" />
<input type="text" name="current_address_line_1" />
```

### 3. API Endpoint

Create an API endpoint at `http://localhost:3000/api/fetch-aadhaar-address`:

```javascript
// Example Node.js Express endpoint
app.post('/api/fetch-aadhaar-address', async (req, res) => {
  const { aadhaarNumber, mobileNumber } = req.body;
  
  try {
    // Your Aadhaar API integration here
    const addressData = await fetchFromAadhaarAPI(aadhaarNumber, mobileNumber);
    
    res.json({
      success: true,
      address: {
        fullAddress: 'B/H Fame Theatre 21, Shri Ram Bungalow, Kalpataru Nagar, Ashoka Colony, Kharar (West), Mumbai - 422022',
        addressLine1: 'B/H Fame Theatre 21',
        addressLine2: 'Shri Ram Bungalow, Kalpataru Nagar',
        landmark: 'Ashoka Colony',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '422022',
        addressType: 'both' // or 'permanent_address', 'current_address', 'none'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch address'
    });
  }
});
```

### 4. API Response Format

The API must return this JSON structure:

```json
{
  "success": true,
  "address": {
    "fullAddress": "Complete formatted address string",
    "addressLine1": "Building/House number, Street",
    "addressLine2": "Area, Locality",
    "landmark": "Near landmark",
    "city": "City name",
    "state": "State name",
    "pincode": "123456",
    "addressType": "both"
  }
}
```

**Address Type Values:**
- `permanent_address` - Only permanent address
- `current_address` - Only current address  
- `both` - Same for both addresses
- `none` - Not matching either address

## How It Works

### Flow Diagram

```
1. Form loads with address panel
   ↓
2. Panel becomes visible (wizard navigation)
   ↓
3. Auto-fetch triggered
   ↓
4. Get Aadhaar + Mobile from form
   ↓
5. Call API endpoint
   ↓
6. Display formatted address
   ↓
7. Pre-select radio button (if addressType provided)
   ↓
8. User selects address type
   ↓
9. Populate form fields based on selection
```

### Key Functions

#### `fetchAadhaarAddress(aadhaarNumber, mobile)`
Fetches address from API.

```javascript
const response = await fetchAadhaarAddress('123456789012', '9876543210');
if (response.success) {
  console.log(response.address);
}
```

#### `formatAddressDisplay(address)`
Formats address object into display string.

```javascript
const formatted = formatAddressDisplay({
  addressLine1: 'B/H Fame Theatre 21',
  addressLine2: 'Shri Ram Bungalow',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '422022'
});
// Returns: "B/H Fame Theatre 21, Shri Ram Bungalow, Mumbai, Maharashtra, - 422022"
```

#### `populateAddressFields(form, address, fieldPrefix)`
Populates form fields with address data.

```javascript
// Populate permanent address fields
populateAddressFields(form, addressData, 'permanent');

// Populate current address fields
populateAddressFields(form, addressData, 'current');
```

## Customization

### Change Field Name Mappings

Edit the `populateAddressFields` function in `functions.js`:

```javascript
const fieldMappings = {
  addressLine1: `${fieldPrefix}_address_line_1`,  // Change these
  addressLine2: `${fieldPrefix}_address_line_2`,
  landmark: `${fieldPrefix}_landmark`,
  city: `${fieldPrefix}_city`,
  state: `${fieldPrefix}_state`,
  pincode: `${fieldPrefix}_pincode`,
};
```

### Change API Endpoint

Update `OTP_API_BASE` in `functions.js`:

```javascript
const OTP_API_BASE = 'https://your-api-domain.com';
```

### Custom Field Selectors

Modify the selector in `decorateAadhaarAddressDetails`:

```javascript
// Default
const aadhaarInput = form.querySelector('.field-aadhaar-number input');

// Custom
const aadhaarInput = form.querySelector('input[name="custom_aadhaar_field"]');
```

## Testing

### Mock API Response

For testing without a real API, the system falls back to showing:
```
"Unable to fetch address. Please enter manually."
```

### Test with Mock Data

Create a simple mock endpoint:

```javascript
app.post('/api/fetch-aadhaar-address', (req, res) => {
  res.json({
    success: true,
    address: {
      fullAddress: 'B/H Fame Theatre 21, Shri Ram Bungalow, Kalpataru Nagar, Ashoka Colony, Kharar (West), Mumbai - 422022',
      addressLine1: 'B/H Fame Theatre 21',
      addressLine2: 'Shri Ram Bungalow, Kalpataru Nagar',
      landmark: 'Ashoka Colony',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '422022',
      addressType: 'both'
    }
  });
});
```

## Troubleshooting

### Address not fetching

**Check:**
1. Is the `.field-address-details` panel visible?
2. Are Aadhaar and mobile fields populated?
3. Is API endpoint accessible?
4. Check browser console for errors

**Debug:**
```javascript
// Add to decorateAadhaarAddressDetails
console.log('Aadhaar:', aadhaarInput?.value);
console.log('Mobile:', mobileInput?.value);
console.log('API Response:', response);
```

### Fields not populating

**Check:**
1. Field name attributes match conventions
2. Address data is stored in `addressPanel.dataset.addressData`
3. Radio button value matches expected values

**Debug:**
```javascript
// In radio change handler
console.log('Selected type:', selectedType);
console.log('Address data:', addressData);
console.log('Parsed address:', address);
```

### Panel not visible

**Check:**
1. `data-visible="true"` attribute
2. CSS `display` property
3. Wizard navigation state

## Error Handling

The system includes built-in error handling:

1. **Missing fields** - Warns in console, doesn't crash
2. **API failure** - Shows error message, allows manual entry
3. **Invalid response** - Gracefully handles and shows fallback
4. **Network errors** - Catches and logs, shows user-friendly message

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never expose Aadhaar API credentials** in client-side code
2. **Always use server-side proxy** for Aadhaar API calls
3. **Validate and sanitize** all inputs
4. **Use HTTPS** for all API communications
5. **Implement rate limiting** on your API endpoint
6. **Log all access attempts** for audit purposes

## Browser Support

✅ Chrome 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+

**Requirements:**
- ES6+ support
- Fetch API
- Mutation Observer
- Async/Await

## Additional Resources

- [AEM Forms Documentation](https://experienceleague.adobe.com/docs/experience-manager-65/forms/home.html)
- [Aadhaar API Documentation](https://uidai.gov.in/)
- [MDN Mutation Observer](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)

## Support

For issues or questions:
1. Check console for error messages
2. Verify API endpoint is responding
3. Test with mock data first
4. Review field naming conventions
