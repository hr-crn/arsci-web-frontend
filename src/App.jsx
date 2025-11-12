import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "@/layouts";


import { SignIn } from "./pages/auth";
import { LockModule } from "./pages/dashboard/lock-module";

import ProtectedRoute from "@/components/ProtectedRoute";

import { Sections } from "./pages/dashboard/section";
// Importing components from the pages directory.

function App() {
  return (
    <Routes>
     <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      <Route path="/auth/sign-in" element={<SignIn />} />
      
      
      <Route path="/lock-module/:sectionSlug" element={<LockModule />} />
      
      <Route path="/section" element={<Sections />} />
      <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
    </Routes>
  );
}

export default App;
