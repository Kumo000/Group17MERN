import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Verify from "./pages/Verify";
import Signup from "./pages/Signup";
import ProfilePage from "./pages/ProfilePage";
import JobSearchPage from "./pages/JobSearchPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/jobs" element={<JobSearchPage />} />
      </Routes>
    </Router>
  );
}

export default App;
