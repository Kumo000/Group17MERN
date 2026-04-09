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

const statusColor = (status?: string): React.CSSProperties => {
  switch (status) {
    case "interview requested": return { color: "#6a1b9a", fontWeight: 700 };
    case "interview pending":   return { color: "#bf360c", fontWeight: 700 };
    case "under review":        return { color: "#0d47a1", fontWeight: 700 };
    case "hired":               return { color: "#1b5e20", fontWeight: 700 };
    case "rejected":            return { color: "#b71c1c", fontWeight: 700 };
    default:                    return { color: "#333" };
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

  const [hireConfirm, setHireConfirm] = useState<{ jobId: string; subdocId: string; name: string; jobTitle: string } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) { const s = localStorage.getItem("user"); if (s) setUser(JSON.parse(s)); return; }
      try {
        const r = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, { headers: { Authorization: token } });
        const u = await r.json(); setUser(u); localStorage.setItem("user", JSON.stringify(u));
      } catch { const s = localStorage.getItem("user"); if (s) setUser(JSON.parse(s)); }
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
      (data.active || []).forEach((job: Job) => fetchApplicants(job._id, token));
    } catch (err) { console.error("Error fetching listings:", err); }
  };

  const fetchApplicants = async (jobId: string, token?: string) => {
    const t = token || localStorage.getItem("token") || "";
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/getApplicants/${jobId}`, { headers: { Authorization: t } });
      if (!r.ok) return;
      const data = await r.json();
      setApplicantsByJob(prev => ({ ...prev, [jobId]: data.applicants }));
    } catch (err) { console.error("Error fetching applicants:", err); }
  };

  const updateApplicantStatus = async (jobId: string, subdocId: string, status: "rejected" | "under review") => {
    const token = localStorage.getItem("token") || "";
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/updateApplicantStatus/${jobId}/${subdocId}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: token }, body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error();
      setApplicantsByJob(prev => ({ ...prev, [jobId]: prev[jobId]?.map(a => a._id === subdocId ? { ...a, status } : a) }));
    } catch { alert("Error updating status"); }
  };

  const requestInterview = async (jobId: string, subdocId: string) => {
    const token = localStorage.getItem("token") || "";
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/requestInterview/${jobId}/${subdocId}`, { method: "POST", headers: { Authorization: token } });
      if (!r.ok) throw new Error();
      setApplicantsByJob(prev => ({ ...prev, [jobId]: prev[jobId]?.map(a => a._id === subdocId ? { ...a, status: "interview requested" } : a) }));
    } catch { alert("Error sending interview request"); }
  };

  const confirmHire = async () => {
    if (!hireConfirm) return;
    const token = localStorage.getItem("token") || "";
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/hire/${hireConfirm.jobId}/${hireConfirm.subdocId}`, { method: "PUT", headers: { Authorization: token } });
      if (!r.ok) throw new Error();
      setHireConfirm(null);
      await fetchListings(token);
    } catch { alert("Error hiring applicant"); }
  };

  const saveUserToAPI = async (updatedUser: User) => {
    const token = localStorage.getItem("token");
    const r = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update`, {
      method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) }, body: JSON.stringify(updatedUser),
    });
    if (!r.ok) throw new Error();
    const data = await r.json(); setUser(data.user); localStorage.setItem("user", JSON.stringify(data.user)); return data.user;
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
    try { await saveUserToAPI({ ...user, skills: [...existing, t] }); setNewSkill(""); setAddingSkill(false); } catch { alert("Error saving skill"); }
  };
  const handleRemoveSkill = async (skill: string) => { if (!user) return; try { await saveUserToAPI({ ...user, skills: (user.skills || []).filter(s => s !== skill) }); } catch { alert("Error removing skill"); } };

  const handlePostJob = async () => {
    if (!newJob.title || !newJob.company) return;
    const token = localStorage.getItem("token");
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/postJob`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: token || "" }, body: JSON.stringify({ ...newJob, startDate: newJob.startDate || undefined }) });
      if (!r.ok) { const e = await r.json(); alert(e.message || "Error posting job"); return; }
      setNewJob({ title: "", description: "", company: "", payRate: "", startDate: "" }); setAddingJob(false); fetchListings(token || "");
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
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/closeJob/${jobId}`, { method: "PUT", headers: { Authorization: token } });
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
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/updateJob/${jobId}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: token || "" }, body: JSON.stringify(editingJob) });
      if (!r.ok) { alert("Error updating job"); return; }
      const data = await r.json(); setActiveJobs(prev => prev.map(j => j._id === jobId ? { ...j, ...data.job } : j)); setEditingJobId(null);
    } catch { alert("Error updating job"); }
  };

  if (!user) return <div role="status" aria-live="polite">Loading...</div>;

  // ---- Shared styles ----
  const inputStyle: React.CSSProperties = { padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid #999", fontSize: "0.9rem", width: "100%", boxSizing: "border-box" };
  const editBtnStyle: React.CSSProperties = { padding: "0.2rem 0.6rem", fontSize: "0.78rem", cursor: "pointer", border: "none", borderRadius: "6px", backgroundColor: "rgba(50, 30, 90, 0.85)", color: "white", whiteSpace: "nowrap" };
  const addOutlineBtnStyle: React.CSSProperties = { backgroundColor: "#e8f5e9", color: "#1b5e20", border: "2px solid #2e7d32", borderRadius: "8px", cursor: "pointer", padding: "0.35rem 0.85rem", fontSize: "0.85rem", fontWeight: 700, alignSelf: "flex-start" };
  const saveBtnStyle: React.CSSProperties = { padding: "0.35rem 1.1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", border: "none", borderRadius: "8px", backgroundColor: "rgba(50, 30, 90, 0.85)", color: "white" };
  const cancelSmallBtnStyle: React.CSSProperties = { padding: "0.35rem 0.85rem", fontSize: "0.85rem", cursor: "pointer", border: "none", borderRadius: "6px", backgroundColor: "#666", color: "white" };
  const removeBtnStyle: React.CSSProperties = { backgroundColor: "#c62828", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", padding: "0.25rem 0.55rem", fontSize: "0.78rem" };
  const interviewBtnStyle: React.CSSProperties = { backgroundColor: "#bf360c", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", padding: "0.2rem 0.5rem", fontSize: "0.75rem", fontWeight: 600 };
  const hireBtnStyle: React.CSSProperties = { backgroundColor: "#1b5e20", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", padding: "0.2rem 0.5rem", fontSize: "0.75rem", fontWeight: 600 };
  const titleStyle: React.CSSProperties = { color: "#111", fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.75rem" };
  const labelStyle: React.CSSProperties = { display: "block", fontWeight: 800, color: "#222", marginBottom: "0.25rem", fontSize: "0.95rem" };

  const renderInfoRow = (label: string, field: "firstname" | "lastname" | "email" | "phone", displayValue: string) => {
    const inputId = `edit-${field}`;
    const valueId = `value-${field}`;
    return (
      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor={editingField === field ? inputId : valueId} style={labelStyle}>{label}</label>
        {editingField === field ? (
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <input id={inputId} value={editValue} onChange={e => setEditValue(e.target.value)} style={{ ...inputStyle, fontSize: "0.88rem" }} autoFocus aria-label={`Edit ${label}`}
              onKeyDown={e => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") cancelEdit(); }} />
            <button onClick={confirmEdit} style={{ ...editBtnStyle, backgroundColor: "#2e7d32" }} aria-label={`Save ${label}`}>✓</button>
            <button onClick={cancelEdit} style={{ ...editBtnStyle, backgroundColor: "#666" }} aria-label={`Cancel editing ${label}`}>✕</button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span id={valueId} style={{ fontSize: "0.93rem", color: "#222" }}>{displayValue}</span>
            <button onClick={() => startEditing(field)} style={editBtnStyle} aria-label={`Edit ${label}`}>Edit</button>
          </div>
        )}
      </div>
    );
  };

  const renderApplicantPanel = (app: Applicant, jobId: string) => {
    const key = `${jobId}_${app._id}`;
    const isExpanded = expandedApplicant === key;
    const isUnderReview = app.status === "under review";
    const fullName = `${app.firstname} ${app.lastname}`;

    return (
      <div key={app._id} style={{ borderLeft: "3px solid rgba(50,30,90,0.3)", paddingLeft: "0.75rem", marginBottom: "0.6rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
          <div style={{ fontSize: "0.85rem" }}>
            <strong>{fullName}</strong>
            <span style={{ color: "#444", marginLeft: "0.5rem" }}>{app.email}</span>
            <span style={{ marginLeft: "0.6rem", fontSize: "0.78rem", ...statusColor(app.status) }}>
              ({app.status ?? "pending"})
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
            {app.status === "pending" && (
              <button onClick={() => updateApplicantStatus(jobId, app._id, "under review")} style={{ ...editBtnStyle, fontSize: "0.72rem", padding: "0.2rem 0.4rem" }} aria-label={`Mark ${fullName} as under review`}>
                Under Review
              </button>
            )}

            {(isUnderReview || app.status === "interview requested") && (
              <button
                onClick={() => isUnderReview ? requestInterview(jobId, app._id) : undefined}
                disabled={app.status === "interview requested"}
                aria-label={app.status === "interview requested" ? `Interview already requested for ${fullName}` : `Request interview with ${fullName}`}
                aria-disabled={app.status === "interview requested"}
                style={{ ...interviewBtnStyle, opacity: app.status === "interview requested" ? 0.6 : 1, cursor: app.status === "interview requested" ? "not-allowed" : "pointer" }}
              >
                {app.status === "interview requested" ? "Interview Requested" : "📅 Request Interview"}
              </button>
            )}

            {(app.status === "interview requested" || app.status === "interview pending") && (
              <button
                onClick={() => setHireConfirm({ jobId, subdocId: app._id, name: fullName, jobTitle: activeJobs.find(j => j._id === jobId)?.title || "" })}
                style={hireBtnStyle}
                aria-label={`Hire ${fullName}`}
              >
                ✅ Hire
              </button>
            )}

            {app.status !== "rejected" && app.status !== "hired" && app.status !== "interview requested" && app.status !== "interview pending" && (
              <button onClick={() => updateApplicantStatus(jobId, app._id, "rejected")} style={{ ...removeBtnStyle, fontSize: "0.72rem", padding: "0.2rem 0.4rem" }} aria-label={`Reject ${fullName}`}>
                Reject
              </button>
            )}

            <button
              onClick={() => setExpandedApplicant(isExpanded ? null : key)}
              style={{ ...editBtnStyle, fontSize: "0.72rem", padding: "0.2rem 0.5rem", backgroundColor: "rgba(50,30,90,0.5)" }}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? `Hide profile for ${fullName}` : `View profile for ${fullName}`}
            >
              {isExpanded ? "▲ Hide" : "▼ Profile"}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div style={{ marginTop: "0.75rem", backgroundColor: "rgba(255,255,255,0.95)", borderRadius: "10px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.75rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Resume</div>
              {app.resumeUrl
                ? <a href={`${import.meta.env.VITE_API_URL}${app.resumeUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: "#1b5e20", fontWeight: 700, textDecoration: "underline" }} aria-label={`View ${fullName}'s resume PDF (opens in new tab)`}>📄 View Resume (PDF)</a>
                : <span style={{ color: "#666" }}>No resume uploaded</span>}
            </div>
            {(app.skills || []).length > 0 && (
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.75rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>Skills</div>
                <ul aria-label={`${fullName}'s skills`} style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", listStyle: "none", padding: 0, margin: 0 }}>
                  {app.skills!.map((s, i) => <li key={i} style={{ backgroundColor: "rgba(50,30,90,0.1)", border: "1px solid rgba(50,30,90,0.25)", borderRadius: "20px", padding: "0.15rem 0.6rem", fontSize: "0.82rem" }}>{s}</li>)}
                </ul>
              </div>
            )}
            {(app.degrees || []).length > 0 && (
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.75rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>Education</div>
                {app.degrees!.map((d, i) => <div key={i} style={{ marginBottom: "0.3rem" }}><strong>{d.degree}</strong>{d.major ? ` — ${d.major}` : ""}<div style={{ color: "#444", fontSize: "0.82rem" }}>{d.university}</div></div>)}
              </div>
            )}
            {(app.experience || []).length > 0 && (
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.75rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>Experience</div>
                {app.experience!.map((e, i) => (
                  <div key={i} style={{ marginBottom: "0.5rem" }}>
                    <strong>{e.title}</strong>
                    <div style={{ color: "#444", fontSize: "0.8rem" }}><time>{e.startDate.split("T")[0]}</time> — {e.endDate ? <time>{e.endDate.split("T")[0]}</time> : "Present"}</div>
                    {e.description && <div style={{ color: "#333", marginTop: "0.1rem" }}>{e.description}</div>}
                  </div>
                ))}
              </div>
            )}
            {app.appliedAt && <div style={{ color: "#777", fontSize: "0.78rem" }}>Applied: <time>{new Date(app.appliedAt).toLocaleDateString()}</time></div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", width: "100%", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "5vh", fontFamily: "Arial, sans-serif", color: "#111" }}>
      <div role="presentation" aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "100%", backgroundImage: "url(/mountain.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", zIndex: -1, animation: "kenBurns 35s ease-in-out infinite" }} />

      {/* Header */}
      <header style={{ width: "90%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2rem", color: "#111" }}>Hello, {user.firstname}</h1>
        <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", fontSize: "1rem", fontWeight: 600, cursor: "pointer", border: "none", borderRadius: "8px", backgroundColor: "rgba(50, 30, 90, 0.85)", color: "white" }}>Logout</button>
      </header>

      {/* Main layout */}
      <main style={{ display: "flex", gap: "2rem", width: "90%", justifyContent: "center", alignItems: "flex-start", marginBottom: "3rem" }}>

        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <section aria-label="Personal Information" style={{ backgroundColor: "rgba(255,255,255,0.92)", padding: "1.75rem", borderRadius: "16px", width: "260px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h2 style={titleStyle}>Personal Information</h2>
            {renderInfoRow("First Name", "firstname", user.firstname)}
            {renderInfoRow("Last Name", "lastname", user.lastname)}
            {renderInfoRow("Email", "email", user.email)}
            {renderInfoRow("Phone", "phone", user.phone || "—")}
            <button onClick={handleSavePersonalInfo} style={{ ...saveBtnStyle, marginTop: "0.5rem", alignSelf: "flex-start" }}>Save Changes</button>
          </section>

          <section aria-label="Skills" style={{ backgroundColor: "rgba(240,240,240,0.97)", padding: "1.75rem", borderRadius: "16px", width: "260px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h2 style={{ ...titleStyle, marginBottom: "0.25rem" }}>Skills</h2>
            <ul aria-label="Your skills" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
              {(user.skills || []).map((skill, idx) => (
                <li key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", backgroundColor: "rgba(50,30,90,0.12)", border: "1px solid rgba(50,30,90,0.35)", borderRadius: "20px", padding: "0.2rem 0.65rem", fontSize: "0.85rem", color: "#222" }}>
                  {skill}
                  <button onClick={() => handleRemoveSkill(skill)} aria-label={`Remove skill: ${skill}`} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: "0.85rem", padding: 0, lineHeight: 1 }}>✕</button>
                </li>
              ))}
            </ul>
            {addingSkill ? (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <label htmlFor="new-skill" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>New skill</label>
                <input id="new-skill" value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Enter a skill" autoFocus
                  onKeyDown={e => { if (e.key === "Enter") handleSaveSkill(); if (e.key === "Escape") { setAddingSkill(false); setNewSkill(""); } }}
                  style={{ ...inputStyle, fontSize: "0.9rem" }} />
                <button onClick={handleSaveSkill} style={saveBtnStyle}>Save</button>
                <button onClick={() => { setAddingSkill(false); setNewSkill(""); }} style={cancelSmallBtnStyle}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAddingSkill(true)} style={addOutlineBtnStyle}>+ Add Skill</button>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "650px" }}>

          {/* Active Listings */}
          <section aria-label="My active job listings" style={{ backgroundColor: "rgba(255,255,255,0.92)", padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 style={{ ...titleStyle, marginBottom: "0.25rem" }}>My Listings</h2>

            {activeJobs.length === 0 && !addingJob && <p style={{ color: "#444", fontSize: "0.95rem" }}>No active listings.</p>}

            {activeJobs.map(job => (
              <article key={job._id} style={{ border: "1px solid #bbb", padding: "0.85rem 1rem", borderRadius: "10px", backgroundColor: "rgba(245,245,255,0.95)", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {editingJobId === job._id ? (
                  <>
                    <label htmlFor={`edit-job-title-${job._id}`} style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Job Title</label>
                    <input id={`edit-job-title-${job._id}`} value={editingJob.title} placeholder="Job Title" onChange={e => setEditingJob({ ...editingJob, title: e.target.value })} style={inputStyle} />
                    <label htmlFor={`edit-job-company-${job._id}`} style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Company</label>
                    <input id={`edit-job-company-${job._id}`} value={editingJob.company} placeholder="Company" onChange={e => setEditingJob({ ...editingJob, company: e.target.value })} style={inputStyle} />
                    <label htmlFor={`edit-job-pay-${job._id}`} style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Pay Rate</label>
                    <input id={`edit-job-pay-${job._id}`} value={editingJob.payRate} placeholder="Pay Rate" onChange={e => setEditingJob({ ...editingJob, payRate: e.target.value })} style={inputStyle} />
                    <label htmlFor={`edit-job-start-${job._id}`} style={{ fontSize: "0.8rem", fontWeight: 700, color: "#333" }}>Start Date <span style={{ fontWeight: 400 }}>(optional)</span></label>
                    <input id={`edit-job-start-${job._id}`} type="date" value={editingJob.startDate} onChange={e => setEditingJob({ ...editingJob, startDate: e.target.value })} style={inputStyle} />
                    <label htmlFor={`edit-job-desc-${job._id}`} style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Description</label>
                    <textarea id={`edit-job-desc-${job._id}`} value={editingJob.description} placeholder="Description" onChange={e => setEditingJob({ ...editingJob, description: e.target.value })} style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }} />
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => handleUpdateJob(job._id)} style={saveBtnStyle}>Save</button>
                      <button onClick={() => setEditingJobId(null)} style={cancelSmallBtnStyle}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 style={{ fontWeight: 700, fontSize: "1rem", margin: 0, color: "#111" }}>{job.title}</h3>
                    <div style={{ color: "#444", fontSize: "0.88rem" }}>{job.company}</div>
                    {job.payRate && <div style={{ fontSize: "0.88rem", color: "#1b5e20", fontWeight: 600 }}>💰 {job.payRate}</div>}
                    {job.startDate && <div style={{ fontSize: "0.82rem", color: "#444" }}>Start: <time>{new Date(job.startDate).toLocaleDateString()}</time></div>}
                    {job.createdAt && <div style={{ fontSize: "0.78rem", color: "#666" }}>Posted: <time>{new Date(job.createdAt).toLocaleDateString()}</time></div>}
                    {job.description && <div style={{ color: "#333", fontSize: "0.88rem", marginTop: "0.15rem" }}>{job.description}</div>}

                    <div style={{ marginTop: "0.5rem" }} aria-label={`Applicants for ${job.title}`}>
                      <div style={{ fontSize: "0.82rem", color: "#555", marginBottom: "0.4rem", fontWeight: 600 }}>
                        {applicantsByJob[job._id]?.length ?? 0} applicant{(applicantsByJob[job._id]?.length ?? 0) !== 1 ? "s" : ""}
                      </div>
                      {(applicantsByJob[job._id] || []).map(app => renderApplicantPanel(app, job._id))}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                      <button onClick={() => startEditingJob(job)} style={editBtnStyle} aria-label={`Edit ${job.title}`}>Edit</button>
                      <button onClick={() => handleDeleteJob(job._id)} style={removeBtnStyle} aria-label={`Delete ${job.title}`}>Delete</button>
                      <button onClick={() => handleCloseJob(job._id)} style={{ backgroundColor: "#555", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", padding: "0.25rem 0.55rem", fontSize: "0.78rem" }} aria-label={`Close listing for ${job.title}`}>
                        Close Listing
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}

            {addingJob ? (
              <div style={{ border: "1px solid #bbb", padding: "0.85rem 1rem", borderRadius: "10px", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="new-job-title" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Job Title</label>
                <input id="new-job-title" value={newJob.title} placeholder="Job Title" onChange={e => setNewJob({ ...newJob, title: e.target.value })} style={inputStyle} />
                <label htmlFor="new-job-company" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Company</label>
                <input id="new-job-company" value={newJob.company} placeholder="Company" onChange={e => setNewJob({ ...newJob, company: e.target.value })} style={inputStyle} />
                <label htmlFor="new-job-pay" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Pay Rate <span style={{ fontWeight: 400 }}>(optional)</span></label>
                <input id="new-job-pay" value={newJob.payRate} placeholder="e.g. $25/hr" onChange={e => setNewJob({ ...newJob, payRate: e.target.value })} style={inputStyle} />
                <label htmlFor="new-job-start" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Start Date <span style={{ fontWeight: 400 }}>(optional)</span></label>
                <input id="new-job-start" type="date" value={newJob.startDate} onChange={e => setNewJob({ ...newJob, startDate: e.target.value })} style={inputStyle} />
                <label htmlFor="new-job-desc" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Description <span style={{ fontWeight: 400 }}>(optional)</span></label>
                <textarea id="new-job-desc" value={newJob.description} placeholder="Description" onChange={e => setNewJob({ ...newJob, description: e.target.value })} style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }} />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={handlePostJob} style={saveBtnStyle}>Post Job</button>
                  <button onClick={() => { setAddingJob(false); setNewJob({ title: "", description: "", company: "", payRate: "", startDate: "" }); }} style={cancelSmallBtnStyle}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingJob(true)} style={addOutlineBtnStyle}>+ Post New Job</button>
            )}
          </section>

          {/* Past Listings */}
          {pastJobs.length > 0 && (
            <section aria-label="Past job listings" style={{ backgroundColor: "rgba(240,240,240,0.95)", padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h2 style={{ ...titleStyle, marginBottom: "0.25rem" }}>Past Listings</h2>
              {pastJobs.map(job => (
                <article key={job._id} style={{ border: "1px solid #bbb", padding: "0.85rem 1rem", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.85)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <h3 style={{ fontWeight: 700, fontSize: "1rem", margin: 0, color: "#111" }}>{job.title}</h3>
                  <div style={{ color: "#444", fontSize: "0.88rem" }}>{job.company}</div>
                  {job.payRate && <div style={{ fontSize: "0.85rem", color: "#1b5e20", fontWeight: 600 }}>💰 {job.payRate}</div>}
                  {job.startDate && <div style={{ fontSize: "0.82rem", color: "#444" }}>Start: <time>{new Date(job.startDate).toLocaleDateString()}</time></div>}
                  {job.description && <div style={{ color: "#444", fontSize: "0.85rem", marginTop: "0.15rem" }}>{job.description}</div>}
                  {job.hiredApplicant && (
                    <div style={{ marginTop: "0.5rem", backgroundColor: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}>
                      ✅ <strong>Applicant Hired:</strong> {job.hiredApplicant.firstname} {job.hiredApplicant.lastname}
                      <span style={{ color: "#444", marginLeft: "0.5rem" }}>({job.hiredApplicant.email})</span>
                    </div>
                  )}
                  {job.createdAt && <div style={{ fontSize: "0.75rem", color: "#777", marginTop: "0.25rem" }}>Posted: <time>{new Date(job.createdAt).toLocaleDateString()}</time></div>}
                </article>
              ))}
            </section>
          )}
        </div>
      </main>

      {/* Hire Confirmation Modal */}
      {hireConfirm && (
        <div role="dialog" aria-modal="true" aria-labelledby="hire-modal-title" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "2.5rem", maxWidth: "420px", width: "90%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <h2 id="hire-modal-title" style={{ color: "#321e5a", marginBottom: "1rem" }}>Confirm Hire</h2>
            <p style={{ fontSize: "0.97rem", color: "#333", marginBottom: "0.5rem" }}>
              Hire <strong>{hireConfirm.name}</strong> for <strong>{hireConfirm.jobTitle}</strong>?
            </p>
            <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1.75rem" }}>
              This will close the listing and mark it as filled.
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

