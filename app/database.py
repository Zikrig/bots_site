from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# SQLite needs connect_args for foreign keys; MySQL (asyncmy) does not
_connect_args = {}
if "sqlite" in settings.database_url:
    _connect_args["check_same_thread"] = False
engine = create_async_engine(
    settings.database_url,
    echo=False,
    connect_args=_connect_args,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
