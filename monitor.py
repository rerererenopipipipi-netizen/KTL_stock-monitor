import os
from datetime import datetime
from supabase import create_client

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_ANON_KEY"]

supabase = create_client(url, key)

data = {
    "name": "テスト監視商品",
    "url": "https://example.com",
    "price": 1000,
    "stock": "確認済み",
    "checked_at": datetime.now().isoformat()
}

response = supabase.table("products").insert(data).execute()

print(response)
