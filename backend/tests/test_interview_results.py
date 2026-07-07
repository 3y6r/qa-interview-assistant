def make_interview_result_payload():
    return {
        "candidate_full_name": "Ivan Ivanov",
        "position": "Backend Developer",
        "interview_date": "2026-01-01",
        "average_score": 7.5,
        "comment": "Good candidate",
    }


def test_delete_interview_result(client):
    created = client.post(
        "/api/interview-results", json=make_interview_result_payload()
    )
    assert created.status_code == 201
    result_id = created.json()["id"]

    response = client.delete(f"/api/interview-results/{result_id}")

    assert response.status_code == 204
    assert response.content == b""

    missing = client.get(f"/api/interview-results/{result_id}")
    assert missing.status_code == 404
    assert missing.json()["detail"] == "Interview result not found"


def test_delete_missing_interview_result_returns_not_found(client):
    response = client.delete("/api/interview-results/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Interview result not found"
