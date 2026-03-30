import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Define the User type
interface User {
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  degrees?: string[];
  skills?: string[];
}

const EmployerProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
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
        body: JSON.stringify({
          phone: user.phone,
          degrees: user.degrees,
          skills: user.skills,
        }),
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
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "5vh",
        color: "black",
        fontFamily: "Arial, sans-serif",
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

      {/* Header with Logout */}
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

      {/* Left Panel */}
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          padding: "3rem 2rem",
          borderRadius: "16px",
          width: "320px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h2 style={{ marginBottom: "1.5rem", color: "#333" }}>Personal Information</h2>

        {/* Full Name */}
        <div>
          <div style={{ fontWeight: 600, color: "#555", marginBottom: "0.25rem" }}>Full Name</div>
          <div style={{ fontWeight: 400, fontSize: "0.9rem", marginBottom: "0.75rem", color: "#222" }}>
            {user.firstname} {user.lastname}
          </div>
        </div>

        {/* Email */}
        <div>
          <div style={{ fontWeight: 600, color: "#555", marginBottom: "0.25rem" }}>Email</div>
          <div style={{ fontWeight: 400, fontSize: "0.9rem", marginBottom: "0.75rem", color: "#222" }}>
            {user.email}
          </div>
        </div>

        {/* Phone */}
        <div>
          <div style={{ fontWeight: 600, color: "#555", marginBottom: "0.25rem" }}>Phone Number</div>
          <input
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "0.75rem",
              width: "100%",
            }}
            value={user.phone || ""}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
          />
        </div>

        {/* Degrees */}
        <div>
          <div style={{ fontWeight: 600, color: "#555", marginBottom: "0.25rem" }}>Degree(s)</div>
          <input
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "0.75rem",
              width: "100%",
            }}
            value={user.degrees?.join(", ") || ""}
            onChange={(e) => setUser({ ...user, degrees: e.target.value.split(",") })}
          />
        </div>

        {/* Skills */}
        <div>
          <div style={{ fontWeight: 600, color: "#555", marginBottom: "0.25rem" }}>Skills</div>
          <input
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "0.75rem",
              width: "100%",
            }}
            value={user.skills?.join(", ") || ""}
            onChange={(e) => setUser({ ...user, skills: e.target.value.split(",") })}
          />
        </div>

        {/* Save Button */}
        <button
          style={{
            padding: "0.6rem 2rem",
            fontSize: "1rem",
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "rgba(50, 30, 90, 0.7)",
            color: "white",
          }}
          onClick={handleSave}
        >
          Save
        </button>
      </div>

      {/* Ken Burns animation keyframes */}
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

export default EmployerProfile;
