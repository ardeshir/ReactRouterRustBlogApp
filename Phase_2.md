# Phase 2: Complete Frontend CRUD UI/UX with Tailwind CSS

**Estimated Time**: 3-4 hours  
**Goal**: Build beautiful, responsive frontend with full CRUD operations

---

## Step 1: Install and Configure Tailwind CSS

### 1.1 Install Tailwind Dependencies

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 1.2 Configure Tailwind

Create `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
```

### 1.3 Create Tailwind CSS File

Create `frontend/app/tailwind.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  /* Button Styles */
  .btn {
    @apply font-semibold py-2 px-4 rounded-lg transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg;
  }
  
  .btn-secondary {
    @apply bg-gray-600 hover:bg-gray-700 text-white shadow-md hover:shadow-lg;
  }
  
  .btn-danger {
    @apply bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg;
  }
  
  .btn-outline {
    @apply border-2 border-primary-600 text-primary-600 hover:bg-primary-50;
  }
  
  .btn-ghost {
    @apply text-gray-700 hover:bg-gray-100;
  }

  /* Card Styles */
  .card {
    @apply bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden;
  }

  /* Form Styles */
  .form-input {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all;
  }
  
  .form-label {
    @apply block text-sm font-medium text-gray-700 mb-2;
  }
  
  .form-error {
    @apply text-red-600 text-sm mt-1;
  }

  /* Badge Styles */
  .badge {
    @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-medium;
  }
  
  .badge-success {
    @apply bg-green-100 text-green-800;
  }
  
  .badge-warning {
    @apply bg-yellow-100 text-yellow-800;
  }
  
  .badge-gray {
    @apply bg-gray-100 text-gray-800;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

### 1.4 Update Root Layout

Update `frontend/app/root.tsx`:

```tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";
import "./tailwind.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-50 min-h-screen antialiased">
        {children}
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
  const error = useRouteError();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error</title>
        <Links />
      </head>
      <body className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Oops!</h1>
          {isRouteErrorResponse(error) ? (
            <>
              <p className="text-gray-600 mb-4">
                {error.status} - {error.statusText}
              </p>
              {error.data?.message && (
                <p className="text-sm text-gray-500">{error.data.message}</p>
              )}
            </>
          ) : (
            <p className="text-gray-600 mb-4">
              Something went wrong. Please try again later.
            </p>
          )}
          <a href="/" className="btn btn-primary mt-6">
            Go Home
          </a>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Modern Blog" },
    { name: "description", content: "A modern blog built with React Router v7 and Rust Axum" },
  ];
}
```

---

## Step 2: Create Layout Component

Create `frontend/app/components/Layout.tsx`:

```tsx
import { Link, useLocation } from "react-router";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2 text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              <span className="text-3xl">📝</span>
              <span>Modern Blog</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-4">
              <Link 
                to="/posts" 
                className={`font-medium transition-colors ${
                  isActive('/posts') 
                    ? 'text-primary-600' 
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                All Posts
              </Link>
              <Link 
                to="/posts/new" 
                className="btn btn-primary"
              >
                <span className="text-lg">+</span>
                New Post
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="font-semibold text-lg mb-1">Modern Blog</p>
              <p className="text-gray-400 text-sm">
                Built with React Router v7 + Rust Axum
              </p>
            </div>
            <div className="flex gap-6">
              <a 
                href="https://reactrouter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                React Router
              </a>
              <a 
                href="https://docs.rs/axum" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Axum
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

---

## Step 3: Create Reusable Components

### 3.1 Loading Spinner

Create `frontend/app/components/LoadingSpinner.tsx`:

```tsx
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
}
```

### 3.2 Empty State

Create `frontend/app/components/EmptyState.tsx`:

```tsx
import { Link } from "react-router";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  icon?: string;
}

