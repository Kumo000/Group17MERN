import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  _id?: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  role?: string;
  skills?: string[];
}

interface HiredApplicant {
  userId: string;
  firstname: string;
  lastname: string;
  email: string;
}

interface Job {
  _id: string;
  title: string;
  description?: string;
  company: string;
  payRate?: string;
  startDate?: string;
  createdAt?: string;
  closed?: boolean;
  hiredApplicant?: HiredApplicant;
  applicants?: { user: string; appliedAt: string; status: string }[];
}

interface Degree { university: string; degree: string; major?: string; }
interface Experience { title: string; startDate: string; endDate?: string; description?: string; }

interface Applicant {
  _id: string;
  userId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  skills?: string[];
  degrees?: Degree[];
  experience?: Experience[];
  resumeUrl?: string | null;
  appliedAt?: string;
  status?: string;
}

// Status badge colors
const statusColor = (status?: string): React.CSSProperties => {
  switch (status) {
    case "interview requested": return { color: "#7b1fa2", fontWeight: 700 };
    case "interview pending":   return { color: "#e65100", fontWeight: 700 };
    case "under review":        return { color: "#1565c0", fontWeight: 700 };
    case "hired":               return { color: "#2e7d32", fontWeight: 700 };
    case "rejected":            return { color: "#c62828", fontWeight: 700 };
    default:                    return { color: "#555" };
  }
};

const EmployerProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [pastJobs, setPastJobs] = useState<Job[]>([]);

  const [editingField, setEditingField] = useState<"firstname" | "lastname" | "email" | "phone" | null>(null);
  const [editValue, setEditValue] = useState("");

  const [newSkill, setNewSkill] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  const [addingJob, setAddingJob] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", description: "", company: "", payRate: "", startDate: "" });

  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState({ title: "", description: "", company: "", payRate: "", startDate: "" });

  const [applicantsByJob, setApplicantsByJob] = useState<Record<string, Applicant[]>>({});
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);

  // Hire confirmation modal state
  const [hireConfirm, setHireConfirm] = useState<{ jobId: string; subdocId: string; name: string; jobTitle: string } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        const s = localStorage.getItem("user");
        if (s) setUser(JSON.parse(s));
        return;
      }
      try {
        const r = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, { headers: { Authorization: token } });
        const u = await r.json();
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      } catch {
        const s = localStorage.getItem("user");
        if (s) setUser(JSON.parse(s));
      }
      await fetchListings(token);
    };
    init();
  }, []);

  const fetchListings = async (token: string) => {
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/myListings`, { headers: { Authorization: token } });
      const data = await r.json();
      setActiveJobs(data.active || []);
      setPastJobs(data.past || []);
      // Fetch applicants for each active job
      (data.active || []).forEach((job: Job) => fetchApplicants(job._id, token));
    } catch (err) {
      console.error("Error fetching listings:", err);
    }
  };

  const fetchApplicants = async (jobId: string, token?: string) => {
    const t = token || localStorage.getItem("token") || "";
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/getApplicants/${jobId}`, { headers: { Authorization: t } });
      if (!r.ok) return;
      const data = await r.json();
      setApplicantsByJob(prev => ({ ...prev, [jobId]: data.applicants }));
    } catch (err) {
      console.error("Error fetching applicants:", err);
    }
  };

  const updateApplicantStatus = async (jobId: string, subdocId: string, status: "rejected" | "under review") => {
    const token = localStorage.getItem("token") || "";
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/updateApplicantStatus/${jobId}/${subdocId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error();
      setApplicantsByJob(prev => ({
        ...prev,
        [jobId]: prev[jobId]?.map(a => a._id === subdocId ? { ...a, status } : a),
      }));
    } catch { alert("Error updating status"); }
  };

  const requestInterview = async (jobId: string, subdocId: string) => {
    const token = localStorage.getItem("token") || "";
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/requestInterview/${jobId}/${subdocId}`, {
        method: "POST",
        headers: { Authorization: token },
      });
      if (!r.ok) throw new Error();
      // Update local state immediately so UI reflects new status
      setApplicantsByJob(prev => ({
        ...prev,
        [jobId]: prev[jobId]?.map(a => a._id === subdocId ? { ...a, status: "interview requested" } : a),
      }));
    } catch { alert("Error sending interview request"); }
  };

  const confirmHire = async () => {
    if (!hireConfirm) return;
    const token = localStorage.getItem("token") || "";
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/hire/${hireConfirm.jobId}/${hireConfirm.subdocId}`, {
        method: "PUT",
        headers: { Authorization: token },
      });
      if (!r.ok) throw new Error();
      setHireConfirm(null);
      await fetchListings(token);
    } catch { alert("Error hiring applicant"); }
  };

  const saveUserToAPI = async (updatedUser: User) => {
    const token = localStorage.getItem("token");
    const r = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) },
      body: JSON.stringify(updatedUser),
    });
    if (!r.ok) throw new Error();
    const data = await r.json();
    setUser(data.user);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  };

  const handleLogout = () => { localStorage.removeItem("user"); localStorage.removeItem("token"); navigate("/"); };
  const startEditing = (field: "firstname" | "lastname" | "email" | "phone") => { setEditingField(field); setEditValue(user?.[field] || ""); };
  const cancelEdit = () => { setEditingField(null); setEditValue(""); };
  const confirmEdit = () => { if (!user || !editingField) return; setUser({ ...user, [editingField]: editValue }); setEditingField(null); setEditValue(""); };
  const handleSavePersonalInfo = async () => { if (!user) return; try { await saveUserToAPI(user); alert("Saved!"); } catch { alert("Error saving"); } };

  const handleSaveSkill = async () => {
    const t = newSkill.trim(); if (!t || !user) return;
    const existing = user.skills || [];
    if (existing.includes(t)) { setNewSkill(""); setAddingSkill(false); return; }
    try { await saveUserToAPI({ ...user, skills: [...existing, t] }); setNewSkill(""); setAddingSkill(false); }
    catch { alert("Error saving skill"); }
  };
  const handleRemoveSkill = async (skill: string) => {
    if (!user) return;
    try { await saveUserToAPI({ ...user, skills: (user.skills || []).filter(s => s !== skill) }); }
    catch { alert("Error removing skill"); }
  };

  const handlePostJob = async () => {
    if (!newJob.title || !newJob.company) return;
    const token = localStorage.getItem("token");
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/postJob`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token || "" },
        body: JSON.stringify({ ...newJob, startDate: newJob.startDate || undefined }),
      });
      if (!r.ok) { const e = await r.json(); alert(e.message || "Error posting job"); return; }
      setNewJob({ title: "", description: "", company: "", payRate: "", startDate: "" });
      setAddingJob(false);
      fetchListings(token || "");
    } catch { alert("Error posting job"); }
  };

  const handleDeleteJob = async (jobId: string) => {
    const token = localStorage.getItem("token");
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/deleteJob/${jobId}`, { method: "DELETE", headers: { Authorization: token || "" } });
      if (!r.ok) { alert("Error deleting job"); return; }
      setActiveJobs(prev => prev.filter(j => j._id !== jobId));
    } catch { alert("Error deleting job"); }
  };

  const handleCloseJob = async (jobId: string) => {
    const token = localStorage.getItem("token") || "";
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/closeJob/${jobId}`, {
        method: "PUT",
        headers: { Authorization: token },
      });
      if (!r.ok) { alert("Error closing listing"); return; }
      await fetchListings(token);
    } catch { alert("Error closing listing"); }
  };

  const startEditingJob = (job: Job) => {
    setEditingJobId(job._id);
    setEditingJob({ title: job.title, description: job.description || "", company: job.company, payRate: job.payRate || "", startDate: job.startDate ? job.startDate.split("T")[0] : "" });
  };

  const handleUpdateJob = async (jobId: string) => {
    const token = localStorage.getItem("token");
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/updateJob/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: token || "" },
        body: JSON.stringify(editingJob),
      });
      if (!r.ok) { alert("Error updating job"); return; }
      const data = await r.json();
      setActiveJobs(prev => prev.map(j => j._id === jobId ? { ...j, ...data.job } : j));
      setEditingJobId(null);
    } catch { alert("Error updating job"); }
  };

  if (!user) return <div>Loading...</div>;

  // ---- Shared styles ----
  const inputStyle: React.CSSProperties = { padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "0.9rem", width: "100%", boxSizing: "border-box" };
  const editBtnStyle: React.CSSProperties = { padding: "0.2rem 0.6rem", fontSize: "0.78rem", cursor: "pointer", border: "none", borderRadius: "6px", backgroundColor: "rgba(50, 30, 90, 0.7)", color: "white", whiteSpace: "nowrap" };
  const addOutlineBtnStyle: React.CSSProperties = { backgroundColor: "#e8f5e9", color: "#2e7d32", border: "2px solid #388e3c", borderRadius: "8px", cursor: "pointer", padding: "0.35rem 0.85rem", fontSize: "0.85rem", fontWeight: 600, alignSelf: "flex-start" };
  const saveBtnStyle: React.CSSProperties = { padding: "0.35rem 1.1rem", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", border: "none", borderRadius: "8px", backgroundColor: "rgba(50, 30, 90, 0.7)", color: "white" };
  const cancelSmallBtnStyle: React.CSSProperties = { padding: "0.35rem 0.85rem", fontSize: "0.85rem", cursor: "pointer", border: "none", borderRadius: "6px", backgroundColor: "#aaa", color: "white" };
  const removeBtnStyle: React.CSSProperties = { backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", padding: "0.25rem 0.55rem", fontSize: "0.78rem" };
  const interviewBtnStyle: React.CSSProperties = { backgroundColor: "#e65100", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", padding: "0.2rem 0.5rem", fontSize: "0.7rem", fontWeight: 600 };
  const hireBtnStyle: React.CSSProperties = { backgroundColor: "#2e7d32", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", padding: "0.2rem 0.5rem", fontSize: "0.7rem", fontWeight: 600 };
  const titleStyle: React.CSSProperties = { color: "#333", fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.75rem" };
  const labelStyle: React.CSSProperties = { fontWeight: 800, color: "#333", marginBottom: "0.25rem", fontSize: "0.95rem" };

  const renderInfoRow = (label: string, field: "firstname" | "lastname" | "email" | "phone", displayValue: string) => (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={labelStyle}>{label}</div>
      {editingField === field ? (
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <input value={editValue} onChange={e => setEditValue(e.target.value)} style={{ ...inputStyle, fontSize: "0.88rem" }} autoFocus
            onKeyDown={e => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") cancelEdit(); }} />
          <button onClick={confirmEdit} style={{ ...editBtnStyle, backgroundColor: "#4CAF50" }}>✓</button>
          <button onClick={cancelEdit} style={{ ...editBtnStyle, backgroundColor: "#aaa" }}>✕</button>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.93rem" }}>{displayValue}</span>
          <button onClick={() => startEditing(field)} style={editBtnStyle}>Edit</button>
        </div>
      )}
    </div>
  );

  const renderApplicantPanel = (app: Applicant, jobId: string) => {
    const key = `${jobId}_${app._id}`;
    const isExpanded = expandedApplicant === key;
    const isUnderReview = app.status === "under review";

    return (
      <div key={app._id} style={{ borderLeft: "3px solid rgba(50,30,90,0.3)", paddingLeft: "0.75rem", marginBottom: "0.6rem" }}>
        {/* Summary row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
          <div style={{ fontSize: "0.85rem" }}>
            <strong>{app.firstname} {app.lastname}</strong>
            <span style={{ color: "#666", marginLeft: "0.5rem" }}>{app.email}</span>
            <span style={{ marginLeft: "0.6rem", fontSize: "0.78rem", ...statusColor(app.status) }}>
              ({app.status ?? "pending"})
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
            {/* Pending → move to Under Review */}
            {app.status === "pending" && (
              <button onClick={() => updateApplicantStatus(jobId, app._id, "under review")} style={{ ...editBtnStyle, fontSize: "0.7rem", padding: "0.2rem 0.4rem" }}>
                Under Review
              </button>
            )}

            {/* Under Review → Request Interview (disabled once already requested) */}
            {(isUnderReview || app.status === "interview requested") && (
              <button
                onClick={() => isUnderReview ? requestInterview(jobId, app._id) : undefined}
                disabled={app.status === "interview requested"}
                style={{
                  ...interviewBtnStyle,
                  opacity: app.status === "interview requested" ? 0.5 : 1,
                  cursor: app.status === "interview requested" ? "not-allowed" : "pointer",
                }}
              >
                📅 {app.status === "interview requested" ? "Interview Requested" : "Request Interview"}
              </button>
            )}

            {/* Hire — available once interview has been requested or is pending */}
            {(app.status === "interview requested" || app.status === "interview pending") && (
              <button
                onClick={() => setHireConfirm({ jobId, subdocId: app._id, name: `${app.firstname} ${app.lastname}`, jobTitle: activeJobs.find(j => j._id === jobId)?.title || "" })}
                style={hireBtnStyle}
              >
                ✅ Hire
              </button>
            )}

            {/* Reject — available unless already rejected, hired, or interview requested/pending */}
            {app.status !== "rejected" && app.status !== "hired" &&
             app.status !== "interview requested" && app.status !== "interview pending" && (
              <button onClick={() => updateApplicantStatus(jobId, app._id, "rejected")} style={{ ...removeBtnStyle, fontSize: "0.7rem", padding: "0.2rem 0.4rem" }}>
                Reject
              </button>
            )}

            {/* Expand toggle */}
            <button onClick={() => setExpandedApplicant(isExpanded ? null : key)} style={{ ...editBtnStyle, fontSize: "0.7rem", padding: "0.2rem 0.5rem", backgroundColor: "rgba(50,30,90,0.4)" }}>
              {isExpanded ? "▲ Hide" : "▼ Profile"}
            </button>
          </div>
        </div>

        {/* Expanded profile */}
        {isExpanded && (
          <div style={{ marginTop: "0.75rem", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "10px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.72rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Resume</div>
              {app.resumeUrl
                ? <a href={`${import.meta.env.VITE_API_URL}${app.resumeUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: "#2e7d32", fontWeight: 600, textDecoration: "underline" }}>📄 View Resume (PDF)</a>
                : <span style={{ color: "#aaa" }}>No resume uploaded</span>}
            </div>
            {(app.skills || []).length > 0 && (
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.72rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {app.skills!.map((s, i) => <span key={i} style={{ backgroundColor: "rgba(50,30,90,0.1)", border: "1px solid rgba(50,30,90,0.25)", borderRadius: "20px", padding: "0.15rem 0.6rem", fontSize: "0.82rem" }}>{s}</span>)}
                </div>
              </div>
            )}
            {(app.degrees || []).length > 0 && (
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.72rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>Education</div>
                {app.degrees!.map((d, i) => <div key={i} style={{ marginBottom: "0.3rem" }}><strong>{d.degree}</strong>{d.major ? ` — ${d.major}` : ""}<div style={{ color: "#555", fontSize: "0.82rem" }}>{d.university}</div></div>)}
              </div>
            )}
            {(app.experience || []).length > 0 && (
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.72rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>Experience</div>
                {app.experience!.map((e, i) => (
                  <div key={i} style={{ marginBottom: "0.5rem" }}>
                    <strong>{e.title}</strong>
                    <div style={{ color: "#666", fontSize: "0.8rem" }}>{e.startDate.split("T")[0]} — {e.endDate ? e.endDate.split("T")[0] : "Present"}</div>
                    {e.description && <div style={{ color: "#444", marginTop: "0.1rem" }}>{e.description}</div>}
                  </div>
                ))}
              </div>
            )}
            {app.appliedAt && <div style={{ color: "#bbb", fontSize: "0.78rem" }}>Applied: {new Date(app.appliedAt).toLocaleDateString()}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", width: "100%", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "5vh", fontFamily: "Arial, sans-serif", color: "black" }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "100%", backgroundImage: "url(/mountain.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", zIndex: -1, animation: "kenBurns 35s ease-in-out infinite" }} />

      {/* Header */}
      <div style={{ width: "90%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2rem" }}>Hello, {user.firstname}</h1>
        <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", fontSize: "1rem", fontWeight: 500, cursor: "pointer", border: "none", borderRadius: "8px", backgroundColor: "rgba(50, 30, 90, 0.7)", color: "white" }}>Logout</button>
      </div>

      {/* Main layout */}
      <div style={{ display: "flex", gap: "2rem", width: "90%", justifyContent: "center", alignItems: "flex-start", marginBottom: "3rem" }}>

        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Personal Info */}
          <div style={{ backgroundColor: "rgba(255,255,255,0.85)", padding: "1.75rem", borderRadius: "16px", width: "260px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h2 style={titleStyle}>Personal Information</h2>
            {renderInfoRow("First Name", "firstname", user.firstname)}
            {renderInfoRow("Last Name", "lastname", user.lastname)}
            {renderInfoRow("Email", "email", user.email)}
            {renderInfoRow("Phone", "phone", user.phone || "—")}
            <button onClick={handleSavePersonalInfo} style={{ ...saveBtnStyle, marginTop: "0.5rem", alignSelf: "flex-start" }}>Save</button>
          </div>

          {/* Skills */}
          <div style={{ backgroundColor: "rgba(240,240,240,0.95)", padding: "1.75rem", borderRadius: "16px", width: "260px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h2 style={{ ...titleStyle, marginBottom: "0.25rem" }}>Skills</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {(user.skills || []).map((skill, idx) => (
                <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", backgroundColor: "rgba(50,30,90,0.12)", border: "1px solid rgba(50,30,90,0.35)", borderRadius: "20px", padding: "0.2rem 0.65rem", fontSize: "0.85rem" }}>
                  {skill}
                  <button onClick={() => handleRemoveSkill(skill)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "0.85rem", padding: 0, lineHeight: 1 }}>✕</button>
                </span>
              ))}
            </div>
            {addingSkill ? (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Enter a skill" autoFocus
                  onKeyDown={e => { if (e.key === "Enter") handleSaveSkill(); if (e.key === "Escape") { setAddingSkill(false); setNewSkill(""); } }}
                  style={{ ...inputStyle, fontSize: "0.9rem" }} />
                <button onClick={handleSaveSkill} style={saveBtnStyle}>Save</button>
                <button onClick={() => { setAddingSkill(false); setNewSkill(""); }} style={cancelSmallBtnStyle}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAddingSkill(true)} style={addOutlineBtnStyle}>+ Add Skill</button>
            )}
          </div>
        </div>

        {/* Right Column: Active Listings + Past Listings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "650px" }}>

          {/* Active Listings */}
          <div style={{ backgroundColor: "rgba(255,255,255,0.85)", padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 style={{ ...titleStyle, marginBottom: "0.25rem" }}>My Listings</h2>

            {activeJobs.length === 0 && !addingJob && <div style={{ color: "#666", fontSize: "0.95rem" }}>No active listings.</div>}

            {activeJobs.map(job => (
              <div key={job._id} style={{ border: "1px solid #ccc", padding: "0.85rem 1rem", borderRadius: "10px", backgroundColor: "rgba(245,245,255,0.9)", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {editingJobId === job._id ? (
                  <>
                    <input value={editingJob.title} placeholder="Job Title" onChange={e => setEditingJob({ ...editingJob, title: e.target.value })} style={inputStyle} />
                    <input value={editingJob.company} placeholder="Company" onChange={e => setEditingJob({ ...editingJob, company: e.target.value })} style={inputStyle} />
                    <input value={editingJob.payRate} placeholder="Pay Rate" onChange={e => setEditingJob({ ...editingJob, payRate: e.target.value })} style={inputStyle} />
                    <label style={{ fontSize: "0.8rem", color: "#555" }}>Start Date (optional)</label>
                    <input type="date" value={editingJob.startDate} onChange={e => setEditingJob({ ...editingJob, startDate: e.target.value })} style={inputStyle} />
                    <textarea value={editingJob.description} placeholder="Description" onChange={e => setEditingJob({ ...editingJob, description: e.target.value })} style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }} />
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => handleUpdateJob(job._id)} style={saveBtnStyle}>Save</button>
                      <button onClick={() => setEditingJobId(null)} style={cancelSmallBtnStyle}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>{job.title}</div>
                    <div style={{ color: "#555", fontSize: "0.88rem" }}>{job.company}</div>
                    {job.payRate && <div style={{ fontSize: "0.88rem", color: "#2e7d32", fontWeight: 600 }}>💰 {job.payRate}</div>}
                    {job.startDate && <div style={{ fontSize: "0.82rem", color: "#555" }}>Start: {new Date(job.startDate).toLocaleDateString()}</div>}
                    {job.createdAt && <div style={{ fontSize: "0.78rem", color: "#999" }}>Posted: {new Date(job.createdAt).toLocaleDateString()}</div>}
                    {job.description && <div style={{ color: "#444", fontSize: "0.88rem", marginTop: "0.15rem" }}>{job.description}</div>}

                    <div style={{ marginTop: "0.5rem" }}>
                      <div style={{ fontSize: "0.82rem", color: "#777", marginBottom: "0.4rem", fontWeight: 600 }}>
                        {applicantsByJob[job._id]?.length ?? 0} applicant{(applicantsByJob[job._id]?.length ?? 0) !== 1 ? "s" : ""}
                      </div>
                      {(applicantsByJob[job._id] || []).map(app => renderApplicantPanel(app, job._id))}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                      <button onClick={() => startEditingJob(job)} style={editBtnStyle}>Edit</button>
                      <button onClick={() => handleDeleteJob(job._id)} style={removeBtnStyle}>Delete</button>
                      <button
                        onClick={() => handleCloseJob(job._id)}
                        style={{ backgroundColor: "#555", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", padding: "0.25rem 0.55rem", fontSize: "0.78rem" }}
                      >
                        Close Listing
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {addingJob ? (
              <div style={{ border: "1px solid #ccc", padding: "0.85rem 1rem", borderRadius: "10px", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input value={newJob.title} placeholder="Job Title" onChange={e => setNewJob({ ...newJob, title: e.target.value })} style={inputStyle} />
                <input value={newJob.company} placeholder="Company" onChange={e => setNewJob({ ...newJob, company: e.target.value })} style={inputStyle} />
                <input value={newJob.payRate} placeholder="Pay Rate (e.g. $25/hr)" onChange={e => setNewJob({ ...newJob, payRate: e.target.value })} style={inputStyle} />
                <label style={{ fontSize: "0.8rem", color: "#555" }}>Start Date (optional)</label>
                <input type="date" value={newJob.startDate} onChange={e => setNewJob({ ...newJob, startDate: e.target.value })} style={inputStyle} />
                <textarea value={newJob.description} placeholder="Description (optional)" onChange={e => setNewJob({ ...newJob, description: e.target.value })} style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }} />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={handlePostJob} style={saveBtnStyle}>Post Job</button>
                  <button onClick={() => { setAddingJob(false); setNewJob({ title: "", description: "", company: "", payRate: "", startDate: "" }); }} style={cancelSmallBtnStyle}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingJob(true)} style={addOutlineBtnStyle}>+ Post New Job</button>
            )}
          </div>

          {/* Past Listings */}
          {pastJobs.length > 0 && (
            <div style={{ backgroundColor: "rgba(240,240,240,0.9)", padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h2 style={{ ...titleStyle, marginBottom: "0.25rem" }}>Past Listings</h2>
              {pastJobs.map(job => (
                <div key={job._id} style={{ border: "1px solid #ccc", padding: "0.85rem 1rem", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.8)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{job.title}</div>
                  <div style={{ color: "#555", fontSize: "0.88rem" }}>{job.company}</div>
                  {job.payRate && <div style={{ fontSize: "0.85rem", color: "#2e7d32", fontWeight: 600 }}>💰 {job.payRate}</div>}
                  {job.startDate && <div style={{ fontSize: "0.82rem", color: "#555" }}>Start: {new Date(job.startDate).toLocaleDateString()}</div>}
                  {job.description && <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "0.15rem" }}>{job.description}</div>}
                  {job.hiredApplicant && (
                    <div style={{ marginTop: "0.5rem", backgroundColor: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}>
                      ✅ <strong>Applicant Hired:</strong> {job.hiredApplicant.firstname} {job.hiredApplicant.lastname}
                      <span style={{ color: "#555", marginLeft: "0.5rem" }}>({job.hiredApplicant.email})</span>
                    </div>
                  )}
                  {job.createdAt && <div style={{ fontSize: "0.75rem", color: "#bbb", marginTop: "0.25rem" }}>Posted: {new Date(job.createdAt).toLocaleDateString()}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hire Confirmation Modal */}
      {hireConfirm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "2.5rem", maxWidth: "420px", width: "90%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <h2 style={{ color: "#321e5a", marginBottom: "1rem" }}>Confirm Hire</h2>
            <p style={{ fontSize: "0.97rem", color: "#444", marginBottom: "0.5rem" }}>
              Hire <strong>{hireConfirm.name}</strong> for <strong>{hireConfirm.jobTitle}</strong>?
            </p>
            <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "1.75rem" }}>
              This will close the listing and mark it as filled. All other applicants will be rejected.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button onClick={confirmHire} style={{ ...hireBtnStyle, padding: "0.6rem 1.5rem", fontSize: "0.95rem", borderRadius: "8px" }}>
                ✅ Hire &amp; Close Listing
              </button>
              <button onClick={() => setHireConfirm(null)} style={{ ...cancelSmallBtnStyle, padding: "0.6rem 1.5rem", fontSize: "0.95rem" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1) translate(0, 0); }
          25% { transform: scale(1.05) translate(-1%, -1%); }
          50% { transform: scale(1.1) translate(1%, -1%); }
          75% { transform: scale(1.05) translate(-1%, 1%); }
          100% { transform: scale(1) translate(0, 0); }
        }
      `}</style>
    </div>
  );
};

export default EmployerProfile;
