import time
from datetime import datetime
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, generate_latest
from sqlalchemy import func, inspect, or_, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from starlette.responses import Response

import database
import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mega Inventory API", version="2.0.0")

REQUEST_COUNT = Counter("api_requests_total", "Total number of API requests", ["method", "endpoint", "status"])
STOCK_LEVEL = Gauge("inventory_stock_level", "Current stock level per product", ["product_name"])
LOW_STOCK_PRODUCTS = Gauge("inventory_low_stock_products", "Products currently below their threshold")
API_LATENCY = Gauge("api_latency_seconds", "API request latency in seconds", ["endpoint"])


def ensure_product_columns(db: Session) -> None:
    bind = db.get_bind()
    dialect = bind.dialect.name
    inspector = inspect(bind)
    now = datetime.utcnow().isoformat()

    with bind.begin() as connection:
        existing_columns = {column["name"] for column in inspector.get_columns("products")}
        if "sku" not in existing_columns:
            if dialect == "postgresql":
                statements = [
                    "ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR",
                    "ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active'",
                    "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE",
                    "ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP",
                    "ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP",
                    "ALTER TABLE products ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP",
                ]
            else:
                statements = [
                    "ALTER TABLE products ADD COLUMN sku VARCHAR",
                    "ALTER TABLE products ADD COLUMN status VARCHAR DEFAULT 'active'",
                    "ALTER TABLE products ADD COLUMN is_archived BOOLEAN DEFAULT 0",
                    "ALTER TABLE products ADD COLUMN created_at DATETIME",
                    "ALTER TABLE products ADD COLUMN updated_at DATETIME",
                    "ALTER TABLE products ADD COLUMN archived_at DATETIME",
                ]
            for statement in statements:
                connection.execute(text(statement))
            connection.execute(text("UPDATE products SET created_at = COALESCE(created_at, :now), updated_at = COALESCE(updated_at, :now), status = COALESCE(status, 'active'), is_archived = COALESCE(is_archived, false)"), {"now": now})

        supplier_columns = {column["name"] for column in inspector.get_columns("suppliers")}
        if "status" not in supplier_columns:
            if dialect == "postgresql":
                statements = [
                    "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active'",
                    "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP",
                    "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP",
                ]
            else:
                statements = [
                    "ALTER TABLE suppliers ADD COLUMN status VARCHAR DEFAULT 'active'",
                    "ALTER TABLE suppliers ADD COLUMN created_at DATETIME",
                    "ALTER TABLE suppliers ADD COLUMN updated_at DATETIME",
                ]
            for statement in statements:
                connection.execute(text(statement))
            connection.execute(text("UPDATE suppliers SET created_at = COALESCE(created_at, :now), updated_at = COALESCE(updated_at, :now), status = COALESCE(status, 'active')"), {"now": now})

        order_columns = {column["name"] for column in inspector.get_columns("orders")}
        if "notes" not in order_columns:
            if dialect == "postgresql":
                connection.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT"))
            else:
                connection.execute(text("ALTER TABLE orders ADD COLUMN notes TEXT"))


def stock_status(product: models.Product) -> str:
    if product.is_archived or product.status == "archived":
        return "Archived"
    if product.quantity <= 0:
        return "Out of Stock"
    if product.quantity <= product.threshold:
        return "Low"
    return "OK"


def sync_product_metrics(db: Session) -> None:
    products = db.query(models.Product).all()
    low_stock_count = 0
    for product in products:
        if product.is_archived or product.status == "archived":
            continue
        STOCK_LEVEL.labels(product_name=product.name).set(product.quantity)
        if product.quantity <= product.threshold:
            low_stock_count += 1
    LOW_STOCK_PRODUCTS.set(low_stock_count)


def movement_entry(db: Session, product: models.Product, movement_type: str, quantity_delta: int, note: Optional[str] = None) -> None:
    db.add(
        models.InventoryMovement(
            product_id=product.id,
            movement_type=movement_type,
            quantity_delta=quantity_delta,
            quantity_after=product.quantity,
            note=note,
        )
    )


def serialize_product(product: models.Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "description": product.description,
        "price": product.price,
        "quantity": product.quantity,
        "threshold": product.threshold,
        "supplier_id": product.supplier_id,
        "status": product.status,
        "is_archived": product.is_archived,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "archived_at": product.archived_at,
        "supplier": {
            "id": product.supplier.id,
            "name": product.supplier.name,
            "status": product.supplier.status,
        } if product.supplier else None,
        "stock_status": stock_status(product),
    }


@app.on_event("startup")
def startup_tasks():
    db = database.SessionLocal()
    try:
        ensure_product_columns(db)
        sync_product_metrics(db)
    finally:
        db.close()


@app.middleware("http")
async def add_prometheus_metrics(request, call_next):
    start_time = time.time()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    finally:
        duration = time.time() - start_time
        REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path, status=status_code).inc()
        API_LATENCY.labels(endpoint=request.url.path).set(duration)


