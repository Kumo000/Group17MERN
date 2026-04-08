import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Verify from "./pages/Verify";
import Signup from "./pages/Signup";
import ProfilePage from "./pages/ProfilePage";
import JobSearchPage from "./pages/JobSearchPage";
import EmployerProfile from "./pages/EmployerProfile";
import ApplicantProfile from "./pages/ApplicantProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/jobs" element={<JobSearchPage />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/employerProfile" element={<EmployerProfile />} />
        <Route path="/applicantProfile" element={<ApplicantProfile />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
