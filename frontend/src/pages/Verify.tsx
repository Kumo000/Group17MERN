import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const Verify: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("No token provided");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/verify?token=${token}`);   // Vite
        const data = await res.json();

        if (res.ok && data.message === "Email verified!") {
          setStatus("Email verified! You can now log in.");
        } else {
          setStatus("Verification failed: " + (data.message || "Unknown error"));
        }
      } catch (err) {
        setStatus("Server error during verification");
        console.error("Verification error:", err);
      }
    };

    verifyEmail();
  }, [params]);

  return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <h1>{status}</h1>
      {status === "Email verified! You can now log in." && (
        <button
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          Go to Login
        </button>
      )}
    </div>
  );
};

export default Verify;
