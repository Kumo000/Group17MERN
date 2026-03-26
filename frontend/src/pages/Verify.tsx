// src/pages/Verify.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

/*function VerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("No token provided");
      return;
    }

    fetch(`/api/users/verify?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Email verified!") {
          setStatus("Email verified! You can now log in.");
        } else {
          setStatus("Verification failed: " + data.message);
        }
      })
      .catch(() => setStatus("Server error during verification"));
  }, [params]);

  return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <h1>{status}</h1>
      {status === "Email verified! You can now log in." && (
        <button onClick={() => navigate("/login")}>Go to Login</button>
      )}
    </div>
  );
}
*/
const Verify: React.FC = () => {
  return <h1>Verify Page</h1>;
};

export default Verify;
