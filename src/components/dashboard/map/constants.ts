
// Storage key for API key
export const API_KEY_STORAGE_KEY = "traffic_management_maps_api_key";

// Hyderabad coordinates
export const defaultCenter = {
  lat: 17.3850,
  lng: 78.4867
};

// Map container style
export const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

// Map options
export const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
};

// Libraries to load with Google Maps
export const libraries: ["visualization"] = ["visualization"];

// Map theme - slightly muted colors to make markers stand out
export const mapTheme = [
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7c93a3" }, { lightness: "-10" }]
  },
  {
    featureType: "administrative.country",
    elementType: "geometry",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.fill",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "landscape",
    elementType: "geometry.fill",
    stylers: [{ color: "#f7f7f7" }]
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#c7eced" }]
  }
];
