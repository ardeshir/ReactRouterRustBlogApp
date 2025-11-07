import { useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/posts";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Pagination from "../components/Pagination";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  status: string;
  created_at: string;
}

interface PostsResponse {
  data: Post[];
  page: number;
  per_page: number;
  total: number;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  
  try {
    const response = await fetch(`${API_URL}/posts?page=${page}&per_page=6`);
    if (!response.ok) throw new Error("Failed to fetch posts");
    return await response.json();
  } catch (error) {
    console.error("Error loading posts:", error);
    return { data: [], page: 1, per_page: 6, total: 0 };
  }
}

export function meta() {
  return [
    { title: "Blog Posts" },
    { name: "description", content: "Browse all blog posts" },
  ];
}

export default function Posts({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>(loaderData.data || []);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const totalPages = Math.ceil(loaderData.total / loaderData.per_page);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(id);
    try {
      const response = await fetch(`${API_URL}/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== id));
      } else {
        alert("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePageChange = (page: number) => {
    navigate(`/posts?page=${page}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Blog Posts
      </Typography>

      {posts.length === 0 ? (
        <Alert severity="info" sx={{ mt: 3 }}>
          No posts yet. Create your first post to get started!
        </Alert>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {posts.map((post) => (
              <Grid item xs={12} sm={6} md={4} key={post.id}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {post.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      By {post.author} • {formatDate(post.created_at)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {post.content}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={post.status}
                        color={post.status === "published" ? "success" : "default"}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      component={Link}
                      to={`/posts/${post.id}`}
                    >
                      Read More
                    </Button>
                    <Button
                      size="small"
                      component={Link}
                      to={`/posts/${post.id}/edit`}
                      startIcon={<EditIcon />}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={
                        isDeleting === post.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <DeleteIcon />
                        )
                      }
                      onClick={() => handleDelete(post.id)}
                      disabled={isDeleting === post.id}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Pagination
              currentPage={loaderData.page}
              totalPages={totalPages}
              totalItems={loaderData.total}
              perPage={loaderData.per_page}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </Box>
  );
}
