import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Verify from "./pages/Verify";
import Signup from "./pages/Signup";
import ProfilePage from "./pages/ProfilePage";
import JobSearchPage from "./pages/JobSearchPage";
import EmployerProfile from "./pages/EmployerProfile";
import ApplicantProfile from "./pages/ApplicantProfile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/jobs" element={<JobSearchPage />} />
	<Route path="/employerProfile" element={<EmployerProfile />} />
	<Route path="/applicantProfile" element={<ApplicantProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
