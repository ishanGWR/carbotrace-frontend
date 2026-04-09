import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Upload as UploadIcon,
  FileText,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { supabase } from "../supabaseClient";

export default function Sidebar({ session }) {
  const navigate = useNavigate();
  const email = session?.user?.email || "user@example.com";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error.message);
      return;
    }
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="brand-wrap">
          <div className="brand-icon">C</div>
          <div>
            <h2 className="logo">CarboTrace</h2>
            <p className="sidebar-subtitle">Carbon Intelligence Platform</p>
          </div>
        </div>

        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/upload"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <UploadIcon size={18} />
            <span>Upload</span>
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <FileText size={18} />
            <span>Reports</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="audit-chip">
          <ShieldCheck size={16} />
          <span>Phase 3 Active</span>
        </div>

        <div className="user-box">
          <p className="user-label">Signed in as</p>
          <p className="footer-text">{email}</p>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}