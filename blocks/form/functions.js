/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */
function getFullName(firstname, lastname) {
  return `${firstname} ${lastname}`.trim();
}

/**
 * Custom submit function
 * @param {scope} globals
 */
function submitFormArrayToString(globals) {
  const data = globals.functions.exportData();
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key] = data[key].join(',');
    }
  });
  globals.functions.submitForm(data, true, 'application/json');
}

/**
 * Calculate the number of days between two dates.
 * @param {*} endDate
 * @param {*} startDate
 * @returns {number} returns the number of days between two dates
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // return zero if dates are valid
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
* Masks the first 5 digits of the mobile number with *
* @param {*} mobileNumber
* @returns {string} returns the mobile number with first 5 digits masked
*/
function maskMobileNumber(mobileNumber) {
  if (!mobileNumber) {
    return '';
  }
  const value = mobileNumber.toString();
  // Mask first 5 digits and keep the rest
  return ` ${'*'.repeat(5)}${value.substring(5)}`;
}

const OTP_API_BASE = 'http://localhost:3000';

/**
 * Calls the backend to generate an OTP for the given mobile + DOB.
 * Wire this to your "Send OTP" button click rule.
 * @name generateOtp
 * @param {string} mobile - Mobile number from the form field
 * @param {string} dob - Date of birth from the form field (YYYY-MM-DD)
 * @param {scope} globals - AEM Forms globals (auto-injected by rule engine)
 * @return {void}
 */
async function generateOtp(mobile, dob, globals) {
  try {
    const res = await fetch(`${OTP_API_BASE}/api/generate-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, dob }),
    });
    const data = await res.json();
    if (!res.ok) {
      globalThis.alert(data.message || 'Failed to send OTP. Please try again.');
    }
  } catch {
    globalThis.alert('Network error while sending OTP. Please try again.');
  }
}

/**
 * Validates the OTP entered by the user.
 * On success → navigates to the next wizard panel and stores customer data including address.
 * On failure → marks the OTP field invalid with an error message.
 *
 * Wire this to your "Verify OTP" button click rule:
 *   validateOtp(mobileField, otpField, nextPanel)
 *
 * @name validateOtp
 * @param {string} mobile - Mobile number value
 * @param {string} otp - OTP value entered by user
 * @param {object} nextPanelRef - Reference to the next wizard panel (passed from rule editor)
 * @param {scope} globals - AEM Forms globals (auto-injected by rule engine)
 * @return {void}
 */
async function validateOtp(mobile, otp, nextPanelRef, globals) {
  try {
    const res = await fetch(`${OTP_API_BASE}/api/validate-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestString: {
          mobileNo: String(mobile),
          passwordValue: String(otp),
        },
      }),
    });
    const data = await res.json();

    if (data?.status?.responseCode === '0') {
      // Store customer demographics data including address for later use
      if (data?.responseString?.OfferDemogDetails) {
        const form = globals.form.getElement();
        if (form) {
          // Store the complete customer data on the form element
          form.dataset.customerDemographics = JSON.stringify(data.responseString.OfferDemogDetails);
          
          // Extract and store address data specifically
          const firstOffer = data.responseString.OfferDemogDetails[0];
          if (firstOffer) {
            const addressData = {
              addressLine1: firstOffer.customerAddress1 || '',
              addressLine2: firstOffer.customerAddress2 || '',
              addressLine3: firstOffer.customerAddress3 || '',
              city: firstOffer.customerCity || '',
              state: firstOffer.customerState || '',
              pincode: firstOffer.zipCode || '',
              country: firstOffer.customerCountry || '',
            };
            form.dataset.aadhaarAddress = JSON.stringify(addressData);
          }
        }
      }
      
      globals.functions.navigateTo(nextPanelRef);
    } else {
      const msg = data?.status?.errorDesc || 'Incorrect OTP. Please try again.';
      globals.functions.markFieldAsInvalid(
        globals.field.$qualifiedName,
        msg,
        { useQualifiedName: true },
      );
    }
  } catch {
    globalThis.alert('Network error while verifying OTP. Please try again.');
  }
}

