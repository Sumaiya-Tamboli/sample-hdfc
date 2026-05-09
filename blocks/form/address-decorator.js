import { fetchAadhaarAddress, formatAddressDisplay, populateAddressFields } from './functions.js';

export default function decorateAadhaarAddressDetails(form) {
  console.log('Address decorator initialized');
  
  function wire() {
    const addressPanel = form.querySelector('.field-address-details');
    console.log('Address panel found:', !!addressPanel);
    
    if (!addressPanel || addressPanel.dataset.addressWired) return;

    const displayWrapper = addressPanel.querySelector('.field-aadhaar-address-display');
    const radioGroup = addressPanel.querySelector('.field-aadhaar-address-type');
    
    console.log('Display wrapper found:', !!displayWrapper);
    console.log('Radio group found:', !!radioGroup);
    
    if (!displayWrapper || !radioGroup) return;

    addressPanel.dataset.addressWired = 'true';

    // Function to fetch and display address
    async function fetchAndDisplayAddress() {
      console.log('Fetching address...');
      
      // Get Aadhaar number from form
      const aadhaarInput = form.querySelector('.field-aadhaar-number input, input[name="aadhaar_number"]');
      const mobileInput = form.querySelector('.field-mobile-number input, input[name="mobile_number"]');

      console.log('Aadhaar input:', aadhaarInput?.value);
      console.log('Mobile input:', mobileInput?.value);

      if (!aadhaarInput?.value || !mobileInput?.value) {
        console.warn('Aadhaar or mobile number not available');
        return;
      }

      // Show loading state
      const displayP = displayWrapper.querySelector('p');
      if (displayP) {
        displayP.innerHTML = '<p>Loading address...<br></p>';
      }

      try {
        // Fetch address from API
        const response = await fetchAadhaarAddress(
          aadhaarInput.value,
          mobileInput.value
        );

        console.log('API Response:', response);

        if (response.success && response.address) {
          // Display the address
          const formattedAddress = formatAddressDisplay(response.address);
          console.log('Formatted address:', formattedAddress);
          
          if (displayP) {
            displayP.innerHTML = `<p>Address as per Aadhaar records<br>${formattedAddress}</p>`;
          }

          // Store address data for later use
          addressPanel.dataset.addressData = JSON.stringify(response.address);

          // Pre-select radio button if addressType is provided
          if (response.address.addressType) {
            const radioToSelect = radioGroup.querySelector(
              `input[value="${response.address.addressType}"]`
            );
            if (radioToSelect && !radioToSelect.checked) {
              radioToSelect.checked = true;
              radioToSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        } else {
          console.error('API returned unsuccessful response');
          if (displayP) {
            displayP.innerHTML = '<p>Address as per Aadhaar records<br>Unable to fetch address. Please enter manually.</p>';
          }
        }
      } catch (error) {
        console.error('Error fetching address:', error);
        if (displayP) {
          displayP.innerHTML = '<p>Address as per Aadhaar records<br>Error loading address. Please enter manually.</p>';
        }
      }
    }

    // Handle radio button changes to populate address fields
    radioGroup.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (!radio.checked) return;

        const selectedType = radio.value;
        const addressData = addressPanel.dataset.addressData;

        console.log('Radio changed to:', selectedType);
        console.log('Address data available:', !!addressData);

        if (!addressData) return;

        try {
          const address = JSON.parse(addressData);
          
          // Populate fields based on selection
          switch (selectedType) {
            case 'permanent_address':
              populateAddressFields(form, address, 'permanent');
              break;
            case 'current_address':
              populateAddressFields(form, address, 'current');
              break;
            case 'both':
              populateAddressFields(form, address, 'permanent');
              populateAddressFields(form, address, 'current');
              break;
            case 'none':
              console.log('User selected none - manual entry required');
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Error parsing address data:', error);
        }
      });
    });

    // Auto-fetch address when panel becomes visible
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-visible') {
          console.log('Panel visibility changed to:', addressPanel.dataset.visible);
          if (addressPanel.dataset.visible === 'true' && !addressPanel.dataset.addressFetched) {
            addressPanel.dataset.addressFetched = 'true';
            fetchAndDisplayAddress();
          }
        }
      });
    });

    observer.observe(addressPanel, { attributes: true });

    // Also fetch if already visible
    if (addressPanel.dataset.visible !== 'false' && getComputedStyle(addressPanel).display !== 'none') {
      console.log('Panel already visible, fetching address immediately');
      if (!addressPanel.dataset.addressFetched) {
        addressPanel.dataset.addressFetched = 'true';
        fetchAndDisplayAddress();
      }
    }
  }

  wire();
  const observer = new MutationObserver(() => wire());
  observer.observe(form, { childList: true, subtree: true });
}
