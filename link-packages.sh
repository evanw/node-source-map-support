#!/usr/bin/env bash
set -euo pipefail
shopt -s inherit_errexit

__dirname="$(CDPATH= cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$__dirname"

[ -e node_modules/source-map ] && rm -r node_modules/source-map
ln -s ../../source-map ./node_modules/source-map
