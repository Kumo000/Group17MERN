import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: "14vh", 
        color: "white"
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
          marginBottom: "7rem",
          textAlign: "center",      // ensures heading is centered
          letterSpacing: "0.6em",
          width: "100%"
        }}
      >
        ASCENT
      </h1>

      <div
        style={{
          backgroundColor: "rgba(220, 220, 220, 0.7)", // semi-transparent gray rectangle
          padding: "6rem 3rem", // space around buttons
          borderRadius: "16px", // rounded corners
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
          width: "max-content", 
          textAlign: "center"
        }}
      >
        <button
          onClick={() => navigate("/login")}
          style={{
            padding: "0.6rem 2rem", // less padding
            fontSize: "1.2rem",     // smaller text
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "rgba(50, 30, 90, 0.6)",
            color: "black"
          }}
        >
          Login      
        </button>

        <button
          onClick={() => navigate("/signup")}
          style={{
            padding: "0.6rem 2rem", // less padding
            fontSize: "1.2rem",     // smaller text
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "rgba(50, 30, 90, 0.6)",
            color: "black"
          }}
        >
          Sign Up
        </button>
      </div>
      {/* Ken Burns animation keyframes */}
      <style>
        {`
          @keyframes kenBurns {
            0% {
              transform: scale(1) translate(0, 0);
            }
            25% {
              transform: scale(1.05) translate(-1%, -1%);
            }
            50% {
              transform: scale(1.1) translate(1%, -1%);
            }
            75% {
              transform: scale(1.05) translate(-1%, 1%);
            }
            100% {
              transform: scale(1) translate(0, 0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default LandingPage;