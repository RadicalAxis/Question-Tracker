import { useEffect, useState } from "react";

const API = "https://question-tracker-a38i.onrender.com";

export default function App() {
  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    leetcode: "",
    codeforces: "",
  });

  const fetchUsers = async () => {
    const res = await fetch(`${API}/users`);
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async () => {
    await fetch(`${API}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    setForm({
      name: "",
      leetcode: "",
      codeforces: "",
    });

    fetchUsers();
  };

  return (
    <div
      style={{
        background: "#0f172a",
        minHeight: "100vh",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>Question Tracker</h1>

      <div
        style={{
          marginTop: "30px",
          marginBottom: "40px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="LeetCode"
          value={form.leetcode}
          onChange={(e) =>
            setForm({ ...form, leetcode: e.target.value })
          }
        />

        <input
          placeholder="Codeforces"
          value={form.codeforces}
          onChange={(e) =>
            setForm({ ...form, codeforces: e.target.value })
          }
        />

        <button onClick={addUser}>Add User</button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px",
        }}
      >
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              background: "#1e293b",
              padding: "20px",
              borderRadius: "16px",
            }}
          >
            <h2>{user.name}</h2>

            <p>⚔️ CF: {user.codeforces || "N/A"}</p>
            <p>💻 LC: {user.leetcode || "N/A"}</p>

            <p>🏆 CF Rating: {user.cf_rating || "N/A"}</p>

            <p>🔥 Streak: {user.streak}</p>
          </div>
        ))}
      </div>
    </div>
  );
}