def test_create_and_update_supplier(client, supplier_payload):
    create_response = client.post("/suppliers", json=supplier_payload)
    assert create_response.status_code == 201
    supplier = create_response.json()
    assert supplier["status"] == "active"

    update_response = client.put(
        f"/suppliers/{supplier['id']}",
        json={
            "name": "Acme Supplier Updated",
            "contact_email": "updated@acme.com",
            "phone": "5557779999",
            "status": "inactive",
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["name"] == "Acme Supplier Updated"
    assert updated["status"] == "inactive"

    list_response = client.get("/suppliers")
    assert list_response.status_code == 200
    assert list_response.json()[0]["name"] == "Acme Supplier Updated"
