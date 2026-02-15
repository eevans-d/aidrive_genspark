#!/usr/bin/env bash
set -euo pipefail

forbidden_names=(
  "nueva carpeta"
  "new folder"
  "untitled"
  "untitled folder"
  "temp"
  "tmp"
)

violations=()

while IFS= read -r -d '' path; do
  if [[ "$path" == *" "* ]]; then
    violations+=("space:${path}")
  fi

  IFS='/' read -ra parts <<< "$path"
  for part in "${parts[@]}"; do
    part_lc=$(printf '%s' "$part" | tr '[:upper:]' '[:lower:]')
    for forbidden in "${forbidden_names[@]}"; do
      if [[ "$part_lc" == "$forbidden" ]]; then
        violations+=("forbidden:${path}")
      fi
    done
  done
done < <(git ls-files -z)

if (( ${#violations[@]} > 0 )); then
  echo "Path validation failed. Issues found:"
  for violation in "${violations[@]}"; do
    echo "- ${violation}"
  done
  echo ""
  echo "Remove spaces or generic folder/file names (e.g., 'Nueva carpeta', 'New folder', 'Untitled', 'temp')."
  exit 1
fi

echo "Path validation passed."