export default function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  actionLink,
  icon = "📭"
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {actionLink && actionLabel && (
        <Link to={actionLink} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
```

### 3.3 Pagination Component

Create `frontend/app/components/Pagination.tsx`:

```tsx
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PaginationProps) {
  const pages = [];
  
  // Show max 7 page numbers
  const maxPages = 7;
  let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
  let endPage = Math.min(totalPages, startPage + maxPages - 1);
  
  if (endPage - startPage < maxPages - 1) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn btn-ghost disabled:opacity-30"
      >
        ← Previous
      </button>

      {/* Page Numbers */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="btn btn-ghost"
          >
            1
          </button>
          {startPage > 2 && <span className="text-gray-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`btn ${
            page === currentPage
              ? 'btn-primary'
              : 'btn-ghost'
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="btn btn-ghost"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn btn-ghost disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  );
}
```

---

## Step 4: Create Route Files

### 4.1 Home Page (Redirect)

Create `frontend/app/routes/home.tsx`:

```tsx
import { redirect } from "react-router";
import type { Route } from "./+types/home";

export function loader({}: Route.LoaderArgs) {
  return redirect("/posts");
}

export default function Home() {
  return null;
}
```

### 4.2 Posts List Page

Create `frontend/app/routes/posts.tsx`:

```tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/posts";
import Pagination from "../components/Pagination";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  status: string;
  view_count: number;
  created_at: string;
  published_at?: string;
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
  const status = url.searchParams.get("status") || "";

  try {
    let apiUrl = `${API_URL}/api/posts?page=${page}&per_page=9`;
    if (status) {
      apiUrl += `&status=${status}`;
    }

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch posts");
    
    const data: PostsResponse = await response.json();
    return { ...data, selectedStatus: status };
  } catch (error) {
    console.error("Error loading posts:", error);
    return { 
      data: [], 
      page: 1, 
      per_page: 9, 
      total: 0,
      selectedStatus: status
    };
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "All Posts - Modern Blog" },
    { name: "description", content: "Browse all blog posts" },
  ];
}

