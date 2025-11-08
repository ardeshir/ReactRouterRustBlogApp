# React Router v7 + Rust Axum Blog: Troubleshooting Guide

## 🚨 Quick Diagnostics

### Check System Status

```bash
# Check if containers are running
docker-compose -f docker-compose.dev.yml ps

# Check all logs
docker-compose -f docker-compose.dev.yml logs

# Check specific service
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs frontend

# Check container resource usage
docker stats

# Check disk space
df -h
```

---

## 🔧 Backend Issues

### Issue: Database Locked Error

**Symptoms**:
```
Error: database is locked
SqliteFailure(Error { code: DatabaseLocked })
```

**Causes**:
- Multiple processes accessing database
- Stale lock file
- Container didn't shut down cleanly

**Solutions**:

```bash
# Solution 1: Clean restart
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

# Solution 2: Remove lock files
docker-compose -f docker-compose.dev.yml down
rm backend/data/blog.db-shm
rm backend/data/blog.db-wal
docker-compose -f docker-compose.dev.yml up -d

# Solution 3: Fresh database
docker-compose -f docker-compose.dev.yml down
rm backend/data/blog.db*
docker-compose -f docker-compose.dev.yml up -d
```

---

### Issue: Migration Errors

**Symptoms**:
```
Error: no such table: posts
Migration error: ...
```

**Solutions**:

```bash
# Check migration status
docker-compose -f docker-compose.dev.yml logs backend | grep -i migration

# Force re-run migrations
docker-compose -f docker-compose.dev.yml exec backend rm -rf /app/data/blog.db
docker-compose -f docker-compose.dev.yml restart backend

# Check migration files exist
ls -la backend/migrations/

# Verify migration SQL syntax
cat backend/migrations/*.sql
```

---

### Issue: Backend Won't Start

**Symptoms**:
```
backend container keeps restarting
Exit code 101
```

**Diagnostics**:

```bash
# Check logs for compile errors
docker-compose -f docker-compose.dev.yml logs backend | tail -100

# Check Cargo.toml syntax
docker-compose -f docker-compose.dev.yml exec backend cargo check

# Try building manually
cd backend
docker build -f Dockerfile.dev -t test-backend .
```

**Common Causes**:
- Rust syntax error in main.rs or models.rs
- Missing dependency in Cargo.toml
- Database URL misconfigured
- Permission issues on database file

**Solutions**:

```bash
# Fix Rust errors
docker-compose -f docker-compose.dev.yml exec backend cargo clippy

# Verify environment variables
docker-compose -f docker-compose.dev.yml exec backend env | grep DATABASE_URL

# Check file permissions
ls -la backend/data/

# Ensure entrypoint is executable
chmod +x backend/entrypoint.sh
```

---

### Issue: cargo-watch Not Working

**Symptoms**:
- Changes to Rust files don't trigger rebuild
- No "Compiling..." message in logs

**Solutions**:

```bash
# Check if cargo-watch is running
docker-compose -f docker-compose.dev.yml exec backend ps aux | grep cargo-watch

# Manually restart cargo-watch
docker-compose -f docker-compose.dev.yml exec backend cargo watch -x run

# Check Dockerfile.dev has cargo-watch installation
docker-compose -f docker-compose.dev.yml exec backend which cargo-watch

# Rebuild if needed
docker-compose -f docker-compose.dev.yml build --no-cache backend
```

---

### Issue: Port 3001 Already in Use

**Symptoms**:
```
Error starting userland proxy: listen tcp 0.0.0.0:3001: bind: address already in use
```

**Solutions**:

```bash
# Find process using port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.dev.yml
# ports:
#   - "3002:3001"  # Host:Container
```

---

## 🎨 Frontend Issues

### Issue: CORS Errors

**Symptoms**:
```
Access to fetch at 'http://localhost:3001/api/posts' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Diagnostics**:

```bash
# Check CORS configuration in backend
docker-compose -f docker-compose.dev.yml logs backend | grep -i cors

# Test API directly
curl http://localhost:3001/api/posts

# Check environment variable
docker-compose -f docker-compose.dev.yml exec frontend env | grep VITE_API_URL
```

**Solutions**:

1. **Verify backend CORS settings** in `backend/src/main.rs`:
```rust
let cors = CorsLayer::new()
    .allow_origin(Any)
    .allow_methods(Any)
    .allow_headers(Any);
```

2. **Use Docker service name** in docker-compose.dev.yml:
```yaml
frontend:
  environment:
    - VITE_API_URL=http://backend:3001  # Use service name, not localhost
```

3. **Restart both services**:
```bash
docker-compose -f docker-compose.dev.yml restart backend frontend
```

---

### Issue: API Calls Return 404

**Symptoms**:
- Frontend makes requests but gets 404
- `/api/posts` not found

**Diagnostics**:

```bash
# Check if backend is responding
curl http://localhost:3001/health

# Check API endpoint
curl http://localhost:3001/api/posts

