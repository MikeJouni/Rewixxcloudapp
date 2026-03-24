import React from "react";
import { Routes, Route } from "react-router-dom";
import CustomerListView from "./components/CustomerListView";
import CustomerCreateView from "./components/CustomerCreateView";
import CustomerEditView from "./components/CustomerEditView";

const CustomersPage = () => {
  return (
    <Routes>
      <Route index element={<CustomerListView />} />
      <Route path="create" element={<CustomerCreateView />} />
      <Route path=":id" element={<CustomerEditView />} />
    </Routes>
  );
};

export default CustomersPage;
