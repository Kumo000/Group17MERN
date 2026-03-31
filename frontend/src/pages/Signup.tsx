import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup: React.FC = () => {
  const navigate = useNavigate();

  // State for text fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const handleRegister = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname,
          lastname,
          email,
	  phone,
          password,
          role, // e.g., "employee" or "employer"
        }),
      });

      console.log("STATUS:", response.status);

      const text = await response.text();
      console.log("RAW RESPONSE:", text);

      const data = JSON.parse(text);

      if (response.ok) {
        // Successful registration
        alert(data.message); // "Check your email to verify your account"
        // Optionally navigate to login page
        navigate("/");
      } else {
        // Registration failed (user exists, etc.)
        alert("Registration failed: " + data.message);
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
          marginBottom: "1rem",
          textAlign: "center",
          letterSpacing: "0.2em",
          width: "100%",
        }}
      >
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
          gap: "1.5rem",
          width: "max-content",
          textAlign: "center",
        }}
      >
        {/* First name field */}
        <input
          type="text"
          placeholder="First Name"
          value={firstname}
          onChange={(e) => setFirstName(e.target.value)}
          style={{
            padding: "0.6rem 1rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            width: "250px",
          }}
        />
        {/* Last name field */}
        <input
          type="text"
          placeholder="Last Name"
          value={lastname}
          onChange={(e) => setLastName(e.target.value)}
          style={{
            padding: "0.6rem 1rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            width: "250px",
          }}
        />
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
        {/* phone field */}
        <input
          type="text"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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

        {/* Role dropdown */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{
            padding: "0.6rem 1rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            width: "250px",
            marginBottom: "0.5rem",
          }}
        >
          <option value="" disabled>
            Select role
          </option>
          <option value="Applicant">Applicant</option>
          <option value="Employer">Employer</option>
        </select>

        {/* SignUp button */}
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
          }}
        >
          Signup
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
          It's time to climb
        </h1>

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

export default Signup;
