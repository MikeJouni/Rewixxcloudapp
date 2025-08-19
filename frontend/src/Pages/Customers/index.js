import React from "react";
import { Routes, Route } from "react-router-dom";
import CustomerListView from "./components/CustomerListView";
import CustomerCreateView from "./components/CustomerCreateView";

const CustomersPage = () => {
  return (
    <Routes>
      <Route index element={<CustomerListView />} />
      <Route path="create" element={<CustomerCreateView />} />
    </Routes>
  );
};

export default CustomersPage;
