# Complete React Router v7 + Rust Axum CRUD Blog Application

A production-ready full-stack blog application with React Router v7 (Remix upstream), Material UI, Rust Axum backend, SQLite database, and Docker development environment.

## Project Structure

```
blog-app/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
│
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   ├── .dockerignore
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── react-router.config.ts
│   └── app/
│       ├── root.tsx
│       ├── routes.ts
│       ├── entry.client.tsx
│       ├── entry.server.tsx
│       ├── theme.ts
│       ├── utils/
│       │   └── createEmotionCache.ts
│       ├── components/
│       │   ├── Layout.tsx
│       │   └── Pagination.tsx
│       └── routes/
│           ├── home.tsx
│           ├── posts.tsx
│           ├── posts.new.tsx
│           ├── posts.$id.tsx
│           └── posts.$id.edit.tsx
│
└── backend/
    ├── Dockerfile
    ├── .dockerignore
    ├── Cargo.toml
    ├── migrations/
    │   └── 001_create_posts.sql
    └── src/
        ├── main.rs
        ├── models.rs
        ├── handlers.rs
        ├── error.rs
        └── schema.rs
```

## Quick Start

### Prerequisites

- **Docker** and **Docker Compose** installed on Linux
- **Git** for version control
- **8GB RAM minimum** recommended

### Setup Steps

```bash
# 1. Clone or create project directory
mkdir blog-app && cd blog-app

# 2. Create all files as shown below

# 3. Copy environment template
cp .env.example .env

# 4. Start the entire stack (first time takes 5-10 minutes)
docker-compose up --build

# 5. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

The application will start with hot reload enabled. Edit any file and see changes instantly:
- **Frontend**: Sub-second hot reload via Vite HMR
- **Backend**: 2-4 second compilation via cargo-watch

---

## Configuration Files

### Root Level Files

#### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: blog-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:8000
      - CHOKIDAR_USEPOLLING=true
    networks:
      - blog-network
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: dev
    container_name: blog-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - cargo-cache:/usr/local/cargo/registry
      - target-cache:/app/target
    environment:
      - DATABASE_URL=sqlite:///app/database.db
      - RUST_LOG=info
      - RUST_BACKTRACE=1
      - JWT_SECRET=your-super-secret-jwt-key-change-in-production
    networks:
      - blog-network

networks:
  blog-network:
    driver: bridge

volumes:
  cargo-cache:
  target-cache:
```

#### .env.example

```bash
# Backend Configuration
DATABASE_URL=sqlite:///app/database.db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
RUST_LOG=info

# Frontend Configuration
VITE_API_URL=http://localhost:8000
```

#### .gitignore

```
# Frontend
frontend/node_modules/
frontend/dist/
frontend/.react-router/
frontend/build/

# Backend
backend/target/
backend/database.db
backend/database.db-shm
backend/database.db-wal

# Environment
.env
.env.local

# Docker
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo
```

---

## Frontend Code

### frontend/package.json

```json
{
  "name": "blog-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "react-router dev",
    "build": "react-router build",
    "start": "react-router-serve build/server/index.js",
    "typecheck": "tsc"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^7.1.0",
    "@react-router/node": "^7.1.0",
    "@react-router/serve": "^7.1.0",
    "@mui/material": "^6.1.0",
    "@mui/icons-material": "^6.1.0",
    "@emotion/react": "^11.13.0",
    "@emotion/styled": "^11.13.0",
    "@emotion/server": "^11.11.0",
    "@emotion/cache": "^11.13.0",
    "isbot": "^4.1.0"
  },
  "devDependencies": {
    "@react-router/dev": "^7.1.0",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.8"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### frontend/tsconfig.json

```json
{
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".react-router/types/**/*"
  ],
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "isolatedModules": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "target": "ES2022",
    "strict": true,
    "allowJs": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["./app/*"]
    },
    "types": ["@react-router/node", "vite/client"],
    "rootDirs": [".", "./.react-router/types"]
  }
}
```

### frontend/vite.config.ts

```typescript
import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";

export default defineConfig({
  plugins: [reactRouter()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 3000,
    },
  },
  ssr: {
    noExternal: ["@mui/material", "@mui/icons-material"],
  },
});
```

### frontend/react-router.config.ts

```typescript
import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "app",
  ssr: true,
} satisfies Config;
```

### frontend/Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### frontend/.dockerignore

```
node_modules
dist
build
.react-router
.env.local
.git
```

### frontend/app/root.tsx

```tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { CacheProvider } from "@emotion/react";
import createEmotionCache from "./utils/createEmotionCache";
import theme from "./theme";

