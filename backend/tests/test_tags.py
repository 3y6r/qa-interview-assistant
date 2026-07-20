def test_list_tags_filters_not_archived(client):
    active = client.post("/api/tags", json={"name": "SQL", "color": "#FF5733"})
    assert active.status_code == 201
    archived = client.post("/api/tags", json={"name": "API", "color": "#33AAFF"})
    assert archived.status_code == 201
    archive = client.patch(f"/api/tags/{archived.json()['id']}/archive")
    assert archive.status_code == 200

    response = client.get("/api/tags", params={"is_archived": False})

    assert response.status_code == 200
    body = response.json()
    assert [tag["name"] for tag in body] == ["SQL"]
    assert all(tag["is_archived"] is False for tag in body)
