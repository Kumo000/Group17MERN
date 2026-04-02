import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ------------------ Types ------------------
interface User {
  _id?: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  role?: string;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  description: string;
  createdAt?: string;
  createdBy?:
    | string
    | {
        _id?: string;
        firstname?: string;
        lastname?: string;
        email?: string;
      };
}
// ------------------ Component ------------------
const EmployerProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const navigate = useNavigate();

  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    description: "",
  });
  // Fetch jobs created by this employer
  const fetchJobs = async () => {
    const token = localStorage.getItem("token");
    if (!token || !user?._id) {
      setLoadingJobs(false);
      return;
    }

    setLoadingJobs(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/searchJobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          title: "",
          description: "",
          company: "",
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch jobs");

      const data = await res.json();

      const filteredJobs = Array.isArray(data)
        ? data.filter((job: Job) => {
            if (!job.createdBy) return false;

            if (typeof job.createdBy === "string") {
              return job.createdBy === user._id;
            }

            return job.createdBy._id === user._id;
          })
        : [];

      setJobs(filteredJobs);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user?._id) {
      fetchJobs();
    }
  }, [user]);
  // Save updated info
  const handleSave = async () => {
    if (!user) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify(user),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const data = await res.json();
      alert("Profile updated!");
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }
  };
  // Reset job form
  const resetJobForm = () => {
    setNewJob({
      title: "",
      company: "",
      description: "",
    });
    setEditingJobId(null);
  };
  // Post job function
  const handlePostJob = async () => {
    const token = localStorage.getItem("token");

    if (!newJob.title.trim()) {
      alert("Job title is required");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/postJob`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify(newJob),
      });

      if (!res.ok) throw new Error("Failed to post job");

      await res.json();
      alert("Job posted!");

      await fetchJobs();
      resetJobForm();
    } catch (err) {
      console.error(err);
      alert("Error posting job");
    }
  };
  // Edit job function
  const handleEditJob = (job: Job) => {
    setEditingJobId(job._id);
    setNewJob({
      title: job.title,
      company: job.company,
      description: job.description,
    });
  };
  // Update job function
  const handleUpdateJob = async () => {
    const token = localStorage.getItem("token");

    if (!editingJobId) return;

    if (!newJob.title.trim()) {
      alert("Job title is required");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/jobs/updateJob/${editingJobId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: token } : {}),
          },
          body: JSON.stringify(newJob),
        }
      );

      if (!res.ok) throw new Error("Failed to update job");

      await res.json();
      alert("Job updated!");

      await fetchJobs();
      resetJobForm();
    } catch (err) {
      console.error(err);
      alert("Error updating job");
    }
  };
  // Delete job function
  const handleDeleteJob = async (jobId: string) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/jobs/deleteJob/${jobId}`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: token } : {}),
          },
        }
      );

      if (!res.ok) throw new Error("Failed to delete job");

      await res.json();
      await fetchJobs();

      if (editingJobId === jobId) {
        resetJobForm();
      }

      alert("Job deleted!");
    } catch (err) {
      console.error(err);
      alert("Error deleting job");
    }
  };
  // Confirm before deleting job
  const confirmDeleteJob = (jobId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this job?");
    if (confirmed) {
      handleDeleteJob(jobId);
    }
  };
  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  if (!user) return <div>Loading...</div>;

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
          maxWidth: "1200px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "3rem",
        }}
      >
        <h1 style={{ fontSize: "2rem" }}>Hello, {user.firstname}</h1>
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
      {/* Main layout: Left, Right, and My Jobs*/}
      <div
        style={{
          display: "flex",
          gap: "2rem",
          width: "90%",
          maxWidth: "1200px",
          justifyContent: "center",
          alignItems: "flex-start",
          marginBottom: "3rem",
        }}
      >
        {/* Left column: Personal Info */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            padding: "2rem",
            borderRadius: "16px",
            width: "320px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ marginBottom: "1rem", color: "#333" }}>Personal Information</h2>

          <div>
            <div style={{ fontWeight: 600, color: "#555" }}>Full Name</div>
            <div style={{ marginBottom: "0.75rem" }}>
              {user.firstname} {user.lastname}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 600, color: "#555" }}>Email</div>
            <div style={{ marginBottom: "0.75rem" }}>{user.email}</div>
          </div>

          <div>
            <div style={{ fontWeight: 600, color: "#555" }}>Phone</div>
            <input
              value={user.phone || ""}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              style={{
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
                marginBottom: "0.75rem",
                width: "100%",
                backgroundColor: "white",
                color: "black",
              }}
            />
          </div>

          <button
            onClick={handleSave}
            style={{
              padding: "0.6rem 2rem",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "rgba(50, 30, 90, 0.7)",
              color: "white",
              marginTop: "1rem",
            }}
          >
            Save Profile
          </button>
        </div>
        {/* Middle column: Job Form */}
        <div
          style={{
            backgroundColor: "rgba(240, 240, 240, 0.95)",
            padding: "2rem",
            borderRadius: "16px",
            width: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          <h2 style={{ marginBottom: "1rem", color: "#333" }}>
            {editingJobId ? "Edit Job" : "Post New Job"}
          </h2>

          <input
            placeholder="Job Title"
            value={newJob.title}
            onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "100%",
              backgroundColor: "white",
              color: "black",
            }}
          />

          <input
            placeholder="Company"
            value={newJob.company}
            onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "100%",
              backgroundColor: "white",
              color: "black",
            }}
          />

          <textarea
            placeholder="Description"
            value={newJob.description}
            onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "100%",
              minHeight: "150px",
              resize: "vertical",
              backgroundColor: "white",
              color: "black",
              fontFamily: "inherit",
            }}
          />

          <button
            onClick={editingJobId ? handleUpdateJob : handlePostJob}
            style={{
              padding: "0.6rem 2rem",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "rgba(50, 30, 90, 0.7)",
              color: "white",
            }}
          >
            {editingJobId ? "Save Changes" : "Post Job"}
          </button>

          {editingJobId && (
            <button
              onClick={resetJobForm}
              style={{
                padding: "0.6rem 2rem",
                fontSize: "1rem",
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "rgba(120, 120, 120, 0.7)",
                color: "white",
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
        {/* Right column: My Jobs */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            padding: "2rem",
            borderRadius: "16px",
            width: "350px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ marginBottom: "1rem", color: "#333" }}>My Job Postings</h2>

          <div style={{ maxHeight: "450px", overflowY: "auto" }}>
            {loadingJobs ? (
              <div style={{ color: "#777" }}>Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div style={{ color: "#777" }}>No jobs posted yet</div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job._id}
                  style={{
                    marginBottom: "1rem",
                    border:
                      editingJobId === job._id
                        ? "2px solid rgba(50, 30, 90, 0.7)"
                        : "1px solid #ccc",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#333" }}>{job.title}</div>

                  <div style={{ fontSize: "0.9rem", color: "#555" }}>{job.company}</div>

                  <div style={{ fontSize: "0.85rem", color: "#666" }}>
                    {job.description.length > 90
                      ? `${job.description.slice(0, 90)}...`
                      : job.description}
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "#888" }}>
                    {job.createdAt
                      ? new Date(job.createdAt).toLocaleDateString()
                      : "Date unavailable"}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <button
                      onClick={() => handleEditJob(job)}
                      style={{
                        flex: 1,
                        padding: "0.45rem",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "none",
                        borderRadius: "8px",
                        backgroundColor: "rgba(90, 70, 150, 0.8)",
                        color: "white",
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => confirmDeleteJob(job._id)}
                      style={{
                        flex: 1,
                        padding: "0.45rem",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "none",
                        borderRadius: "8px",
                        backgroundColor: "rgba(170, 40, 40, 0.8)",
                        color: "white",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
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

export default EmployerProfile;