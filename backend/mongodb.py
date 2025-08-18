from pymongo import MongoClient
from bson import ObjectId
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

client = MongoClient(MONGO_URI)
db = client["rtsp_streams_db"]  # Database name
streams_collection = db["streams"]  # Collection name

def add_overlay(username, rtsp_url, hls_url, element=None):
    """Add a new username, RTSP URL, HLS URL, and overlay elements to the database."""
    if not rtsp_url:
        raise ValueError("RTSP URL cannot be empty")
    # Use default structure if element is not provided
    if element is None:
        element = [
            {
                "type": "Text",
                "context": "Live",
                "position": {"x": 100, "y": 50},
                "size": {"width": 200, "height": 50},
                "opacity": 0.8
            },
            {
                "type": "Logo",
                "content": "logo",
                "position": {"x": 10, "y": 10},
                "size": {"width": 100, "height": 100},
                "opacity": 0.8
            }
        ]
    stream_data = {
        "username": username,
        "rtsp_url": rtsp_url,
        "hls_url": hls_url,
        "element": element,
    }
    # Upsert by username (replace if exists, insert if not)
    result = streams_collection.update_one(
        {"username": username},
        {"$set": stream_data},
        upsert=True
    )
    return str(result.upserted_id) if result.upserted_id else str(streams_collection.find_one({"username": username})["_id"])

def get_overlay_by_username(username):
    """Retrieve a stream overlay document by username."""
    return streams_collection.find_one({"username": username})

def get_all_overlays():
    """Retrieve all stream overlay documents."""
    return list(streams_collection.find())

def update_overlay(username, update_data):
    """Update a stream overlay document by username."""
    result = streams_collection.update_one(
        {"username": username},
        {"$set": update_data}
    )
    return result.modified_count

def delete_overlay(username):
    """Delete a stream overlay document by username."""
    result = streams_collection.delete_one({"username": username})
    return result.deleted_count


