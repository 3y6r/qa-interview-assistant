def test_create_category(client):
    response = client.post("/api/categories", json={"name": "Backend"})

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Backend"
    assert body["is_archived"] is False


def test_create_duplicate_category_returns_conflict(client):
    first = client.post("/api/categories", json={"name": "Backend"})
    assert first.status_code == 201

    second = client.post("/api/categories", json={"name": "Backend"})

    assert second.status_code == 409
    assert second.json()["detail"] == "Category with this name already exists"
