import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ------------------ Types ------------------
interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  createdBy?: { firstname: string; lastname: string; email: string };
}

// ------------------ Component ------------------
const JobSearchPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleSearch = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/searchJobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token!,
        },
        body: JSON.stringify({ title: searchTerm, description: "", company: "" }),
      });

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error(err);
      alert("Error fetching jobs");
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: "700px",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <button
          onClick={() => navigate("/applicantProfile")}
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
          Profile
        </button>
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

      {/* Main layout */}
      <div
        style={{
          width: "90%",
          maxWidth: "700px",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        {/* Search Panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Search Jobs</h1>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Title, keyword or company ..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: "0.5rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "rgba(50, 30, 90, 0.7)",
                color: "white",
              }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            padding: "2rem",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ color: "#333", margin: 0 }}>Results</h2>

          {loading && <div>Loading...</div>}

          {!loading && jobs.length === 0 && (
            <div>No jobs found. Try another search above.</div>
          )}

          {jobs.map((job) => (
            <div
              key={job._id}
              style={{
                border: "1px solid #ccc",
                padding: "0.75rem",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{job.title}</div>
              <div style={{ color: "#555" }}>{job.company}</div>
              <div style={{ marginTop: "0.25rem" }}>{job.description}</div>
              {job.createdBy && (
                <div style={{ fontSize: "0.85rem", color: "#888" }}>
                  Posted by: {job.createdBy.firstname} {job.createdBy.lastname}
                </div>
              )}
            </div>
          ))}
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

export default JobSearchPage;
