class Memory:
    def __init__(self):
        self.history = []

    def add(self, user, ai):
        self.history.append((user, ai))

    def get(self):
        return "\n".join(
            [f"User: {u}\nAI: {a}" for u, a in self.history[-5:]]
        )

memory = Memory()