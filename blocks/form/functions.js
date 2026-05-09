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
 * On success → navigates to the next wizard panel.
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
};
