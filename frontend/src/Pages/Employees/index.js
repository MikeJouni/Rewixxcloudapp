import React from "react";
import { Routes, Route } from "react-router-dom";
import EmployeeListView from "./components/EmployeeListView";
import EmployeeCreateView from "./components/EmployeeCreateView";
import EmployeeEditView from "./components/EmployeeEditView";

const Employees = () => {
  return (
    <Routes>
      <Route path="/" element={<EmployeeListView />} />
      <Route path="/create" element={<EmployeeCreateView />} />
      <Route path="/edit/:id" element={<EmployeeEditView />} />
    </Routes>
  );
};

export default Employees;
