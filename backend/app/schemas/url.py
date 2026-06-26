from pydantic import BaseModel, HttpUrl
from datetime import datetime
import uuid

class URLCreate(BaseModel):
    original_url: HttpUrl
    custom_alias: str | None = None
    title: str | None = None
    expires_at: datetime | None = None

class URLOut(BaseModel):
    id: uuid.UUID
    short_code: str
    short_url: str
    original_url: str
    title: str | None
    custom_alias: str | None
    expires_at: datetime | None
    created_at: datetime
    total_clicks: int
    is_active: bool

    class Config:
        from_attributes = True
