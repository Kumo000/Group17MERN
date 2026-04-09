import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ------------------ Types ------------------
interface Degree {
  university: string;
  degree: string;
  major?: string;
}

interface Experience {
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface User {
  _id?: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  role?: string;
  degrees?: Degree[];
  experience?: Experience[];
  skills?: string[];
  resumeUrl?: string;
}

interface ApplicationJob {
  _id: string;
  title: string;
  company: string;
  appliedAt: string;
  status: "pending" | "rejected" | "under review" | "interview requested" | "interview pending" | "hired";
}

// ------------------ Component ------------------
const ApplicantProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<ApplicationJob[]>([]);

  const [editingField, setEditingField] = useState<"firstname" | "lastname" | "email" | "phone" | null>(null);
  const [editValue, setEditValue] = useState("");

  const [newSkill, setNewSkill] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  const [addingDegree, setAddingDegree] = useState(false);
  const [newDegree, setNewDegree] = useState<Degree>({ university: "", degree: "", major: "" });

  const [addingExperience, setAddingExperience] = useState(false);
  const [newExperience, setNewExperience] = useState<Experience>({ title: "", startDate: "", endDate: "", description: "" });

  const [resumeUploading, setResumeUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, { headers: { Authorization: token } })
        .then((res) => res.json())
        .then((data) => { setUser(data); localStorage.setItem("user", JSON.stringify(data)); })
        .catch(() => {
          const storedUser = localStorage.getItem("user");
          if (storedUser) setUser(JSON.parse(storedUser));
        });

