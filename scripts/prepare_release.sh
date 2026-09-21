#!/usr/bin/env bash
set -euo pipefail
: "${GH_TOKEN:?RELEASE_TOKEN must be configured}"
: "${RELEASE_TAG:?}"
: "${GITHUB_REPOSITORY:?}"
: "${GITHUB_OUTPUT:?}"
test "$(gh api user --jq .login)" = "Rival99900"
source_sha="$(git rev-parse HEAD)"
release="$(gh api --paginate --slurp "repos/${GITHUB_REPOSITORY}/releases?per_page=100" |
  jq -c --arg tag "$RELEASE_TAG" '[.[][] | select(.tag_name == $tag)] |
    if length <= 1 then .[0] // null else error("Multiple matching releases") end')"
if test "$RELEASE_TAG" = v0.5.0; then
  tag_sha="$(gh api "repos/${GITHUB_REPOSITORY}/git/ref/tags/v0.5.0" --jq .object.sha)"
  if test "$tag_sha" != "$source_sha" && test "$tag_sha" != 4eac630f713a9e410fe13b5c260f1405ce1db17d; then
    echo "Unexpected v0.5.0 tag; refusing to replace it." >&2
    exit 1
  fi
  if test "$release" != null; then
    if test "$(jq -r .id <<<"$release")" = 392595787; then
      gh api --method DELETE "repos/${GITHUB_REPOSITORY}/releases/392595787"
      release=null
    elif ! jq -e --arg sha "$source_sha" '.draft == true and .target_commitish == $sha and .author.login == "Rival99900"' <<<"$release" >/dev/null; then
      echo "Unexpected replacement release; refusing to delete it." >&2
      exit 1
    fi
  fi
  if test "$tag_sha" != "$source_sha"; then
    gh api --method PATCH "repos/${GITHUB_REPOSITORY}/git/refs/tags/v0.5.0" -f sha="$source_sha" -F force=true >/dev/null
  fi
fi
if test "$release" = null; then
  gh release create "$RELEASE_TAG" --draft --target "$source_sha" \
    --title "Bloodborne Save Editor Enhanced ${RELEASE_TAG}" \
    --notes-file ".github/release-notes/${RELEASE_TAG}.md"
  release="$(gh api --paginate --slurp "repos/${GITHUB_REPOSITORY}/releases?per_page=100" |
    jq -ce --arg tag "$RELEASE_TAG" '[.[][] | select(.tag_name == $tag)] | if length == 1 then .[0] else error("Missing draft") end')"
fi
jq -e '.draft == true and .author.login == "Rival99900"' <<<"$release" >/dev/null
echo "release_id=$(jq -r .id <<<"$release")" >> "$GITHUB_OUTPUT"
