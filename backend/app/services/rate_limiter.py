import time
from app.services.cache import redis_client

async def is_rate_limited(ip: str, max_requests: int = 20, window_seconds: int = 60) -> bool:
    key = f"rate:{ip}"
    now = time.time()
    window_start = now - window_seconds

    pipe = redis_client.pipeline()
    # Remove timestamps outside window
    pipe.zremrangebyscore(key, 0, window_start)
    # Count requests in window
    pipe.zcard(key)
    # Add current request timestamp
    pipe.zadd(key, {str(now): now})
    # Set key expiry
    pipe.expire(key, window_seconds)
    results = await pipe.execute()

    request_count = results[1]
    return request_count >= max_requests
