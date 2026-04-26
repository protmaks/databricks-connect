// Lightweight gazetteer of Indian cities for "near <city>" reasoning.
// We don't need full coverage — top ~80 cities cover the queries the demo
// agent will get and let us compute haversine distance without external geocoding.

export interface CityCoord {
  name: string;       // canonical Title Case
  state: string;
  lat: number;
  lon: number;
  aliases?: string[];
}

export const INDIA_CITIES: CityCoord[] = [
  { name: "Delhi", state: "Delhi", lat: 28.6139, lon: 77.209, aliases: ["new delhi", "ncr"] },
  { name: "Mumbai", state: "Maharashtra", lat: 19.076, lon: 72.8777, aliases: ["bombay"] },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lon: 77.5946, aliases: ["bangalore"] },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707, aliases: ["madras"] },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lon: 88.3639, aliases: ["calcutta"] },
  { name: "Hyderabad", state: "Telangana", lat: 17.385, lon: 78.4867 },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lon: 72.5714 },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lon: 73.8567 },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lon: 75.7873 },
  { name: "Surat", state: "Gujarat", lat: 21.1702, lon: 72.8311 },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lon: 80.9462 },
  { name: "Kanpur", state: "Uttar Pradesh", lat: 26.4499, lon: 80.3319 },
  { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lon: 79.0882 },
  { name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lon: 75.8577 },
  { name: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lon: 77.4126 },
  { name: "Patna", state: "Bihar", lat: 25.5941, lon: 85.1376 },
  { name: "Gaya", state: "Bihar", lat: 24.7914, lon: 85.0002 },
  { name: "Muzaffarpur", state: "Bihar", lat: 26.1209, lon: 85.3647 },
  { name: "Bhagalpur", state: "Bihar", lat: 25.2425, lon: 86.9842 },
  { name: "Darbhanga", state: "Bihar", lat: 26.1542, lon: 85.8918 },
  { name: "Ranchi", state: "Jharkhand", lat: 23.3441, lon: 85.3096 },
  { name: "Jamshedpur", state: "Jharkhand", lat: 22.8046, lon: 86.2029 },
  { name: "Bhubaneswar", state: "Odisha", lat: 20.2961, lon: 85.8245 },
  { name: "Cuttack", state: "Odisha", lat: 20.4625, lon: 85.8828 },
  { name: "Guwahati", state: "Assam", lat: 26.1445, lon: 91.7362 },
  { name: "Shillong", state: "Meghalaya", lat: 25.5788, lon: 91.8933 },
  { name: "Imphal", state: "Manipur", lat: 24.817, lon: 93.9368 },
  { name: "Agartala", state: "Tripura", lat: 23.8315, lon: 91.2868 },
  { name: "Aizawl", state: "Mizoram", lat: 23.7271, lon: 92.7176 },
  { name: "Itanagar", state: "Arunachal Pradesh", lat: 27.0844, lon: 93.6053 },
  { name: "Kohima", state: "Nagaland", lat: 25.6747, lon: 94.1086 },
  { name: "Gangtok", state: "Sikkim", lat: 27.3389, lon: 88.6065 },
  { name: "Dehradun", state: "Uttarakhand", lat: 30.3165, lon: 78.0322 },
  { name: "Haridwar", state: "Uttarakhand", lat: 29.9457, lon: 78.1642 },
  { name: "Shimla", state: "Himachal Pradesh", lat: 31.1048, lon: 77.1734 },
  { name: "Srinagar", state: "Jammu and Kashmir", lat: 34.0837, lon: 74.7973 },
  { name: "Jammu", state: "Jammu and Kashmir", lat: 32.7266, lon: 74.857 },
  { name: "Leh", state: "Ladakh", lat: 34.1526, lon: 77.5771 },
  { name: "Chandigarh", state: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  { name: "Amritsar", state: "Punjab", lat: 31.634, lon: 74.8723 },
  { name: "Ludhiana", state: "Punjab", lat: 30.901, lon: 75.8573 },
  { name: "Jalandhar", state: "Punjab", lat: 31.326, lon: 75.5762 },
  { name: "Faridabad", state: "Haryana", lat: 28.4089, lon: 77.3178 },
  { name: "Gurugram", state: "Haryana", lat: 28.4595, lon: 77.0266, aliases: ["gurgaon"] },
  { name: "Noida", state: "Uttar Pradesh", lat: 28.5355, lon: 77.391 },
  { name: "Ghaziabad", state: "Uttar Pradesh", lat: 28.6692, lon: 77.4538 },
  { name: "Meerut", state: "Uttar Pradesh", lat: 28.9845, lon: 77.7064 },
  { name: "Agra", state: "Uttar Pradesh", lat: 27.1767, lon: 78.0081 },
  { name: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lon: 82.9739 },
  { name: "Allahabad", state: "Uttar Pradesh", lat: 25.4358, lon: 81.8463, aliases: ["prayagraj"] },
  { name: "Gorakhpur", state: "Uttar Pradesh", lat: 26.7606, lon: 83.3732 },
  { name: "Jodhpur", state: "Rajasthan", lat: 26.2389, lon: 73.0243 },
  { name: "Udaipur", state: "Rajasthan", lat: 24.5854, lon: 73.7125 },
  { name: "Kota", state: "Rajasthan", lat: 25.2138, lon: 75.8648 },
  { name: "Ajmer", state: "Rajasthan", lat: 26.4499, lon: 74.6399 },
  { name: "Vadodara", state: "Gujarat", lat: 22.3072, lon: 73.1812, aliases: ["baroda"] },
  { name: "Rajkot", state: "Gujarat", lat: 22.3039, lon: 70.8022 },
  { name: "Nashik", state: "Maharashtra", lat: 19.9975, lon: 73.7898 },
  { name: "Aurangabad", state: "Maharashtra", lat: 19.8762, lon: 75.3433 },
  { name: "Solapur", state: "Maharashtra", lat: 17.6599, lon: 75.9064 },
  { name: "Goa", state: "Goa", lat: 15.2993, lon: 74.124, aliases: ["panaji", "panjim"] },
  { name: "Mangaluru", state: "Karnataka", lat: 12.9141, lon: 74.856, aliases: ["mangalore"] },
  { name: "Mysuru", state: "Karnataka", lat: 12.2958, lon: 76.6394, aliases: ["mysore"] },
  { name: "Hubballi", state: "Karnataka", lat: 15.3647, lon: 75.124, aliases: ["hubli"] },
  { name: "Belagavi", state: "Karnataka", lat: 15.8497, lon: 74.4977, aliases: ["belgaum"] },
  { name: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lon: 76.9558 },
  { name: "Madurai", state: "Tamil Nadu", lat: 9.9252, lon: 78.1198 },
  { name: "Tiruchirappalli", state: "Tamil Nadu", lat: 10.7905, lon: 78.7047, aliases: ["trichy"] },
  { name: "Salem", state: "Tamil Nadu", lat: 11.6643, lon: 78.146 },
  { name: "Vellore", state: "Tamil Nadu", lat: 12.9165, lon: 79.1325 },
  { name: "Kochi", state: "Kerala", lat: 9.9312, lon: 76.2673, aliases: ["cochin", "ernakulam"] },
  { name: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lon: 76.9366, aliases: ["trivandrum"] },
  { name: "Kozhikode", state: "Kerala", lat: 11.2588, lon: 75.7804, aliases: ["calicut"] },
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lon: 83.2185, aliases: ["vizag"] },
  { name: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lon: 80.648 },
  { name: "Tirupati", state: "Andhra Pradesh", lat: 13.6288, lon: 79.4192 },
  { name: "Warangal", state: "Telangana", lat: 17.9689, lon: 79.5941 },
  { name: "Raipur", state: "Chhattisgarh", lat: 21.2514, lon: 81.6296 },
  { name: "Bhilai", state: "Chhattisgarh", lat: 21.2092, lon: 81.4285 },
  { name: "Jabalpur", state: "Madhya Pradesh", lat: 23.1815, lon: 79.9864 },
  { name: "Gwalior", state: "Madhya Pradesh", lat: 26.2183, lon: 78.1828 },
  { name: "Ujjain", state: "Madhya Pradesh", lat: 23.1765, lon: 75.7885 },
  { name: "Siliguri", state: "West Bengal", lat: 26.7271, lon: 88.3953 },
  { name: "Asansol", state: "West Bengal", lat: 23.6739, lon: 86.9524 },
  { name: "Durgapur", state: "West Bengal", lat: 23.5204, lon: 87.3119 },
  { name: "Howrah", state: "West Bengal", lat: 22.5958, lon: 88.2636 },
  { name: "Port Blair", state: "Andaman and Nicobar Islands", lat: 11.6234, lon: 92.7265 },
  { name: "Puducherry", state: "Puducherry", lat: 11.9416, lon: 79.8083, aliases: ["pondicherry"] },
];

export function lookupCity(name: string | null | undefined): CityCoord | null {
  if (!name) return null;
  const lc = name.toLowerCase().trim();
  for (const c of INDIA_CITIES) {
    if (c.name.toLowerCase() === lc) return c;
    if (c.aliases?.some((a) => a === lc)) return c;
  }
  // Partial / state-only fallback: pick the largest city of that state.
  for (const c of INDIA_CITIES) {
    if (c.state.toLowerCase() === lc) return c;
  }
  return null;
}

// Haversine distance in kilometres.
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
