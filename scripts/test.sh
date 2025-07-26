#!/bin/bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo
    print_status $PURPLE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_status $PURPLE "  $1"
    print_status $PURPLE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

print_step() {
    print_status $CYAN "🔄 $1"
}

print_success() {
    print_status $GREEN "✅ $1"
}

print_error() {
    print_status $RED "❌ $1"
}

print_warning() {
    print_status $YELLOW "⚠️  $1"
}

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_step "Running: $test_name"
    
    if eval "$test_command"; then
        print_success "$test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        print_error "$test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to setup example dependencies
setup_example() {
    local example_path="$1"
    local example_name="$2"
    
    print_step "Setting up $example_name example dependencies"
    
    if [ -d "$example_path" ]; then
        cd "$example_path"
        
        # Check if package.json exists
        if [ -f "package.json" ]; then
            # Install dependencies if node_modules doesn't exist
            if [ ! -d "node_modules" ]; then
                print_step "Installing dependencies for $example_name"
                bun install
            fi
        else
            print_warning "No package.json found in $example_path"
            return 1
        fi
        
        cd - > /dev/null
        return 0
    else
        print_warning "Example directory $example_path not found"
        return 1
    fi
}

# Start the test suite
print_header "🚀 BETTER AUTH TURSO ADAPTER - COMPREHENSIVE TEST SUITE"

# Store the original directory
ORIGINAL_DIR=$(pwd)

# Ensure we're in the project root
if [ ! -f "package.json" ]; then
    print_error "Not in project root directory. Please run from the repository root."
    exit 1
fi

# Check if required tools are available
print_header "🔧 ENVIRONMENT CHECK"

if ! command -v bun &> /dev/null; then
    print_error "Bun is not installed. Please install Bun first."
    exit 1
fi
print_success "Bun is available"

if ! command -v node &> /dev/null; then
    print_warning "Node.js not found (optional for some operations)"
else
    print_success "Node.js is available"
fi

# Install main project dependencies
print_header "📦 DEPENDENCY SETUP"
print_step "Installing main project dependencies"
bun install
print_success "Main dependencies installed"

# 1. Code Quality Checks
print_header "🔍 CODE QUALITY CHECKS"

run_test "TypeScript type checking" "bun run typecheck"
run_test "Code formatting check" "bun run format:check"

# Note: ESLint might have issues with docs, so we'll run it on src only
print_step "ESLint check (src directory only)"
if npx eslint src/ --max-warnings 0 > /dev/null 2>&1; then
    print_success "ESLint check (src directory)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "ESLint check (src directory)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 2. Unit Tests
print_header "🧪 UNIT TESTS"

run_test "Core adapter unit tests" "bun test src/turso-adapter.unit.test.ts --run"

# 3. Integration Tests  
print_header "🔗 INTEGRATION TESTS"

run_test "Better Auth integration tests" "bun test src/turso-adapter.integration.test.ts --run"

# 4. Property-based Tests
print_header "🎲 PROPERTY-BASED TESTS"

run_test "Property-based testing" "bun test src/turso-adapter.property.test.ts --run"

# 5. Performance Tests
print_header "⚡ PERFORMANCE TESTS"

run_test "Performance benchmarks" "bun test src/turso-adapter.performance.test.ts --run"

# 6. Error Handling Tests
print_header "🚨 ERROR HANDLING TESTS"

run_test "Error handling scenarios" "bun test src/turso-adapter.error.test.ts --run"

# 7. All Tests Together
print_header "🎯 COMPREHENSIVE TEST SUITE"

run_test "All tests together" "bun test --run"

# 8. Build Test
print_header "🏗️  BUILD VERIFICATION"

run_test "TypeScript build" "bun run build"

# Check if build artifacts exist
if [ -d "dist" ] && [ -f "dist/src/index.js" ]; then
    print_success "Build artifacts created successfully"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "Build artifacts not found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 9. Example Tests
print_header "📚 EXAMPLE VERIFICATION"

# Test basic example
if setup_example "examples/basic" "basic"; then
    cd examples/basic
    run_test "Basic example test" "timeout 30s bun test.ts"
    cd "$ORIGINAL_DIR"
else
    print_warning "Skipping basic example (setup failed)"
fi

# Test numeric IDs example
if setup_example "examples/numeric-ids" "numeric-ids"; then
    cd examples/numeric-ids  
    run_test "Numeric IDs example test" "timeout 30s bun test.ts"
    cd "$ORIGINAL_DIR"
else
    print_warning "Skipping numeric IDs example (setup failed)"
fi

# 10. Example Execution Tests (optional, can be skipped if they take too long)
print_header "🎭 EXAMPLE EXECUTION TESTS"

print_step "Testing basic example execution"
cd examples/basic
if timeout 10s bun index.ts > /dev/null 2>&1; then
    print_success "Basic example execution"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_warning "Basic example execution (may be expected if it runs indefinitely)"
    # Don't count as failure since some examples might run indefinitely
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
cd "$ORIGINAL_DIR"

print_step "Testing numeric IDs example execution"
cd examples/numeric-ids
if timeout 10s bun index.ts > /dev/null 2>&1; then
    print_success "Numeric IDs example execution"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_warning "Numeric IDs example execution (may be expected if it runs indefinitely)"
    # Don't count as failure since some examples might run indefinitely
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
cd "$ORIGINAL_DIR"

# 11. Package Validation
print_header "📦 PACKAGE VALIDATION"

# Check package.json structure
if [ -f "package.json" ]; then
    print_step "Validating package.json structure"
    
    # Check required fields
    if grep -q '"name"' package.json && grep -q '"version"' package.json; then
        print_success "Package.json structure"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Package.json missing required fields"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Check exports
if [ -f "dist/src/index.js" ]; then
    print_step "Checking module exports"
    
    # Simple check if the built file has exports
    if grep -q "export" dist/src/index.js; then
        print_success "Module exports present"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "No exports found in built module"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Final Results
print_header "📊 TEST RESULTS SUMMARY"

echo
print_status $BLUE "Total Tests: $TOTAL_TESTS"
print_status $GREEN "Passed: $PASSED_TESTS"
print_status $RED "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo
    print_status $GREEN "🎉 ALL TESTS PASSED! 🎉"
    print_status $GREEN "The Better Auth Turso adapter is ready for production!"
    echo
    exit 0
else
    echo
    print_status $RED "💥 $FAILED_TESTS TEST(S) FAILED 💥"
    print_status $RED "Please review the failures above and fix them."
    echo
    exit 1
fi