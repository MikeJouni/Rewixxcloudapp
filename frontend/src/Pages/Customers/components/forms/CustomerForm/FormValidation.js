export const validateForm = (formData) => {
  const errors = {};

  // Required field validation
  if (!formData.name || formData.name.trim() === "") {
    errors.name = "Name is required.";
  }

  if (!formData.username || formData.username.trim() === "") {
    errors.username = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username)) {
    errors.username = "Please enter a valid email address.";
  }

  if (!formData.phone || formData.phone.trim() === "") {
    errors.phone = "Phone is required.";
  }

  if (!formData.addressLine1 || formData.addressLine1.trim() === "") {
    errors.addressLine1 = "Address Line 1 is required.";
  }

  if (!formData.city || formData.city.trim() === "") {
    errors.city = "City is required.";
  }

  if (!formData.state || formData.state.trim() === "") {
    errors.state = "State is required.";
  }

  if (!formData.zip || formData.zip.trim() === "") {
    errors.zip = "ZIP is required.";
  }

  // Format validation (only if field has value)
  if (formData.zip && !/^\d{5}$/.test(formData.zip)) {
    errors.zip = "ZIP must be exactly 5 digits.";
  }

  if (formData.phone) {
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!/^\d{10}$/.test(phoneDigits)) {
      errors.phone = "Phone must be exactly 10 digits.";
    }
  }

  // City validation (no numbers)
  if (formData.city && /\d/.test(formData.city)) {
    errors.city = "City must not contain numbers.";
  }

  return errors;
};

export const parseServerError = (error) => {
  const newErrors = {};
  let serverError = null;
  
  // Check if it's a 400 error with validation details
  if (error.response?.status === 400) {
    const errorData = error.response.data;
    let message = '';
    
    // Handle different error response formats
    if (typeof errorData === 'string') {
      message = errorData.toLowerCase();
    } else if (errorData && errorData.message) {
      message = errorData.message.toLowerCase();
    } else if (errorData && errorData.errors) {
      // Handle field-specific validation errors
      errorData.errors.forEach(err => {
        if (err.field === 'username') {
          newErrors.username = err.message;
        } else if (err.field === 'phone') {
          newErrors.phone = err.message;
        } else {
          newErrors[err.field] = err.message;
        }
      });
      return { errors: newErrors, serverError: null };
    } else {
      serverError = "Validation failed. Please check your input.";
      return { errors: {}, serverError };
    }
    
    // Parse the message for specific errors
    if (message === 'email already exists') {
      newErrors.username = "Email already exists. Please use a different email address.";
    } else if (message === 'phone number already exists') {
      newErrors.phone = "Phone number already exists. Please use a different phone number.";
    } else if (message.includes('email') && message.includes('already exists')) {
      newErrors.username = "Email already exists. Please use a different email address.";
    } else if (message.includes('phone') && message.includes('already exists')) {
      newErrors.phone = "Phone number already exists. Please use a different phone number.";
    } else if (message.includes('username') && message.includes('already exists')) {
      newErrors.username = "Email already exists. Please use a different email address.";
    } else {
      // Generic validation error - show the actual message
      serverError = typeof errorData === 'string' ? errorData : errorData.message || "Validation failed. Please check your input.";
    }
  } else {
    serverError = error.message || "An error occurred while saving the customer.";
  }
  
  return { errors: newErrors, serverError };
};
