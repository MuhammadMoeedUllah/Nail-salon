#!/bin/sh
set -e
mkdir -p "$(dirname "$DATABASE_URL")" "$PHOTO_DIR"
if [ -n "$LITESTREAM_REPLICA_URL" ] && command -v litestream >/dev/null 2>&1; then
  # Restore on an empty volume, then run the app under Litestream replication.
  if [ ! -f "$DATABASE_URL" ]; then
    litestream restore -if-replica-exists -config /etc/litestream.yml "$DATABASE_URL" || true
  fi
  exec litestream replicate -config /etc/litestream.yml -exec "node build"
else
  if [ -n "$LITESTREAM_REPLICA_URL" ]; then
    echo "warning: LITESTREAM_REPLICA_URL is set but litestream is not installed; running without backups" >&2
  fi
  exec node build
fi
