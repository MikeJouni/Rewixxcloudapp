import React from "react";

const FormField = ({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange, 
  error, 
  required = false, 
  disabled = false,
  options = null,
  placeholder = ""
}) => {
  const baseClasses = `w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`;
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && "*"}
      </label>
      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={baseClasses}
          disabled={disabled}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={baseClasses}
          disabled={disabled}
          placeholder={placeholder}
        />
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default FormField;
