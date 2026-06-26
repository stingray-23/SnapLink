from fastapi import APIRouter, Request, Depends, HTTPException, BackgroundTasks
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.database import get_db
from app.services.cache import get_cached_url, cache_url, increment_click_counter
from app.services.rate_limiter import is_rate_limited
from app.services.geo import get_geo_data, parse_user_agent
from app.models.url import URL
from app.models.click import Click

router = APIRouter()

async def log_click(short_code: str, ip: str, user_agent: str, referrer: str, db: AsyncSession):
    """Background task: geo lookup + UA parse + write click to DB."""
    result = await db.execute(select(URL).where(URL.short_code == short_code))
    url_obj = result.scalar_one_or_none()
    if not url_obj:
        return

    geo = await get_geo_data(ip)
    ua_data = parse_user_agent(user_agent)

    click = Click(
        url_id=url_obj.id,
        ip_address=ip,
        user_agent=user_agent,
        referrer=referrer,
        **geo,
        **ua_data
    )
    db.add(click)

    # Increment denormalized counter
    url_obj.total_clicks += 1
    await db.commit()
    
    # Also increment Redis counter
    await increment_click_counter(short_code)

@router.get("/r/{short_code}")
async def redirect_url(
    short_code: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    ip = request.client.host if request.client else "127.0.0.1"

    # 1. Rate limiting
    if await is_rate_limited(ip, max_requests=60, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many requests")

    # 2. Check Redis cache FIRST
    original_url = await get_cached_url(short_code)

    # 3. Cache miss — hit PostgreSQL
    if not original_url:
        result = await db.execute(
            select(URL).where(URL.short_code == short_code, URL.is_active == True)
        )
        url_obj = result.scalar_one_or_none()
        if not url_obj:
            raise HTTPException(status_code=404, detail="Short URL not found")
        
        # Check expiry
        if url_obj.expires_at and url_obj.expires_at.replace(tzinfo=None) < datetime.utcnow():
            raise HTTPException(status_code=410, detail="This link has expired")
        
        original_url = url_obj.original_url
        await cache_url(short_code, original_url)

    # 4. Log click asynchronously
    background_tasks.add_task(
        log_click,
        short_code=short_code,
        ip=ip,
        user_agent=request.headers.get("user-agent", ""),
        referrer=request.headers.get("referer", ""),
        db=db
    )

    # 5. Redirect
    return RedirectResponse(url=original_url, status_code=302)
