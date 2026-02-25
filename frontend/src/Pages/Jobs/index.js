import React from "react";
import { Routes, Route } from "react-router-dom";
import JobsListView from "./components/JobsListView";
import JobsCreateView from "./components/JobsCreateView";

const JobsPage = () => {
  return (
    <Routes>
      <Route index element={<JobsListView />} />
      <Route path="create" element={<JobsCreateView />} />
    </Routes>
  );
};

export default JobsPage;
