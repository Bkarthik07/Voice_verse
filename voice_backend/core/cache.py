from collections import OrderedDict

class SimpleLRUCache:
    def __init__(self, capacity: int = 100):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: str):
        key = key.lower().strip()
        if key not in self.cache:
            return None
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: str, value):
        key = key.lower().strip()
        self.cache[key] = value
        self.cache.move_to_end(key)
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

# Global in-memory cache instance (if we need shared state, we might need a multiprocessing Manager dict, 
# but for simplicity, we can house it within the LLM worker or a dedicated step).
qa_cache = SimpleLRUCache(100)
