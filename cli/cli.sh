#!/usr/bin/env bash

#link="$(readlink -f "$BASH_SOURCE")";

link="$(readlink -f "$0")"
package_root="$(cd "$(dirname "$(dirname "$link")")" && pwd)"
commands="$package_root/dist/cli/commands"

first_arg="$1";
shift 1;

if [[ "$first_arg" == "build" ]]; then

   node "/build" "$@"

elif [[ "$first_arg" == "symlink" || "$first_arg" == "symlinks" ]]; then

   node "$commands/symlink" "$@"

else

   node "$commands/default" "$@"

fi

