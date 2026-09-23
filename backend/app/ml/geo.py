"""City coordinates for travel-distance features. Small on purpose: covers the demo data and the generator."""
import math

# city -> (country, lat, lon)
CITIES: dict[str, tuple[str, float, float]] = {
    "Almaty": ("KZ", 43.24, 76.89), "Astana": ("KZ", 51.17, 71.45), "Shymkent": ("KZ", 42.32, 69.59),
    "Karaganda": ("KZ", 49.81, 73.10), "Aktobe": ("KZ", 50.28, 57.17),
    "Singapore": ("SG", 1.35, 103.82), "Dubai": ("AE", 25.20, 55.27), "Istanbul": ("TR", 41.01, 28.98),
    "London": ("GB", 51.51, -0.13), "New York": ("US", 40.71, -74.01), "Berlin": ("DE", 52.52, 13.40),
    "Tbilisi": ("GE", 41.72, 44.79), "Amsterdam": ("NL", 52.37, 4.90), "Seoul": ("KR", 37.57, 126.98),
    "Beijing": ("CN", 39.90, 116.40), "Tokyo": ("JP", 35.68, 139.69),
}
CAPITALS = {"KZ": "Astana", "SG": "Singapore", "AE": "Dubai", "TR": "Istanbul", "GB": "London", "US": "New York",
            "DE": "Berlin", "GE": "Tbilisi", "NL": "Amsterdam", "KR": "Seoul", "CN": "Beijing", "JP": "Tokyo"}


def coords(city: str, country: str) -> tuple[float, float]:
    """Known city, else the country's main city, else (0, 0)."""
    hit = CITIES.get(city) or CITIES.get(CAPITALS.get(country, ""))
    return (hit[1], hit[2]) if hit else (0.0, 0.0)


def haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    (lat1, lon1), (lat2, lon2) = a, b
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(h))