@app.get("/metrics")
async def metrics():
    db = database.SessionLocal()
    try:
        sync_product_metrics(db)
    except Exception:
        pass
    finally:
        db.close()
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/dashboard/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    total_products = db.query(func.count(models.Product.id)).scalar() or 0
    active_products = db.query(func.count(models.Product.id)).filter(models.Product.is_archived.is_(False)).scalar() or 0
    archived_products = db.query(func.count(models.Product.id)).filter(models.Product.is_archived.is_(True)).scalar() or 0
    active_suppliers = db.query(func.count(models.Supplier.id)).filter(models.Supplier.status == "active").scalar() or 0
    low_stock_items = db.query(func.count(models.Product.id)).filter(models.Product.is_archived.is_(False), models.Product.quantity <= models.Product.threshold).scalar() or 0
    total_units = db.query(func.coalesce(func.sum(models.Product.quantity), 0)).filter(models.Product.is_archived.is_(False)).scalar() or 0
    total_orders = db.query(func.count(models.Order.id)).scalar() or 0
    recent_movements = db.query(func.count(models.InventoryMovement.id)).filter(models.InventoryMovement.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)).scalar() or 0
    return schemas.DashboardSummary(
        total_products=total_products,
        active_products=active_products,
        archived_products=archived_products,
        active_suppliers=active_suppliers,
        low_stock_items=low_stock_items,
        total_units=total_units,
        total_orders=total_orders,
        recent_movements=recent_movements,
    )


@app.get("/dashboard/low-stock", response_model=List[schemas.ProductListItem])
def dashboard_low_stock(limit: int = Query(5, ge=1, le=50), db: Session = Depends(get_db)):
    products = (
        db.query(models.Product)
        .options(joinedload(models.Product.supplier))
        .filter(models.Product.is_archived.is_(False), models.Product.quantity <= models.Product.threshold)
        .order_by(models.Product.quantity.asc(), models.Product.name.asc())
        .limit(limit)
        .all()
    )
    return [schemas.ProductListItem(**serialize_product(product)) for product in products]


