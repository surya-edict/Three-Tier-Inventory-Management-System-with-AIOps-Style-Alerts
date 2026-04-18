# Manual Test Checklist

## Dashboard

- Open `http://localhost:3000`
- Verify sidebar navigation opens:
  - Dashboard
  - Products
  - Suppliers
  - Orders
  - Movements
- Confirm KPI cards render without crashes
- Confirm low-stock table loads

## Suppliers

- Add a supplier from `Suppliers`
- Edit the supplier status/details
- Confirm supplier list refreshes correctly

## Products

- Add a product with:
  - name
  - SKU
  - price
  - quantity
  - threshold
  - supplier
- Edit the same product
- Search by name and SKU
- Filter by supplier
- Filter by low stock
- Archive the product and confirm it disappears from active view

## Stock Workflows

- Sell a valid quantity and confirm:
  - order is created
  - product quantity decreases
  - movement record is created
- Attempt oversell and confirm error toast/message appears
- Restock product and confirm:
  - quantity increases
  - movement record appears
  - dashboard low-stock count updates if applicable
- Run manual adjustment flow if exposed

## History Screens

- Confirm `Orders` page shows created sales
- Confirm `Movements` page shows:
  - initial stock
  - sale
  - restock
  - adjustment entries

## API / Ops

- Open `http://localhost:8000/health`
- Confirm `{"status":"healthy"}`
- Open `http://localhost:8000/dashboard/summary`
- Confirm summary payload returns aggregate counts
- Open `http://localhost:8000/metrics`
- Confirm `inventory_low_stock_products` metric exists
