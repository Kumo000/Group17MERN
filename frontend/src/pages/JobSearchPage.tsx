import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ------------------ Types ------------------
interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  payRate?: string;
  startDate?: string;
  createdAt?: string;
  createdBy?: { firstname: string; lastname: string; email: string };
}

// ------------------ Component ------------------
const JobSearchPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
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
        body: JSON.stringify({ query: searchTerm }),
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

  const handleApply = async (jobId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/jobs/apply/${jobId}`, {
        method: "POST",
        headers: { Authorization: token },
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Error applying"); return; }
      setAppliedIds((prev) => new Set(prev).add(jobId));
      alert("Applied successfully!");
    } catch {
      alert("Error applying to job");
    }
  };

  const fieldLabel: React.CSSProperties = {
    fontWeight: 800,
    fontSize: "0.72rem",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "0.1rem",
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
          backgroundImage: `url(/mountain3.webp)`,
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
            backgroundColor: "rgba(50, 30, 90, 0.8)",
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
            backgroundColor: "rgba(50, 30, 90, 0.8)",
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                backgroundColor: "rgba(50, 30, 90, 0.8)",
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
          <h2 style={{ color: "#333", margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>Results</h2>

          {loading && <div>Loading...</div>}

          {!loading && jobs.length === 0 && (
            <div style={{ color: "#474646" }}>No jobs found. Try another search above.</div>
          )}

          {jobs.map((job) => {
            const alreadyApplied = appliedIds.has(job._id);
            return (
              <div
                key={job._id}
                style={{
                  border: "1px solid #ddd",
                  padding: "1rem 1.1rem",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  backgroundColor: "rgba(250,250,255,0.9)",
                }}
              >
                {/* Job Title */}
                <div>
                  <div style={fieldLabel}>Job Title</div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111" }}>{job.title}</div>
                </div>

                {/* Company */}
                <div>
                  <div style={fieldLabel}>Company Name</div>
                  <div style={{ fontSize: "0.97rem", color: "#333" }}>{job.company}</div>
                </div>

                {/* Pay Rate */}
                {job.payRate && (
                  <div>
                    <div style={fieldLabel}>Pay Rate</div>
                    <div style={{ fontSize: "0.95rem", color: "#2e7d32", fontWeight: 600 }}>{job.payRate}</div>
                  </div>
                )}

                {/* Start Date */}
                {job.startDate && (
                  <div>
                    <div style={fieldLabel}>Start Date</div>
                    <div style={{ fontSize: "0.93rem", color: "#444" }}>
                      {new Date(job.startDate).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Description */}
                {job.description && (
                  <div>
                    <div style={fieldLabel}>Job Description</div>
                    <div style={{ fontSize: "0.92rem", color: "#444", lineHeight: 1.55 }}>{job.description}</div>
                  </div>
                )}

                {/* Footer: posted info + apply button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid #eee",
                    marginTop: "0.25rem",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                    {job.createdBy && (
                      <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
                        Posted by: {job.createdBy.firstname} {job.createdBy.lastname}
                      </span>
                    )}
                    {job.createdAt && (
                      <span style={{ fontSize: "0.78rem", color: "#bbb" }}>
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => !alreadyApplied && handleApply(job._id)}
                    disabled={alreadyApplied}
                    style={{
                      padding: "0.4rem 1.2rem",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      cursor: alreadyApplied ? "default" : "pointer",
                      border: "none",
                      borderRadius: "8px",
                      backgroundColor: alreadyApplied ? "#ccc" : "rgba(50, 30, 90, 0.75)",
                      color: "white",
                    }}
                  >
                    {alreadyApplied ? "Applied ✓" : "Apply Now"}
                  </button>
                </div>
              </div>
            );
          })}
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
