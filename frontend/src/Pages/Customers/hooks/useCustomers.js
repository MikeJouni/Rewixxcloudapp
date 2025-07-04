import { useState, useMemo } from "react";

const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const addCustomer = (customerData) => {
    const newCustomer = {
      id: customers.length + 1,
      ...customerData,
      dateAdded: new Date().toISOString().split("T")[0],
    };
    setCustomers([...customers, newCustomer]);
  };

  const updateCustomer = (customerData) => {
    setCustomers(
      customers.map((customer) =>
        customer.id === customerData.id ? customerData : customer
      )
    );
    setEditingCustomer(null);
  };

  const deleteCustomer = (customerId) => {
    setCustomers(customers.filter((customer) => customer.id !== customerId));
  };

  const startEditing = (customer) => {
    setEditingCustomer(customer);
  };

  const cancelEditing = () => {
    setEditingCustomer(null);
  };

  return {
    customers,
    filteredCustomers,
    searchTerm,
    setSearchTerm,
    editingCustomer,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    startEditing,
    cancelEditing,
  };
};

export default useCustomers;