const cache = createEmotionCache();

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        />
      </head>
      <body>
        <CacheProvider value={cache}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </CacheProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export function ErrorBoundary() {
  return (
    <html>
      <body>
        <h1>Something went wrong!</h1>
      </body>
    </html>
  );
}
```

### frontend/app/entry.client.tsx

```tsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
```

### frontend/app/entry.server.tsx

```tsx
import { PassThrough } from "node:stream";
import type { EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { renderToPipeableStream } from "react-dom/server";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        onShellReady() {
          responseHeaders.set("Content-Type", "text/html");
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
      }
    );

    setTimeout(abort, 10000);
  });
}
```

### frontend/app/theme.ts

```typescript
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

export default theme;
```

### frontend/app/utils/createEmotionCache.ts

```typescript
import createCache from "@emotion/cache";

export default function createEmotionCache() {
  return createCache({ key: "css" });
}
```

### frontend/app/routes.ts

```typescript
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("components/Layout.tsx", [
    index("routes/home.tsx"),
    route("posts", "routes/posts.tsx"),
    route("posts/new", "routes/posts.new.tsx"),
    route("posts/:id", "routes/posts.$id.tsx"),
    route("posts/:id/edit", "routes/posts.$id.edit.tsx"),
  ]),
] satisfies RouteConfig;
```

### frontend/app/components/Layout.tsx

```tsx
import { Outlet, Link } from "react-router";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";

export default function Layout() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Blog Application
          </Typography>
          <Button color="inherit" component={Link} to="/" startIcon={<HomeIcon />}>
            Home
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/posts/new"
            startIcon={<AddIcon />}
          >
            New Post
          </Button>
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flex: 1, py: 4 }}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{ bgcolor: "grey.200", py: 2, mt: "auto" }}
      >
        <Container>
          <Typography variant="body2" color="text.secondary" align="center">
            © 2025 Blog Application. Built with React Router v7, Material UI, and Rust Axum.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
```

### frontend/app/components/Pagination.tsx

```tsx
import { Box, Pagination as MuiPagination, Typography } from "@mui/material";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mt: 3,
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing {startItem} to {endItem} of {totalItems} posts
      </Typography>

      <MuiPagination
        count={totalPages}
        page={currentPage}
        onChange={(_, page) => onPageChange(page)}
        color="primary"
        showFirstButton
        showLastButton
      />
    </Box>
  );
}
```

### frontend/app/routes/home.tsx

```tsx
import { redirect } from "react-router";
import type { Route } from "./+types/home";

export function loader() {
  return redirect("/posts");
}

export default function Home() {
  return null;
}
```

### frontend/app/routes/posts.tsx

```tsx
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
```

### frontend/app/routes/posts.new.tsx

```tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/posts.new";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function meta() {
  return [{ title: "Create New Post" }];
}

export default function NewPost() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: "",
    status: "draft",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title || formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }
    if (!formData.content) {
      newErrors.content = "Content is required";
    }
    if (!formData.author) {
      newErrors.author = "Author is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        navigate("/posts");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create post");
      }
    } catch (err) {
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Post
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                error={!!errors.author}
                helperText={errors.author}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={10}
                label="Content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                error={!!errors.content}
                helperText={errors.content}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate("/posts")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Create Post"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
```

### frontend/app/routes/posts.$id.tsx

```tsx
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
```

### frontend/app/routes/posts.$id.edit.tsx

```tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/posts.$id.edit";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function loader({ params }: Route.LoaderArgs) {
  const response = await fetch(`${API_URL}/posts/${params.id}`);
  if (!response.ok) {
    throw new Response("Not Found", { status: 404 });
  }
  return await response.json();
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `Edit: ${data?.title || "Post"}` }];
}

