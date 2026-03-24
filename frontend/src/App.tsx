import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ApplicantDashboard from "./pages/ApplicantDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* This is your landing page */}
        <Route path="/" element={<LoginPage />} />

        {/* Other pages */}
        <Route path="/applicant" element={<ApplicantDashboard />} />
        <Route path="/employer" element={<EmployerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
