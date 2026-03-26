import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();

  // State for text fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
  try {
    const response = await fetch("http://localhost:5001/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("STATUS:", response.status);

    const text = await response.text(); 
    console.log("RAW RESPONSE:", text);

    const data = JSON.parse(text); // manually parse

    if (response.ok) {
      console.log("Login successful:", data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } else {
      alert("Login failed: " + data.message);
    }
  } catch (error) {
    console.error("FULL ERROR:", error);
    alert("An error occurred. Please try again later.");
  }
};

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

      <h1
        style={{
          fontSize: "4rem",
          marginBottom: "2rem",
          textAlign: "center",
          letterSpacing: "0.6em",
          width: "100%",
        }}
      >
        ASCENT
      </h1>
      <h1
        style={{
          fontSize: "1rem",
          marginBottom: "4rem",
          textAlign: "center",
          letterSpacing: "0.2em",
          width: "100%",
        }}
      >
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
          gap: "1.5rem",
          width: "max-content",
          textAlign: "center",
        }}
      >
        {/* Email / Username field */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "0.6rem 1rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            width: "250px",
          }}
        />

        {/* Password field */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "0.6rem 1rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            width: "250px",
          }}
        />

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
            backgroundColor: "rgba(50, 30, 90, 0.6)",
            color: "black",
          }}
        >
          Login
        </button>
        <h1
        style={{
          fontSize: "0.8rem",
          marginBottom: "0rem",
          textAlign: "center",
          letterSpacing: "0.2em",
          width: "100%",
        }}
      >
        Don't have an account? 
      </h1>

        {/* Sign Up button */}
        <button
          onClick={() => navigate("/signup")}
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
          Sign Up
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

export default Login;