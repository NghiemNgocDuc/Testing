async function findStore() {
    const ingredient = document.getElementById("ingredient").value;
    if (!ingredient) return alert("Please enter an ingredient");


    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Send ingredient and location to the Flask backend
        const response = await fetch("/find-store", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ingredient, lat, lng })
        });

        const data = await response.json();
        const list = document.getElementById("results");
        list.innerHTML = "";

        if (data.length === 0) {
            list.innerHTML = "<li>No stores found.</li>";
            return;
        }

        // Display the stores in sorted order
        data.forEach(store => {
            const li = document.createElement("li");
            li.classList.add("store-item");

            // Create a div for the store's name and address
            const storeDetails = document.createElement("div");
            storeDetails.innerHTML = `
                <strong>${store.name}</strong><br>
                ${store.address}<br>
                Distance: ${store.distance.toFixed(2)} km<br>
                <strong>Opening Hours:</strong> ${store.opening_hours}<br>
                <strong>Phone:</strong> ${store.phone}<br>
                <a href="${store.map_url}" target="_blank">View on Map</a>
            `;

            // Create the copy button
            const copyBtn = document.createElement("button");
            copyBtn.classList.add("copy-btn");
            copyBtn.innerText = "Copy Name";
            copyBtn.onclick = () => copyToClipboard(store.name);

            // Create the Google Maps button
            const googleMapsBtn = document.createElement("button");
            googleMapsBtn.classList.add("google-maps-btn");
            googleMapsBtn.innerText = "Open in Google Maps";
            googleMapsBtn.onclick = () => openInGoogleMaps(store.name);

            // Append the store details, copy button, and Google Maps button to the list item
            li.appendChild(storeDetails);
            li.appendChild(copyBtn);
            li.appendChild(googleMapsBtn);

            list.appendChild(li);
        });
    }, () => {
        alert("Geolocation failed.");
    });
}

// Function to render the rating as stars
function renderRating(rating) {
    if (rating === "No rating available") return rating;

    let stars = "";
    const numStars = Math.round(parseFloat(rating)); // Round the rating to the nearest integer
    for (let i = 0; i < numStars; i++) {
        stars += "⭐";
    }
    return stars || "No rating available";
}

// Copy the store name to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Store name copied to clipboard!");
    });
}

// Open the store location in Google Maps
function openInGoogleMaps(name) {
    const query = encodeURIComponent(name);
    window.open(`https://www.google.com/maps/search/${query}`, "_blank");
}

