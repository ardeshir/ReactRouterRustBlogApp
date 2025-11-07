import { useLoaderData } from "react-router";
import type { Route } from "./+types/posts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function loader() {
  try {
    const response = await fetch(`${API_URL}/api/posts`);
    const data = await response.json();
    return { posts: data };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { posts: [] };
  }
}

export default function Posts() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>Blog Posts</h1>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul>
          {posts.map((post: any) => (
            <li key={post.id}>
              <h2>{post.title}</h2>
              <p>{post.content}</p>
              <small>By {post.author}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
