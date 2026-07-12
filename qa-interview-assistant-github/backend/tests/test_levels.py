def test_levels_seeded(client):
    response = client.get("/api/levels")

    assert response.status_code == 200
    data = response.json()
    assert [item["name"] for item in data] == ["Trainee", "Junior", "Middle", "Senior", "Lead"]