      fetch(`${import.meta.env.VITE_API_URL}/api/users/jobs/my-applications`, { headers: { Authorization: token } })
        .then((res) => res.json())
        .then((data) => setApplications(data))
        .catch((err) => console.error("Error fetching applications:", err));
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    }
  }, []);

  const saveToAPI = async (updatedUser: User) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) },
      body: JSON.stringify(updatedUser),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    const data = await res.json();
    setUser(data.user);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { alert("Please upload a PDF file."); return; }
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("resume", file);
    setResumeUploading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/upload-resume`, {
        method: "POST",
        headers: { Authorization: token || "" },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setUser((prev) => prev ? { ...prev, resumeUrl: data.resumeUrl } : prev);
      localStorage.setItem("user", JSON.stringify({ ...user, resumeUrl: data.resumeUrl }));
      alert("Resume uploaded successfully!");
    } catch { alert("Error uploading resume"); }
    finally {
      setResumeUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = () => { localStorage.removeItem("user"); localStorage.removeItem("token"); navigate("/"); };
  const startEditing = (field: "firstname" | "lastname" | "email" | "phone") => { setEditingField(field); setEditValue(user?.[field] || ""); };
  const cancelEdit = () => { setEditingField(null); setEditValue(""); };
  const confirmEdit = () => { if (!user || !editingField) return; setUser({ ...user, [editingField]: editValue }); setEditingField(null); setEditValue(""); };
  const handleSavePersonalInfo = async () => { if (!user) return; try { await saveToAPI(user); alert("Personal info saved!"); } catch { alert("Error saving personal info"); } };

  const handleSaveSkill = async () => {
    const trimmed = newSkill.trim(); if (!trimmed || !user) return;
    const existing = user.skills || [];
    if (existing.includes(trimmed)) { setNewSkill(""); setAddingSkill(false); return; }
    try { await saveToAPI({ ...user, skills: [...existing, trimmed] }); setNewSkill(""); setAddingSkill(false); }
    catch { alert("Error saving skill"); }
  };
  const handleRemoveSkill = async (skill: string) => { if (!user) return; try { await saveToAPI({ ...user, skills: (user.skills || []).filter((s) => s !== skill) }); } catch { alert("Error removing skill"); } };
  const handleSaveDegree = async () => { if (!newDegree.university || !newDegree.degree || !user) return; try { await saveToAPI({ ...user, degrees: [...(user.degrees || []), newDegree] }); setNewDegree({ university: "", degree: "", major: "" }); setAddingDegree(false); } catch { alert("Error saving degree"); } };
  const handleRemoveDegree = async (idx: number) => { if (!user) return; try { await saveToAPI({ ...user, degrees: user.degrees!.filter((_, i) => i !== idx) }); } catch { alert("Error removing degree"); } };
  const handleSaveExperience = async () => { if (!newExperience.title || !newExperience.startDate || !user) return; try { await saveToAPI({ ...user, experience: [...(user.experience || []), newExperience] }); setNewExperience({ title: "", startDate: "", endDate: "", description: "" }); setAddingExperience(false); } catch { alert("Error saving experience"); } };
  const handleRemoveExperience = async (idx: number) => { if (!user) return; try { await saveToAPI({ ...user, experience: user.experience!.filter((_, i) => i !== idx) }); } catch { alert("Error removing experience"); } };

  if (!user) return <div role="status" aria-live="polite">Loading...</div>;

  // ---- Shared styles ----
  const inputStyle: React.CSSProperties = { padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid #999", fontSize: "0.9rem", width: "100%", boxSizing: "border-box" };
  const editBtnStyle: React.CSSProperties = { padding: "0.2rem 0.6rem", fontSize: "0.78rem", cursor: "pointer", border: "none", borderRadius: "6px", backgroundColor: "rgba(50, 30, 90, 0.8)", color: "white", whiteSpace: "nowrap" };
  const addOutlineBtnStyle: React.CSSProperties = { backgroundColor: "#e8f5e9", color: "#1b5e20", border: "2px solid #2e7d32", borderRadius: "8px", cursor: "pointer", padding: "0.35rem 0.85rem", fontSize: "0.85rem", fontWeight: 700, alignSelf: "flex-start" };
  const saveBtnStyle: React.CSSProperties = { padding: "0.35rem 1.1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", border: "none", borderRadius: "8px", backgroundColor: "rgba(50, 30, 90, 0.85)", color: "white" };
  const cancelSmallBtnStyle: React.CSSProperties = { padding: "0.35rem 0.85rem", fontSize: "0.85rem", cursor: "pointer", border: "none", borderRadius: "6px", backgroundColor: "#666", color: "white" };
  const removeBtnStyle: React.CSSProperties = { backgroundColor: "#c62828", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", padding: "0.25rem 0.55rem", fontSize: "0.78rem", alignSelf: "flex-start" };

  // Accessibility: render info row with proper label+input association
  const renderInfoRow = (label: string, field: "firstname" | "lastname" | "email" | "phone", displayValue: string) => {
    const fieldId = `field-${field}`;
    const inputId = `edit-${field}`;
    return (
      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor={editingField === field ? inputId : fieldId} style={{ display: "block", fontWeight: 800, color: "#222", marginBottom: "0.25rem", fontSize: "0.95rem" }}>
          {label}
        </label>
        {editingField === field ? (
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <input
              id={inputId}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              style={{ ...inputStyle, fontSize: "0.88rem" }}
              autoFocus
              aria-label={`Edit ${label}`}
              onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") cancelEdit(); }}
            />
            <button onClick={confirmEdit} style={{ ...editBtnStyle, backgroundColor: "#2e7d32" }} aria-label={`Save ${label}`}>✓</button>
            <button onClick={cancelEdit} style={{ ...editBtnStyle, backgroundColor: "#666" }} aria-label={`Cancel editing ${label}`}>✕</button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span id={fieldId} style={{ fontSize: "0.93rem", color: "#222" }}>{displayValue}</span>
            <button onClick={() => startEditing(field)} style={editBtnStyle} aria-label={`Edit ${label}`}>Edit</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{ position: "relative", minHeight: "100vh", width: "100%", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "5vh", fontFamily: "Arial, sans-serif", color: "#111" }}
    >
      {/* Background — hidden from screen readers as decorative */}
      <div
        role="presentation"
        aria-hidden="true"
        style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "100%", backgroundImage: `url(/mountain.jpg)`, backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat", zIndex: -1, animation: "kenBurns 35s ease-in-out infinite" }}
      />

      {/* Header */}
      <header style={{ width: "90%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2rem", color: "#111" }}>Hello, {user.firstname}</h1>
        <nav aria-label="Main navigation" style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => navigate("/jobs")} style={{ padding: "0.5rem 1rem", fontSize: "1rem", fontWeight: 600, cursor: "pointer", border: "2px solid #2e7d32", borderRadius: "8px", backgroundColor: "#e8f5e9", color: "#1b5e20" }}>
            Search Jobs
          </button>
          <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", fontSize: "1rem", fontWeight: 600, cursor: "pointer", border: "none", borderRadius: "8px", backgroundColor: "rgba(50, 30, 90, 0.85)", color: "white" }}>
            Logout
          </button>
        </nav>
      </header>

      {/* Main layout */}
      <main style={{ display: "flex", gap: "2rem", width: "90%", justifyContent: "center", alignItems: "flex-start", marginBottom: "3rem" }}>

        {/* Left Column: Personal Information */}
        <section aria-label="Personal Information" style={{ backgroundColor: "rgba(255, 255, 255, 0.92)", padding: "1.75rem", borderRadius: "16px", width: "260px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <h2 style={{ marginBottom: "0.75rem", color: "#111", fontSize: "1.4rem", fontWeight: 800 }}>Personal Information</h2>
          {renderInfoRow("First Name", "firstname", user.firstname)}
          {renderInfoRow("Last Name", "lastname", user.lastname)}
          {renderInfoRow("Email", "email", user.email)}
          {renderInfoRow("Phone", "phone", user.phone || "—")}
          <button onClick={handleSavePersonalInfo} style={{ ...saveBtnStyle, marginTop: "0.5rem", alignSelf: "flex-start" }}>
            Save Changes
          </button>
        </section>

        {/* Middle Column */}
        <section aria-label="Qualifications" style={{ backgroundColor: "rgba(240, 240, 240, 0.97)", padding: "2rem", borderRadius: "16px", width: "400px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Degrees */}
          <h2 style={{ marginBottom: "0.25rem", color: "#111", fontSize: "1.4rem", fontWeight: 800 }}>Degrees</h2>
          {(user.degrees || []).map((deg, idx) => (
            <article key={idx} style={{ border: "1px solid #bbb", padding: "0.6rem 0.75rem", borderRadius: "8px", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "0.15rem", fontSize: "0.9rem" }}>
              <div><strong>{deg.degree}</strong>{deg.major ? ` — ${deg.major}` : ""}</div>
              <div style={{ color: "#444" }}>{deg.university}</div>
              <button onClick={() => handleRemoveDegree(idx)} style={{ ...removeBtnStyle, marginTop: "0.35rem" }} aria-label={`Remove ${deg.degree} from ${deg.university}`}>Remove</button>
            </article>
          ))}
          {addingDegree ? (
            <div style={{ border: "1px solid #bbb", padding: "0.75rem", borderRadius: "8px", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="new-degree-university" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>University</label>
              <input id="new-degree-university" value={newDegree.university} placeholder="University" onChange={(e) => setNewDegree({ ...newDegree, university: e.target.value })} style={inputStyle} />
              <label htmlFor="new-degree-name" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Degree</label>
              <input id="new-degree-name" value={newDegree.degree} placeholder="e.g. B.S." onChange={(e) => setNewDegree({ ...newDegree, degree: e.target.value })} style={inputStyle} />
              <label htmlFor="new-degree-major" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Major <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="new-degree-major" value={newDegree.major || ""} placeholder="Major" onChange={(e) => setNewDegree({ ...newDegree, major: e.target.value })} style={inputStyle} />
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                <button onClick={handleSaveDegree} style={saveBtnStyle}>Save</button>
                <button onClick={() => { setAddingDegree(false); setNewDegree({ university: "", degree: "", major: "" }); }} style={cancelSmallBtnStyle}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingDegree(true)} style={addOutlineBtnStyle}>+ Add Degree</button>
          )}

          {/* Experience */}
          <h2 style={{ marginBottom: "0.25rem", color: "#111", fontSize: "1.4rem", fontWeight: 800 }}>Experience</h2>
          {(user.experience || []).map((exp, idx) => (
            <article key={idx} style={{ border: "1px solid #bbb", padding: "0.6rem 0.75rem", borderRadius: "8px", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "0.15rem", fontSize: "0.9rem" }}>
              <div><strong>{exp.title}</strong></div>
              <div style={{ color: "#444", fontSize: "0.82rem" }}>
                <time>{exp.startDate.split("T")[0]}</time> — {exp.endDate ? <time>{exp.endDate.split("T")[0]}</time> : "Present"}
              </div>
              {exp.description && <div style={{ color: "#333", marginTop: "0.15rem" }}>{exp.description}</div>}
              <button onClick={() => handleRemoveExperience(idx)} style={{ ...removeBtnStyle, marginTop: "0.35rem" }} aria-label={`Remove ${exp.title} experience`}>Remove</button>
            </article>
          ))}
          {addingExperience ? (
            <div style={{ border: "1px solid #bbb", padding: "0.75rem", borderRadius: "8px", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="new-exp-title" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Job Title</label>
              <input id="new-exp-title" value={newExperience.title} placeholder="Job Title" onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })} style={inputStyle} />
              <label htmlFor="new-exp-start" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Start Date</label>
              <input id="new-exp-start" type="date" value={newExperience.startDate} onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })} style={inputStyle} />
              <label htmlFor="new-exp-end" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>End Date <span style={{ fontWeight: 400 }}>(leave blank if current)</span></label>
              <input id="new-exp-end" type="date" value={newExperience.endDate || ""} onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })} style={inputStyle} />
              <label htmlFor="new-exp-desc" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>Description <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <textarea id="new-exp-desc" value={newExperience.description || ""} placeholder="Description" onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })} style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }} />
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                <button onClick={handleSaveExperience} style={saveBtnStyle}>Save</button>
                <button onClick={() => { setAddingExperience(false); setNewExperience({ title: "", startDate: "", endDate: "", description: "" }); }} style={cancelSmallBtnStyle}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingExperience(true)} style={addOutlineBtnStyle}>+ Add Experience</button>
          )}

          {/* Resume */}
          <h2 style={{ marginBottom: "0.25rem", color: "#111", fontSize: "1.4rem", fontWeight: 800 }}>Resume</h2>
          <div style={{ border: "1px solid #bbb", padding: "0.75rem", borderRadius: "8px", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {user.resumeUrl ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span aria-hidden="true" style={{ fontSize: "1.2rem" }}>📄</span>
                  <a href={`${import.meta.env.VITE_API_URL}${user.resumeUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.88rem", color: "#1b5e20", fontWeight: 700, textDecoration: "underline" }}>
                    View Current Resume <span style={{ fontSize: "0.78rem", color: "#555" }}>(opens in new tab)</span>
                  </a>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#555" }}>Upload a new file to replace it.</div>
              </>
            ) : (
              <div style={{ fontSize: "0.88rem", color: "#555" }}>No resume uploaded yet. Add a PDF to strengthen your applications.</div>
            )}
            <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleResumeUpload} aria-label="Upload resume PDF" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={resumeUploading}
              aria-disabled={resumeUploading}
              style={{ ...addOutlineBtnStyle, opacity: resumeUploading ? 0.6 : 1, cursor: resumeUploading ? "not-allowed" : "pointer" }}
            >
              {resumeUploading ? "Uploading..." : user.resumeUrl ? "Replace Resume (PDF)" : "Upload Resume (PDF)"}
            </button>
          </div>

          {/* Skills */}
          <h2 style={{ marginBottom: "0.25rem", color: "#111", fontSize: "1.4rem", fontWeight: 800 }}>Skills</h2>
          <ul aria-label="Your skills" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
            {(user.skills || []).map((skill, idx) => (
              <li key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", backgroundColor: "rgba(50, 30, 90, 0.12)", border: "1px solid rgba(50, 30, 90, 0.4)", borderRadius: "20px", padding: "0.2rem 0.65rem", fontSize: "0.85rem", color: "#222" }}>
                {skill}
                <button onClick={() => handleRemoveSkill(skill)} aria-label={`Remove skill: ${skill}`} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: "0.85rem", padding: 0, lineHeight: 1 }}>✕</button>
              </li>
            ))}
          </ul>
          {addingSkill ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <label htmlFor="new-skill-input" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>New skill</label>
              <input id="new-skill-input" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Enter a skill" autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveSkill(); if (e.key === "Escape") { setAddingSkill(false); setNewSkill(""); } }}
                style={{ ...inputStyle, fontSize: "0.9rem" }} />
              <button onClick={handleSaveSkill} style={saveBtnStyle}>Save</button>
              <button onClick={() => { setAddingSkill(false); setNewSkill(""); }} style={cancelSmallBtnStyle}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setAddingSkill(true)} style={addOutlineBtnStyle}>+ Add Skill</button>
          )}
        </section>

        {/* Right Column: My Applications */}
        <section aria-label="My Applications" style={{ backgroundColor: "rgba(255, 255, 255, 0.92)", padding: "2rem", borderRadius: "16px", width: "460px", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ marginBottom: "1rem", color: "#111", fontSize: "1.4rem", fontWeight: 800 }}>My Applications</h2>
          {applications.length === 0 ? (
            <p style={{ color: "#444" }}>No applications yet.</p>
          ) : (
            applications.map((app) => (
              <article key={app._id} style={{ border: "1px solid #bbb", padding: "0.75rem", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111" }}>{app.title}</div>
                <div style={{ fontSize: "0.9rem", color: "#444" }}>Company: {app.company}</div>
                <div style={{ fontSize: "0.85rem", color: "#555" }}>Applied: <time>{new Date(app.appliedAt).toLocaleDateString()}</time></div>
                <div style={{ fontSize: "0.9rem", marginTop: "0.15rem" }}>
                  Status:{" "}
                  <strong style={{
                    color:
                      app.status === "interview requested" ? "#6a1b9a" :
                      app.status === "interview pending"  ? "#bf360c" :
                      app.status === "under review"       ? "#0d47a1" :
                      app.status === "hired"              ? "#1b5e20" :
                      app.status === "rejected"           ? "#b71c1c" : "#333"
                  }}>
                    {app.status === "interview requested" ? "📅 Interview Requested" :
                     app.status === "interview pending"   ? "🗓 Interview Pending" :
                     app.status === "under review"        ? "🔍 Under Review" :
                     app.status === "hired"               ? "🎉 Hired!" :
                     app.status === "rejected"            ? "Not Selected" :
                     app.status}
                  </strong>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

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

export default ApplicantProfile;

