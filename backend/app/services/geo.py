import httpx
import user_agents
from app.config import settings

async def get_geo_data(ip: str) -> dict:
    """Fetch country, city, lat/lon from ip-api.com (free)."""
    if ip in ("127.0.0.1", "::1", "testclient"):
        return {}
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{settings.geo_api_url}/{ip}")
            data = response.json()
            if data.get("status") == "success":
                return {
                    "country": data.get("country"),
                    "country_code": data.get("countryCode"),
                    "city": data.get("city"),
                    "region": data.get("regionName"),
                    "latitude": data.get("lat"),
                    "longitude": data.get("lon"),
                }
    except Exception:
        pass
    return {}

def parse_user_agent(ua_string: str) -> dict:
    """Parse browser, OS, device type from User-Agent header."""
    ua = user_agents.parse(ua_string or "")
    if ua.is_mobile:
        device = "mobile"
    elif ua.is_tablet:
        device = "tablet"
    else:
        device = "desktop"
    return {
        "browser": ua.browser.family,
        "os": ua.os.family,
        "device_type": device,
    }
