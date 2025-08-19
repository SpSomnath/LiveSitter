# 🎥 RTSP Stream with Overlay Manager

A full-stack application to stream **RTSP feeds** using **FFmpeg → HLS**, manage overlays (text & logo), and persist overlay settings in **MongoDB**. The backend is built with **Flask** and the frontend with **React**.

---

## 🚀 Features

* Stream RTSP video to **HLS (`.m3u8`)** for web playback.
* Overlay **custom text** and **logos** on the video.
* Drag-and-drop repositioning of overlays in the React frontend.
* Save overlay settings to **MongoDB** (per user).
* Restore or reset saved overlays by username.
* RESTful CRUD API endpoints for overlays.
* Cross-platform (tested on macOS/Linux).

---


## 🛠️ Tech Stack

* **Backend:** Flask, FFmpeg, PyMongo
* **Database:** MongoDB
* **Frontend:** React + Hls.js + Axios
* **Streaming:** RTSP → FFmpeg → HLS

---

## 📂 Project Structure

```
.
├── backend/
│   ├── app.py           # Flask server with stream + overlay API
│   ├── mongodb.py       # MongoDB helpers for overlay CRUD
│   ├── streams/         # Auto-generated HLS files (stream.m3u8, .ts chunks)
│   └── venv/            # Python virtual environment
└── frontend/
    ├── src/VideoPlayer.tsx   # React HLS player with draggable overlays
    └── package.json
```

---

## ⚡ Setup Instructions

### 1️⃣ Prerequisites

* [Python 3.8+](https://www.python.org/)
* [Node.js 16+](https://nodejs.org/)
* [MongoDB](https://www.mongodb.com/) running locally at `mongodb://localhost:27017`
* [FFmpeg](https://ffmpeg.org/) installed and available in PATH

Verify installation:

```bash
python3 --version
node -v
ffmpeg -version
```

---

### 2️⃣ Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # (Mac/Linux)
venv\Scripts\activate      # (Windows)

pip install flask flask-cors pymongo
```

Run the Flask server:

```bash
python3 app.py
```

Server runs at:

```
http://127.0.0.1:5001
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm start
```

React dev server runs at:

```
http://localhost:3000
```

---

## 🎯 API Endpoints

### ▶️ Start Streaming

```http
POST /start_stream
Content-Type: application/json
```

**Request Body (required):**

```json
{
  "rtsp_url": "rtsp://example.com/live"
}
```

**Response:**

```json
{
  "message": "Streaming started",
  "hls_url": "/streams/stream.m3u8",
  "overlay_id": "68a3f78a596bc1531d5b4a9e"
}
```

---

### 💾 Save Overlay

```http
POST /overlay/<username>
Content-Type: application/json
```

**Request Body Example:**

```json
{
  "rtsp_url": "rtsp://example.com/live",
  "hls_url": "/streams/stream.m3u8",
  "element": [
    { "type": "Text", "context": "LIVE", "position": {"x":100,"y":50}, "fontSize":22, "opacity":0.8 },
    { "type": "Logo", "content": "https://example.com/logo.png", "position": {"x":10,"y":10}, "size": {"width":100,"height":100}, "opacity":0.8 }
  ]
}
```

---

### 🔄 Update Overlay

```http
PUT /overlay/<username>
Content-Type: application/json
```

**Request Body Example:**

```json
{
  "element": [
    { "type": "Text", "context": "BREAKING", "position": {"x":150,"y":60}, "fontSize":26, "opacity":0.9 }
  ]
}
```

---

### 📥 Get Overlay

```http
GET /overlay/<username>
```

**Response Example:**

```json
{
  "_id": "68a3f78a596bc1531d5b4a9e",
  "username": "somnath",
  "rtsp_url": "rtsp://example.com/live",
  "hls_url": "/streams/stream.m3u8",
  "element": [...]
}
```

---

### ❌ Delete Overlay

```http
DELETE /overlay/<username>
```

**Response Example:**

```json
{
  "deleted_count": 1
}
```

---
## 🎬 Frontend Usage

* Enter RTSP URL and click **Start Stream**.
* Use settings panel to adjust overlay text/logo.
* Click **Save** → prompts for username → settings stored in DB.
* Next time, click **Restore** to fetch saved settings.
* Save button changes to **Update** after first save.

---
## 📽 Demo Video

<a href="https://drive.google.com/file/d/1ifiRUsKe4Fgy55OuEI6pjqYcv7_bXea8/view?usp=sharing" target="_blank">
  <img src="https://github.com/SpSomnath/LiveSitter/blob/main/Img/Screenshot%202025-08-19%20at%2011.56.10%E2%80%AFAM.png" width="600" alt="Demo Video"/>
</a>

---

## 📸 Demo Screenshot

* **Landing page that take RTSP URL**
![Landing page](https://github.com/SpSomnath/LiveSitter/blob/main/Img/Screenshot%202025-08-19%20at%2011.55.33%E2%80%AFAM.png?raw=true)


* **Playing RTSP -> HLS video**
![Streaming RTSP](https://github.com/SpSomnath/LiveSitter/blob/main/Img/Screenshot%202025-08-19%20at%2011.56.10%E2%80%AFAM.png?raw=true)


* **Overlay Setting with logo and dragable overlay settings -> HLS video**
![Overlay Setting](https://github.com/SpSomnath/LiveSitter/blob/main/Img/Screenshot%202025-08-19%20at%2011.58.01%E2%80%AFAM.png?raw=true)


---




## 🧑‍💻 Author

**Somnath Prajapati**
🔗 [GitHub](https://github.com/spsomnath)

---