export default function EditPost({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: loaderData.title,
    content: loaderData.content,
    author: loaderData.author,
    status: loaderData.status,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title || formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }
    if (!formData.content) {
      newErrors.content = "Content is required";
    }
    if (!formData.author) {
      newErrors.author = "Author is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/posts/${loaderData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        navigate(`/posts/${loaderData.id}`);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update post");
      }
    } catch (err) {
      setError("Failed to update post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Post
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                error={!!errors.author}
                helperText={errors.author}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={10}
                label="Content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                error={!!errors.content}
                helperText={errors.content}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate(`/posts/${loaderData.id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
```

---

## Backend Code

### backend/Cargo.toml

```toml
[package]
name = "blog-backend"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
sqlx = { version = "0.8", features = ["runtime-tokio", "tls-native-tls", "sqlite", "chrono"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tower-http = { version = "0.5", features = ["trace", "cors"] }
chrono = { version = "0.4", features = ["serde"] }
thiserror = "1.0"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
dotenvy = "0.15"
```

### backend/Dockerfile

```dockerfile
FROM rust:1.75-slim AS dev

WORKDIR /app

RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*

RUN cargo install cargo-watch

COPY . .

EXPOSE 8000

CMD ["cargo", "watch", "-x", "run"]
```

### backend/.dockerignore

```
target
database.db
database.db-shm
database.db-wal
.env
.git
```

### backend/migrations/001_create_posts.sql

```sql
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_posts_timestamp 
    AFTER UPDATE ON posts
    FOR EACH ROW
BEGIN
    UPDATE posts SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Insert sample data
INSERT INTO posts (title, content, author, status) VALUES
('Welcome to Our Blog', 'This is our first blog post. Welcome to our new blog platform built with React Router v7 and Rust Axum!', 'Admin', 'published'),
('Getting Started with Rust', 'Rust is a systems programming language that runs blazingly fast, prevents segfaults, and guarantees thread safety.', 'John Doe', 'published'),
('React Router v7 Features', 'React Router v7 brings SSR capabilities from Remix into the React Router ecosystem. This is a game changer!', 'Jane Smith', 'draft');
```

### backend/src/main.rs

```rust
use axum::{
    routing::{get, post, put, delete},
    Router,
};
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::sync::Arc;
use tower_http::{
    cors::{CorsLayer, Any},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod models;
mod handlers;
mod error;
mod schema;

use error::AppError;

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "info,sqlx=warn".into())
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Create database connection pool
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://database.db".to_string());

    tracing::info!("Connecting to database: {}", database_url);

    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await?;

    // Run migrations
    tracing::info!("Running migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;

    let state = Arc::new(AppState { db: pool });

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/posts", get(handlers::list_posts).post(handlers::create_post))
        .route("/posts/:id", 
            get(handlers::get_post)
            .put(handlers::update_post)
            .delete(handlers::delete_post)
        )
        .layer(TraceLayer::new_for_http())
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any)
        )
        .with_state(state);

    // Start server
    let addr = "0.0.0.0:8000";
    let listener = tokio::net::TcpListener::bind(addr).await?;

    tracing::info!("Server listening on {}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}
```

### backend/src/models.rs

```rust
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Post {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub author: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePost {
    pub title: String,
    pub content: String,
    pub author: String,
    #[serde(default = "default_status")]
    pub status: String,
}

fn default_status() -> String {
    "draft".to_string()
}

#[derive(Debug, Deserialize)]
pub struct UpdatePost {
    pub title: Option<String>,
    pub content: Option<String>,
    pub author: Option<String>,
    pub status: Option<String>,
}
```

### backend/src/schema.rs

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    #[serde(default = "default_page")]
    pub page: i64,
    #[serde(default = "default_per_page")]
    pub per_page: i64,
}

fn default_page() -> i64 { 1 }
fn default_per_page() -> i64 { 10 }

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}
```

### backend/src/error.rs

```rust
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Resource not found")]
    NotFound,

    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Internal server error")]
    InternalError,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::NotFound => (
                StatusCode::NOT_FOUND,
                "Resource not found".to_string()
            ),
            AppError::DatabaseError(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Database error: {}", e)
            ),
            AppError::ValidationError(msg) => (
                StatusCode::BAD_REQUEST,
                msg
            ),
            AppError::InternalError => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string()
            ),
        };

        let body = Json(json!({
            "error": error_message,
            "status": status.as_u16(),
        }));

        (status, body).into_response()
    }
}
```

### backend/src/handlers.rs

```rust
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use sqlx::SqlitePool;
use std::sync::Arc;

