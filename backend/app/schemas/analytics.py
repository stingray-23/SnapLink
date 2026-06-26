from pydantic import BaseModel
from datetime import datetime
from typing import List

class TimeseriesData(BaseModel):
    date: str
    clicks: int

class TimeseriesResponse(BaseModel):
    period: str
    data: List[TimeseriesData]

class AnalyticsOverview(BaseModel):
    short_code: str
    original_url: str
    title: str | None
    total_clicks: int
    unique_countries: int
    created_at: datetime
    last_click_at: datetime | None = None

class CountryData(BaseModel):
    country: str | None
    country_code: str | None
    clicks: int
    lat: float | None = None
    lon: float | None = None

class CountryResponse(BaseModel):
    data: List[CountryData]

class DeviceData(BaseModel):
    device_type: str | None
    clicks: int

class DeviceResponse(BaseModel):
    data: List[DeviceData]

class BrowserData(BaseModel):
    browser: str | None
    clicks: int

class BrowserResponse(BaseModel):
    data: List[BrowserData]

class ReferrerData(BaseModel):
    referrer: str | None
    clicks: int

class ReferrerResponse(BaseModel):
    data: List[ReferrerData]
