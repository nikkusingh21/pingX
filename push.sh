#!/bin/bash
# PingX One-Click GitHub & Vercel Sync Script

COMMIT_MSG="${1:-Update PingX changes}"

echo "🔄 Adding changes..."
git add .

echo "💾 Committing: '$COMMIT_MSG'..."
git commit -m "$COMMIT_MSG" || echo "No new changes to commit."

echo "🚀 Pushing to GitHub (nikkusingh21/pingX)..."
git push origin main
git push origin gh-pages

echo ""
echo "================================================="
echo "✅ Code successfully pushed to GitHub!"
echo "⚡ Vercel & GitHub Pages will auto-deploy now."
echo "================================================="