export default function Posts({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>(loaderData.data || []);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState(loaderData.selectedStatus || "");

  const totalPages = Math.ceil(loaderData.total / loaderData.per_page);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    setIsDeleting(id);
    try {
      const response = await fetch(`${API_URL}/api/posts/${id}`, {
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
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (statusFilter) params.set("status", statusFilter);
    navigate(`/posts?${params.toString()}`);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    const params = new URLSearchParams();
    params.set("page", "1");
    if (status) params.set("status", status);
    navigate(`/posts?${params.toString()}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      published: "badge badge-success",
      draft: "badge badge-warning",
      archived: "badge badge-gray",
    };
    return badges[status as keyof typeof badges] || "badge badge-gray";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">All Posts</h1>
          <p className="text-gray-600 mt-2">
            {loaderData.total} {loaderData.total === 1 ? "post" : "posts"} total
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusFilter("")}
            className={`btn ${!statusFilter ? "btn-primary" : "btn-ghost"}`}
          >
            All
          </button>
          <button
            onClick={() => handleStatusFilter("published")}
            className={`btn ${statusFilter === "published" ? "btn-primary" : "btn-ghost"}`}
          >
            Published
          </button>
          <button
            onClick={() => handleStatusFilter("draft")}
            className={`btn ${statusFilter === "draft" ? "btn-primary" : "btn-ghost"}`}
          >
            Drafts
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <EmptyState
          title="No posts found"
          description="Get started by creating your first blog post."
          actionLabel="Create First Post"
          actionLink="/posts/new"
          icon="✍️"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.id} className="card group">
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className={getStatusBadge(post.status)}>
                      {post.status}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>👁️</span>
                      <span className="ml-1">{post.view_count}</span>
                    </div>
                  </div>

                  <Link 
                    to={`/posts/${post.id}`}
                    className="block mb-3 group-hover:text-primary-600 transition-colors"
                  >
                    <h2 className="text-xl font-bold text-gray-900 line-clamp-2">
                      {post.title}
                    </h2>
                  </Link>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <span>✍️</span>
                    <span className="ml-2">{post.author}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="border-t border-gray-100 px-6 py-3 flex gap-2">
                  <Link
                    to={`/posts/${post.id}`}
                    className="btn btn-ghost text-sm flex-1"
                  >
                    Read
                  </Link>
                  <Link
                    to={`/posts/${post.id}/edit`}
                    className="btn btn-ghost text-sm"
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id, post.title)}
                    disabled={isDeleting === post.id}
                    className="btn btn-ghost text-sm text-red-600 hover:bg-red-50"
                  >
                    {isDeleting === post.id ? "⏳" : "🗑️"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={loaderData.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
```

### 4.3 Create New Post

Create `frontend/app/routes/posts.new.tsx`:

```tsx
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/posts.new";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create New Post - Modern Blog" },
    { name: "description", content: "Create a new blog post" },
  ];
}

interface FormErrors {
  title?: string;
  content?: string;
  author?: string;
}

export default function NewPost() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: "",
    excerpt: "",
    status: "draft",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title || formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!formData.content || formData.content.length < 10) {
      newErrors.content = "Content must be at least 10 characters";
    }

    if (!formData.author || formData.author.length < 2) {
      newErrors.author = "Author name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const post = await response.json();
        navigate(`/posts/${post.id}`);
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-600 mt-2">Share your thoughts with the world</p>
      </div>

      {/* Form Card */}
      <div className="card">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="form-label">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter an engaging title..."
              className={`form-input ${errors.title ? 'border-red-500' : ''}`}
              required
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          {/* Author and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="author" className="form-label">
                Author *
              </label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Your name"
                className={`form-input ${errors.author ? 'border-red-500' : ''}`}
                required
              />
              {errors.author && <p className="form-error">{errors.author}</p>}
            </div>

            <div>
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="form-label">
              Excerpt (Optional)
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Brief summary of your post (auto-generated if left empty)"
              rows={2}
              className="form-input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to auto-generate from content
            </p>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="form-label">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your post content here..."
              rows={15}
              className={`form-input ${errors.content ? 'border-red-500' : ''}`}
              required
            />
            {errors.content && <p className="form-error">{errors.content}</p>}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/posts")}
              className="btn btn-ghost flex-1 sm:flex-none"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 sm:flex-none"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  💾 Create Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 4.4 View Single Post

Create `frontend/app/routes/posts.$id.tsx`:

```tsx
import { Link } from "react-router";
import type { Route } from "./+types/posts.$id";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  status: string;
  view_count: number;
  created_at: string;
  published_at?: string;
  updated_by?: string;
}

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const response = await fetch(`${API_URL}/api/posts/${params.id}`);
    if (!response.ok) {
      throw new Response("Post not found", { status: 404 });
    }
    return await response.json();
  } catch (error) {
    throw new Response("Post not found", { status: 404 });
  }
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data?.title || "Post"} - Modern Blog` },
    { name: "description", content: data?.excerpt || "" },
  ];
}

export default function PostDetail({ loaderData }: Route.ComponentProps) {
  const post: Post = loaderData;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      published: { class: "badge badge-success", icon: "✓" },
      draft: { class: "badge badge-warning", icon: "📝" },
      archived: { class: "badge badge-gray", icon: "📦" },
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const statusBadge = getStatusBadge(post.status);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link 
        to="/posts" 
        className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-8 transition-colors"
      >
        <span className="mr-2">←</span>
        Back to all posts
      </Link>

      {/* Post Card */}
      <article className="card">
        {/* Header */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <span className={statusBadge.class}>
              {statusBadge.icon} {post.status}
            </span>
            <Link
              to={`/posts/${post.id}/edit`}
              className="btn btn-outline"
            >
              ✏️ Edit Post
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-balance">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <span>✍️</span>
              <span className="font-medium">{post.author}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{formatDate(post.created_at)}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <span>👁️</span>
              <span>{post.view_count} views</span>
            </div>
          </div>

          {post.published_at && post.published_at !== post.created_at && (
            <p className="text-sm text-gray-500 mt-2">
              Published on {formatDate(post.published_at)}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-8">
          <div 
            className="prose prose-lg max-w-none"
            style={{ 
              whiteSpace: "pre-wrap",
              lineHeight: "1.8"
            }}
          >
            {post.content}
          </div>
        </div>

        {/* Footer */}
        {post.updated_by && (
          <div className="p-8 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-600">
              Last updated by <span className="font-medium">{post.updated_by}</span>
            </p>
          </div>
        )}
      </article>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <Link to={`/posts/${post.id}/edit`} className="btn btn-primary flex-1">
          ✏️ Edit This Post
        </Link>
        <Link to="/posts" className="btn btn-ghost flex-1">
          View All Posts
        </Link>
      </div>
    </div>
  );
}
```

### 4.5 Edit Post

Create `frontend/app/routes/posts.$id.edit.tsx`:

```tsx
import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/posts.$id.edit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  status: string;
}

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const response = await fetch(`${API_URL}/api/posts/${params.id}`);
    if (!response.ok) {
      throw new Response("Post not found", { status: 404 });
    }
    return await response.json();
  } catch (error) {
    throw new Response("Post not found", { status: 404 });
  }
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `Edit: ${data?.title || "Post"} - Modern Blog` },
  ];
}

interface FormErrors {
  title?: string;
  content?: string;
}

export default function EditPost({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const post: Post = loaderData;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: post.title,
    content: post.content,
    excerpt: post.excerpt || "",
    status: post.status,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title || formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!formData.content || formData.content.length < 10) {
      newErrors.content = "Content must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(`${API_URL}/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          updated_by: post.author, // In real app, use current user
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/posts/${post.id}`);
        }, 1000);
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Edit Post</h1>
        <p className="text-gray-600 mt-2">Make changes to your blog post</p>
      </div>

      {/* Form Card */}
      <div className="card">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Success Alert */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <p className="font-medium">✓ Success!</p>
              <p className="text-sm">Post updated successfully. Redirecting...</p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="form-label">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? 'border-red-500' : ''}`}
              required
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="form-label">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-input"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="form-label">
              Excerpt (Optional)
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Brief summary of your post"
              rows={2}
              className="form-input"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="form-label">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={15}
              className={`form-input ${errors.content ? 'border-red-500' : ''}`}
              required
            />
            {errors.content && <p className="form-error">{errors.content}</p>}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/posts/${post.id}`)}
              className="btn btn-ghost flex-1 sm:flex-none"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 sm:flex-none"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : success ? (
                <>✓ Saved!</>
              ) : (
                <>💾 Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## Step 5: Update Routes Configuration

Update `frontend/app/routes.ts`:

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

---

## Step 6: Test Frontend

### 6.1 Rebuild and Start

```bash
# Rebuild frontend with Tailwind
docker-compose -f docker-compose.dev.yml up -d --build frontend

# Check logs
docker-compose -f docker-compose.dev.yml logs -f frontend
```

### 6.2 Manual Testing Checklist

Open http://localhost:3000 and test:

- [ ] Homepage redirects to /posts
- [ ] Posts list displays with cards
- [ ] Status filter works (All/Published/Drafts)
- [ ] Pagination works
- [ ] Click "New Post" creates a post
- [ ] Form validation shows errors
- [ ] Created post appears in list
- [ ] Click post card to view details
- [ ] View count increases on each view
- [ ] Edit post works
- [ ] Delete post works with confirmation
- [ ] Empty state shows when no posts
- [ ] Responsive design works on mobile

---

## ✅ Phase 2 Complete!

You should now have:

- ✅ Beautiful Tailwind CSS styling
- ✅ Responsive layout with header/footer
- ✅ Complete CRUD interface
- ✅ Form validation and error handling
- ✅ Loading states and animations
- ✅ Status filters and pagination
- ✅ Empty states
- ✅ View counter
- ✅ Mobile-friendly design

**Next**: Phase 3 - Production Deployment with Kubernetes
