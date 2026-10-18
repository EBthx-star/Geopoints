#!/usr/bin/env bash
# Publier BTHX Travel sur GitHub Pages.
# Construit le fichier compilé, lance le banc de test, et ne pousse à GitHub
# que si les tests passent sans erreur console.
#
# Usage :
#   ./publish.sh "ton message de commit"
#
# S'il n'y a rien de nouveau à commiter, le script tente quand même un push
# (sans effet si GitHub est déjà à jour). Il faut être sur la branche main.

set -euo pipefail
set +m   # pas de notifications bruyantes quand on arrête le serveur HTTP
cd "$(dirname "$0")"

if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "Usage: ./publish.sh \"ton message de commit\""
  exit 1
fi
MSG="$1"

# --- Vérifications de base --------------------------------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Pas dans un dépôt git."
  exit 1
fi

BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Branche actuelle : $BRANCH"
  echo "   publish.sh ne pousse que depuis main. Change de branche d'abord :"
  echo "   git checkout main"
  exit 1
fi

# --- 1. Construction --------------------------------------------------------
echo "🔨 1/4 Construction du fichier compilé (docs/index.html)..."
./build.sh

# --- 2. Tests ---------------------------------------------------------------
echo "🧪 2/4 Lancement des tests (Playwright)..."

# Serveur HTTP temporaire pour que les tests puissent charger la page.
python3 -m http.server 8777 >/tmp/bthx-publish-server.log 2>&1 &
SERVER_PID=$!
disown $SERVER_PID 2>/dev/null || true
trap 'kill $SERVER_PID 2>/dev/null; rm -f /tmp/bthx-publish-server.log' EXIT

# Attendre que le serveur réponde (max 5 s)
for _ in 1 2 3 4 5; do
  if curl -s http://localhost:8777/ >/dev/null 2>&1; then break; fi
  sleep 1
done

TEST_LOG=/tmp/bthx-publish-tests.log
if ! node test/run.mjs >"$TEST_LOG" 2>&1; then
  echo "❌ Les tests ont planté. Rien n'a été publié."
  echo "   --- fin de la sortie des tests ---"
  tail -40 "$TEST_LOG"
  exit 1
fi
if ! grep -q "Aucune erreur console" "$TEST_LOG"; then
  echo "❌ Erreur console pendant les tests. Rien n'a été publié."
  echo "   --- fin de la sortie des tests ---"
  tail -40 "$TEST_LOG"
  exit 1
fi
echo "   ✓ Tests OK"

# --- 3. Commit --------------------------------------------------------------
echo "📝 3/4 Commit des changements..."
git add -A
if git diff --cached --quiet; then
  echo "   (rien de nouveau à commiter)"
else
  git commit -m "$MSG"
  echo "   ✓ $(git log -1 --oneline)"
fi

# --- 4. Push ----------------------------------------------------------------
echo "🚀 4/4 Push vers GitHub..."
git push origin main
echo ""
echo "✅ Publié. GitHub Pages rebâtit en 1-2 min."
echo "   URL : https://ebthx-star.github.io/Geopoints/"