use crate::error::AppError;
use crate::models::{Post, CreatePost, UpdatePost};
use crate::schema::{PaginationParams, PaginatedResponse};

type AppState = Arc<crate::AppState>;

pub async fn list_posts(
    State(state): State<AppState>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<PaginatedResponse<Post>>, AppError> {
    let page = params.page.max(1);
    let per_page = params.per_page.clamp(1, 100);
    let offset = (page - 1) * per_page;

    let posts = sqlx::query_as::<_, Post>(
        "SELECT id, title, content, author, status, created_at, updated_at 
         FROM posts 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?"
    )
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let (total,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM posts")
        .fetch_one(&state.db)
        .await?;

    Ok(Json(PaginatedResponse {
        data: posts,
        page,
        per_page,
        total,
    }))
}

pub async fn get_post(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<Post>, AppError> {
    let post = sqlx::query_as::<_, Post>(
        "SELECT id, title, content, author, status, created_at, updated_at 
         FROM posts 
         WHERE id = ?"
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => AppError::NotFound,
        _ => AppError::DatabaseError(e),
    })?;

    Ok(Json(post))
}

pub async fn create_post(
    State(state): State<AppState>,
    Json(payload): Json<CreatePost>,
) -> Result<(StatusCode, Json<Post>), AppError> {
    if payload.title.len() < 3 {
        return Err(AppError::ValidationError(
            "Title must be at least 3 characters".to_string()
        ));
    }

    if payload.content.is_empty() {
        return Err(AppError::ValidationError(
            "Content cannot be empty".to_string()
        ));
    }

    if payload.author.is_empty() {
        return Err(AppError::ValidationError(
            "Author cannot be empty".to_string()
        ));
    }

    let post = sqlx::query_as::<_, Post>(
        r#"
        INSERT INTO posts (title, content, author, status)
        VALUES (?, ?, ?, ?)
        RETURNING id, title, content, author, status, created_at, updated_at
        "#
    )
    .bind(&payload.title)
    .bind(&payload.content)
    .bind(&payload.author)
    .bind(&payload.status)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(post)))
}

pub async fn update_post(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdatePost>,
) -> Result<Json<Post>, AppError> {
    if let Some(ref title) = payload.title {
        if title.len() < 3 {
            return Err(AppError::ValidationError(
                "Title must be at least 3 characters".to_string()
            ));
        }
    }

    let post = sqlx::query_as::<_, Post>(
        r#"
        UPDATE posts 
        SET title = COALESCE(?, title),
            content = COALESCE(?, content),
            author = COALESCE(?, author),
            status = COALESCE(?, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING id, title, content, author, status, created_at, updated_at
        "#
    )
    .bind(payload.title)
    .bind(payload.content)
    .bind(payload.author)
    .bind(payload.status)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => AppError::NotFound,
        _ => AppError::DatabaseError(e),
    })?;

    Ok(Json(post))
}

