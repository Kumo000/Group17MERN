import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {lazy, Suspense} from "react"; //lazy loading for better performance

const Login = lazy(() => import("./pages/Login"));
const Verify = lazy(() => import("./pages/Verify"));
const Signup = lazy(() => import("./pages/Signup"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const JobSearchPage = lazy(() => import("./pages/JobSearchPage"));
const EmployerProfile = lazy(() => import("./pages/EmployerProfile"));
const ApplicantProfile = lazy(() => import("./pages/ApplicantProfile"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
// import Login from "./pages/Login";
// import Verify from "./pages/Verify";
// import Signup from "./pages/Signup";
// import ProfilePage from "./pages/ProfilePage";
// import JobSearchPage from "./pages/JobSearchPage";
// import EmployerProfile from "./pages/EmployerProfile";
// import ApplicantProfile from "./pages/ApplicantProfile";
// import ForgotPassword from "./pages/ForgotPassword";
// import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <Router>
      <Suspense fallback={null}>
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
      </Suspense>
    </Router>
  );
}

export default App;
