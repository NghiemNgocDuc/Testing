from flask import Flask, request, jsonify, render_template
import requests
from math import radians, sin, cos, sqrt, atan2
import os

app = Flask(__name__)


# Haversine formula to calculate distance between two lat/lon points
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0  # Radius of the Earth in kilometers
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c  # Distance in kilometers


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/find-store", methods=["POST"])
def find_store():
    data = request.json
    ingredient = data.get("ingredient")
    lat = data.get("lat")
    lng = data.get("lng")

    overpass_url = "http://overpass-api.de/api/interpreter"
    overpass_query = f"""
    [out:json];
    node
      ["shop"="supermarket"]
      (around:5000, {lat}, {lng});  // 5000 meters radius
    out body;
    """

    response = requests.get(overpass_url, params={'data': overpass_query})
    stores = response.json().get('elements', [])

    store_list = []
    for store in stores:
        store_lat = store.get("lat")
        store_lon = store.get("lon")
        distance = haversine(lat, lng, store_lat, store_lon)

        # Extract the opening hours if available
        opening_hours = store.get("tags", {}).get("opening_hours", "Opening hours not available")

        # Extract contact information (phone number)
        phone = store.get("tags", {}).get("contact:phone", store.get("tags", {}).get("phone", "Phone not available"))

        store_info = {
            "name": store.get("tags", {}).get("name", "Unknown Store"),
            "address": store.get("tags", {}).get("addr:street", "No Address"),
            "lat": store_lat,
            "lng": store_lon,
            "distance": distance,  # Distance in kilometers
            "opening_hours": opening_hours,
            "phone": phone,
            "map_url": f"https://www.openstreetmap.org/?mlat={store_lat}&mlon={store_lon}"
        }
        store_list.append(store_info)

    # Sort stores by distance (ascending order)
    store_list.sort(key=lambda store: store["distance"])

    return jsonify(store_list)


if __name__ == "__main__":
    app.run(debug=True)

