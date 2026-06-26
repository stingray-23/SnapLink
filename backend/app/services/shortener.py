import string
import random
import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.url import URL

BASE62_CHARS = string.ascii_letters + string.digits  # a-z A-Z 0-9 = 62 chars

def encode_base62(num: int, length: int = 6) -> str:
    """Convert an integer to a base62 string of fixed length."""
    result = []
    while num > 0:
        result.append(BASE62_CHARS[num % 62])
        num //= 62
    return ''.join(reversed(result)).zfill(length)

def generate_short_code(url: str, length: int = 6) -> str:
    """
    Generate a short code by:
    1. Hashing the URL + random salt with MD5
    2. Taking first 8 hex chars -> convert to int -> encode base62
    """
    salt = ''.join(random.choices(string.ascii_letters, k=8))
    hash_input = f"{url}{salt}"
    hex_hash = hashlib.md5(hash_input.encode()).hexdigest()[:8]
    num = int(hex_hash, 16)
    return encode_base62(num, length)

async def get_unique_short_code(db: AsyncSession, original_url: str) -> str:
    """Keep generating until we get a unique code."""
    for _ in range(10):
        code = generate_short_code(original_url)
        result = await db.execute(select(URL).where(URL.short_code == code))
        if not result.scalar_one_or_none():
            return code
    raise Exception("Could not generate unique short code after 10 attempts")
