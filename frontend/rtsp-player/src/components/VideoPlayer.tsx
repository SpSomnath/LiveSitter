import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import axios from "axios";

interface OverlayTextProps {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  opacity: number;
}

interface OverlayLogoProps {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

interface VideoPlayerProps {
  url: string;
  overlayText?: OverlayTextProps;
  overlayLogo?: OverlayLogoProps;
  onOverlayChange?: (
    overlayText: OverlayTextProps,
    overlayLogo: OverlayLogoProps
  ) => void;
}

const API_BASE = "http://localhost:5001"; // Change if backend runs elsewhere

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  overlayText: initialOverlayText,
  overlayLogo: initialOverlayLogo,
  onOverlayChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Local state for overlay settings
  const [overlayText, setOverlayText] = useState<OverlayTextProps>(
    initialOverlayText || {
      text: "Live",
      x: 100,
      y: 50,
      fontSize: 22,
      opacity: 0.8,
    }
  );
  const [overlayLogo, setOverlayLogo] = useState<OverlayLogoProps>(
    initialOverlayLogo || {
      url: "",
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      opacity: 0.8,
    }
  );

  // CRUD state
  const [username, setUsername] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<"save" | "update">("save");

  // Drag state
  const [dragging, setDragging] = useState<null | "text" | "logo">(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
        hls.startLoad();
        return () => {
          hls.destroy();
        };
      } else if (
        videoRef.current.canPlayType("application/vnd.apple.mpegurl")
      ) {
        videoRef.current.src = url;
      }
    }
  }, [url]);

  // Notify parent if overlay changes
  useEffect(() => {
    if (onOverlayChange) {
      onOverlayChange(overlayText, overlayLogo);
    }
    // eslint-disable-next-line
  }, [overlayText, overlayLogo]);

  // Helper to clamp overlay position within container (for both text and logo)
  const clampOverlayPosition = (
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const container = containerRef.current;
    if (!container) return { x, y };
    const bounds = container.getBoundingClientRect();
    const maxX = bounds.width - width;
    const maxY = bounds.height - height;
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, type: "text" | "logo") => {
    e.preventDefault();
    setDragging(type);
    const bounds = containerRef.current?.getBoundingClientRect();
    if (type === "text") {
      setDragOffset({
        x: e.clientX - (bounds?.left ?? 0) - overlayText.x,
        y: e.clientY - (bounds?.top ?? 0) - overlayText.y,
      });
    } else {
      setDragOffset({
        x: e.clientX - (bounds?.left ?? 0) - overlayLogo.x,
        y: e.clientY - (bounds?.top ?? 0) - overlayLogo.y,
      });
    }
    window.addEventListener("mousemove", handleMouseMove as any);
    window.addEventListener("mouseup", handleMouseUp as any);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging || !containerRef.current) return;
    const bounds = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - bounds.left;
    const mouseY = e.clientY - bounds.top;

    if (dragging === "text") {
      let newX = mouseX - dragOffset.x;
      let newY = mouseY - dragOffset.y;
      // Estimate text width/height based on fontSize (simple approximation)
      const textWidth = overlayText.text.length * overlayText.fontSize * 0.6;
      const textHeight = overlayText.fontSize * 1.2;
      const { x, y } = clampOverlayPosition(newX, newY, textWidth, textHeight);
      setOverlayText((prev) => ({ ...prev, x, y }));
    } else if (dragging === "logo") {
      let newX = mouseX - dragOffset.x;
      let newY = mouseY - dragOffset.y;
      const { x, y } = clampOverlayPosition(
        newX,
        newY,
        overlayLogo.width,
        overlayLogo.height
      );
      setOverlayLogo((prev) => ({ ...prev, x, y }));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    window.removeEventListener("mousemove", handleMouseMove as any);
    window.removeEventListener("mouseup", handleMouseUp as any);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => handleMouseMove(e);
    const up = () => handleMouseUp();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    // eslint-disable-next-line
  }, [dragging]);

  // Save or update overlay to backend
  const handleSaveOrUpdate = async () => {
    let user = username;
    if (!user) {
      user = prompt("Enter username to save overlay:");
      if (!user) return;
      setUsername(user);
    }
    setIsSaving(true);
    try {
      if (saveMode === "save") {
        // POST to create new overlay
        await axios.post(`${API_BASE}/overlay/${user}`, {
          rtsp_url: "",
          hls_url: "",
          element: [
            {
              type: "Text",
              context: overlayText.text,
              position: { x: overlayText.x, y: overlayText.y },
              fontSize: overlayText.fontSize,
              opacity: overlayText.opacity,
            },
            {
              type: "Logo",
              content: overlayLogo.url,
              position: { x: overlayLogo.x, y: overlayLogo.y },
              size: { width: overlayLogo.width, height: overlayLogo.height },
              opacity: overlayLogo.opacity,
            },
          ],
        });
        setSaveMode("update");
      } else {
        // PUT to update overlay
        await axios.put(`${API_BASE}/overlay/${user}`, {
          element: [
            {
              type: "Text",
              context: overlayText.text,
              position: { x: overlayText.x, y: overlayText.y },
              fontSize: overlayText.fontSize,
              opacity: overlayText.opacity,
            },
            {
              type: "Logo",
              content: overlayLogo.url,
              position: { x: overlayLogo.x, y: overlayLogo.y },
              size: { width: overlayLogo.width, height: overlayLogo.height },
              opacity: overlayLogo.opacity,
            },
          ],
        });
      }
    } catch (err) {
      alert("Failed to save/update overlay.");
    }
    setIsSaving(false);
  };

  // Restore overlay from backend
  const handleRestore = async () => {
    let user = username;
    if (!user) {
      user = prompt("Enter username to restore overlay:");
      if (!user) return;
      setUsername(user);
    }
    try {
      const res = await axios.get(`${API_BASE}/overlay/${user}`);
      const element = res.data.element;
      if (element && element.length === 2) {
        const text = element.find((el: any) => el.type === "Text");
        const logo = element.find((el: any) => el.type === "Logo");
        if (text) {
          setOverlayText({
            text: text.context,
            x: text.position.x,
            y: text.position.y,
            fontSize: text.fontSize || 22,
            opacity: text.opacity,
          });
        }
        if (logo) {
          setOverlayLogo({
            url: logo.content,
            x: logo.position.x,
            y: logo.position.y,
            width: logo.size.width,
            height: logo.size.height,
            opacity: logo.opacity,
          });
        }
        setSaveMode("update");
      }
    } catch (err) {
      alert("Failed to restore overlay.");
    }
  };

  // On mount, if username is set, set saveMode to update
  useEffect(() => {
    if (username) setSaveMode("update");
  }, [username]);

  return (
    <div
      style={{
        marginTop: "5px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}>
      {/* Overlay Settings */}
      <div
        style={{
          marginBottom: "16px",
          background: "#f7f7f7",
          padding: "16px",
          borderRadius: "8px",
          width: "80%",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
        }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              marginBottom: "5px",
              flexDirection: "row",
              flexWrap: "nowrap",
              display: "flex",
              justifyContent: "space-between",
            }}>
            <h3 style={{ marginTop: 0 }}>Overlay Settings</h3>
            <p style={{ marginTop: 0 }}>User: {username ?? "None"}</p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              marginTop: '8px',
            }}>
            {/* ...overlay text controls... */}
            <label>
              Text:
              <input
                type="text"
                value={overlayText.text}
                onChange={(e) =>
                  setOverlayText({ ...overlayText, text: e.target.value })
                }
                style={{ marginLeft: 4, width: 80 }}
              />
            </label>
            <label>
              X:
              <input
                type="number"
                value={overlayText.x}
                onChange={(e) => {
                  const textWidth =
                    overlayText.text.length * overlayText.fontSize * 0.6;
                  const textHeight = overlayText.fontSize * 1.2;
                  const newX = Number(e.target.value);
                  const { x } = clampOverlayPosition(
                    newX,
                    overlayText.y,
                    textWidth,
                    textHeight
                  );
                  setOverlayText({ ...overlayText, x });
                }}
                style={{ marginLeft: 4, width: 50 }}
              />
            </label>
            <label>
              Y:
              <input
                type="number"
                value={overlayText.y}
                onChange={(e) => {
                  const textWidth =
                    overlayText.text.length * overlayText.fontSize * 0.6;
                  const textHeight = overlayText.fontSize * 1.2;
                  const newY = Number(e.target.value);
                  const { y } = clampOverlayPosition(
                    overlayText.x,
                    newY,
                    textWidth,
                    textHeight
                  );
                  setOverlayText({ ...overlayText, y });
                }}
                style={{ marginLeft: 4, width: 50 }}
              />
            </label>
            <label>
              Font Size:
              <input
                type="number"
                value={overlayText.fontSize}
                onChange={(e) => {
                  const newFontSize = Number(e.target.value);
                  const textWidth = overlayText.text.length * newFontSize * 0.6;
                  const textHeight = newFontSize * 1.2;
                  const { x, y } = clampOverlayPosition(
                    overlayText.x,
                    overlayText.y,
                    textWidth,
                    textHeight
                  );
                  setOverlayText({
                    ...overlayText,
                    fontSize: newFontSize,
                    x,
                    y,
                  });
                }}
                style={{ marginLeft: 4, width: 60 }}
              />
            </label>
            <label>
              Opacity:
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={overlayText.opacity}
                onChange={(e) =>
                  setOverlayText({
                    ...overlayText,
                    opacity: Number(e.target.value),
                  })
                }
                style={{ marginLeft: 4, width: 50 }}
              />
            </label>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              marginTop: 8,
            }}>
            {/* ...overlay logo controls... */}
            <label>
              Logo Url:
              <input
                type="text"
                value={overlayLogo.url}
                onChange={(e) =>
                  setOverlayLogo({ ...overlayLogo, url: e.target.value })
                }
                style={{ marginLeft: 4, width: 120 }}
              />
            </label>
            <label>
              X:
              <input
                type="number"
                value={overlayLogo.x}
                onChange={(e) => {
                  const newX = Number(e.target.value);
                  const { x } = clampOverlayPosition(
                    newX,
                    overlayLogo.y,
                    overlayLogo.width,
                    overlayLogo.height
                  );
                  setOverlayLogo({ ...overlayLogo, x });
                }}
                style={{ marginLeft: 4, width: 50 }}
              />
            </label>
            <label>
              Y:
              <input
                type="number"
                value={overlayLogo.y}
                onChange={(e) => {
                  const newY = Number(e.target.value);
                  const { y } = clampOverlayPosition(
                    overlayLogo.x,
                    newY,
                    overlayLogo.width,
                    overlayLogo.height
                  );
                  setOverlayLogo({ ...overlayLogo, y });
                }}
                style={{ marginLeft: 4, width: 50 }}
              />
            </label>
            <label>
              Width:
              <input
                type="number"
                value={overlayLogo.width}
                onChange={(e) => {
                  const newWidth = Number(e.target.value);
                  const { x, y } = clampOverlayPosition(
                    overlayLogo.x,
                    overlayLogo.y,
                    newWidth,
                    overlayLogo.height
                  );
                  setOverlayLogo({ ...overlayLogo, width: newWidth, x, y });
                }}
                style={{ marginLeft: 4, width: 60 }}
              />
            </label>
            <label>
              Height:
              <input
                type="number"
                value={overlayLogo.height}
                onChange={(e) => {
                  const newHeight = Number(e.target.value);
                  const { x, y } = clampOverlayPosition(
                    overlayLogo.x,
                    overlayLogo.y,
                    overlayLogo.width,
                    newHeight
                  );
                  setOverlayLogo({ ...overlayLogo, height: newHeight, x, y });
                }}
                style={{ marginLeft: 4, width: 60 }}
              />
            </label>
            <label>
              Opacity:
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={overlayLogo.opacity}
                onChange={(e) =>
                  setOverlayLogo({
                    ...overlayLogo,
                    opacity: Number(e.target.value),
                  })
                }
                style={{ marginLeft: 4, width: 50 }}
              />
            </label>
          </div>
        </div>
        {/* Save and Restore buttons at right bottom */}
        <div
          style={{
            position: "absolute",
            right: 24,
            bottom: 16,
            display: "flex",
            gap: 12,
          }}>
          <button
            style={{
              height: 40,
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "0 24px",
              fontWeight: "bold",
              fontSize: 16,
              cursor: isSaving ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              opacity: isSaving ? 0.7 : 1,
            }}
            disabled={isSaving}
            onClick={handleSaveOrUpdate}>
            {saveMode === "save" ? "Save" : "Update"}
          </button>
          <button
            style={{
              height: 40,
              background: "#888",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "0 24px",
              fontWeight: "bold",
              fontSize: 16,
              cursor: isSaving ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              opacity: isSaving ? 0.7 : 1,
            }}
            disabled={isSaving}
            onClick={handleRestore}>
            Restore
          </button>
        </div>
      </div>
      {/* Video Player with overlays */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "80%",
          height: "500px",
          userSelect: dragging ? "none" : "auto",
        }}>
        <video
          ref={videoRef}
          controls
          autoPlay
          style={{
            width: "100%",
            height: "100%",
            border: "2px solid #333",
            borderRadius: "10px",
          }}
        />
        {/* Draggable Overlay Text */}
        {overlayText && (
          <div
            style={{
              position: "absolute",
              left: overlayText.x,
              top: overlayText.y,
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: overlayText.fontSize,
              borderRadius: 6,
              cursor: "move",
              pointerEvents: "auto",
              zIndex: 2,
              userSelect: "none",
              opacity: overlayText.opacity,
              textShadow:
                "-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff," +
                "0px -2px 0 #fff, 0px 2px 0 #fff, -2px 0px 0 #fff, 2px 0px 0 #fff",
              padding: "0 8px",
              background: "transparent",
              height: overlayText.fontSize * 1.2,
              minWidth: 10,
            }}
            onMouseDown={(e) => handleMouseDown(e, "text")}>
            {overlayText.text}
          </div>
        )}
        {/* Draggable Overlay Logo */}
        {overlayLogo && overlayLogo.url && (
          <img
            src={overlayLogo.url}
            alt="Logo"
            style={{
              position: "absolute",
              left: overlayLogo.x,
              top: overlayLogo.y,
              width: overlayLogo.width,
              height: overlayLogo.height,
              opacity: overlayLogo.opacity,
              cursor: "move",
              pointerEvents: "auto",
              zIndex: 2,
              userSelect: "none",
            }}
            onMouseDown={(e) => handleMouseDown(e, "logo")}
          />
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
