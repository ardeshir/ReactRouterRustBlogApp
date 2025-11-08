# Quick Reference Card: React Router v7 + Rust Axum Blog

## 🚀 Essential Commands

### Start/Stop Development

```bash
# Start everything
docker-compose -f docker-compose.dev.yml up -d

# Start with logs
docker-compose -f docker-compose.dev.yml up

# Stop everything
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (fresh start)
docker-compose -f docker-compose.dev.yml down -v

# Rebuild and start
docker-compose -f docker-compose.dev.yml up -d --build
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Backend only
docker-compose -f docker-compose.dev.yml logs -f backend

# Frontend only
docker-compose -f docker-compose.dev.yml logs -f frontend

# Last 50 lines
docker-compose -f docker-compose.dev.yml logs --tail=50 backend
```

### Restart Services

```bash
# Restart backend
docker-compose -f docker-compose.dev.yml restart backend

# Restart frontend
docker-compose -f docker-compose.dev.yml restart frontend

# Restart all
docker-compose -f docker-compose.dev.yml restart
```

### Execute Commands Inside Containers

```bash
# Backend shell
docker-compose -f docker-compose.dev.yml exec backend sh

# Frontend shell
docker-compose -f docker-compose.dev.yml exec frontend sh

# Run cargo command
docker-compose -f docker-compose.dev.yml exec backend cargo check

# Run npm command
docker-compose -f docker-compose.dev.yml exec frontend npm install
```

---

## 🗄️ Database Commands

```bash
# Access SQLite shell
docker-compose -f docker-compose.dev.yml exec backend sqlite3 /app/data/blog.db

# Common queries
sqlite> SELECT * FROM posts;
sqlite> SELECT COUNT(*) FROM posts;
sqlite> .schema posts
sqlite> .tables
sqlite> .exit

# Backup database
cp backend/data/blog.db backend/data/blog.db.backup

# Reset database
rm backend/data/blog.db
docker-compose -f docker-compose.dev.yml restart backend
```

---

## 🧪 Testing

```bash
# Test backend API
./backend/test-api.sh

# Test specific endpoint
curl http://localhost:3001/api/posts
curl http://localhost:3001/health

# Test with data
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Content","author":"Me","status":"draft"}'
```

---

## 🔍 Debugging

```bash
# Check container status
docker-compose -f docker-compose.dev.yml ps

# Check resource usage
docker stats

# Check environment variables
docker-compose -f docker-compose.dev.yml exec backend env
docker-compose -f docker-compose.dev.yml exec frontend env

# Follow logs in real-time
docker-compose -f docker-compose.dev.yml logs -f | grep -i error
```

---

## 🌐 URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React Router v7 app |
| Backend API | http://localhost:3001 | Rust Axum API |
| Health Check | http://localhost:3001/health | API health status |
| Posts API | http://localhost:3001/api/posts | Posts endpoint |

---

## 📁 Project Structure

```
ReactRouterRustBlogApp/
├── frontend/
│   ├── app/
│   │   ├── components/      # Reusable components
│   │   ├── routes/          # Page components
│   │   ├── root.tsx         # Root layout
│   │   ├── routes.ts        # Route config
│   │   └── tailwind.css     # Styles
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── main.rs          # Entry point
│   │   └── models.rs        # Data models
│   ├── migrations/          # SQL migrations
│   ├── data/
│   │   └── blog.db          # SQLite database
│   ├── Cargo.toml
│   └── entrypoint.sh
│
└── docker-compose.dev.yml
```

---

## 🎨 Tailwind CSS Classes

### Buttons
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-ghost">Ghost</button>
```

### Cards
```html
<div class="card">
  <div class="p-6">Card content</div>
</div>
```

### Forms
```html
<label class="form-label">Label</label>
<input type="text" class="form-input" />
<p class="form-error">Error message</p>
```

### Badges
```html
<span class="badge badge-success">Published</span>
<span class="badge badge-warning">Draft</span>
<span class="badge badge-gray">Archived</span>
```

---

## 📊 API Response Formats

### List Posts
```json
{
  "data": [
    {
      "id": 1,
      "title": "Post Title",
      "slug": "post-title",
      "content": "...",
      "excerpt": "...",
      "author": "Author",
      "status": "published",
      "view_count": 42,
      "created_at": "2025-01-08T12:00:00Z",
      "published_at": "2025-01-08T12:00:00Z"
    }
  ],
  "page": 1,
  "per_page": 10,
  "total": 25
}
```

### Single Post
```json
{
  "id": 1,
  "title": "Post Title",
  "slug": "post-title",
  "content": "Full content...",
  "excerpt": "Brief summary...",
  "author": "Author Name",
  "status": "published",
  "view_count": 42,
  "created_at": "2025-01-08T12:00:00Z",
  "published_at": "2025-01-08T12:00:00Z",
  "updated_by": "Editor Name"
}
```

---

## 🛠️ Common Fixes

### Database Locked
```bash
docker-compose -f docker-compose.dev.yml down
rm backend/data/blog.db-shm backend/data/blog.db-wal
docker-compose -f docker-compose.dev.yml up -d
```

### CORS Error
```yaml
# In docker-compose.dev.yml frontend service:
environment:
  - VITE_API_URL=http://backend:3001  # Use service name
