def create_supplier(client, payload):
    response = client.post("/suppliers", json=payload)
    assert response.status_code == 201
    return response.json()


def test_create_and_archive_product(client, supplier_payload):
    supplier = create_supplier(client, supplier_payload)
    response = client.post(
        "/products",
        json={
            "name": "Business Laptop",
            "sku": "LTP-100",
            "description": "Work device",
            "price": 1200,
            "quantity": 12,
            "threshold": 5,
            "supplier_id": supplier["id"],
        },
    )
    assert response.status_code == 201
    product = response.json()
    assert product["stock_status"] == "OK"
    assert product["supplier"]["name"] == supplier["name"]

    archive_response = client.post(f"/products/{product['id']}/archive")
    assert archive_response.status_code == 200
    archived = archive_response.json()
    assert archived["status"] == "archived"
    assert archived["is_archived"] is True

    list_response = client.get("/products")
    assert list_response.status_code == 200
    assert list_response.json() == []
