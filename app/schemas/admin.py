from pydantic import BaseModel, Field


class AdminLogin(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)
    password: str = Field(..., min_length=1)


class AdminRead(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True
