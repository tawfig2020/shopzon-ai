import pytest
import asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.database.models import Base
from app.config import get_settings
from app.main import app
from httpx import AsyncClient

settings = get_settings()

# Create async engine for testing
test_engine = create_async_engine(
    settings.TEST_DATABASE_URL,
    echo=True,
    future=True
)

# Create async session for testing
async_session = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_db_setup():
    """Set up test database."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session(test_db_setup) -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async with async_session() as session:
        yield session
        await session.rollback()
        await session.close()

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create a test client for the FastAPI app."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def test_user_data():
    """Test user data fixture."""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }

@pytest.fixture
def test_product_data():
    """Test product data fixture."""
    return {
        "name": "Test Product",
        "description": "A test product description",
        "base_price": 99.99,
        "category": "test_category",
        "features": {
            "color": "blue",
            "size": "medium",
            "weight": 1.5
        }
    }

@pytest.fixture
def test_order_data():
    """Test order data fixture."""
    return {
        "total_amount": 199.98,
        "status": "pending",
        "shipping_address": {
            "street": "123 Test St",
            "city": "Test City",
            "state": "TS",
            "zip": "12345"
        },
        "payment_info": {
            "payment_method": "credit_card",
            "last_four": "4242"
        }
    }
