import React from "react";
import { Routes, Route } from "react-router-dom";
import ExpenseListView from "./components/ExpenseListView";
import ExpenseCreateView from "./components/ExpenseCreateView";
import ExpenseEditView from "./components/ExpenseEditView";

const Expenses = () => {
  return (
    <Routes>
      <Route path="/" element={<ExpenseListView />} />
      <Route path="/create" element={<ExpenseCreateView />} />
      <Route path="/edit/:id" element={<ExpenseEditView />} />
    </Routes>
  );
};

export default Expenses;
