import os
import subprocess
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from mongodb import (
    add_overlay,
    get_overlay_by_username,
    get_all_overlays,
    update_overlay,
    delete_overlay,
)

app = Flask(__name__, static_folder="streams")
CORS(app)

STREAMS_DIR = os.path.join(os.getcwd(), "streams")
os.makedirs(STREAMS_DIR, exist_ok=True)
ffmpeg_process = None

@app.route("/start_stream", methods=["POST"])
def start_stream():
    global ffmpeg_process

    data = request.get_json()
    rtsp_url = data.get("rtsp_url")
    username = data.get("username", "default")
    element = data.get("element")

    if not rtsp_url:
        return jsonify({"error": "No RTSP URL provided"}), 400

    # Kill existing FFmpeg process if running
    if ffmpeg_process and ffmpeg_process.poll() is None:
        ffmpeg_process.terminate()

    cmd = [
        "ffmpeg",
        "-fflags", "nobuffer",
        "-flags", "low_delay",
        "-rtsp_transport", "tcp",
        "-i", rtsp_url,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-tune", "zerolatency",
        "-c:a", "aac",
        "-ar", "44100",
        "-b:a", "128k",
        "-force_key_frames", "expr:gte(t,n_forced*2)",
        "-f", "hls",
        "-hls_time", "2",
        "-hls_list_size", "5",
        "-hls_flags", "delete_segments+append_list+omit_endlist+program_date_time",
        os.path.join(STREAMS_DIR, "stream.m3u8")
    ]

    ffmpeg_process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    hls_url = "/streams/stream.m3u8"
    overlay_id = add_overlay(username, rtsp_url, hls_url, element)

    return jsonify({
        "message": "Streaming started",
        "hls_url": hls_url,
        "overlay_id": overlay_id
    })

@app.route("/streams/<path:filename>")
def serve_stream(filename):
    return send_from_directory(STREAMS_DIR, filename)

# --- Overlay CRUD endpoints ---


@app.route("/overlay/<username>", methods=["GET"])
def api_get_overlay(username):
    """Fetch overlay for a given username"""
    doc = get_overlay_by_username(username)
    if not doc:
        return jsonify({"error": "Not found"}), 404
    doc["_id"] = str(doc["_id"])  # convert ObjectId to str
    return jsonify(doc)

@app.route("/overlay/<username>", methods=["POST"])
def api_add_overlay(username):
    """Save or update overlay settings"""
    data = request.get_json()
    rtsp_url = data.get("rtsp_url", "")
    hls_url = data.get("hls_url", "")
    element = data.get("element", None)

    overlay_id = add_overlay(username, rtsp_url, hls_url, element)
    return jsonify({"message": "Overlay saved", "overlay_id": overlay_id})

@app.route("/overlay/<username>", methods=["PUT"])
def api_update_overlay(username):
    """Update overlay settings for user"""
    update_data = request.get_json()
    count = update_overlay(username, update_data)
    return jsonify({"modified_count": count})

@app.route("/overlay/<username>", methods=["DELETE"])
def api_delete_overlay(username):
    """Delete overlay for a user"""
    count = delete_overlay(username)
    return jsonify({"deleted_count": count})



if __name__ == "__main__":
    print("Registered routes:", app.url_map)
    app.run(host="0.0.0.0", port=5001, debug=False)
