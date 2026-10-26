#!/bin/zsh
# Risse Application Launcher (macOS)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================================"
echo "  Starting Risse Application (Laravel Backend + Vue 3)"
echo "========================================================"
echo ""

# Clear Laravel config cache and remove stale hot file
echo "[1/3] Clearing Laravel config cache..."
cd "$SCRIPT_DIR/backend"
php artisan config:clear
rm -f "$SCRIPT_DIR/backend/public/hot"

# Launch Laravel backend in a new Terminal tab/window
echo "[2/3] Launching Laravel backend on http://127.0.0.1:8000..."
osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR/backend' && php artisan serve --port=8000\""

# Launch Vite frontend dev server in a new Terminal tab/window
echo "[3/3] Launching Vite frontend dev server on http://127.0.0.1:5173..."
osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR/frontend' && npm run dev\""

echo ""
echo "========================================================"
echo "  Risse Servers are Starting!"
echo "  - Open: http://127.0.0.1:8000 in your browser"
echo "========================================================"
echo ""
