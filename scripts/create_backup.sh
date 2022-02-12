#!/bin/bash
source /Users/daniel/Dropbox/workspace/listening-history-deno/secrets/daniel.env

pg_dump $SUPBASE_DATABASE_URL --no-acl --no-owner > /Users/daniel/Dropbox/backup/listening-history/supabase.sql

# archive the current postgres dump with date
cp /Users/daniel/Dropbox/backup/listening-history/supabase.sql "/Users/daniel/Dropbox/backup/listening-history/archive/supabase_$(date +%Y-%m-%d).sql"

# rotate postgres-archives
/Users/daniel/Dropbox/workspace/listening-history-deno/.direnv/python-3.10.0/bin/rotate-backups --daily=7 --weekly=7 --monthly=25 --yearly=5 /Users/daniel/Dropbox/backup/listening-history/archive
