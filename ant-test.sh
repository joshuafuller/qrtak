#!/bin/bash

# Simple ANT-style test runner for qrtak

echo "======================================"
echo "    ANT Test Runner for QR TAK"
echo "======================================"

# Function to run a target
run_target() {
    case "$1" in
        "test")
            echo "[ANT] Running target: test"
            echo "[ANT] Executing: npm test"
            npm test
            if [ $? -eq 0 ]; then
                echo "[ANT] BUILD SUCCESSFUL"
            else
                echo "[ANT] BUILD FAILED"
                exit 1
            fi
            ;;
        "test-coverage")
            echo "[ANT] Running target: test-coverage"
            echo "[ANT] Executing: npm test -- --coverage"
            npm test -- --coverage
            ;;
        "quick")
            echo "[ANT] Running target: quick-test"
            echo "[ANT] Executing: npm test -- --passWithNoTests"
            npm test -- --passWithNoTests
            ;;
        *)
            echo "[ANT] Unknown target: $1"
            echo "[ANT] Available targets: test, test-coverage, quick"
            exit 1
            ;;
    esac
}

# Main execution
TARGET=${1:-test}
START_TIME=$(date +%s)

run_target "$TARGET"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "[ANT] Total time: ${DURATION} seconds"
echo "======================================"