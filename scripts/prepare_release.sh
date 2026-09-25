#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "::error::Release preparation failed at line ${LINENO}." >&2' ERR
: "${GH_TOKEN:?RELEASE_TOKEN must be configured}"
: "${RELEASE_TAG:?}"
: "${GITHUB_REPOSITORY:?}"
: "${GITHUB_OUTPUT:?}"
if test "$(gh api user --jq .login)" != "Rival99900"; then
  echo "::error::RELEASE_TOKEN must belong to Rival99900." >&2
  exit 1
fi
source_sha="$(git rev-parse HEAD)"
first_refresh_sha=820bf555945e326552b689fb9e2d56af8e769474
failed_refresh_sha=9c6b4a0079c243c78c0795f51fb83a6a70b2b3ce
# Recover this exact owner draft even if moving the tag detached it.
recovery_id=393144615
recovery_tag=untagged-75abb2d1a9c279164fe4
release="$(gh api --paginate --slurp "repos/${GITHUB_REPOSITORY}/releases?per_page=100" |
  jq -c --arg tag "$RELEASE_TAG" --arg recovery_tag "$recovery_tag" --argjson recovery_id "$recovery_id" '
    [.[][] | select(.tag_name == $tag or
      ($tag == "v0.5.0" and .id == $recovery_id and .tag_name == $recovery_tag))] |
    if length <= 1 then .[0] // null else error("Multiple matching releases") end')"
if test "$RELEASE_TAG" = v0.5.0; then
  tag_sha="$(gh api "repos/${GITHUB_REPOSITORY}/git/ref/tags/v0.5.0" --jq .object.sha)"
  if test "$tag_sha" != "$source_sha" && test "$tag_sha" != "$first_refresh_sha" && test "$tag_sha" != "$failed_refresh_sha"; then
    echo "::error::Unexpected v0.5.0 tag; refusing to replace it." >&2
    exit 1
  fi
fi
repair_draft=false
if test "$release" != null; then
  if jq -e --arg tag "$RELEASE_TAG" --arg sha "$source_sha" '
    .tag_name == $tag and .draft == true and .target_commitish == $sha and .author.login == "Rival99900"' <<<"$release" >/dev/null; then
    # A rerun on the same source can retain already uploaded assets.
    :
  elif test "$RELEASE_TAG" = v0.5.0 && jq -e \
    --arg first "$first_refresh_sha" --arg failed "$failed_refresh_sha" --arg sha "$source_sha" \
    --argjson id "$recovery_id" '
      .id == $id and .draft == true and .author.login == "Rival99900" and
      (.assets | length) == 0 and
      (.target_commitish == $first or .target_commitish == $failed or .target_commitish == $sha)' <<<"$release" >/dev/null; then
    repair_draft=true
  else
    echo "::error::Unexpected release state; refusing to modify it." >&2
    exit 1
  fi
fi
if test "$RELEASE_TAG" = v0.5.0 && test "$tag_sha" != "$source_sha"; then
  # Move the Git tag FIRST. Then explicitly bind the draft to it, because
  # an existing draft can become untagged when its original tag is moved.
  gh api --method PATCH "repos/${GITHUB_REPOSITORY}/git/refs/tags/v0.5.0" \
    -f sha="$source_sha" -F force=true >/dev/null
  if test "$release" != null; then repair_draft=true; fi
fi
if test "$repair_draft" = true; then
  release_id="$(jq -r .id <<<"$release")"
  release="$(gh api --method PATCH "repos/${GITHUB_REPOSITORY}/releases/${release_id}" \
    -f tag_name="$RELEASE_TAG" -f target_commitish="$source_sha" -F draft=true)"
fi
if test "$release" = null; then
  # Use the creation response directly; do not immediately requery the list.
  release="$(gh api --method POST "repos/${GITHUB_REPOSITORY}/releases" \
    -f tag_name="$RELEASE_TAG" -f target_commitish="$source_sha" \
    -f name="Bloodborne Save Editor Enhanced ${RELEASE_TAG}" \
    -F draft=true -F prerelease=false \
    -F "body=@.github/release-notes/${RELEASE_TAG}.md")"
fi
if ! jq -e --arg tag "$RELEASE_TAG" --arg sha "$source_sha" '
  (.id | type) == "number" and .id > 0 and .tag_name == $tag and
  .draft == true and .target_commitish == $sha and .author.login == "Rival99900"' <<<"$release" >/dev/null; then
  echo "::error::Prepared draft has an unexpected ID, tag, target, state or author." >&2
  jq '{id, tag_name, target_commitish, draft, author: .author.login}' <<<"$release" >&2
  exit 1
fi
if test "$RELEASE_TAG" = v0.5.0; then
  test "$(gh api "repos/${GITHUB_REPOSITORY}/git/ref/tags/v0.5.0" --jq .object.sha)" = "$source_sha"
fi
echo "Prepared ${RELEASE_TAG} draft $(jq -r .id <<<"$release") at ${source_sha}."
echo "release_id=$(jq -r .id <<<"$release")" >> "$GITHUB_OUTPUT"
