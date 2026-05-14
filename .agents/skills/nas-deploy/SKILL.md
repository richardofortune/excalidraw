# SKILL.md

## Skill: nas-deploy

### Purpose
Automate deployment of projects (Node.js, static sites, Dockerized apps, etc.) to a user’s NAS (Network Attached Storage) device. Supports common NAS brands (Synology, QNAP, Unraid) and generic Linux-based NAS systems.

### Features
- Build project artifacts (production build, Docker image, etc.)
- Transfer files or images to NAS (via SCP, rsync, or Docker registry)
- Remotely start/stop/restart services (via SSH, Docker, or NAS API)
- Optionally configure reverse proxy or HTTPS (if supported by NAS)
- Support for environment variables and secrets
- Status reporting and error handling

### Inputs
- NAS connection info (host, port, user, auth method)
- Project type (Node.js, static, Docker, etc.)
- Deployment target (path, Docker service, etc.)
- Optional: environment variables, secrets, post-deploy commands

### Outputs
- Deployment status (success/failure)
- Logs of build, transfer, and deployment steps
- URL or endpoint of deployed service (if applicable)

### Example Usage
- Deploy a React app as a static site to a Synology NAS web folder
- Deploy a Dockerized app to a QNAP NAS Docker instance
- Restart a Node.js service on a Linux-based NAS after uploading new code

### Implementation Notes
- Use SSH for command execution and file transfer
- Use rsync for efficient file sync
- Use Docker CLI or Compose for container management
- Provide clear error messages and rollback on failure
- Allow dry-run mode for testing

### Security
- Never store plaintext credentials
- Support SSH key authentication
- Mask secrets in logs

### Extensibility
- Add support for more NAS brands/APIs
- Support for scheduled deployments
- Integration with CI/CD pipelines
