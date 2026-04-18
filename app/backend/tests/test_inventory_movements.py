def seed_product(client, supplier_payload, quantity=5):
    supplier = client.post("/suppliers", json=supplier_payload).json()
    product = client.post(
        "/products",
        json={
            "name": "Rack Unit",
            "sku": "RU-100",
            "description": "Storage rack",
            "price": 80,
            "quantity": quantity,
            "threshold": 2,
            "supplier_id": supplier["id"],
        },
    ).json()
    return product


def test_restock_adjust_and_movement_history(client, supplier_payload):
    product = seed_product(client, supplier_payload)

    restock = client.post("/inventory/restock", json={"product_id": product["id"], "quantity": 7, "note": "Truck delivery"})
    assert restock.status_code == 200
    assert restock.json()["quantity"] == 12

    adjust = client.post("/inventory/adjust", json={"product_id": product["id"], "quantity_delta": -2, "note": "Cycle count correction"})
    assert adjust.status_code == 200
    assert adjust.json()["quantity"] == 10

    movements = client.get(f"/products/{product['id']}/movements")
    assert movements.status_code == 200
    payload = movements.json()
    assert len(payload) == 3
    assert payload[0]["movement_type"] in {"adjustment", "restock", "initial_stock"}
