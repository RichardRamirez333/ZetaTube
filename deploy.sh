#!/bin/bash
set -e

echo "=== Installing client dependencies ==="
cd client && npm install

echo "=== Building client ==="
npm run build

echo "=== Installing server dependencies ==="
cd ../server && npm install

echo "=== Building server ==="
npm run build

echo "=== Build complete ==="
cd ..
