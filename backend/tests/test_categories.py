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


def test_list_categories_filters_not_archived(client):
    active = client.post("/api/categories", json={"name": "Backend"})
    assert active.status_code == 201
    archived = client.post("/api/categories", json={"name": "Frontend"})
    assert archived.status_code == 201
    archive = client.patch(f"/api/categories/{archived.json()['id']}/archive")
    assert archive.status_code == 200

    response = client.get("/api/categories", params={"is_archived": False})

    assert response.status_code == 200
    body = response.json()
    assert [category["name"] for category in body] == ["Backend"]
    assert all(category["is_archived"] is False for category in body)
