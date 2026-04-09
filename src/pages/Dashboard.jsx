import React, { useCallback, useEffect, useState } from "react";
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

export default function Dashboard({ session }) {
  const [emissions, setEmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmissions = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("emissions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
    } else {
      setEmissions(data || []);
    }

    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchEmissions();
  }, [fetchEmissions]);

  const latest = emissions[0];

  // Pie chart data
  const pieData = latest
    ? [
        { name: "Electricity", value: latest.electricity || 0 },
        { name: "Fuel", value: latest.fuel || 0 },
        { name: "Travel", value: latest.travel || 0 },
      ]
    : [];

  // Bar chart data (history)
  const barData = emissions.map((item, index) => ({
    name: `#${index + 1}`,
    total: item.total,
  }));

  return (
    <motion.div
      className="main"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="topbar">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Real emission analytics from your uploaded data
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="premium-card stat-card">
          <p>Total Records</p>
          <h2>{emissions.length}</h2>
        </div>

        <div className="premium-card stat-card">
          <p>Latest Total</p>
          <h2>{latest?.total || 0}</h2>
        </div>

        <div className="premium-card stat-card">
          <p>Status</p>
          <h2>{latest?.status || "N/A"}</h2>
        </div>
      </div>

      {/* Charts */}
      <div className="stats-grid">
        {/* Pie Chart */}
        <div className="premium-card">
          <h3>Emission Breakdown</h3>
          {latest ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={80}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No data</p>
          )}
        </div>

        {/* Bar Chart */}
        <div className="premium-card">
          <h3>Emission History</h3>
          {emissions.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No history</p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="premium-card">
        <h3>Emission Records</h3>

        {loading ? (
          <p>Loading...</p>
        ) : emissions.length === 0 ? (
          <p>No data</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Electricity</th>
                <th>Fuel</th>
                <th>Travel</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {emissions.map((item) => (
                <tr key={item.id}>
                  <td>{item.electricity}</td>
                  <td>{item.fuel}</td>
                  <td>{item.travel}</td>
                  <td>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}