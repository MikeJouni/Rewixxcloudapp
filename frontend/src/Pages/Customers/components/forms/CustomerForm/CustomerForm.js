import React, { useState, useEffect, useRef } from "react";
import { US_STATES } from "./USStates";
import { formatPhoneNumber } from "./PhoneFormatter";
import { validateForm, parseServerError } from "./FormValidation";
import FormField from "./FormField";

const CustomerForm = ({ onSubmit, onCancel, initialData = null, isLoading = false, error = null }) => {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      username: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zip: "",
    }
  );

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const formRef = useRef(null);

  // Removed auto-scroll effect as it's not needed in modal

  // Parse server error and set specific field errors
  useEffect(() => {
    if (error) {
      const { errors: parsedErrors, serverError: parsedServerError } = parseServerError(error);
      setErrors(parsedErrors);
      setServerError(parsedServerError);
    } else {
      setErrors({});
      setServerError(null);
    }
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "zip" && !/^\d{0,5}$/.test(value)) return;
    if (["name", "city"].includes(name) && /\d/.test(value)) return;

    let processedValue = value;
    
    // Format phone number
    if (name === "phone") {
      processedValue = formatPhoneNumber(value);
    }

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validateForm(formData);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  return (
    <div ref={formRef}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Name */}
        <FormField
          label="Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          required
          disabled={isLoading}
        />

        {/* Email */}
        <FormField
          label="Email"
          name="username"
          type="email"
          value={formData.username}
          onChange={handleInputChange}
          error={errors.username}
          required
          disabled={isLoading}
        />

        {/* Phone */}
        <FormField
          label="Phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange}
          error={errors.phone}
          required
          disabled={isLoading}
        />

        {/* Address Line 1 */}
        <FormField
          label="Address Line 1"
          name="addressLine1"
          type="text"
          value={formData.addressLine1}
          onChange={handleInputChange}
          required
          disabled={isLoading}
        />

        {/* Address Line 2 */}
        <FormField
          label="Address Line 2"
          name="addressLine2"
          type="text"
          value={formData.addressLine2}
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {/* City, State, ZIP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* City */}
          <FormField
            label="City"
            name="city"
            type="text"
            value={formData.city}
            onChange={handleInputChange}
            error={errors.city}
            required
            disabled={isLoading}
          />

          {/* State */}
          <FormField
            label="State"
            name="state"
            type="select"
            value={formData.state}
            onChange={handleInputChange}
            error={errors.state}
            required
            disabled={isLoading}
            options={US_STATES}
          />

          {/* ZIP */}
          <FormField
            label="ZIP"
            name="zip"
            type="text"
            value={formData.zip}
            onChange={handleInputChange}
            error={errors.zip}
            required
            disabled={isLoading}
          />
        </div>

        {/* Server-side error */}
        {serverError && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
            {serverError}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (initialData ? "Updating..." : "Adding...") : (initialData ? "Update Customer" : "Add Customer")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
