import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validate = () => {
    const newErrors: Record<string, boolean> = {
      email: !email.trim(),
      password: !password.trim(),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Login failed: " + data.message);
        return;
      }

      console.log("Login successful:", data.user);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const token = data.token;
      const meRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: token },
      });
      const meData = await meRes.json();
      localStorage.setItem("user", JSON.stringify(meData));

      if (meData.role === "Employer") {
        navigate("/employerProfile");
      } else {
        navigate("/applicantProfile");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred. Please try again later.");
    }
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
          backgroundImage: `url(/mountain2.webp)`,
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
        climb the ladder. reach your career potential.
      </h1>

      <div
        style={{
          backgroundColor: "rgba(220, 220, 220, 0.7)",
          padding: "6rem 3rem",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          width: "max-content",
          textAlign: "center",
        }}
      >
        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem", marginBottom: "0.5rem" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
            style={inputStyle("email")}
          />
          {errors.email && <span style={{ color: "#e53935", fontSize: "0.75rem", paddingLeft: "0.25rem" }}>Email is required</span>}
        </div>

        {/* Password */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem", marginBottom: "0.5rem" }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
            style={inputStyle("password")}
          />
          {errors.password && <span style={{ color: "#e53935", fontSize: "0.75rem", paddingLeft: "0.25rem" }}>Password is required</span>}
        </div>

        {/* Login button */}
        <button
          onClick={handleLogin}
          style={{
            padding: "0.6rem 2rem",
            fontSize: "1.2rem",
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "rgba(50, 30, 90, 0.7)",
            color: "white",
            marginTop: "0.5rem",
          }}
        >
          Login
        </button>

        <h1 style={{ fontSize: "0.8rem", marginBottom: "0rem", textAlign: "center", letterSpacing: "0.2em", width: "100%" }}>
          Don't have an account?
        </h1>

        <button
          onClick={() => navigate("/signup")}
          style={{
            padding: "0.6rem 2rem",
            fontSize: "1.2rem",
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "rgba(50, 30, 90, 0.7)",
            color: "white",
          }}
        >
          Sign Up
        </button>

        <h1 style={{ fontSize: "0.8rem", marginBottom: "0rem", textAlign: "center", letterSpacing: "0.2em", width: "100%" }}>
          Forgot password?
        </h1>

        <button
          onClick={() => navigate("/forgotPassword")}
          style={{
            padding: "0.6rem 2rem",
            fontSize: "1.2rem",
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "rgba(50, 30, 90, 0.7)",
            color: "white",
          }}
        >
          Forgot Password
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

export default Login;

