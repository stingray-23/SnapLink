from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models.url import URL
from app.schemas.url import URLCreate, URLOut
from app.middleware.auth import get_current_user, get_current_user_optional
from app.models.user import User
from app.services.shortener import get_unique_short_code
from app.services.cache import cache_url
import httpx
from bs4 import BeautifulSoup
from typing import List

router = APIRouter()

async def fetch_page_title(url: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, follow_redirects=True)
            soup = BeautifulSoup(resp.text, "html.parser")
            og_title = soup.find("meta", property="og:title")
            if og_title:
                return og_title.get("content")
            title_tag = soup.find("title")
            return title_tag.text.strip() if title_tag else None
    except Exception:
        return None

@router.post("/shorten", response_model=URLOut, status_code=201)
async def create_url(
    url_in: URLCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional)
):
    # Check custom alias
    if url_in.custom_alias:
        result = await db.execute(select(URL).where(URL.custom_alias == url_in.custom_alias))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Custom alias is already taken")
        short_code = url_in.custom_alias
    else:
        short_code = await get_unique_short_code(db, str(url_in.original_url))
    
    title = url_in.title
    if not title:
        title = await fetch_page_title(str(url_in.original_url))

    new_url = URL(
        original_url=str(url_in.original_url),
        short_code=short_code,
        custom_alias=url_in.custom_alias,
        title=title,
        expires_at=url_in.expires_at,
        user_id=current_user.id if current_user else None
    )
    db.add(new_url)
    await db.commit()
    await db.refresh(new_url)

    # Cache immediately
    await cache_url(short_code, new_url.original_url)

    from app.config import settings
    setattr(new_url, "short_url", f"{settings.base_url}/r/{short_code}")
    return new_url

@router.get("/", response_model=List[URLOut])
async def list_urls(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(URL).where(URL.user_id == current_user.id, URL.is_active == True).order_by(URL.created_at.desc())
    )
    urls = result.scalars().all()
    from app.config import settings
    for u in urls:
        setattr(u, "short_url", f"{settings.base_url}/r/{u.short_code}")
    return urls

@router.get("/{short_code}", response_model=URLOut)
async def get_url(short_code: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(URL).where(URL.short_code == short_code, URL.user_id == current_user.id, URL.is_active == True)
    )
    url_obj = result.scalar_one_or_none()
    if not url_obj:
        raise HTTPException(status_code=404, detail="URL not found")
    
    from app.config import settings
    setattr(url_obj, "short_url", f"{settings.base_url}/r/{url_obj.short_code}")
    return url_obj

@router.delete("/{short_code}", status_code=204)
async def delete_url(short_code: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(URL).where(URL.short_code == short_code, URL.user_id == current_user.id)
    )
    url_obj = result.scalar_one_or_none()
    if not url_obj:
        raise HTTPException(status_code=404, detail="URL not found")
    
    url_obj.is_active = False
    await db.commit()
    
    from app.services.cache import invalidate_url_cache
    await invalidate_url_cache(short_code)
    return None
