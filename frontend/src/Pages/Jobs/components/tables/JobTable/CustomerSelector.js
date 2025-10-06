import React from "react";

const CustomerSelector = ({
  customers,
  filteredCustomers,
  customerSearchTerm,
  showDropdown,
  onSearchChange,
  onCustomerSelect,
  onDropdownToggle
}) => {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-600 mb-1">
        Customer *
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder="Search customers..."
          value={customerSearchTerm}
          onChange={(e) => {
            onSearchChange(e.target.value);
            onDropdownToggle(true);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => onCustomerSelect(customer)}
                >
                  {customer.name} ({customer.username})
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-center text-sm">
                {customers.length === 0 
                  ? "No customers available. Please add a customer first." 
                  : "No customers match your search."
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSelector;
