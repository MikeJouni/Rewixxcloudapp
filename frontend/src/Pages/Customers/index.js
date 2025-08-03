import React from "react";
import { Routes, Route } from "react-router-dom";
import CustomerListView from "./components/CustomerListView";
import CustomerDetailView from "./components/CustomerDetailView";
import CustomerCreateView from "./components/CustomerCreateView";

const CustomersPage = () => {
  return (
    <Routes>
      <Route index element={<CustomerListView />} />
      <Route path="create" element={<CustomerCreateView />} />
      <Route path=":id" element={<CustomerDetailView />} />
    </Routes>
  );
};

export default CustomersPage;