# Check frontend is using correct URL
docker-compose -f docker-compose.dev.yml logs frontend | grep -i api
```

**Solutions**:

1. **Verify VITE_API_URL** in docker-compose:
```yaml
VITE_API_URL=http://backend:3001  # For internal Docker networking
```

2. **Check route definitions** in `backend/src/main.rs`:
```rust
.route("/api/posts", get(list_posts).post(create_post))
```

3. **Verify frontend API calls** use the env variable:
```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
```

---

### Issue: Hot Module Replacement (HMR) Not Working

**Symptoms**:
- Changes to frontend files don't update browser
- Need to manually refresh

**Solutions**:

```bash
# Check if Vite HMR WebSocket is connected (browser console)
# Should see: [vite] connected.

# Ensure CHOKIDAR_USEPOLLING is set
docker-compose -f docker-compose.dev.yml exec frontend env | grep CHOKIDAR

# If not set, add to docker-compose.dev.yml:
environment:
  - CHOKIDAR_USEPOLLING=true

# Clear browser cache
# Chrome: Ctrl+Shift+Del
# Firefox: Ctrl+Shift+Del

# Restart frontend
docker-compose -f docker-compose.dev.yml restart frontend
```

---

### Issue: Tailwind Styles Not Applying

**Symptoms**:
- CSS classes present in HTML but no styles
- Page looks unstyled

**Diagnostics**:

```bash
# Check if Tailwind CSS file exists
docker-compose -f docker-compose.dev.yml exec frontend ls -la /app/app/tailwind.css

# Check if tailwind.config.js exists
docker-compose -f docker-compose.dev.yml exec frontend cat /app/tailwind.config.js

# Check build output
docker-compose -f docker-compose.dev.yml logs frontend | grep -i tailwind
```

**Solutions**:

1. **Verify tailwind.css import** in `app/root.tsx`:
```tsx
import "./tailwind.css";
```

2. **Check Tailwind content paths** in `tailwind.config.js`:
```javascript
content: [
  "./app/**/*.{js,jsx,ts,tsx}",
],
```

3. **Rebuild frontend**:
```bash
docker-compose -f docker-compose.dev.yml down frontend
docker-compose -f docker-compose.dev.yml up -d --build frontend
```

---

### Issue: TypeScript Errors

**Symptoms**:
```
Cannot find module './+types/posts'
Property 'loaderData' does not exist
```

**Solutions**:

```bash
# Check TypeScript config
docker-compose -f docker-compose.dev.yml exec frontend cat /app/tsconfig.json

# Verify React Router types are installed
docker-compose -f docker-compose.dev.yml exec frontend npm list @react-router/dev

# Regenerate types
docker-compose -f docker-compose.dev.yml exec frontend npm run build

# If still failing, reinstall
docker-compose -f docker-compose.dev.yml exec frontend rm -rf node_modules
docker-compose -f docker-compose.dev.yml restart frontend
```

---

### Issue: Routes Not Found (404)

**Symptoms**:
- Clicking links gives 404
- Route doesn't match

**Solutions**:

1. **Check routes.ts file**:
```typescript
// Ensure all routes are defined
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

2. **Verify file names match** (React Router v7 uses file-based routing):
```bash
ls -la frontend/app/routes/
# Should see: posts.tsx, posts.new.tsx, posts.$id.tsx, posts.$id.edit.tsx
```

3. **Restart dev server**:
```bash
docker-compose -f docker-compose.dev.yml restart frontend
```

---

## 🐳 Docker Issues

### Issue: Volumes Not Mounting

**Symptoms**:
- Changes to code don't appear in container
- Files missing inside container

**Diagnostics**:

```bash
# Check volume mounts
docker inspect blog-frontend-dev | grep -A 10 Mounts
docker inspect blog-backend-dev | grep -A 10 Mounts

# Check if files exist in container
docker-compose -f docker-compose.dev.yml exec frontend ls -la /app/app
docker-compose -f docker-compose.dev.yml exec backend ls -la /app/src
```

**Solutions**:

```bash
# Remove containers and volumes
docker-compose -f docker-compose.dev.yml down -v

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up -d --build

# Check permissions on host
ls -la frontend/
ls -la backend/
```

---

### Issue: Container Keeps Restarting

**Symptoms**:
```
Restarting (1) X seconds ago
Exit code 1 or 101
```

**Diagnostics**:

```bash
# Check exit reason
docker-compose -f docker-compose.dev.yml ps

# View logs for crash reason
docker-compose -f docker-compose.dev.yml logs --tail=50 backend
docker-compose -f docker-compose.dev.yml logs --tail=50 frontend

# Check container health
docker inspect blog-backend-dev | grep -A 20 State
```

**Solutions**:

```bash
# Remove restart policy temporarily to see error
docker-compose -f docker-compose.dev.yml down

# Edit docker-compose.dev.yml:
# restart: "no"  # Instead of "unless-stopped"

docker-compose -f docker-compose.dev.yml up

# Fix the error shown, then restore restart policy
```

---

### Issue: Out of Disk Space

**Symptoms**:
```
no space left on device
Error response from daemon: write /var/lib/docker...
```

