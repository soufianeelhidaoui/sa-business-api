#!/usr/bin/env sh

# Exist at first error (failfast)
set -o errexit

echo "Starting application"
exec pnpm run start
