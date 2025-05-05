
// Export the API key storage key for consistent use across the app
export const API_KEY_STORAGE_KEY = 'google_maps_api_key';

// Default map center (Hyderabad)
export const defaultCenter = {
  lat: 17.385044,
  lng: 78.486671,
};

// Default container style
export const mapContainerStyle = {
  height: "100%",
  width: "100%",
};

// Default map options
export const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  clickableIcons: false,
};

// Required libraries for Google Maps API
// Type as any to resolve Library type issues
export const libraries: any = ["places", "drawing", "geometry", "visualization"];

// Vehicle types and their corresponding colors
export const vehicleTypeColors: Record<string, string> = {
  "CAR": "#3b82f6",    // Blue
  "TAXI": "#eab308",   // Yellow
  "BUS": "#22c55e",    // Green
  "TRUCK": "#f97316",  // Orange
  "BIKE": "#8b5cf6",   // Purple
  "AMBULANCE": "#ef4444", // Red
  "POLICE": "#0ea5e9", // Light blue
  "FIRE": "#dc2626",   // Dark red
  "OTHER": "#6b7280"   // Gray
};

// RSU status colors
export const rsuStatusColors: Record<string, string> = {
  "Active": "#22c55e",   // Green
  "Inactive": "#6b7280", // Gray
  "Warning": "#f59e0b",  // Orange
  "Error": "#ef4444",    // Red
  "Maintenance": "#8b5cf6" // Purple
};

// Set the Google Maps API key from environment
export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// Adding mapTheme export for MapContainer
export const mapTheme = [
  {
    "featureType": "poi",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "transit",
    "stylers": [
      { "visibility": "off" }
    ]
  }
];
