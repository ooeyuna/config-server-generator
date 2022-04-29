#!/bin/bash
set -e;

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; cd ..; pwd -P )

REPOSRC="git@github.com:ooeyuna/config-server-generator.git"
LOCALREPO="config-server-generator"
git clone "$REPOSRC" "$LOCALREPO" 2> /dev/null || git -C "$LOCALREPO" pull