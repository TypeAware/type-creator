#!/usr/bin/env bash

#link="$(readlink -f "$BASH_SOURCE")";

# link="$(readlink -f "$0")"

link="$(realpath "$0")"
package_root="$(cd "$(dirname "$(dirname "$link")")" && pwd)"


first_arg="$1";
shift 1;

if [[ "$first_arg" == "build" ]]; then

   node "$package_root/dist/cli/commands/build" "$@"

elif [[ "$first_arg" == "symlink" || "$first_arg" == "symlinks" ]]; then

   node "$package_root/dist/cli/commands/symlink" "$@"

else

   node "$package_root/dist/cli/commands/default" "$@"

fi

