import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports({ session }) {
  const [emissions, setEmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadEmissions = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("emissions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Reports fetch error:", error.message);
    } else {
      setEmissions(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadEmissions();
  }, [session.user.id]);

  const handleApprove = async (emissionId) => {
    setMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/approve-emission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emission_id: emissionId,
          approved_by: session.user.email,
          verifier_notes: "Verified through auditor dashboard"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Approval failed");
      }

      setMessage("Emission approved successfully.");
      loadEmissions();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("CarboTrace Emission Report", 14, 20);

    doc.setFontSize(11);
    doc.text(`User: ${session.user.email}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);
    doc.text("Status: Audit Ready", 14, 44);

    if (emissions.length > 0) {
      const latest = emissions[0];

      doc.setFontSize(14);
      doc.text("Latest Emission Summary", 14, 58);

      doc.setFontSize(11);
      doc.text(`Scope 1 (Fuel): ${latest.fuel ?? 0}`, 14, 68);
      doc.text(`Scope 2 (Electricity): ${latest.electricity ?? 0}`, 14, 75);
      doc.text(`Scope 3 (Travel): ${latest.travel ?? 0}`, 14, 82);
      doc.text(`Total Emissions: ${latest.total ?? 0}`, 14, 89);
      doc.text(`Status: ${latest.status ?? "N/A"}`, 14, 96);
    }

    autoTable(doc, {
      startY: 110,
      head: [["Scope 1", "Scope 2", "Scope 3", "Total", "Status", "Created At"]],
      body: emissions.map((item) => [
        item.fuel ?? 0,
        item.electricity ?? 0,
        item.travel ?? 0,
        item.total ?? 0,
        item.status ?? "N/A",
        item.created_at ? new Date(item.created_at).toLocaleString() : "N/A",
      ]),
    });

    doc.save("carbotrace-emission-report.pdf");
  };

  return (
    <motion.div
      className="main"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="topbar">
        <div>
          <p className="eyebrow">Reports & Verification</p>
          <h1 className="page-title">Auditor Review Panel</h1>
          <p className="page-subtitle">
            Review processed emission records, approve them in one click, and download PDF reports.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={generatePDF}
          disabled={loading || emissions.length === 0}
        >
          Download PDF Report
        </button>
      </div>

      {message && (
        <div className="premium-card" style={{ marginBottom: "20px" }}>
          <p>{message}</p>
        </div>
      )}

      <div className="premium-card">
        <h3>Verification Queue</h3>

        {loading ? (
          <p>Loading records...</p>
        ) : emissions.length === 0 ? (
          <p>No processed records found.</p>
        ) : (
          <div className="table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Scope 1</th>
                  <th>Scope 2</th>
                  <th>Scope 3</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Approved By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {emissions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.fuel}</td>
                    <td>{item.electricity}</td>
                    <td>{item.travel}</td>
                    <td>{item.total}</td>
                    <td>{item.status}</td>
                    <td>{item.approved_by || "-"}</td>
                    <td>
                      {item.status === "Approved" ? (
                        <span className="status-pill">Approved</span>
                      ) : (
                        <button
                          className="primary-btn"
                          onClick={() => handleApprove(item.id)}
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}