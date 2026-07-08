#!/bin/bash
set -e
echo "=== Install handled by npm workspaces ==="
npm install
echo "=== Building ==="
npm run build
echo "=== Build complete ==="