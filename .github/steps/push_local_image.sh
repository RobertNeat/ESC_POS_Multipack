#!/usr/bin/env bash
set -euo pipefail

: "${REGISTRY:?REGISTRY is required}"
: "${IMAGE:?IMAGE is required}"
: "${SHA:?SHA is required}"
: "${CONFIG_FILE:=deploy/config.env}"

test -f "$CONFIG_FILE"
set -a
. "$CONFIG_FILE"
set +a

: "${IMAGE_TITLE:?IMAGE_TITLE is required in $CONFIG_FILE}"
: "${IMAGE_DESCRIPTION:?IMAGE_DESCRIPTION is required in $CONFIG_FILE}"
: "${IMAGE_VENDOR:?IMAGE_VENDOR is required in $CONFIG_FILE}"
: "${IMAGE_LICENSES:?IMAGE_LICENSES is required in $CONFIG_FILE}"
: "${IMAGE_SOURCE:?IMAGE_SOURCE is required in $CONFIG_FILE}"

image_ref="${REGISTRY}/${IMAGE}:${SHA}"
validate_image_labels() {
  local image_ref="$1"
  local label_name actual expected
  for label_name in title description vendor licenses source; do
    case "$label_name" in
      title) expected="$IMAGE_TITLE" ;;
      description) expected="$IMAGE_DESCRIPTION" ;;
      vendor) expected="$IMAGE_VENDOR" ;;
      licenses) expected="$IMAGE_LICENSES" ;;
      source) expected="$IMAGE_SOURCE" ;;
    esac
    actual="$(docker image inspect "$image_ref" --format "{{index .Config.Labels \"org.opencontainers.image.${label_name}\"}}")"
    [ "$actual" = "$expected" ] || {
      echo "Image label org.opencontainers.image.${label_name} does not match $CONFIG_FILE" >&2
      exit 4
    }
  done
}

if docker manifest inspect "$image_ref" >/dev/null 2>&1; then
  remote_digest="$(docker manifest inspect "$image_ref" --verbose | jq -r '.Descriptor.digest // empty' | head -n 1)"
  local_digest="$(docker image inspect "$image_ref" --format '{{index .RepoDigests 0}}' 2>/dev/null | sed 's/^.*@//' || true)"
  if [ -n "$remote_digest" ] && [ -n "$local_digest" ] && [ "$remote_digest" != "$local_digest" ]; then
    echo "Refusing to overwrite immutable tag $image_ref" >&2
    exit 3
  fi
  echo "Immutable tag already exists: $image_ref@$remote_digest"
  exit 0
fi

validate_image_labels "$image_ref"
docker push "$image_ref"
docker inspect --format='{{index .RepoDigests 0}}' "$image_ref"

