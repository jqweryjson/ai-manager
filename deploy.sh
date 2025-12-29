#!/usr/bin/env bash
set -e

cd /opt/ai-manager/ai-manager

echo "[deploy] git pull"
git pull

echo "[deploy] build frontend"
cd frontend
npm ci
npm run build