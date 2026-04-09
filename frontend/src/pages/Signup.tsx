import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  // Tracks which fields have been flagged as empty on submit
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validate = () => {
    const newErrors: Record<string, boolean> = {
      firstname: !firstname.trim(),
      lastname: !lastname.trim(),
      email: !email.trim(),
      phone: !phone.trim(),
      password: !password.trim(),
      role: !role,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean); // true if no errors
  };

  const handleRegister = async () => {
    if (!validate()) return; // stop if any field is empty

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstname, lastname, email, phone, password, role }),
      });

      console.log("STATUS:", response.status);
      const text = await response.text();
      console.log("RAW RESPONSE:", text);
      const data = JSON.parse(text);

      if (response.ok) {
        alert(data.message);
        navigate("/");
      } else {
        alert("Registration failed: " + data.message);
      }
    } catch (error) {
      console.error("FULL ERROR:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  // Clears the error for a field as soon as the user types in it
  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    padding: "0.6rem 1rem",
    fontSize: "1rem",
    borderRadius: "8px",
    border: errors[field] ? "2px solid #e53935" : "1px solid #ccc",
    width: "250px",
    backgroundColor: errors[field] ? "#fff5f5" : "white",
    outline: "none",
    transition: "border 0.15s",
  });

  const selectStyle = (): React.CSSProperties => ({
    padding: "0.6rem 1rem",
    fontSize: "1rem",
    borderRadius: "8px",
    border: errors.role ? "2px solid #e53935" : "1px solid #ccc",
    width: "250px",
    backgroundColor: errors.role ? "#fff5f5" : "white",
    marginBottom: "0.5rem",
    outline: "none",
    transition: "border 0.15s",
  });

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: "14vh",
        color: "white",
      }}
    >
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

      <h1 style={{ fontSize: "4rem", marginBottom: "2rem", textAlign: "center", letterSpacing: "0.6em", width: "100%" }}>
        ASCENT
      </h1>
      <h1 style={{ fontSize: "1rem", marginBottom: "1rem", textAlign: "center", letterSpacing: "0.2em", width: "100%" }}>
        Create your account
      </h1>

      <div
        style={{
          backgroundColor: "rgba(220, 220, 220, 0.7)",
          padding: "4rem 3rem",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
          width: "max-content",
          textAlign: "center",
        }}
      >
        {/* First Name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem", marginBottom: "0.75rem" }}>
          <input
            type="text"
            placeholder="First Name"
            value={firstname}
            onChange={(e) => { setFirstName(e.target.value); clearError("firstname"); }}
            style={inputStyle("firstname")}
          />
          {errors.firstname && <span style={{ color: "#e53935", fontSize: "0.75rem", paddingLeft: "0.25rem" }}>First name is required</span>}
        </div>

        {/* Last Name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem", marginBottom: "0.75rem" }}>
          <input
            type="text"
            placeholder="Last Name"
            value={lastname}
            onChange={(e) => { setLastName(e.target.value); clearError("lastname"); }}
            style={inputStyle("lastname")}
          />
          {errors.lastname && <span style={{ color: "#e53935", fontSize: "0.75rem", paddingLeft: "0.25rem" }}>Last name is required</span>}
        </div>

        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem", marginBottom: "0.75rem" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
            style={inputStyle("email")}
          />
          {errors.email && <span style={{ color: "#e53935", fontSize: "0.75rem", paddingLeft: "0.25rem" }}>Email is required</span>}
        </div>

        {/* Phone */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem", marginBottom: "0.75rem" }}>
          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); clearError("phone"); }}
            style={inputStyle("phone")}
          />
          {errors.phone && <span style={{ color: "#e53935", fontSize: "0.75rem", paddingLeft: "0.25rem" }}>Phone number is required</span>}
        </div>

        {/* Password */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem", marginBottom: "0.75rem" }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
            style={inputStyle("password")}
          />
          {errors.password && <span style={{ color: "#e53935", fontSize: "0.75rem", paddingLeft: "0.25rem" }}>Password is required</span>}
        </div>

        {/* Role */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem", marginBottom: "0.75rem" }}>
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); clearError("role"); }}
            style={selectStyle()}
          >
            <option value="" disabled>Select role</option>
            <option value="Applicant">Applicant</option>
            <option value="Employer">Employer</option>
          </select>
          {errors.role && <span style={{ color: "#e53935", fontSize: "0.75rem", paddingLeft: "0.25rem" }}>Please select a role</span>}
        </div>

        {/* Sign Up button */}
        <button
          onClick={handleRegister}
          style={{
            padding: "0.6rem 2rem",
            fontSize: "1.2rem",
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "rgba(50, 30, 90, 0.6)",
            color: "black",
            marginTop: "0.5rem",
          }}
        >
          Signup
        </button>

        <h1 style={{ fontSize: "0.8rem", marginBottom: "0rem", textAlign: "center", letterSpacing: "0.2em", width: "100%" }}>
          It's time to climb
        </h1>

        <h1 style={{ fontSize: "0.8rem", marginBottom: "0rem", textAlign: "center", letterSpacing: "0.2em", width: "100%" }}>
          Already have an account?
        </h1>

        <button
          onClick={() => navigate("/")}
          style={{
            padding: "0.6rem 2rem",
            fontSize: "1.2rem",
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "rgba(50, 30, 90, 0.6)",
            color: "black",
          }}
        >
          Login
        </button>
      </div>

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

export default Signup;
