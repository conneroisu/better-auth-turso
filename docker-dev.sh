#!/bin/bash

# Better Auth Turso - Docker Development Helper
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Help function
show_help() {
    cat << EOF
Better Auth Turso - Docker Development Helper

Usage: $0 [COMMAND]

Commands:
  dev         Start development environment
  prod        Start production environment
  build       Build all images
  clean       Clean up containers and images
  logs        Show logs for running containers
  shell       Open shell in development container
  db-setup    Initialize database
  test        Run tests in container
  stop        Stop all services
  restart     Restart services
  help        Show this help message

Examples:
  $0 dev              # Start development server
  $0 prod             # Start production server  
  $0 shell            # Open shell in dev container
  $0 logs             # Show container logs
  $0 clean            # Clean up everything

EOF
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Development environment
dev() {
    print_header "Starting Development Environment"
    check_docker
    
    print_status "Creating development database..."
    docker-compose --profile setup run --rm db-setup
    
    print_status "Starting development server..."
    docker-compose --profile dev up --build app-dev
}

# Production environment
prod() {
    print_header "Starting Production Environment"
    check_docker
    
    print_status "Building production image..."
    docker-compose --profile prod build app-prod
    
    print_status "Starting production server..."
    docker-compose --profile prod up app-prod
}

# Build all images
build() {
    print_header "Building All Images"
    check_docker
    
    print_status "Building development image..."
    docker-compose build app-dev
    
    print_status "Building production image..."
    docker-compose build app-prod
    
    print_status "Build complete!"
}

# Clean up
clean() {
    print_header "Cleaning Up Docker Resources"
    check_docker
    
    print_warning "This will remove all containers, images, and volumes related to this project."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping all services..."
        docker-compose --profile dev --profile prod --profile tools down -v --remove-orphans
        
        print_status "Removing images..."
        docker images --filter "reference=better-auth-turso*" -q | xargs -r docker rmi -f
        
        print_status "Cleaning up dangling images..."
        docker image prune -f
        
        print_status "Clean up complete!"
    else
        print_status "Clean up cancelled."
    fi
}

# Show logs
logs() {
    print_header "Container Logs"
    check_docker
    
    docker-compose logs -f
}

# Open shell in development container
shell() {
    print_header "Opening Shell in Development Container"
    check_docker
    
    if ! docker-compose --profile dev ps | grep -q "app-dev"; then
        print_warning "Development container is not running. Starting it first..."
        docker-compose --profile dev up -d app-dev
        sleep 3
    fi
    
    print_status "Opening shell..."
    docker-compose --profile dev exec app-dev /bin/bash
}

# Initialize database
db_setup() {
    print_header "Database Setup"
    check_docker
    
    print_status "Creating database file..."
    docker-compose --profile setup run --rm db-setup
    
    print_status "Database setup complete!"
}

# Run tests
test() {
    print_header "Running Tests"
    check_docker
    
    print_status "Running adapter tests..."
    docker-compose --profile dev run --rm app-dev bun test
    
    print_status "Running example tests..."
    docker-compose --profile dev run --rm app-dev sh -c "cd examples/nextjs && bun test"
    
    print_status "Tests complete!"
}

# Stop all services
stop() {
    print_header "Stopping All Services"
    check_docker
    
    print_status "Stopping services..."
    docker-compose --profile dev --profile prod --profile tools down
    
    print_status "All services stopped!"
}

# Restart services
restart() {
    print_header "Restarting Services"
    stop
    sleep 2
    dev
}

# Main command handler
case "${1:-help}" in
    dev)
        dev
        ;;
    prod)
        prod
        ;;
    build)
        build
        ;;
    clean)
        clean
        ;;
    logs)
        logs
        ;;
    shell)
        shell
        ;;
    db-setup)
        db_setup
        ;;
    test)
        test
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac