export const formatPhoneNumber = (value) => {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '');
  
  // Don't format if empty or too long
  if (phoneNumber.length === 0) return '';
  if (phoneNumber.length > 10) return value;
  
  // Format based on length
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
  }
};
