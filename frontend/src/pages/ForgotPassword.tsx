import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const clearError = (field: string) => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
    };

    const loginRedirect = async () => {
        navigate("/");
    }

    const sendResetLink = async () => {

        if (!email.trim()) {
            alert("Please enter your email address first.");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Success! Please check your email for the reset link.");
            } else {
                alert("Error: " + data.message);
            }
        } catch (error) {
            console.error("Forgot password error:", error);
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
                    position: "fixed",
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
                <h1 style={{ fontSize: "1rem", marginBottom: "1rem", textAlign: "center", letterSpacing: "0.2em", width: "100%" }}>
                    Enter email to reset password
                </h1>

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

                {/* Send Reset Link button */}
                <button
                    onClick={sendResetLink}
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
                    Send Reset Link
                </button>

                {/* Login Button */}
                <button
                    onClick={loginRedirect}
                    style={{
                        padding: "0.6rem 2.7rem",
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
                    Back to Login
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

export default ForgotPassword;