**Solutions**:

```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a
docker volume prune

# Remove unused images
docker image prune -a

# Remove all stopped containers
docker container prune

# Check disk space
df -h
```

---

## 🔍 Debugging Tips

### Enable Verbose Logging

**Backend**:
```yaml
# In docker-compose.dev.yml
environment:
  - RUST_LOG=debug  # or trace for more detail
  - RUST_BACKTRACE=1
```

**Frontend**:
```typescript
// Add console.logs in route loaders
export async function loader({ request }: Route.LoaderArgs) {
  console.log("Loading posts...");
  const response = await fetch(`${API_URL}/api/posts`);
  console.log("Response:", response.status);
  // ...
}
```

---

### Test API Directly

```bash
# Health check
curl http://localhost:3001/health

# List posts
curl http://localhost:3001/api/posts

# Get single post
curl http://localhost:3001/api/posts/1

# Create post
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "content": "Test content",
    "author": "Test Author",
    "status": "draft"
  }'
```

---

### Check Database Directly

```bash
# Enter database container
docker-compose -f docker-compose.dev.yml exec backend sqlite3 /app/data/blog.db

# Run queries
sqlite> SELECT * FROM posts;
sqlite> .schema posts
sqlite> .tables
sqlite> .exit
```

---

### Use Browser DevTools

1. **Network Tab**: Check API calls, response status, timing
2. **Console**: View JavaScript errors, logs
3. **Application Tab**: Check cookies, local storage
4. **Elements Tab**: Inspect HTML, verify classes applied

---

## 🆘 Nuclear Option: Complete Reset

If nothing else works:

```bash
# Stop everything
docker-compose -f docker-compose.dev.yml down -v

# Remove all blog-related containers
docker ps -a | grep blog | awk '{print $1}' | xargs docker rm -f

# Remove all blog-related images
docker images | grep blog | awk '{print $3}' | xargs docker rmi -f

# Remove volumes
docker volume ls | grep blog | awk '{print $2}' | xargs docker volume rm

# Remove database
rm -rf backend/data/blog.db*

# Remove node_modules (optional, but thorough)
rm -rf frontend/node_modules

# Rebuild everything from scratch
docker-compose -f docker-compose.dev.yml up -d --build

# Wait for services to start
sleep 10

# Test
curl http://localhost:3001/health
curl http://localhost:3000
```

---

## 📊 Performance Issues

### Slow Backend Response

**Diagnostics**:
```bash
# Time API calls
time curl http://localhost:3001/api/posts

# Check database query time
docker-compose -f docker-compose.dev.yml logs backend | grep -i "query"

# Check container resources
docker stats blog-backend-dev
```

**Solutions**:
- Add database indexes (already in migrations)
- Reduce page size for pagination
- Check for N+1 queries
- Add caching layer

---

### Slow Frontend Load

**Diagnostics**:
- Use browser DevTools Performance tab
- Check Network tab for slow requests
- Verify HMR is working

**Solutions**:
- Optimize bundle size
- Use lazy loading for routes
- Reduce number of re-renders
- Check for memory leaks in DevTools

---

## 📞 Getting Help

### Before Asking for Help

1. **Check logs**:
   ```bash
   docker-compose -f docker-compose.dev.yml logs backend > backend.log
   docker-compose -f docker-compose.dev.yml logs frontend > frontend.log
   ```

2. **Run test script**:
   ```bash
   ./backend/test-api.sh > test-results.txt 2>&1
   ```

3. **Document steps to reproduce**:
   - What were you trying to do?
   - What did you expect to happen?
   - What actually happened?
   - Error messages (exact text)

### Information to Include

- Docker version: `docker --version`
- Docker Compose version: `docker-compose --version`
- Operating system
- Log files (backend.log, frontend.log)
- Test results (test-results.txt)
- Relevant code snippets

---

## ✅ Health Check Script

Create `check-health.sh`:

```bash
#!/bin/bash

echo "🏥 System Health Check"
echo "====================="

# Check Docker
echo -n "Docker: "
docker --version > /dev/null 2>&1 && echo "✅" || echo "❌"

# Check containers
echo -n "Backend container: "
docker ps | grep blog-backend-dev > /dev/null && echo "✅" || echo "❌"

echo -n "Frontend container: "
docker ps | grep blog-frontend-dev > /dev/null && echo "✅" || echo "❌"

# Check services
echo -n "Backend API: "
curl -s http://localhost:3001/health > /dev/null && echo "✅" || echo "❌"

echo -n "Frontend: "
curl -s http://localhost:3000 > /dev/null && echo "✅" || echo "❌"

# Check database
echo -n "Database: "
docker-compose -f docker-compose.dev.yml exec -T backend \
  sqlite3 /app/data/blog.db "SELECT COUNT(*) FROM posts;" > /dev/null 2>&1 \
  && echo "✅" || echo "❌"

echo "====================="
echo "Check complete!"
```

```bash
chmod +x check-health.sh
./check-health.sh
```

---

**Last Updated**: 2025-01-08  
**Version**: 1.0
