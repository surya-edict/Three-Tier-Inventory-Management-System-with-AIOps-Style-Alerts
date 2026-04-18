def seed_product(client, supplier_payload, quantity=10):
    supplier = client.post("/suppliers", json=supplier_payload).json()
    product = client.post(
        "/products",
        json={
            "name": "Warehouse Monitor",
            "sku": "WM-1",
            "description": "Display panel",
            "price": 250,
            "quantity": quantity,
            "threshold": 3,
            "supplier_id": supplier["id"],
        },
    ).json()
    return product


def test_sell_product_and_prevent_oversell(client, supplier_payload):
    product = seed_product(client, supplier_payload, quantity=4)

    success = client.post("/orders", json={"product_id": product["id"], "quantity": 2, "notes": "Counter sale"})
    assert success.status_code == 201
    body = success.json()
    assert body["status"] == "completed"

    product_after_sale = client.get(f"/products/{product['id']}").json()
    assert product_after_sale["quantity"] == 2

    failure = client.post("/orders", json={"product_id": product["id"], "quantity": 3, "notes": "Oversell attempt"})
    assert failure.status_code == 400
    assert "Insufficient stock" in failure.json()["detail"]
