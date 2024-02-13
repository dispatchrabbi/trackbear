#!/usr/bin/env bash
set -euo pipefail

sed -E \
  -e 's/^(.*PRAGMA.*)$/-- \1/' \
  -e 's/^INSERT INTO sqlite_sequence VALUES\('\''(.*)'\'',(.*)\);$/SELECT setval('\''"\1_id_seq"'\''::regclass,\2);/' \
  -e 's/(INSERT INTO )([^"]+)( VALUES)/\1"\2"\3/' \
  -e 's/1704516508/1704516508000/g' \
  -e 's/([0-9]{10})([0-9]{3})/to_timestamp(\1.\2)/g' \
  -e 's/^(INSERT INTO "User".*),(0|1),(.*)$/\1,\2 = 1,\3/' \
  -e 's/^(INSERT INTO "Project".*),(0|1),(to_timestamp.*)$/\1,\2 = 1,\3/' \
  -e 's/^(INSERT INTO "Banner".*),(0|1),(to_timestamp.*)$/\1,\2 = 1,\3/' \
  -e 's/^(.*DELETE FROM.*)$/-- \1/' \
  -e 's/^(.*CREATE (UNIQUE )?INDEX.*)$/-- \1/'

# -e 's/^INSERT INTO sqlite_sequence VALUES\(\x27(.*)\x27,(.*)\);$/SELECT setval(\x27"\1_id_seq"\x27::regclass,\2);/' \
