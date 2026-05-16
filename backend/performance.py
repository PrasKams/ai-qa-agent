from collections import defaultdict
import time
import hashlib
from datetime import datetime, timedelta


class SimpleCache:
    def __init__(self, max_size=1000, ttl = 3600):
        self.cache = {}
        self.max_size = max_size
        self.ttl = ttl

    def get_cache_key(self, prompt: str, model: str) -> str:
        content = f"{model}:{prompt}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def get(self, prompt: str, model: str = "gpt-3.5-turbo"):
        key = self.get_cache_key(prompt, model)

        if key in self.cache:
            data, expiry = self.cache[key]
            if datetime.now() < expiry:
                print(f"✅ Cache HIT: {key[:8]}...")
                return data
            else:
                # Expired
                del self.cache[key]
        
        print(f"❌ Cache MISS: {key[:8]}...")
        return None
    

    def set(self, prompt: str, response: str, model: str = "gpt-3.5-turbo" ):
        key = self.get_cache_key(prompt, model)

        if len(self.cache) >= self.max_size:
            oldest = min(self.cache.items(), key=lambda x: x[1][1])
            del self.cache[oldest[0]]
        
        expiry = datetime.now() + timedelta(seconds=self.ttl)
        self.cache[key] = (response, expiry)
        print(f"💾 Cached: {key[:8]}...")


    def clear(self):
        """Clear all cache."""
        self.cache.clear()

    def get_stats(self):

        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'ttl': self.ttl
        }


ai_cache = SimpleCache(max_size=1000, ttl=3600)  # 1 hour cache


class UserRateLimiter:
    
    def __init__(self):
        self.limits = defaultdict(list)

    def check_limits(self, user_id: str, max_requests: int = 100, window: int = 3600):
        current_time = time.time()

        self.limits[user_id] = [
            t for t in self.limits[user_id]
            if current_time -t < window
        ]

        if len(self.limits[user_id]) >= max_requests:
            return False

        self.limits[user_id].append(current_time)
        return True
    

rate_limiter = UserRateLimiter()
    