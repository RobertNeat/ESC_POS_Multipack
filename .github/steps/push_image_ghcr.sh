#!/usr/bin/env bash
set -euo pipefail

: "${LOCAL_REGISTRY:?LOCAL_REGISTRY is required}"
: "${IMAGE:?IMAGE is required}"
: "${SOURCE_SHA:?SOURCE_SHA is required}"
: "${RELEASE_TAG:?RELEASE_TAG is required}"
: "${GHCR_OWNER:?GHCR_OWNER is required}"
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

[[ "$SOURCE_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "A lowercase full commit SHA is required" >&2; exit 2; }
source_image="${LOCAL_REGISTRY}/${IMAGE}:${SOURCE_SHA}"
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

version="${RELEASE_TAG#release_}"
destination="ghcr.io/${GHCR_OWNER,,}/${IMAGE}:${version}"
docker pull "$source_image"
validate_image_labels "$source_image"
source_digest="$(docker image inspect "$source_image" --format '{{index .RepoDigests 0}}' | sed 's/^.*@//')"

if docker manifest inspect "$destination" >/dev/null 2>&1; then
  destination_digest="$(docker manifest inspect "$destination" --verbose | jq -r '.Descriptor.digest // empty' | head -n 1)"
  [ "$source_digest" = "$destination_digest" ] || { echo "Refusing to overwrite release $destination" >&2; exit 3; }
  echo "Release already exists: $destination@$destination_digest"
  exit 0
fi

docker tag "$source_image" "$destination"
docker push "$destination"
echo "$destination@$source_digest"

