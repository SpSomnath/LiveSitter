import React, { useState } from "react";
import axios from "axios";
import VideoPlayer from "../components/VideoPlayer";

const LandingPage: React.FC = () => {
  const [rtspUrl, setRtspUrl] = useState<string>("");
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rtspUrl) {
      alert("Please enter an RTSP URL");
      return;
    }

    setLoading(true);
    setStreamUrl(""); // reset previous stream

    try {
      const res = await axios.post("http://localhost:5001/start_stream", { rtsp_url: rtspUrl });
      const hlsUrl = `http://localhost:5001${res.data.hls_url}`;
      setStreamUrl(hlsUrl);
    } catch (err) {
      console.error("Error starting stream:", err);
      alert("Failed to start stream. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>LiveSitter (RTSP LiveStream)</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input 
          type="text" 
          placeholder="Enter RTSP URL" 
          value={rtspUrl}
          onChange={(e) => setRtspUrl(e.target.value)}
          style={{
            width: "400px",
            padding: "10px",
            fontSize: "16px",
            borderRadius: "6px",
            border: "1px solid #aaa",
            marginRight: "10px"
          }}
        />
        <button 
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Starting..." : "Start Stream"}
        </button>
      </form>

      {streamUrl && (
        <div style={{ marginTop: "20px" }}>
          <VideoPlayer url={streamUrl} />
          <div>
            <p style={{ fontSize: "14px", color: "#555" }}>
              Stream URL: {streamUrl}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
