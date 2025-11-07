# Check backend health
curl http://localhost:3001/health

# Get posts
curl http://localhost:3001/api/posts

# Create a post
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Post","content":"Testing the API","author":"Developer"}'

# Visit frontend
open http://localhost:3000