/**
 * Validates PAN card format according to Indian standards
 * Format: ABCPK1234H
 * - First 3: Alphabetic (AAA-ZZZ)
 * - 4th: Type indicator (P/C/H/A/B/T/F/L/J/G)
 * - 5th: First letter of surname/name
 * - Next 4: Numeric (0001-9999)
 * - Last: Alphabetic check digit
 * @name validatePan
 * @param {string} pan - PAN number to validate
 * @return {boolean} - Returns true if valid PAN format
 */
function validatePan(pan) {
  if (!pan || typeof pan !== 'string') return false;

  // Remove spaces and convert to uppercase
  const cleanPan = pan.trim().toUpperCase();

  // Check length
  if (cleanPan.length !== 10) return false;

  // PAN regex pattern
  // ^[A-Z]{3} - First 3 alphabetic characters
  // [PCHABFTLJ] - 4th character: type of holder
  // [A-Z] - 5th character: first letter of name
  // [0-9]{4} - Next 4 numeric digits
  // [A-Z]$ - Last alphabetic check digit
  const panPattern = /^[A-Z]{3}[PCHABFTLJG][A-Z][0-9]{4}[A-Z]$/;

  return panPattern.test(cleanPan);
}

/**
 * Formats PAN input in real-time as user types
 * Converts to uppercase and restricts to valid characters
 * @name formatPanInput
 * @param {string} value - Current input value
 * @return {string} - Formatted PAN value
 */
function formatPanInput(value) {
  if (!value) return '';

  // Convert to uppercase and remove invalid characters
  let formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Limit to 10 characters
  if (formatted.length > 10) {
    formatted = formatted.substring(0, 10);
  }

  return formatted;
}

/**
 * Gets descriptive error message for invalid PAN
 * @name getPanErrorMessage
 * @param {string} pan - PAN number to validate
 * @return {string} - Error message or empty string if valid
 */
function getPanErrorMessage(pan) {
  if (!pan || pan.trim().length === 0) {
    return 'PAN number is required';
  }

  const cleanPan = pan.trim().toUpperCase();

  if (cleanPan.length !== 10) {
    return 'PAN must be exactly 10 characters';
  }

  // Check first 3 characters
  if (!/^[A-Z]{3}/.test(cleanPan)) {
    return 'First 3 characters must be alphabetic (A-Z)';
  }

  // Check 4th character (type indicator)
  if (!/^[A-Z]{3}[PCHABFTLJG]/.test(cleanPan)) {
    return 'Invalid PAN type indicator (4th character)';
  }

  // Check 5th character
  if (!/^[A-Z]{4}[A-Z]/.test(cleanPan)) {
    return '5th character must be alphabetic (A-Z)';
  }

  // Check next 4 numeric digits
  if (!/^[A-Z]{5}[0-9]{4}/.test(cleanPan)) {
    return 'Characters 6-9 must be numeric (0-9)';
  }

  // Check last character
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
    return 'Last character must be alphabetic (A-Z)';
  }

  return ''; // Valid PAN
}

/**
 * Validates email format
 * @name validateEmail
 * @param {string} email - Email to validate
 * @return {boolean} - Returns true if valid email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailPattern = /^([A-Za-z0-9][._]?)+[A-Za-z0-9]@[A-Za-z0-9]+(\.?[A-Za-z0-9]){2}\.([A-Za-z0-9]{2,4})?$/;
  return emailPattern.test(email.trim());
}

/**
 * Extracts domain from email address
 * @name getEmailDomain
 * @param {string} email - Email address
 * @return {string} - Domain part of email (e.g., '@gmail.com')
 */
function getEmailDomain(email) {
  if (!email || typeof email !== 'string') return '';
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return '';
  return email.substring(atIndex);
}

/**
 * Gets username part from email
 * @name getEmailUsername
 * @param {string} email - Email address
 * @return {string} - Username part before @
 */
function getEmailUsername(email) {
  if (!email || typeof email !== 'string') return '';
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return email;
  return email.substring(0, atIndex);
}

/**
 * Generates email OTP for verification
 * @name generateEmailOtp
 * @param {string} email - Email address
 * @return {Promise<object>} - API response
 */
