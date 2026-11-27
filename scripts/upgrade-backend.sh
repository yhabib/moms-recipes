#!/usr/bin/env bash
# Upgrades the backend canister in 4 steps: stop, snapshot, upgrade, then start and check.
# If a step after the snapshot fails, the script restores the snapshot and starts the canister.
# Each run replaces the most recent snapshot.
# If the job is cancelled or killed, the backend can stay stopped. Then restore it by hand:
#   icp canister snapshot list backend -e ic
#   icp canister snapshot restore backend <snapshot-id> -e ic && icp canister start backend -e ic
#
# Usage: scripts/upgrade-backend.sh <environment> [identity]
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <environment> [identity]" >&2
  exit 2
fi

CANISTER=backend
icp_args=(-e "$1")
if [[ -n "${2:-}" ]]; then
  icp_args+=(--identity "$2")
fi

stopped=false
snapshot_id=""

recover() {
  local code=$?
  # A second signal must not stop the restore halfway.
  trap '' INT TERM
  if [[ $code -eq 0 || $stopped == false ]]; then
    exit "$code"
  fi
  set +e
  if [[ -n $snapshot_id ]]; then
    echo "::error::The backend upgrade failed. Restoring snapshot $snapshot_id." >&2
    # If the restore fails, a start would run the rejected upgrade.
    if ! icp canister stop "$CANISTER" "${icp_args[@]}" ||
      ! icp canister snapshot restore "$CANISTER" "$snapshot_id" "${icp_args[@]}"; then
      echo "::error::The restore of snapshot $snapshot_id failed. The backend stays stopped. Restore it by hand." >&2
      exit "$code"
    fi
  else
    echo "::error::The backend snapshot failed. Starting the canister again without an upgrade." >&2
  fi
  icp canister start "$CANISTER" "${icp_args[@]}"
  exit "$code"
}
trap recover EXIT
# A cancelled job must not exit with 0, or recover skips the restore.
trap 'exit 130' INT
trap 'exit 143' TERM

echo "Building $CANISTER"
icp build "$CANISTER" "${icp_args[@]:0:2}"

# A backend that is not running can be the rejected upgrade of a failed restore.
# A new snapshot would then replace the only good one.
before=$(icp canister status "$CANISTER" --json "${icp_args[@]}" | jq -r '.status')
if [[ $before != "Running" ]]; then
  echo "::error::$CANISTER is $before, not Running. Restore it by hand first (see the top of $0)." >&2
  exit 1
fi

echo "Stopping $CANISTER"
# The IC can finish the stop even if the call fails here.
stopped=true
icp canister stop "$CANISTER" "${icp_args[@]}"

echo "Taking a snapshot of $CANISTER"
previous=$(icp canister snapshot list "$CANISTER" --json "${icp_args[@]}" |
  jq -r '.snapshots | sort_by(.taken_at_timestamp) | last | .snapshot_id // empty')
replace_args=()
if [[ -n $previous ]]; then
  replace_args=(--replace "$previous")
fi
snapshot_id=$(icp canister snapshot create "$CANISTER" --json ${replace_args[@]+"${replace_args[@]}"} "${icp_args[@]}" |
  jq -er '.snapshot_id')
echo "Snapshot: $snapshot_id"

echo "Upgrading $CANISTER"
icp deploy "$CANISTER" --mode upgrade "${icp_args[@]}"

echo "Starting $CANISTER"
icp canister start "$CANISTER" "${icp_args[@]}"

echo "Checking $CANISTER"
status=$(icp canister status "$CANISTER" --json "${icp_args[@]}" | jq -r '.status')
if [[ $status != "Running" ]]; then
  echo "::error::$CANISTER is $status after the upgrade, not Running." >&2
  exit 1
fi
# A failed check restores the snapshot and loses the writes since the start, so retry a network error first.
for attempt in 1 2 3; do
  if icp canister call "$CANISTER" listRecipes '()' --query "${icp_args[@]}" >/dev/null; then
    break
  fi
  if [[ $attempt -eq 3 ]]; then
    echo "::error::listRecipes failed 3 times after the upgrade." >&2
    exit 1
  fi
  sleep 5
done

echo "$CANISTER is upgraded and running"