@app.post("/suppliers", response_model=schemas.Supplier, status_code=status.HTTP_201_CREATED)
def create_supplier(supplier: schemas.SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = models.Supplier(**supplier.model_dump())
    try:
        db.add(db_supplier)
        db.commit()
        db.refresh(db_supplier)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Supplier may already exist")
    return db_supplier


@app.get("/suppliers", response_model=List[schemas.Supplier])
def read_suppliers(search: Optional[str] = Query(default=None), status_filter: Optional[str] = Query(default=None, alias="status"), db: Session = Depends(get_db)):
    query = db.query(models.Supplier)
    if search:
        query = query.filter(models.Supplier.name.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(models.Supplier.status == status_filter)
    return query.order_by(models.Supplier.name.asc()).all()


@app.put("/suppliers/{supplier_id}", response_model=schemas.Supplier)
def update_supplier(supplier_id: int, supplier: schemas.SupplierUpdate, db: Session = Depends(get_db)):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for key, value in supplier.model_dump().items():
        setattr(db_supplier, key, value)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@app.post("/products", response_model=schemas.ProductListItem, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == product.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    payload = product.model_dump()
    if not payload.get("sku"):
        payload["sku"] = f"SKU-{int(time.time() * 1000)}"

    db_product = models.Product(**payload)
    try:
        db.add(db_product)
        db.flush()
        movement_entry(db, db_product, "initial_stock", db_product.quantity, "Initial stock load")
        db.commit()
        db.refresh(db_product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Product SKU may already exist")

    sync_product_metrics(db)
    db.refresh(db_product)
    return schemas.ProductListItem(**serialize_product(db_product))


@app.get("/products", response_model=List[schemas.ProductListItem])
def read_products(
    search: Optional[str] = Query(default=None),
    supplier_id: Optional[int] = Query(default=None),
    status_filter: str = Query(default="active", alias="status"),
    low_stock_only: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    query = db.query(models.Product).options(joinedload(models.Product.supplier))
    if status_filter == "active":
        query = query.filter(models.Product.is_archived.is_(False))
    elif status_filter == "archived":
        query = query.filter(models.Product.is_archived.is_(True))
    if supplier_id:
        query = query.filter(models.Product.supplier_id == supplier_id)
    if search:
        like_term = f"%{search}%"
        query = query.filter(or_(models.Product.name.ilike(like_term), models.Product.sku.ilike(like_term)))
    if low_stock_only:
        query = query.filter(models.Product.quantity <= models.Product.threshold, models.Product.is_archived.is_(False))

    products = query.order_by(models.Product.updated_at.desc(), models.Product.name.asc()).all()
    return [schemas.ProductListItem(**serialize_product(product)) for product in products]


@app.get("/products/{product_id}", response_model=schemas.ProductListItem)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = (
        db.query(models.Product)
        .options(joinedload(models.Product.supplier))
        .filter(models.Product.id == product_id)
        .first()
    )
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return schemas.ProductListItem(**serialize_product(db_product))


@app.put("/products/{product_id}", response_model=schemas.ProductListItem)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_product = (
        db.query(models.Product)
        .options(joinedload(models.Product.supplier))
        .with_for_update()
        .filter(models.Product.id == product_id)
        .first()
    )
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    supplier = db.query(models.Supplier).filter(models.Supplier.id == product.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    previous_quantity = db_product.quantity
    for key, value in product.model_dump().items():
        setattr(db_product, key, value)
    db_product.is_archived = db_product.status == "archived"
    db_product.archived_at = datetime.utcnow() if db_product.is_archived else None

    try:
        if db_product.quantity != previous_quantity:
            movement_entry(db, db_product, "adjustment", db_product.quantity - previous_quantity, "Product update adjusted stock")
        db.commit()
        db.refresh(db_product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid product data")

    sync_product_metrics(db)
    return schemas.ProductListItem(**serialize_product(db_product))


@app.post("/products/{product_id}/archive", response_model=schemas.ProductListItem)
def archive_product(product_id: int, db: Session = Depends(get_db)):
    db_product = (
        db.query(models.Product)
        .options(joinedload(models.Product.supplier))
        .with_for_update()
        .filter(models.Product.id == product_id)
        .first()
    )
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    db_product.status = "archived"
    db_product.is_archived = True
    db_product.archived_at = datetime.utcnow()
    db.commit()
    db.refresh(db_product)
    sync_product_metrics(db)
    return schemas.ProductListItem(**serialize_product(db_product))


@app.post("/inventory/restock", response_model=schemas.ProductListItem)
def restock_product(payload: schemas.InventoryMovementCreate, db: Session = Depends(get_db)):
    db_product = (
        db.query(models.Product)
        .options(joinedload(models.Product.supplier))
        .with_for_update()
        .filter(models.Product.id == payload.product_id)
        .first()
    )
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    if db_product.is_archived:
        raise HTTPException(status_code=400, detail="Archived products cannot be restocked")

    db_product.quantity += payload.quantity
    movement_entry(db, db_product, "restock", payload.quantity, payload.note or "Stock replenished")
    db.commit()
    db.refresh(db_product)
    sync_product_metrics(db)
    return schemas.ProductListItem(**serialize_product(db_product))


@app.post("/inventory/adjust", response_model=schemas.ProductListItem)
def adjust_inventory(payload: schemas.InventoryAdjustmentCreate, db: Session = Depends(get_db)):
    if payload.quantity_delta == 0:
        raise HTTPException(status_code=400, detail="Quantity delta cannot be zero")

    db_product = (
        db.query(models.Product)
        .options(joinedload(models.Product.supplier))
        .with_for_update()
        .filter(models.Product.id == payload.product_id)
        .first()
    )
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    resulting_quantity = db_product.quantity + payload.quantity_delta
    if resulting_quantity < 0:
        raise HTTPException(status_code=400, detail="Adjustment would make stock negative")

    db_product.quantity = resulting_quantity
    movement_entry(db, db_product, "adjustment", payload.quantity_delta, payload.note or "Manual adjustment")
    db.commit()
    db.refresh(db_product)
    sync_product_metrics(db)
    return schemas.ProductListItem(**serialize_product(db_product))


@app.get("/products/{product_id}/movements", response_model=List[schemas.InventoryMovement])
def read_product_movements(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return (
        db.query(models.InventoryMovement)
        .filter(models.InventoryMovement.product_id == product_id)
        .order_by(models.InventoryMovement.created_at.desc())
        .all()
    )


@app.get("/movements", response_model=List[schemas.InventoryMovement])
def read_movements(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    return (
        db.query(models.InventoryMovement)
        .order_by(models.InventoryMovement.created_at.desc())
        .limit(limit)
        .all()
    )


@app.post("/orders", response_model=schemas.Order, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    db_product = (
        db.query(models.Product)
        .with_for_update()
        .filter(models.Product.id == order.product_id)
        .first()
    )
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    if db_product.is_archived:
        raise HTTPException(status_code=400, detail="Archived products cannot be sold")
    if db_product.quantity < order.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    db_order = models.Order(**order.model_dump())
    db.add(db_order)
    db_product.quantity -= order.quantity
    movement_entry(db, db_product, "sale", -order.quantity, order.notes or "Product sold")
    db.commit()
    db.refresh(db_order)
    sync_product_metrics(db)
    return db_order


@app.get("/orders", response_model=List[schemas.Order])
def read_orders(product_id: Optional[int] = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(models.Order)
    if product_id:
        query = query.filter(models.Order.product_id == product_id)
    return query.order_by(models.Order.order_date.desc()).all()


@app.get("/orders/{order_id}", response_model=schemas.Order)
def read_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
