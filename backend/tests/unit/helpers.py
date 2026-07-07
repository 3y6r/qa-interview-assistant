class DummyRepo:
    def __init__(self, *, get_result=None, list_result=None):
        self.get_result = get_result
        self.list_result = list_result or []
        self.created = []
        self.updated = []
        self.deleted = []
        self.create_calls = []
        self.update_calls = []
        self.delete_calls = []
        self.list_calls = []
        self.get_calls = []
        self.get_all_calls = 0
        self.get_by_id_calls = []
        self.get_by_ids_calls = []

    def list(self, **kwargs):
        self.list_calls.append(kwargs)
        return self.list_result

    def get(self, item_id):
        self.get_calls.append(item_id)
        return self.get_result

    def get_all(self):
        self.get_all_calls += 1
        return self.list_result

    def get_by_id(self, item_id):
        self.get_by_id_calls.append(item_id)
        return self.get_result

    def get_by_ids(self, item_ids):
        self.get_by_ids_calls.append(item_ids)
        return self.list_result

    def get_by_name(self, name):
        self.get_calls.append(name)
        return self.get_result

    def create(self, obj, **kwargs):
        self.created.append(obj)
        self.create_calls.append((obj, kwargs))
        return obj

    def update(self, obj, **kwargs):
        self.updated.append(obj)
        self.update_calls.append((obj, kwargs))
        return obj

    def delete(self, obj):
        self.deleted.append(obj)
        self.delete_calls.append(obj)


class DummySession:
    pass
