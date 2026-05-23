import { useEffect, useState } from "react";

const API = "https://question-tracker-a38i.onrender.com";

export default function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`${API}/users`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setUsers(data);
      })
      .catch((err) => console.error(err));
  }, []);

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

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
            gap: "20px",
            marginTop: "30px",
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

              <p>🔥 Streak: {user.streak}</p>
              <p>💻 LeetCode: {user.leetcode || "Not added"}</p>
              <p>⚔️ Codeforces: {user.codeforces || "Not added"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}