import { formatAddressDisplay, populateAddressFields, clearAddressFields } from './functions.js';

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

    // Function to display address from stored API response
    function displayStoredAddress() {
      console.log('Displaying stored address...');
      
      const displayP = displayWrapper.querySelector('p');
      
      // Check if address data was already stored from OTP validation
      const storedAddress = form.dataset.aadhaarAddress;
      
      if (storedAddress) {
        try {
          const addressData = JSON.parse(storedAddress);
          console.log('Found stored address data:', addressData);
          
          // Format and display the address
          const formattedAddress = formatAddressDisplay(addressData);
          console.log('Formatted address:', formattedAddress);
          
          if (displayP) {
            displayP.innerHTML = `<p>Address as per Aadhaar records<br>${formattedAddress}</p>`;
          }

          // Store address data on the panel for radio button handling
          addressPanel.dataset.addressData = storedAddress;
          
          // Pre-select "Both" radio button as default
          const bothRadio = radioGroup.querySelector('input[value="both"]');
          if (bothRadio && !radioGroup.querySelector('input:checked')) {
            bothRadio.checked = true;
            bothRadio.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
        } catch (error) {
          console.error('Error parsing stored address:', error);
          if (displayP) {
            displayP.innerHTML = '<p>Address as per Aadhaar records<br>Unable to load address. Please enter manually.</p>';
          }
        }
      } else {
        console.warn('No stored address data found');
        if (displayP) {
          displayP.innerHTML = '<p>Address as per Aadhaar records<br>Address will be available after OTP verification.</p>';
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
              // Clear fields when 'none' is selected
              clearAddressFields(form, 'permanent');
              clearAddressFields(form, 'current');
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Error parsing address data:', error);
        }
      });
    });

    // Auto-display address when panel becomes visible
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-visible') {
          console.log('Panel visibility changed to:', addressPanel.dataset.visible);
          if (addressPanel.dataset.visible === 'true' && !addressPanel.dataset.addressDisplayed) {
            addressPanel.dataset.addressDisplayed = 'true';
            displayStoredAddress();
          }
        }
      });
    });

    observer.observe(addressPanel, { attributes: true });

    // Also display if already visible
    if (addressPanel.dataset.visible !== 'false' && getComputedStyle(addressPanel).display !== 'none') {
      console.log('Panel already visible, displaying address immediately');
      if (!addressPanel.dataset.addressDisplayed) {
        addressPanel.dataset.addressDisplayed = 'true';
        displayStoredAddress();
      }
    }
    
    // Check for address data changes (when OTP is validated after panel is visible)
    const dataObserver = new MutationObserver(() => {
      if (form.dataset.aadhaarAddress && !addressPanel.dataset.addressDisplayed) {
        addressPanel.dataset.addressDisplayed = 'true';
        displayStoredAddress();
      }
    });
    
    dataObserver.observe(form, { attributes: true, attributeFilter: ['data-aadhaar-address'] });
  }

  wire();
  const observer = new MutationObserver(() => wire());
  observer.observe(form, { childList: true, subtree: true });
}