```

### Hot Reload Not Working

**Backend**:
```bash
docker-compose -f docker-compose.dev.yml logs backend | grep cargo-watch
docker-compose -f docker-compose.dev.yml restart backend
```

**Frontend**:
```yaml
# Ensure in docker-compose.dev.yml:
environment:
  - CHOKIDAR_USEPOLLING=true
```

### Port Already in Use
```bash
# Find process
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

---

## 🎯 Development Workflow

### Adding a New Feature

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes**
   - Edit files in `frontend/app/` or `backend/src/`
   - Watch logs: `docker-compose -f docker-compose.dev.yml logs -f`

3. **Test locally**
   - Backend: `./backend/test-api.sh`
   - Frontend: Open http://localhost:3000

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/new-feature
   ```

---

## 🔑 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=sqlite:///app/data/blog.db
RUST_LOG=debug
PORT=3001
```

### Frontend (docker-compose.dev.yml)
```yaml
environment:
  - VITE_API_URL=http://backend:3001
  - CHOKIDAR_USEPOLLING=true
```

---

## 📈 Performance Tips

### Backend
- Keep database file on SSD
- Add indexes (already in migrations)
- Use connection pooling (already configured)
- Monitor with: `docker stats blog-backend-dev`

### Frontend
- Use React DevTools Profiler
- Lazy load routes
- Optimize images
- Monitor bundle size

---

## ⚡ Shortcuts

### VS Code
```
Ctrl + `          : Toggle terminal
Ctrl + Shift + P  : Command palette
Ctrl + P          : Quick file open
F5                : Start debugging
```

### Browser DevTools
```
F12               : Open DevTools
Ctrl + Shift + I  : Open DevTools
Ctrl + Shift + J  : Open Console
Ctrl + Shift + R  : Hard reload
```

---

## 🆘 Emergency Commands

### Complete Reset
```bash
docker-compose -f docker-compose.dev.yml down -v
rm -rf backend/data/blog.db*
docker-compose -f docker-compose.dev.yml up -d --build
```

### Free Disk Space
```bash
docker system prune -a
docker volume prune
```

### Fix Permissions
```bash
sudo chown -R $USER:$USER backend/data/
chmod 777 backend/data/
```

---

## 📚 Quick Links

- [React Router Docs](https://reactrouter.com)
- [Axum Docs](https://docs.rs/axum)
- [Tailwind CSS](https://tailwindcss.com)
- [SQLx Guide](https://github.com/launchbadge/sqlx)

---

## ✅ Daily Checklist

**Morning**:
- [ ] `docker-compose -f docker-compose.dev.yml up -d`
- [ ] Check logs for errors
- [ ] Test http://localhost:3000
- [ ] Pull latest changes: `git pull`

**During Development**:
- [ ] Commit frequently
- [ ] Watch logs: `docker-compose logs -f`
- [ ] Test API: `./backend/test-api.sh`
- [ ] Check browser console for errors

**Evening**:
- [ ] Push changes: `git push`
- [ ] Backup database: `cp backend/data/blog.db blog.db.backup`
- [ ] `docker-compose -f docker-compose.dev.yml down`

---

## 📱 Mobile Testing

```bash
# Find your local IP
ip addr show | grep "inet " | grep -v 127.0.0.1

# Access from phone on same network:
# http://<your-ip>:3000

# Update docker-compose.dev.yml for external access:
# ports:
#   - "0.0.0.0:3000:3000"
```

---

## 🎨 Color Palette

```css
/* Primary Blue */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-700: #1d4ed8;

/* Status Colors */
--success: #10b981;  /* Green */
--warning: #f59e0b;  /* Yellow */
--danger: #ef4444;   /* Red */
```

---

**Version**: 1.0  
**Last Updated**: 2025-01-08  
**Keep this open while developing!** 📌
