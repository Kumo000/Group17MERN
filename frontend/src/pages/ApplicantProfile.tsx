import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ------------------ Types ------------------
interface Degree {
  university: string;
  degree: string;
  major?: string;
}

interface Experience {
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface User {
  _id?: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  role?: string;
  degrees?: Degree[];
  experience?: Experience[];
  skills?: string[];
}

interface ApplicationJob {
  _id: string;
  title: string;
  company: string;
  appliedAt: string;
  status: "pending" | "rejected" | "under review";
}

// ------------------ Component ------------------
const ApplicantProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<ApplicationJob[]>([]);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/jobs/my-applications`, {
        headers: { Authorization: token },
      })
        .then((res) => res.json())
        .then((data) => {
          setApplications(data);
        })
        .catch((err) => console.error("Error fetching applications:", err));
    }
  }, []);

  // Save updated info
  const handleSave = async () => {
    if (!user) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify(user),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const data = await res.json();
      alert("Profile updated!");
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "5vh",
        fontFamily: "Arial, sans-serif",
        color: "black",
      }}
    >
      {/* Background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
          backgroundImage: `url(/mountain.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          zIndex: -1,
          animation: "kenBurns 35s ease-in-out infinite",
        }}
      />

      {/* Header */}
      <div
        style={{
          width: "90%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "3rem",
        }}
      >
        <h1 style={{ fontSize: "2rem" }}>Hello, {user.firstname}</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "rgba(50, 30, 90, 0.7)",
            color: "white",
          }}
        >
          Logout
        </button>
      </div>

      {/* Main layout: Left, Right, and Applications */}
      <div
        style={{
          display: "flex",
          gap: "2rem",
          width: "90%",
          justifyContent: "center",
          alignItems: "flex-start",
          marginBottom: "3rem",
        }}
      >
        {/* Left Column: Personal Information */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            padding: "2rem",
            borderRadius: "16px",
            width: "300px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ marginBottom: "1rem", color: "#333" }}>Personal Information</h2>

          <div>
            <div style={{ fontWeight: 600, color: "#555" }}>Full Name</div>
            <div style={{ marginBottom: "0.75rem" }}>{user.firstname} {user.lastname}</div>
          </div>

          <div>
            <div style={{ fontWeight: 600, color: "#555" }}>Email</div>
            <div style={{ marginBottom: "0.75rem" }}>{user.email}</div>
          </div>

          <div>
            <div style={{ fontWeight: 600, color: "#555" }}>Phone</div>
            <input
              value={user.phone || ""}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              style={{
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
                marginBottom: "0.75rem",
                width: "100%",
              }}
            />
          </div>
        </div>

        {/* Middle Column: Degrees, Experience, Skills */}
        <div
          style={{
            backgroundColor: "rgba(240, 240, 240, 0.95)",
            padding: "2rem",
            borderRadius: "16px",
            width: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* Degrees */}
          <h2 style={{ marginBottom: "1rem", color: "#333" }}>Degrees</h2>
          {user.degrees?.map((deg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "1rem",
                border: "1px solid #ccc",
                padding: "0.5rem",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <input
                value={deg.university}
                placeholder="University"
                onChange={(e) => {
                  const newDegrees = [...user.degrees!];
                  newDegrees[idx].university = e.target.value;
                  setUser({ ...user, degrees: newDegrees });
                }}
              />
              <input
                value={deg.degree}
                placeholder="Degree"
                onChange={(e) => {
                  const newDegrees = [...user.degrees!];
                  newDegrees[idx].degree = e.target.value;
                  setUser({ ...user, degrees: newDegrees });
                }}
              />
              <input
                value={deg.major || ""}
                placeholder="Major"
                onChange={(e) => {
                  const newDegrees = [...user.degrees!];
                  newDegrees[idx].major = e.target.value;
                  setUser({ ...user, degrees: newDegrees });
                }}
              />
              <button
                onClick={() => {
                  const newDegrees = user.degrees!.filter((_, i) => i !== idx);
                  setUser({ ...user, degrees: newDegrees });
                }}
                style={{
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Remove Degree
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newDegrees = user.degrees ? [...user.degrees] : [];
              newDegrees.push({ university: "", degree: "", major: "" });
              setUser({ ...user, degrees: newDegrees });
            }}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              padding: "0.5rem",
            }}
          >
            Add Degree
          </button>

          {/* Experience */}
          <h2 style={{ marginBottom: "1rem", color: "#333" }}>Experience</h2>
          {user.experience?.map((exp, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "1rem",
                border: "1px solid #ccc",
                padding: "0.5rem",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <input
                value={exp.title}
                placeholder="Job Title"
                onChange={(e) => {
                  const newExp = [...user.experience!];
                  newExp[idx].title = e.target.value;
                  setUser({ ...user, experience: newExp });
                }}
              />
              <input
                type="date"
                value={exp.startDate.split("T")[0]}
                onChange={(e) => {
                  const newExp = [...user.experience!];
                  newExp[idx].startDate = e.target.value;
                  setUser({ ...user, experience: newExp });
                }}
              />
              <input
                type="date"
                value={exp.endDate?.split("T")[0] || ""}
                onChange={(e) => {
                  const newExp = [...user.experience!];
                  newExp[idx].endDate = e.target.value;
                  setUser({ ...user, experience: newExp });
                }}
              />
              <textarea
                value={exp.description || ""}
                placeholder="Description"
                onChange={(e) => {
                  const newExp = [...user.experience!];
                  newExp[idx].description = e.target.value;
                  setUser({ ...user, experience: newExp });
                }}
                style={{ resize: "vertical", minHeight: "50px" }}
              />
              <button
                onClick={() => {
                  const newExp = user.experience!.filter((_, i) => i !== idx);
                  setUser({ ...user, experience: newExp });
                }}
                style={{
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Remove Experience
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newExp = user.experience ? [...user.experience] : [];
              newExp.push({ title: "", startDate: "", endDate: "", description: "" });
              setUser({ ...user, experience: newExp });
            }}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              padding: "0.5rem",
            }}
          >
            Add Experience
          </button>

          {/* Skills */}
          <h2 style={{ marginBottom: "0.5rem", color: "#333" }}>Skills</h2>
          <input
            value={user.skills?.join(", ") || ""}
            placeholder="Separate skills with commas"
            onChange={(e) => setUser({ ...user, skills: e.target.value.split(",") })}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "0.75rem",
              width: "100%",
            }}
          />

          {/* Save Button */}
          <button
            onClick={handleSave}
            style={{
              padding: "0.6rem 2rem",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "rgba(50, 30, 90, 0.7)",
              color: "white",
              marginTop: "1rem",
            }}
          >
            Save Profile
          </button>
        </div>

        {/* Right Column: My Applications */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            padding: "2rem",
            borderRadius: "16px",
            width: "350px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ marginBottom: "1rem", color: "#333" }}>My Applications</h2>

          {applications.length === 0 ? (
            <div>No Pending Applications</div>
          ) : (
            applications.map((app) => (
              <div
                key={app._id}
                style={{
                  border: "1px solid #ccc",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <div style={{ fontWeight: 600 }}>{app.title}</div>
                <div>Company: {app.company}</div>
                <div>Date Applied: {new Date(app.appliedAt).toLocaleDateString()}</div>
                <div>Status: <strong>{app.status}</strong></div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ken Burns animation */}
      <style>
        {`
          @keyframes kenBurns {
            0% { transform: scale(1) translate(0, 0); }
            25% { transform: scale(1.05) translate(-1%, -1%); }
            50% { transform: scale(1.1) translate(1%, -1%); }
            75% { transform: scale(1.05) translate(-1%, 1%); }
            100% { transform: scale(1) translate(0, 0); }
          }
        `}
      </style>
    </div>
  );
};

export default ApplicantProfile;