pub async fn delete_post(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<StatusCode, AppError> {
    let result = sqlx::query("DELETE FROM posts WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}
```

---

## Usage Guide

### Starting the Application

```bash
# First time setup - build all containers
docker-compose up --build

# Subsequent runs - start without rebuilding
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stopping the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

### Development Workflow

The application supports **hot reload** for both frontend and backend:

**Frontend Changes:**
1. Edit any file in `frontend/app/`
2. Save the file
3. Browser automatically refreshes (HMR)
4. Changes appear in less than 1 second

**Backend Changes:**
1. Edit any file in `backend/src/`
2. Save the file
3. cargo-watch detects change and recompiles
4. Server restarts automatically
5. Changes live in 2-4 seconds

### API Endpoints

**Base URL:** `http://localhost:8000`

- `GET /health` - Health check
- `GET /posts?page=1&per_page=10` - List posts with pagination
- `GET /posts/:id` - Get single post
- `POST /posts` - Create new post
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post

**Example API Request:**

```bash
# Create a new post
curl -X POST http://localhost:8000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Post",
    "content": "This is the content of my blog post.",
    "author": "John Doe",
    "status": "published"
  }'

# Get all posts
curl http://localhost:8000/posts

# Get post by ID
curl http://localhost:8000/posts/1

# Update post
curl -X PUT http://localhost:8000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "status": "published"
  }'

# Delete post
curl -X DELETE http://localhost:8000/posts/1
```

### Database Access

The SQLite database is located at `backend/database.db` inside the container. To access it:

```bash
# Enter backend container
docker-compose exec backend sh

# Open SQLite shell
sqlite3 database.db

# Run SQL queries
SELECT * FROM posts;
```

### Debugging

**View Container Status:**
```bash
docker-compose ps
```

**Check Container Logs:**
```bash
# All services
docker-compose logs -f

# Specific service with last 100 lines
docker-compose logs --tail=100 backend
```

**Restart a Service:**
```bash
docker-compose restart backend
docker-compose restart frontend
```

**Rebuild After Dependency Changes:**
```bash
# Frontend - after changing package.json
docker-compose build frontend
docker-compose up -d frontend

# Backend - after changing Cargo.toml
docker-compose build backend
docker-compose up -d backend
```

**Clean Rebuild:**
```bash
# Remove everything and start fresh
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Troubleshooting

**Port Already in Use:**
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :8000

# Kill the process or change ports in docker-compose.yml
```

**Hot Reload Not Working:**

Frontend:
- Verify `CHOKIDAR_USEPOLLING=true` in docker-compose.yml
- Check browser console for WebSocket errors
- Try clearing browser cache

Backend:
- Check logs: `docker-compose logs backend`
- Verify cargo-watch is installed
- Rebuild: `docker-compose build --no-cache backend`

**CORS Errors:**
- Ensure backend is running before frontend
- Check `VITE_API_URL` environment variable
- Verify CORS configuration in `backend/src/main.rs`

**Database Errors:**
- Check migrations ran: `docker-compose logs backend | grep migration`
- Reset database: `docker-compose down -v && docker-compose up`

---

## Production Deployment

For production deployment, additional considerations are needed:

### Security Enhancements

1. **Use proper JWT secrets** in environment variables
2. **Add authentication middleware** to protect admin routes
3. **Implement rate limiting** to prevent abuse
4. **Use HTTPS** with proper SSL certificates
5. **Validate all user inputs** thoroughly
6. **Set proper CORS origins** (not `Any`)

### Production Build

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        - VITE_API_URL=https://api.yourdomain.com
    restart: always
    ports:
      - "80:3000"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///app/data/database.db
      - RUST_LOG=info
    volumes:
      - ./data:/app/data
```

Run with: `docker-compose -f docker-compose.prod.yml up -d`

### Performance Optimizations

**Frontend:**
- Enable production build optimizations
- Configure caching headers
- Use CDN for static assets
- Implement code splitting

**Backend:**
- Use release mode compilation
- Configure connection pool sizing
- Add database indexes
- Implement response caching
- Use production-grade database (PostgreSQL)

---

## Technology Stack Summary

This application uses cutting-edge technologies as of 2025:

**Frontend:**
- **React Router v7.1.x** - Latest version with Remix-inspired SSR
- **Vite 5.4.x** - Lightning-fast build tool and dev server
- **Material UI 6.1.x** - Google's Material Design components
- **TypeScript 5.6.x** - Type safety and developer experience
- **Emotion** - CSS-in-JS styling engine

**Backend:**
- **Rust 1.75** - Systems programming language
- **Axum 0.7** - Ergonomic web framework
- **SQLx 0.8** - Async SQL toolkit with compile-time verification
- **SQLite** - Embedded database
- **Tokio** - Async runtime

**Infrastructure:**
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **cargo-watch** - Rust hot reload
- **Vite HMR** - Frontend hot module replacement

---

## Next Steps

To extend this application, consider:

1. **Add Authentication:**
   - Implement JWT-based auth system
   - Create login/register pages
   - Protected admin routes

2. **Add Comments:**
   - Create comments table
   - Build comment components
   - Nested comment threads

3. **Rich Text Editor:**
   - Integrate TinyMCE or Quill
   - Support Markdown
   - Image uploads

4. **Search Functionality:**
   - Full-text search in SQLite
   - Search filters
   - Advanced queries

5. **Categories and Tags:**
   - Many-to-many relationships
   - Tag-based filtering
   - Category pages

6. **User Profiles:**
   - Author pages
   - Avatar uploads
   - Bio information

7. **Testing:**
   - Frontend: Vitest + React Testing Library
   - Backend: Rust unit and integration tests
   - E2E: Playwright or Cypress

This complete application provides a solid foundation for building modern full-stack web applications with the latest technologies and best practices.