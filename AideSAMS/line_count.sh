#!/usr/bin/env bash

set -euo pipefail

TARGET="."
EXT_REGEX=""
EXCLUDE_DIRS=".git|node_modules|build|dist"

usage() {
  cat <<EOF
Usage: $0 [-e "ext1|ext2"] [-x "dir1|dir2"] [path]
  -e  regex d'extensions (sans le point), ex: "py|js|c|h"
  -x  répertoires à exclure (séparés par |), ex: "node_modules|.git"
If no path given, uses current directory.
EOF
  exit 1
}

while getopts ":e:x:h" opt; do
  case $opt in
    e) EXT_REGEX="$OPTARG" ;;
    x) EXCLUDE_DIRS="$OPTARG" ;;
    h) usage ;;
    \?) echo "Option invalide: -$OPTARG" >&2; usage ;;
    :) echo "L'option -$OPTARG requiert un argument." >&2; usage ;;
  esac
done
shift $((OPTIND-1))
if [ $# -ge 1 ]; then
  TARGET="$1"
fi

find_exclude_args=()
IFS='|' read -ra parts <<< "$EXCLUDE_DIRS"
for p in "${parts[@]}"; do
  p="$(printf "%s" "$p" | sed 's/^ *//;s/ *$//')"
  [ -z "$p" ] && continue
  find_exclude_args+=( -not -path "*/$p/*" )
done

candidates=()
while IFS= read -r -d '' file; do
  candidates+=("$file")
done < <(find "$TARGET" -type f "${find_exclude_args[@]}" -print0 2>/dev/null)

if [ ${#candidates[@]} -eq 0 ]; then
  echo "Aucun fichier trouvé (vérifiez le chemin/exclusions/extensions)." >&2
  exit 0
fi

if [ -n "$EXT_REGEX" ]; then
  filtered=()
  for f in "${candidates[@]}"; do
    lower=$(printf "%s" "$f" | tr '[:upper:]' '[:lower:]')
    if printf "%s" "$lower" | grep -Eq "\.($EXT_REGEX)$"; then
      filtered+=("$f")
    fi
  done
  candidates=("${filtered[@]}")
fi

if [ ${#candidates[@]} -eq 0 ]; then
  echo "Aucun fichier correspondant au filtre d'extension." >&2
  exit 0
fi

text_files=()
if command -v file >/dev/null 2>&1; then
  for f in "${candidates[@]}"; do
    mtype=$(file --mime-type -Lb -- "$f" 2>/dev/null || echo "application/octet-stream")
    case "$mtype" in
      text/*|application/xml|application/json) text_files+=("$f") ;;
      *) ;;
    esac
  done
else
  text_files=("${candidates[@]}")
fi

if [ ${#text_files[@]} -eq 0 ]; then
  echo "Aucun fichier texte détecté parmi les fichiers candidats." >&2
  exit 0
fi

declare -A file_lines
total=0
for f in "${text_files[@]}"; do
  if cnt=$(wc -l < "$f" 2>/dev/null || true); then
    cnt=$(printf "%s" "$cnt" | tr -d '[:space:]')
    cnt=${cnt:-0}
  else
    cnt=0
  fi
  file_lines["$f"]=$cnt
  total=$((total + cnt))
done

echo "TOTAL_LINES: $total"
echo

declare -A dir_lines
for f in "${!file_lines[@]}"; do
  cnt=${file_lines["$f"]}
  dir=$(dirname -- "$f")
  if [ "$TARGET" != "." ]; then
    case "$dir" in
      "$TARGET"/*) dir="${dir#$TARGET/}" ;;
      "$TARGET") dir="." ;;
    esac
  fi
  if [ -z "${dir_lines[$dir]+_}" ]; then
    dir_lines[$dir]=$cnt
  else
    dir_lines[$dir]=$((dir_lines[$dir] + cnt))
  fi
done

echo "LINES_PER_DIRECTORY (sorted desc):"
for k in "${!dir_lines[@]}"; do
  printf "%d\t%s\n" "${dir_lines[$k]}" "$k"
done | sort -nr -k1,1
echo

echo "LINES_PER_FILE (sorted desc):"
for f in "${!file_lines[@]}"; do
  printf "%d\t%s\n" "${file_lines[$f]}" "$f"
done | sort -nr -k1,1

exit 0
