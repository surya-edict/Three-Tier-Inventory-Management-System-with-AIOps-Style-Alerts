from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SupplierBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    contact_email: EmailStr
    phone: str = Field(min_length=5, max_length=30)


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(SupplierBase):
    status: str = Field(default="active")


class Supplier(SupplierBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    created_at: datetime
    updated_at: datetime


class SupplierSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    status: str


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    sku: Optional[str] = Field(default=None, max_length=64)
    description: Optional[str] = None
    price: float = Field(ge=0)
    quantity: int = Field(ge=0)
    threshold: int = Field(default=10, ge=0)
    supplier_id: int = Field(gt=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    status: str = Field(default="active")


class Product(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: Optional[str] = None
    description: Optional[str] = None
    price: float
    quantity: int
    threshold: int
    supplier_id: int
    status: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    archived_at: Optional[datetime] = None


class ProductListItem(Product):
    supplier: Optional[SupplierSummary] = None
    stock_status: str


class OrderBase(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class Order(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    order_date: datetime
    status: str
    notes: Optional[str] = None


class InventoryMovementCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    note: Optional[str] = None


class InventoryAdjustmentCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity_delta: int
    note: Optional[str] = None


class InventoryMovement(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    movement_type: str
    quantity_delta: int
    quantity_after: int
    note: Optional[str] = None
    created_at: datetime


class DashboardSummary(BaseModel):
    total_products: int
    active_products: int
    archived_products: int
    active_suppliers: int
    low_stock_items: int
    total_units: int
    total_orders: int
    recent_movements: int
