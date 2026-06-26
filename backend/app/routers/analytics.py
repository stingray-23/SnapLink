from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from app.database import get_db
from app.models.user import User
from app.models.url import URL
from app.models.click import Click
from app.middleware.auth import get_current_user
from app.schemas.analytics import (
    TimeseriesResponse, AnalyticsOverview, CountryResponse, 
    DeviceResponse, BrowserResponse, ReferrerResponse
)
from datetime import datetime, timedelta

router = APIRouter()

async def get_url_for_user(short_code: str, user: User, db: AsyncSession) -> URL:
    result = await db.execute(
        select(URL).where(URL.short_code == short_code, URL.user_id == user.id)
    )
    url_obj = result.scalar_one_or_none()
    if not url_obj:
        raise HTTPException(status_code=404, detail="URL not found or unauthorized")
    return url_obj

@router.get("/{short_code}/overview", response_model=AnalyticsOverview)
async def get_overview(short_code: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    url_obj = await get_url_for_user(short_code, current_user, db)
    
    # Get unique countries count
    result = await db.execute(
        select(func.count(func.distinct(Click.country_code))).where(Click.url_id == url_obj.id)
    )
    unique_countries = result.scalar() or 0
    
    # Get last click
    result = await db.execute(
        select(Click.clicked_at).where(Click.url_id == url_obj.id).order_by(Click.clicked_at.desc()).limit(1)
    )
    last_click = result.scalar_one_or_none()
    
    return {
        "short_code": url_obj.short_code,
        "original_url": url_obj.original_url,
        "title": url_obj.title,
        "total_clicks": url_obj.total_clicks,
        "unique_countries": unique_countries,
        "created_at": url_obj.created_at,
        "last_click_at": last_click
    }

@router.get("/{short_code}/timeseries", response_model=TimeseriesResponse)
async def get_timeseries(short_code: str, period: str = "7d", db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    url_obj = await get_url_for_user(short_code, current_user, db)
    
    days = 7
    if period == "30d": days = 30
    elif period == "90d": days = 90
    elif period == "all": days = 3650
    
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(
            cast(Click.clicked_at, Date).label("date"),
            func.count(Click.id).label("clicks")
        )
        .where(Click.url_id == url_obj.id, Click.clicked_at >= cutoff)
        .group_by(cast(Click.clicked_at, Date))
        .order_by(cast(Click.clicked_at, Date))
    )
    
    data = [{"date": str(row.date), "clicks": row.clicks} for row in result]
    return {"period": period, "data": data}

@router.get("/{short_code}/countries", response_model=CountryResponse)
async def get_countries(short_code: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    url_obj = await get_url_for_user(short_code, current_user, db)
    
    result = await db.execute(
        select(
            Click.country, Click.country_code, 
            func.max(Click.latitude).label("lat"), 
            func.max(Click.longitude).label("lon"),
            func.count(Click.id).label("clicks")
        )
        .where(Click.url_id == url_obj.id)
        .group_by(Click.country, Click.country_code)
        .order_by(func.count(Click.id).desc())
        .limit(20)
    )
    
    data = [{"country": r.country, "country_code": r.country_code, "clicks": r.clicks, "lat": r.lat, "lon": r.lon} for r in result if r.country]
    return {"data": data}

@router.get("/{short_code}/devices", response_model=DeviceResponse)
async def get_devices(short_code: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    url_obj = await get_url_for_user(short_code, current_user, db)
    
    result = await db.execute(
        select(Click.device_type, func.count(Click.id).label("clicks"))
        .where(Click.url_id == url_obj.id)
        .group_by(Click.device_type)
        .order_by(func.count(Click.id).desc())
    )
    
    data = [{"device_type": r.device_type or "unknown", "clicks": r.clicks} for r in result]
    return {"data": data}

@router.get("/{short_code}/browsers", response_model=BrowserResponse)
async def get_browsers(short_code: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    url_obj = await get_url_for_user(short_code, current_user, db)
    
    result = await db.execute(
        select(Click.browser, func.count(Click.id).label("clicks"))
        .where(Click.url_id == url_obj.id)
        .group_by(Click.browser)
        .order_by(func.count(Click.id).desc())
    )
    
    data = [{"browser": r.browser or "unknown", "clicks": r.clicks} for r in result]
    return {"data": data}

@router.get("/{short_code}/referrers", response_model=ReferrerResponse)
async def get_referrers(short_code: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    url_obj = await get_url_for_user(short_code, current_user, db)
    
    result = await db.execute(
        select(Click.referrer, func.count(Click.id).label("clicks"))
        .where(Click.url_id == url_obj.id)
        .group_by(Click.referrer)
        .order_by(func.count(Click.id).desc())
        .limit(20)
    )
    
    data = [{"referrer": r.referrer or "Direct / None", "clicks": r.clicks} for r in result]
    return {"data": data}
