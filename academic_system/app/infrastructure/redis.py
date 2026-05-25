"""Redis client for OTP and cache storage."""

import time
import redis.asyncio as aioredis
from typing import Optional
from .config import settings


class InMemoryRedis:
    """In-memory fallback for development when Redis is unavailable."""

    def __init__(self):
        self._storage = {}
        self._ttls = {}

    async def connect(self):
        """No-op for in-memory."""
        pass

    async def disconnect(self):
        """No-op for in-memory."""
        pass

    async def set_with_ttl(self, key: str, value: str, ttl_seconds: int) -> bool:
        """Store key with expiry time."""
        self._storage[key] = value
        self._ttls[key] = time.time() + ttl_seconds
        return True

    async def get(self, key: str) -> Optional[str]:
        """Get value if not expired."""
        if key not in self._storage:
            return None
        if time.time() > self._ttls.get(key, 0):
            del self._storage[key]
            del self._ttls[key]
            return None
        return self._storage.get(key)

    async def delete(self, key: str) -> int:
        """Delete a key."""
        self._storage.pop(key, None)
        self._ttls.pop(key, None)
        return 1

    async def exists(self, key: str) -> bool:
        """Check if key exists and not expired."""
        return await self.get(key) is not None


class RedisClient:
    """Async Redis client wrapper with in-memory fallback."""

    def __init__(self):
        self._pool: Optional[aioredis.ConnectionPool] = None
        self._client: Optional[aioredis.Redis] = None
        self._fallback: Optional[InMemoryRedis] = None

    async def connect(self):
        """Create Redis connection pool or use in-memory fallback."""
        if self._pool is None:
            try:
                self._pool = aioredis.ConnectionPool.from_url(
                    settings.redis_url,
                    db=settings.redis_db,
                    password=settings.redis_password,
                    decode_responses=True
                )
                self._client = aioredis.Redis(connection_pool=self._pool)
                # Test connection
                await self._client.ping()
            except Exception as e:
                print(f"Redis unavailable, using in-memory fallback: {e}")
                self._fallback = InMemoryRedis()

    async def disconnect(self):
        """Close Redis connection pool."""
        if self._pool:
            await self._pool.disconnect()
            self._pool = None
            self._client = None
        if self._fallback:
            await self._fallback.disconnect()

    @property
    def client(self) -> aioredis.Redis:
        """Get Redis client (call connect() first)."""
        if self._client is None:
            raise RuntimeError("Redis client not connected. Call connect() first.")
        return self._client

    async def set_with_ttl(self, key: str, value: str, ttl_seconds: int) -> bool:
        """Set a key with expiration time."""
        if self._fallback:
            return await self._fallback.set_with_ttl(key, value, ttl_seconds)
        return await self.client.setex(key, ttl_seconds, value)

    async def get(self, key: str) -> Optional[str]:
        """Get a value by key."""
        if self._fallback:
            return await self._fallback.get(key)
        return await self.client.get(key)

    async def delete(self, key: str) -> int:
        """Delete a key."""
        if self._fallback:
            return await self._fallback.delete(key)
        return await self.client.delete(key)

    async def exists(self, key: str) -> bool:
        """Check if a key exists."""
        if self._fallback:
            return await self._fallback.exists(key)
        return await self.client.exists(key) > 0


# Global Redis client instance
redis_client = RedisClient()


async def get_redis() -> RedisClient:
    """Dependency to get Redis client."""
    if redis_client._client is None and redis_client._fallback is None:
        await redis_client.connect()
    return redis_client
