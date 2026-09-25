#!/usr/bin/env bash
set -euo pipefail
: "${GH_TOKEN:?RELEASE_TOKEN must be configured}"
: "${RELEASE_TAG:?}"
: "${GITHUB_REPOSITORY:?}"
: "${GITHUB_OUTPUT:?}"
test "$(gh api user --jq .login)" = "Rival99900"
source_sha="$(git rev-parse HEAD)"
# The failed refresh created an empty owner draft and already moved the tag.
# Allow this exact state to advance to a descendant containing the CI repair.
failed_refresh_sha=820bf555945e326552b689fb9e2d56af8e769474
release="$(gh api --paginate --slurp "repos/${GITHUB_REPOSITORY}/releases?per_page=100" |
  jq -c --arg tag "$RELEASE_TAG" '[.[][] | select(.tag_name == $tag)] |
    if length <= 1 then .[0] // null else error("Multiple matching releases") end')"
if test "$RELEASE_TAG" = v0.5.0; then
  tag_sha="$(gh api "repos/${GITHUB_REPOSITORY}/git/ref/tags/v0.5.0" --jq .object.sha)"
  if test "$tag_sha" != "$source_sha" && test "$tag_sha" != 4eac630f713a9e410fe13b5c260f1405ce1db17d && test "$tag_sha" != "$failed_refresh_sha"; then
    echo "Unexpected v0.5.0 tag; refusing to replace it." >&2
    exit 1
  fi
  if test "$release" != null; then
    if test "$(jq -r .id <<<"$release")" = 392595787; then
      gh api --method DELETE "repos/${GITHUB_REPOSITORY}/releases/392595787"
      release=null
    elif jq -e --arg sha "$failed_refresh_sha" '.id == 393144615 and .draft == true and .target_commitish == $sha and .author.login == "Rival99900" and (.assets | length) == 0' <<<"$release" >/dev/null; then
      # Reuse only the verified empty draft left by run 35629799374.
      release="$(gh api --method PATCH "repos/${GITHUB_REPOSITORY}/releases/393144615" -f target_commitish="$source_sha")"
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
  # Use the creation response directly: the release list may not expose a
  # newly created draft immediately. Never depend on a second list lookup.
  release="$(gh api --method POST "repos/${GITHUB_REPOSITORY}/releases" \
    -f tag_name="$RELEASE_TAG" -f target_commitish="$source_sha" \
    -f name="Bloodborne Save Editor Enhanced ${RELEASE_TAG}" \
    -F draft=true -F prerelease=false \
    -F "body=@.github/release-notes/${RELEASE_TAG}.md")"
fi
jq -e --arg tag "$RELEASE_TAG" --arg sha "$source_sha" \
  '.id > 0 and .tag_name == $tag and .draft == true and .target_commitish == $sha and .author.login == "Rival99900"' <<<"$release" >/dev/null
echo "release_id=$(jq -r .id <<<"$release")" >> "$GITHUB_OUTPUT"
