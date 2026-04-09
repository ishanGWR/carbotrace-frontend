import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";

export default function Reports({ session }) {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const loadFiles = async () => {
      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error) setFiles(data || []);
    };

    loadFiles();
  }, [session.user.id]);

  return (
    <motion.div
      className="main"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="topbar">
        <div>
          <p className="eyebrow">Reports</p>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">
            Phase 3 keeps this simple. You can review uploaded records here.
          </p>
        </div>
      </div>

      <div className="reports-grid single-column">
        {files.length === 0 ? (
          <div className="premium-card report-card">
            <h3>No report data yet</h3>
            <p className="report-meta">
              Upload files first. Report generation will come in a later phase.
            </p>
          </div>
        ) : (
          files.map((item) => (
            <div className="premium-card report-card" key={item.id}>
              <div>
                <h3>{item.file_name}</h3>
                <p className="report-meta">{item.file_type || "unknown"}</p>
              </div>

              <div className="report-footer">
                <span className="status-pill">Stored</span>
                <span className="report-meta">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}