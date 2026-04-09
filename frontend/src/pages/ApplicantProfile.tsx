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

  // Resume upload state
  const [resumeUploading, setResumeUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: token },
      })
        .then((res) => res.json())
        .then((data) => {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        })
        .catch(() => {
          const storedUser = localStorage.getItem("user");
          if (storedUser) setUser(JSON.parse(storedUser));
        });

      fetch(`${import.meta.env.VITE_API_URL}/api/users/jobs/my-applications`, {
        headers: { Authorization: token },
      })
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
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
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
    } catch {
      alert("Error uploading resume");
    } finally {
      setResumeUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const startEditing = (field: "firstname" | "lastname" | "email" | "phone") => {
    setEditingField(field);
    setEditValue(user?.[field] || "");
  };
  const cancelEdit = () => { setEditingField(null); setEditValue(""); };
  const confirmEdit = () => {
    if (!user || !editingField) return;
    setUser({ ...user, [editingField]: editValue });
    setEditingField(null);
    setEditValue("");
  };

  const handleSavePersonalInfo = async () => {
    if (!user) return;
    try { await saveToAPI(user); alert("Personal info saved!"); }
    catch { alert("Error saving personal info"); }
  };

  const handleSaveSkill = async () => {
    const trimmed = newSkill.trim();
    if (!trimmed || !user) return;
    const existing = user.skills || [];
    if (existing.includes(trimmed)) { setNewSkill(""); setAddingSkill(false); return; }
    try { await saveToAPI({ ...user, skills: [...existing, trimmed] }); setNewSkill(""); setAddingSkill(false); }
    catch { alert("Error saving skill"); }
  };

  const handleRemoveSkill = async (skill: string) => {
    if (!user) return;
    try { await saveToAPI({ ...user, skills: (user.skills || []).filter((s) => s !== skill) }); }
    catch { alert("Error removing skill"); }
  };

  const handleSaveDegree = async () => {
    if (!newDegree.university || !newDegree.degree || !user) return;
    try { await saveToAPI({ ...user, degrees: [...(user.degrees || []), newDegree] }); setNewDegree({ university: "", degree: "", major: "" }); setAddingDegree(false); }
    catch { alert("Error saving degree"); }
  };

  const handleRemoveDegree = async (idx: number) => {
    if (!user) return;
    try { await saveToAPI({ ...user, degrees: user.degrees!.filter((_, i) => i !== idx) }); }
    catch { alert("Error removing degree"); }
  };

  const handleSaveExperience = async () => {
    if (!newExperience.title || !newExperience.startDate || !user) return;
    try { await saveToAPI({ ...user, experience: [...(user.experience || []), newExperience] }); setNewExperience({ title: "", startDate: "", endDate: "", description: "" }); setAddingExperience(false); }
    catch { alert("Error saving experience"); }
  };

  const handleRemoveExperience = async (idx: number) => {
    if (!user) return;
    try { await saveToAPI({ ...user, experience: user.experience!.filter((_, i) => i !== idx) }); }
    catch { alert("Error removing experience"); }
  };

  if (!user) return <div>Loading...</div>;

  // ---- Shared styles ----
  const inputStyle: React.CSSProperties = {
    padding: "0.4rem 0.6rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "0.9rem",
    width: "100%",
    boxSizing: "border-box",
  };

  const editBtnStyle: React.CSSProperties = {
    padding: "0.2rem 0.6rem",
    fontSize: "0.78rem",
    cursor: "pointer",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "rgba(50, 30, 90, 0.7)",
    color: "white",
    whiteSpace: "nowrap",
  };

  const addOutlineBtnStyle: React.CSSProperties = {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    border: "2px solid #388e3c",
    borderRadius: "8px",
    cursor: "pointer",
    padding: "0.35rem 0.85rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    alignSelf: "flex-start",
  };

  const saveBtnStyle: React.CSSProperties = {
    padding: "0.35rem 1.1rem",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "rgba(50, 30, 90, 0.7)",
    color: "white",
  };

  const cancelSmallBtnStyle: React.CSSProperties = {
    padding: "0.35rem 0.85rem",
    fontSize: "0.85rem",
    cursor: "pointer",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#aaa",
    color: "white",
  };

  const removeBtnStyle: React.CSSProperties = {
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    padding: "0.25rem 0.55rem",
    fontSize: "0.78rem",
    alignSelf: "flex-start",
  };

  const renderInfoRow = (
    label: string,
    field: "firstname" | "lastname" | "email" | "phone",
    displayValue: string
  ) => (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ fontWeight: 800, color: "#333", marginBottom: "0.25rem", fontSize: "0.95rem" }}>{label}</div>
      {editingField === field ? (
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            style={{ ...inputStyle, fontSize: "0.88rem" }}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") cancelEdit(); }}
          />
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "3rem",
        }}
      >
        <h1 style={{ fontSize: "2rem" }}>Hello, {user.firstname}</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => navigate("/jobs")}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
              border: "2px solid #388e3c",
              borderRadius: "8px",
              backgroundColor: "#e8f5e9",
              color: "#2e7d32",
            }}
          >
            Search Jobs
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
      </div>

      {/* Main layout */}
      <div
        style={{
          display: "flex",
          gap: "2rem",
          width: "90%",
          justifyContent: "center",
          alignItems: "flex-start",
          marginBottom: "3rem",
        }}
      >
        {/* Left Column: Personal Information */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            padding: "1.75rem",
            borderRadius: "16px",
            width: "260px",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <h2 style={{ marginBottom: "0.75rem", color: "#333", fontSize: "1.4rem", fontWeight: 800 }}>Personal Information</h2>
          {renderInfoRow("First Name", "firstname", user.firstname)}
          {renderInfoRow("Last Name", "lastname", user.lastname)}
          {renderInfoRow("Email", "email", user.email)}
          {renderInfoRow("Phone", "phone", user.phone || "—")}
          <button onClick={handleSavePersonalInfo} style={{ ...saveBtnStyle, marginTop: "0.5rem", alignSelf: "flex-start" }}>
            Save
          </button>
        </div>

        {/* Middle Column: Degrees, Experience, Resume, Skills */}
        <div
          style={{
            backgroundColor: "rgba(240, 240, 240, 0.95)",
            padding: "2rem",
            borderRadius: "16px",
            width: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Degrees */}
          <h2 style={{ marginBottom: "0.25rem", color: "#333", fontSize: "1.4rem", fontWeight: 800 }}>Degrees</h2>
          {(user.degrees || []).map((deg, idx) => (
            <div key={idx} style={{ border: "1px solid #ccc", padding: "0.6rem 0.75rem", borderRadius: "8px", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "0.15rem", fontSize: "0.9rem" }}>
              <div><strong>{deg.degree}</strong>{deg.major ? ` — ${deg.major}` : ""}</div>
              <div style={{ color: "#555" }}>{deg.university}</div>
              <button onClick={() => handleRemoveDegree(idx)} style={{ ...removeBtnStyle, marginTop: "0.35rem" }}>Remove</button>
            </div>
          ))}
          {addingDegree ? (
            <div style={{ border: "1px solid #ccc", padding: "0.75rem", borderRadius: "8px", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <input value={newDegree.university} placeholder="University" onChange={(e) => setNewDegree({ ...newDegree, university: e.target.value })} style={inputStyle} />
              <input value={newDegree.degree} placeholder="Degree (e.g. B.S.)" onChange={(e) => setNewDegree({ ...newDegree, degree: e.target.value })} style={inputStyle} />
              <input value={newDegree.major || ""} placeholder="Major (optional)" onChange={(e) => setNewDegree({ ...newDegree, major: e.target.value })} style={inputStyle} />
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                <button onClick={handleSaveDegree} style={saveBtnStyle}>Save</button>
                <button onClick={() => { setAddingDegree(false); setNewDegree({ university: "", degree: "", major: "" }); }} style={cancelSmallBtnStyle}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingDegree(true)} style={addOutlineBtnStyle}>+ Add Degree</button>
          )}

          {/* Experience */}
          <h2 style={{ marginBottom: "0.25rem", color: "#333", fontSize: "1.4rem", fontWeight: 800 }}>Experience</h2>
          {(user.experience || []).map((exp, idx) => (
            <div key={idx} style={{ border: "1px solid #ccc", padding: "0.6rem 0.75rem", borderRadius: "8px", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "0.15rem", fontSize: "0.9rem" }}>
              <div><strong>{exp.title}</strong></div>
              <div style={{ color: "#555", fontSize: "0.82rem" }}>
                {exp.startDate.split("T")[0]} — {exp.endDate ? exp.endDate.split("T")[0] : "Present"}
              </div>
              {exp.description && <div style={{ color: "#444", marginTop: "0.15rem" }}>{exp.description}</div>}
              <button onClick={() => handleRemoveExperience(idx)} style={{ ...removeBtnStyle, marginTop: "0.35rem" }}>Remove</button>
            </div>
          ))}
          {addingExperience ? (
            <div style={{ border: "1px solid #ccc", padding: "0.75rem", borderRadius: "8px", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <input value={newExperience.title} placeholder="Job Title" onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })} style={inputStyle} />
              <label style={{ fontSize: "0.8rem", color: "#555", marginBottom: "-0.25rem" }}>Start Date</label>
              <input type="date" value={newExperience.startDate} onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })} style={inputStyle} />
              <label style={{ fontSize: "0.8rem", color: "#555", marginBottom: "-0.25rem" }}>End Date (leave blank if current)</label>
              <input type="date" value={newExperience.endDate || ""} onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })} style={inputStyle} />
              <textarea
                value={newExperience.description || ""}
                placeholder="Description (optional)"
                onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }}
              />
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                <button onClick={handleSaveExperience} style={saveBtnStyle}>Save</button>
                <button onClick={() => { setAddingExperience(false); setNewExperience({ title: "", startDate: "", endDate: "", description: "" }); }} style={cancelSmallBtnStyle}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingExperience(true)} style={addOutlineBtnStyle}>+ Add Experience</button>
          )}

          {/* Resume */}
          <h2 style={{ marginBottom: "0.25rem", color: "#333", fontSize: "1.4rem", fontWeight: 800 }}>Resume</h2>
          <div style={{ border: "1px solid #ccc", padding: "0.75rem", borderRadius: "8px", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {user.resumeUrl ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>📄</span>
                  <a
                    href={`${import.meta.env.VITE_API_URL}${user.resumeUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.88rem", color: "#2e7d32", fontWeight: 600, textDecoration: "underline" }}
                  >
                    View Current Resume
                  </a>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#999" }}>Upload a new file to replace it.</div>
              </>
            ) : (
              <div style={{ fontSize: "0.88rem", color: "#888" }}>No resume uploaded yet. Add a PDF to strengthen your applications.</div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={handleResumeUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={resumeUploading}
              style={{
                ...addOutlineBtnStyle,
                opacity: resumeUploading ? 0.6 : 1,
                cursor: resumeUploading ? "not-allowed" : "pointer",
                alignSelf: "flex-start",
              }}
            >
              {resumeUploading ? "Uploading..." : user.resumeUrl ? "Replace Resume (PDF)" : "Upload Resume (PDF)"}
            </button>
          </div>

          {/* Skills */}
          <h2 style={{ marginBottom: "0.25rem", color: "#333", fontSize: "1.4rem", fontWeight: 800 }}>Skills</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {(user.skills || []).map((skill, idx) => (
              <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", backgroundColor: "rgba(50, 30, 90, 0.12)", border: "1px solid rgba(50, 30, 90, 0.35)", borderRadius: "20px", padding: "0.2rem 0.65rem", fontSize: "0.85rem", color: "#333" }}>
                {skill}
                <button onClick={() => handleRemoveSkill(skill)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "0.85rem", padding: 0, lineHeight: 1 }} title="Remove skill">✕</button>
              </span>
            ))}
          </div>
          {addingSkill ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Enter a skill" autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveSkill(); if (e.key === "Escape") { setAddingSkill(false); setNewSkill(""); } }}
                style={{ ...inputStyle, fontSize: "0.9rem" }} />
              <button onClick={handleSaveSkill} style={saveBtnStyle}>Save</button>
              <button onClick={() => { setAddingSkill(false); setNewSkill(""); }} style={cancelSmallBtnStyle}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setAddingSkill(true)} style={addOutlineBtnStyle}>+ Add Skill</button>
          )}
        </div>

        {/* Right Column: My Applications */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            padding: "2rem",
            borderRadius: "16px",
            width: "460px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ marginBottom: "1rem", color: "#333", fontSize: "1.4rem", fontWeight: 800 }}>My Applications</h2>
          {applications.length === 0 ? (
            <div>No Pending Applications</div>
          ) : (
            applications.map((app) => (
              <div key={app._id} style={{ border: "1px solid #ccc", padding: "0.75rem", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>{app.title}</div>
                <div style={{ fontSize: "0.9rem", color: "#555" }}>Company: {app.company}</div>
                <div style={{ fontSize: "0.85rem", color: "#888" }}>Applied: {new Date(app.appliedAt).toLocaleDateString()}</div>
                <div style={{ fontSize: "0.9rem", marginTop: "0.15rem" }}>
                  Status:{" "}
                  <strong style={{
                    color:
                      app.status === "interview requested" ? "#7b1fa2" :
                      app.status === "interview pending"  ? "#e65100" :
                      app.status === "under review"       ? "#1565c0" :
                      app.status === "hired"              ? "#2e7d32" :
                      app.status === "rejected"           ? "#c62828" : "#555"
                  }}>
                    {app.status === "interview requested" ? "📅 Interview Requested" :
                     app.status === "interview pending"  ? "🗓 Interview Pending" :
                     app.status === "under review"       ? "🔍 Under Review" :
                     app.status === "hired"              ? "🎉 Hired!" :
                     app.status === "rejected"           ? "❌ Not Selected" :
                     app.status}
                  </strong>
                </div>
              </div>
            ))
          )}
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

export default ApplicantProfile;
