import { Link } from "react-router";

export default function Home() {
  return (
    <div style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>Blog Home</h1>
      <p>Welcome to the blog!</p>
      <Link to="/posts" style={{ color: "blue" }}>View Posts</Link>
    </div>
  );
}
