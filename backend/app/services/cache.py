import redis.asyncio as redis
from app.config import settings

redis_client = redis.from_url(settings.redis_url, decode_responses=True)

CACHE_TTL = 3600  # 1 hour

async def get_cached_url(short_code: str) -> str | None:
    """Check Redis before hitting PostgreSQL."""
    return await redis_client.get(f"snaplink:url:{short_code}")

async def cache_url(short_code: str, original_url: str, ttl: int = CACHE_TTL):
    """Cache short_code -> original_url mapping."""
    await redis_client.setex(f"snaplink:url:{short_code}", ttl, original_url)

async def invalidate_url_cache(short_code: str):
    await redis_client.delete(f"snaplink:url:{short_code}")

async def increment_click_counter(short_code: str) -> int:
    """
    Increment a Redis counter. 
    Returns current Redis click count.
    """
    key = f"snaplink:clicks:{short_code}"
    count = await redis_client.incr(key)
    await redis_client.expire(key, 86400)  # 24h TTL
    return count
