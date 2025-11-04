import { Link } from "react-router";
import type { Route } from "./+types/posts.$id";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function loader({ params }: Route.LoaderArgs) {
  const response = await fetch(`${API_URL}/posts/${params.id}`);
  if (!response.ok) {
    throw new Response("Not Found", { status: 404 });
  }
  return await response.json();
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data?.title || "Post" },
    { name: "description", content: data?.content?.substring(0, 160) },
  ];
}

export default function PostDetail({ loaderData }: Route.ComponentProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Button
        component={Link}
        to="/posts"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Back to Posts
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Chip
            label={loaderData.status}
            color={loaderData.status === "published" ? "success" : "default"}
          />
          <Button
            component={Link}
            to={`/posts/${loaderData.id}/edit`}
            variant="outlined"
            startIcon={<EditIcon />}
          >
            Edit Post
          </Button>
        </Box>

        <Typography variant="h3" component="h1" gutterBottom>
          {loaderData.title}
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          By {loaderData.author} • {formatDate(loaderData.created_at)}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="body1"
          sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}
        >
          {loaderData.content}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="caption" color="text.secondary">
          Last updated: {formatDate(loaderData.updated_at)}
        </Typography>
      </Paper>
    </Box>
  );
}