async function generateEmailOtp(email) {
  try {
    const res = await fetch(`${OTP_API_BASE}/api/generate-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
}

/**
 * Validates email OTP
 * @name validateEmailOtp
 * @param {string} email - Email address
 * @param {string} otp - OTP code
 * @return {Promise<object>} - API response
 */
async function validateEmailOtp(email, otp) {
  try {
    const res = await fetch(`${OTP_API_BASE}/api/validate-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
}

/**
 * Fetches address details from Aadhaar API
 * @name fetchAadhaarAddress
 * @param {string} aadhaarNumber - Aadhaar number (12 digits)
 * @param {string} mobile - Mobile number for verification
 * @return {Promise<object>} - Address data with structure:
 *   {
 *     success: boolean,
 *     address: {
 *       fullAddress: string,
 *       addressLine1: string,
 *       addressLine2: string,
 *       landmark: string,
 *       city: string,
 *       state: string,
 *       pincode: string,
 *       addressType: 'permanent_address' | 'current_address' | 'both' | 'none'
 *     }
 *   }
 */
async function fetchAadhaarAddress(aadhaarNumber, mobile) {
  try {
    const res = await fetch(`${OTP_API_BASE}/api/fetch-aadhaar-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadhaarNumber: aadhaarNumber?.replace(/\s/g, ''),
        mobileNumber: mobile,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch address');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching Aadhaar address:', error);
    return {
      success: false,
      message: error.message || 'Network error while fetching address',
    };
  }
}

/**
 * Formats address object into display string
 * @name formatAddressDisplay
 * @param {object} address - Address object with fields
 * @return {string} - Formatted address string
 */
function formatAddressDisplay(address) {
  if (!address) return '';

  const parts = [];

  if (address.addressLine1) parts.push(address.addressLine1);
  if (address.addressLine2) parts.push(address.addressLine2);
  if (address.landmark) parts.push(address.landmark);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.pincode) parts.push(`- ${address.pincode}`);

  return parts.join(', ');
}

/**
 * Populates form fields with address data
 * @name populateAddressFields
 * @param {object} form - Form element
 * @param {object} address - Address data object
 * @param {string} fieldPrefix - Prefix for field names (e.g., 'permanent', 'current')
 */
function populateAddressFields(form, address, fieldPrefix = '') {
  if (!form || !address) return;

  const fieldMappings = {
    addressLine1: `${fieldPrefix}_address_line_1`,
    addressLine2: `${fieldPrefix}_address_line_2`,
    addressLine3: `${fieldPrefix}_address_line_3`,
    city: `${fieldPrefix}_city`,
    state: `${fieldPrefix}_state`,
    pincode: `${fieldPrefix}_pincode`,
  };

  Object.entries(fieldMappings).forEach(([key, fieldName]) => {
    const input = form.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
    if (input && address[key]) {
      input.value = address[key];
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

/**
 * Clears address form fields
 * @name clearAddressFields
 * @param {object} form - Form element
 * @param {string} fieldPrefix - Prefix for field names (e.g., 'permanent', 'current')
 */
function clearAddressFields(form, fieldPrefix = '') {
  if (!form) return;

  const fieldNames = [
    `${fieldPrefix}_address_line_1`,
    `${fieldPrefix}_address_line_2`,
    `${fieldPrefix}_address_line_3`,
    `${fieldPrefix}_city`,
    `${fieldPrefix}_state`,
    `${fieldPrefix}_pincode`,
  ];

  fieldNames.forEach((fieldName) => {
    const input = form.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

// eslint-disable-next-line import/prefer-default-export
export {
  getFullName,
  days,
  submitFormArrayToString,
  maskMobileNumber,
  generateOtp,
  validateOtp,
  validatePan,
  formatPanInput,
  getPanErrorMessage,
  validateEmail,
  getEmailDomain,
  getEmailUsername,
  generateEmailOtp,
  validateEmailOtp,
  fetchAadhaarAddress,
  formatAddressDisplay,
  populateAddressFields,
  clearAddressFields,
};
