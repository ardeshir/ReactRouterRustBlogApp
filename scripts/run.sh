docker-compose -f docker-compose.dev.yml down -v

docker-compose -f docker-compose.dev.yml build --no-cache backend

docker-compose -f docker-compose.dev.yml up 
