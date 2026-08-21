# CI/CD implementation

This repository implements the complete three-stage pipeline from the Proxmox
Docker blueprint:

1. `Check` runs on pushes to `main` and can be started manually. It installs
   Node.js 24 through `mise`, installs the frozen pnpm workspace, runs linting,
   formatting, type checks, Trivy filesystem scanning, Semgrep SAST, tests and
   a non-publishing build.
2. `Build` starts only after a successful `Check` on `main` (or manually for an
   explicit SHA). It builds the service and client images independently, scans
   both final images with Trivy and publishes both the immutable commit SHA and
   the convenience `latest` tag to the local registry.
3. `Deploy` starts only after a successful `Build` on `main` (or manually for
   an explicit image SHA). It obtains the exact SHA from the Build artifact,
   copies the Compose and runtime configuration over SSH, validates the remote
   Compose model and deploys that immutable version.

The project and server mapping is held in `.github/ci/projects.json`. The
current self-hosted runner labels and homelab endpoints are:

- runner: `self-hosted`, `Linux`, `X64`, `production`
- production: `docker_deploy@192.168.1.160`
- registry: `192.168.1.162:5000`
- remote deployment directory: `/home/docker_deploy/esc-pos-multipack`

The runner must expose `git`, `jq`, `ssh`, `scp`, Docker with Compose, `mise`,
`trivy` and `semgrep` in the systemd service PATH. Its SSH key must be
authorized for `docker_deploy`; the runner and production Docker daemons must
accept the configured local HTTP registry.

`latest` is never used for deployment. The Build workflow uploads
`.pipeline/deploy-sha.txt`, and Deploy downloads it from that exact Build run.

