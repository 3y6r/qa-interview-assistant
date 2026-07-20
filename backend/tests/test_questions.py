def _create_question(client, *, text: str, category_id: int, level_id: int):
    response = client.post(
        "/api/questions",
        json={
            "text": text,
            "expected_answer": f"Answer for {text}",
            "category_id": category_id,
            "level_id": level_id,
            "tag_ids": [],
        },
    )
    assert response.status_code == 201
    return response.json()


def test_question_sorting_is_applied_before_pagination(client):
    category = client.post("/api/categories", json={"name": "Sorting"})
    assert category.status_code == 201
    category_id = category.json()["id"]

    levels = client.get("/api/levels")
    assert levels.status_code == 200
    level_id = levels.json()[0]["id"]

    created = [
        _create_question(
            client,
            text=f"Question {index:02d}",
            category_id=category_id,
            level_id=level_id,
        )
        for index in range(21)
    ]
    created_ids = [item["id"] for item in created]

    newest_page = client.get(
        "/api/questions",
        params={"sort_order": "newest", "limit": 20, "offset": 0},
    )
    assert newest_page.status_code == 200
    assert [item["id"] for item in newest_page.json()] == list(
        reversed(created_ids)
    )[:20]

    newest_second_page = client.get(
        "/api/questions",
        params={"sort_order": "newest", "limit": 20, "offset": 20},
    )
    assert newest_second_page.status_code == 200
    assert [item["id"] for item in newest_second_page.json()] == [created_ids[0]]

    oldest_page = client.get(
        "/api/questions",
        params={"sort_order": "oldest", "limit": 20, "offset": 0},
    )
    assert oldest_page.status_code == 200
    assert [item["id"] for item in oldest_page.json()] == created_ids[:20]


def test_question_sort_order_rejects_unknown_value(client):
    response = client.get("/api/questions", params={"sort_order": "random"})

    assert response.status_code == 422
