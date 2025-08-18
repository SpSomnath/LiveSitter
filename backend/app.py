import os
import subprocess
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder="streams")
CORS(app)

STREAMS_DIR = os.path.join(os.getcwd(), "streams")

# Ensure the streams folder exists
os.makedirs(STREAMS_DIR, exist_ok=True)

# Store the FFmpeg process
ffmpeg_process = None


@app.route("/start_stream", methods=["POST"])
def start_stream():
    global ffmpeg_process

    data = request.get_json()
    rtsp_url = data.get("rtsp_url")

    if not rtsp_url:
        return jsonify({"error": "No RTSP URL provided"}), 400

    # Kill existing FFmpeg process if running
    if ffmpeg_process and ffmpeg_process.poll() is None:
        ffmpeg_process.terminate()

    # FFmpeg command (your tested one)
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

    # Run FFmpeg in background
    ffmpeg_process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    return jsonify({
        "message": "Streaming started",
        "hls_url": "/streams/stream.m3u8"
    })


@app.route("/streams/<path:filename>")
def serve_stream(filename):
    return send_from_directory(STREAMS_DIR, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
