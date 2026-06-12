# pyrefly: ignore [missing-import]
import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import get_settings

settings = get_settings()

client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(
        settings.mongodb_url,
        tlsCAFile=certifi.where(),
    )
    db = client[settings.db_name]
    # Ping to confirm connection
    await client.admin.command("ping")
    print(f"✅ Connected to MongoDB: {settings.db_name}")

    # Tạo indexes
    await create_indexes()


async def disconnect_db():
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")


async def create_indexes():
    # Users
    await db.users.create_index("email", unique=True)

    # Products
    await db.products.create_index("slug", unique=True)
    await db.products.create_index([("category", 1), ("is_active", 1)])
    await db.products.create_index([("name", "text"), ("tags", "text")])

    # Orders
    await db.orders.create_index("order_code", unique=True)
    await db.orders.create_index([("user_id", 1), ("created_at", -1)])
    await db.orders.create_index([("payment.status", 1), ("order_status", 1)])
    await db.orders.create_index("payment.transaction_id")

    print("📇 MongoDB indexes created")


def get_db() -> AsyncIOMotorDatabase:
    return db
