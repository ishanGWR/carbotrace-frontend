import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Leaf,
} from "lucide-react";

export default function Dashboard({ session }) {
  const [emissions, setEmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchEmissions = useCallback(async () => {
    if (!session?.user?.id) {
      setErrorMessage("User session not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("emissions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setEmissions([]);
    } else {
      setEmissions(data || []);
    }

    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchEmissions();
  }, [fetchEmissions]);

  const latest = emissions.length > 0 ? emissions[0] : null;

  const pieData = latest
    ? [
        { name: "Scope 1", value: Number(latest.fuel) || 0 },
        { name: "Scope 2", value: Number(latest.electricity) || 0 },
        { name: "Scope 3", value: Number(latest.travel) || 0 },
      ]
    : [];

  const barData = emissions
    .slice()
    .reverse()
    .map((item, index) => ({
      name: `R${index + 1}`,
      total: Number(item.total) || 0,
    }));

  const COLORS = ["#8CF3B0", "#49D17D", "#1FA85A"];

  const aiAnalysis = useMemo(() => {
    if (!latest) {
      return {
        carbonScore: 0,
        health: "No data",
        insights: ["Upload and process a file to generate AI insights."],
        recommendations: [],
        riskLevel: "Low",
        fraudRisk: "Low",
        fraudReason: "No processed records yet.",
        fraudDetected: false,
      };
    }

    const electricity = Number(latest.electricity) || 0;
    const fuel = Number(latest.fuel) || 0;
    const travel = Number(latest.travel) || 0;
    const total = Number(latest.total) || 0;

    const prev = emissions[1];
    const prevTotal = prev ? Number(prev.total) || 0 : 0;

    let score = 100;
    if (total > 700) score -= 35;
    else if (total > 550) score -= 25;
    else if (total > 400) score -= 15;
    else score -= 5;

    if (fuel > electricity) score -= 12;
    if (travel > 120) score -= 8;
    if (prev && total > prevTotal) score -= 8;

    if (score < 0) score = 0;

    let health = "Excellent";
    if (score < 85) health = "Good";
    if (score < 70) health = "Moderate";
    if (score < 50) health = "High Risk";

    let riskLevel = "Low";
    if (score < 80) riskLevel = "Medium";
    if (score < 60) riskLevel = "High";

    const insights = [];
    const recommendations = [];

    if (electricity >= fuel && electricity >= travel) {
      insights.push("Scope 2 electricity emissions are the largest contributor in the latest record.");
      recommendations.push("Focus on electricity optimization and efficient equipment usage.");
    }

    if (fuel > 140) {
      insights.push("Scope 1 fuel usage appears unusually high in the current cycle.");
      recommendations.push("Review diesel or generator dependency for anomalies.");
    }

    if (travel > 90) {
      insights.push("Scope 3 travel emissions are elevated compared to an efficient baseline.");
      recommendations.push("Encourage hybrid meetings and optimize travel schedules.");
    }

    if (prev && total > prevTotal) {
      insights.push(`Total emissions increased by ${total - prevTotal} compared to the previous processed record.`);
      recommendations.push("Compare this upload with prior records to identify the cause of the spike.");
    }

    if (total <= 400) {
      insights.push("Overall emissions remain within a relatively controlled range.");
      recommendations.push("Maintain current controls and continue periodic validation.");
    }

    if (insights.length === 0) {
      insights.push("No major anomaly detected in the latest processed emission record.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue monitoring monthly uploads and validate ongoing trends.");
    }

    let fraudRisk = "Low";
    let fraudReason = "No suspicious pattern detected.";
    let fraudDetected = false;

    if (total > 750) {
      fraudRisk = "High";
      fraudReason = "Total emissions are unusually high and may indicate suspicious reporting.";
      fraudDetected = true;
    } else if (fuel > electricity * 1.4) {
      fraudRisk = "Medium";
      fraudReason = "Fuel consumption is disproportionately high compared to electricity usage.";
      fraudDetected = true;
    } else if (prev && total > prevTotal * 1.5) {
      fraudRisk = "High";
      fraudReason = "A sharp increase from the previous record suggests a possible anomaly or manipulation.";
      fraudDetected = true;
    } else if (travel > 150) {
      fraudRisk = "Medium";
      fraudReason = "Travel emissions are significantly elevated and should be verified.";
      fraudDetected = true;
    }

    return {
      carbonScore: score,
      health,
      insights,
      recommendations,
      riskLevel,
      fraudRisk,
      fraudReason,
      fraudDetected,
    };
  }, [latest, emissions]);

  const topSource =
    pieData.length > 0
      ? pieData.reduce((a, b) => (a.value > b.value ? a : b)).name
      : "N/A";

  const fraudBadgeClass =
    aiAnalysis.fraudRisk === "High"
      ? "fraud-badge fraud-high"
      : aiAnalysis.fraudRisk === "Medium"
      ? "fraud-badge fraud-medium"
      : "fraud-badge fraud-low";

  return (
    <motion.div
      className="main"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="topbar premium-topbar">
        <div>
          <p className="eyebrow">Executive Overview</p>
          <h1 className="page-title">Carbon Intelligence Dashboard</h1>
          <p className="page-subtitle">
            Real-time emissions monitoring, AI-assisted analysis, and audit-ready reporting for CarboTrace.
          </p>
        </div>

        <div className="topbar-actions">
          <div className="mini-status-card">
            <ShieldCheck size={18} />
            <span>{latest ? latest.status : "No Status"}</span>
          </div>
          <button className="secondary-btn" onClick={fetchEmissions}>
            Refresh
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="premium-card" style={{ marginBottom: "20px" }}>
          <p style={{ color: "#ffb3b3", margin: 0 }}>
            Dashboard error: {errorMessage}
          </p>
        </div>
      )}

      <div className="fraud-alert-wrap">
        <div className={fraudBadgeClass}>
          <AlertTriangle size={16} />
          <span>Fraud Risk: {aiAnalysis.fraudRisk}</span>
        </div>
      </div>

      {aiAnalysis.fraudDetected && (
        <div className="premium-card fraud-warning-card">
          <div className="fraud-warning-header">
            <AlertTriangle size={18} />
            <h3>Potential Fraud / Anomaly Detected</h3>
          </div>
          <p>{aiAnalysis.fraudReason}</p>
        </div>
      )}

      <div className="stats-grid premium-stats-grid">
        <div className="premium-card stat-card glass-highlight">
          <div className="stat-icon-circle">
            <Leaf size={18} />
          </div>
          <p className="stat-label">Latest Total Emissions</p>
          <h2 className="stat-value">{latest ? latest.total : 0}</h2>
          <p className="stat-note">Most recent processed result</p>
        </div>

        <div className="premium-card stat-card glass-highlight">
          <div className="stat-icon-circle">
            <Sparkles size={18} />
          </div>
          <p className="stat-label">AI Carbon Score</p>
          <h2 className="stat-value">{aiAnalysis.carbonScore}%</h2>
          <p className="stat-note">{aiAnalysis.health}</p>
        </div>

        <div className="premium-card stat-card glass-highlight">
          <div className="stat-icon-circle">
            <TrendingUp size={18} />
          </div>
          <p className="stat-label">Processed Records</p>
          <h2 className="stat-value">{emissions.length}</h2>
          <p className="stat-note">Rows in emissions table</p>
        </div>

        <div className="premium-card stat-card glass-highlight">
          <div className="stat-icon-circle">
            <AlertTriangle size={18} />
          </div>
          <p className="stat-label">Risk Level</p>
          <h2 className="stat-value small-text">{aiAnalysis.riskLevel}</h2>
          <p className="stat-note">AI-based anomaly signal</p>
        </div>
      </div>

      <div className="dashboard-grid premium-dashboard-grid">
        <div className="premium-card chart-panel">
          <div className="section-header">
            <div>
              <h3>Emission Breakdown</h3>
              <p>Latest processed category distribution</p>
            </div>
            <span className="chip">{topSource}</span>
          </div>

          {latest ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={95}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No chart data available</p>
          )}
        </div>

        <div className="premium-card chart-panel">
          <div className="section-header">
            <div>
              <h3>Emission Trend</h3>
              <p>Historical processed totals</p>
            </div>
            <span className="chip">History</span>
          </div>

          {emissions.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#49D17D" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No history data available</p>
          )}
        </div>
      </div>

      <div className="dashboard-grid premium-dashboard-grid">
        <div className="premium-card ai-panel">
          <div className="section-header">
            <div>
              <h3>AI Insights</h3>
              <p>Pattern-based interpretation of your latest emission record</p>
            </div>
            <span className="chip green-chip">Insights</span>
          </div>

          {aiAnalysis.insights.length === 0 ? (
            <p>No insights available.</p>
          ) : (
            <ul className="ai-list">
              {aiAnalysis.insights.map((insight, index) => (
                <li key={index} className="ai-list-item">
                  <Sparkles size={16} />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="premium-card ai-panel">
          <div className="section-header">
            <div>
              <h3>AI Recommendations</h3>
              <p>Suggested actions to improve reporting and reduce emissions</p>
            </div>
            <span className="chip green-chip">Actions</span>
          </div>

          {aiAnalysis.recommendations.length === 0 ? (
            <p>No recommendations available.</p>
          ) : (
            <ul className="ai-list">
              {aiAnalysis.recommendations.map((item, index) => (
                <li key={index} className="ai-list-item">
                  <Leaf size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="premium-card table-panel">
        <div className="section-header">
          <div>
            <h3>Emission Records</h3>
            <p>Structured results generated by your real processing pipeline</p>
          </div>
          <span className="chip">{session?.user?.email}</span>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : emissions.length === 0 ? (
          <p>No emission records found.</p>
        ) : (
          <div className="table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Scope 1 (Fuel)</th>
                  <th>Scope 2 (Electricity)</th>
                  <th>Scope 3 (Travel)</th>
                  <th>Total</th>
                  <th>Status</th>
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