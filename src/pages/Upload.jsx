import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileUp, FileText, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function Upload({ session }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  const formatFileSize = (size) => {
    if (!size) return "0 KB";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (file) => {
    if (!file) return <FileUp size={34} />;
    if (file.type.includes("image")) return <ImageIcon size={34} />;
    return <FileText size={34} />;
  };

  const handleSelectedFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setMessage("");
  };

  const handleFileChange = (e) => {
    handleSelectedFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleSelectedFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const safeFileName = selectedFile.name.replace(/\s+/g, "_");
      const filePath = `${session.user.id}/${Date.now()}_${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("uploads")
        .insert({
          user_id: session.user.id,
          file_name: selectedFile.name,
          file_path: filePath,
          file_type: selectedFile.type || "unknown",
        });

      if (insertError) throw insertError;

      const processResponse = await fetch("http://127.0.0.1:8000/process-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: session.user.id,
          file_name: selectedFile.name,
          file_path: filePath,
          file_type: selectedFile.type || "unknown",
        }),
      });

      const processData = await processResponse.json();

      if (!processResponse.ok) {
        throw new Error(processData.detail || "Processing failed");
      }

      setMessage(`Upload + processing complete. Total emissions: ${processData.total}`);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setMessage(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      className="main"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="topbar">
        <div>
          <p className="eyebrow">Ingestion</p>
          <h1 className="page-title">Upload Company Data</h1>
          <p className="page-subtitle">
            Upload real files, save metadata, and trigger FastAPI processing.
          </p>
        </div>
      </div>

      <div className="upload-layout">
        <div className="premium-card upload-card">
          <h3>Real Upload + Processing</h3>
          <p>Supported: CSV, PDF, PNG, JPG</p>

          <label
            className={`drop-zone ${dragActive ? "drop-zone-active" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              onChange={handleFileChange}
              hidden
              accept=".csv,.pdf,.png,.jpg,.jpeg"
            />

            <div className="drop-zone-inner">
              <div className="upload-icon">{getFileIcon(selectedFile)}</div>
              <h2>{selectedFile ? selectedFile.name : "Drop files here"}</h2>
              <p>
                {selectedFile
                  ? "File selected successfully"
                  : "or click to browse from your computer"}
              </p>
            </div>
          </label>

          {selectedFile && (
            <div className="selected-file-card">
              <div className="selected-file-left">
                <div className="mini-file-icon">{getFileIcon(selectedFile)}</div>
                <div>
                  <h4>{selectedFile.name}</h4>
                  <p>
                    {selectedFile.type || "Unknown type"} •{" "}
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              <button className="remove-file-btn" onClick={handleRemoveFile}>
                <X size={16} />
              </button>
            </div>
          )}

          <button
            className="primary-btn"
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
          >
            {uploading ? "Uploading..." : "Upload & Process"}
          </button>

          {message && <p className="auth-message">{message}</p>}
        </div>

        <div className="premium-card tips-card">
          <h3>Processing Flow</h3>
          <ul className="tips-list">
            <li>File uploads to Supabase Storage</li>
            <li>Metadata saves in uploads table</li>
            <li>FastAPI calculates emission values</li>
            <li>Results save in emissions table</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}