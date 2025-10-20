## Deploy & Test Guide

### Local (Node.js)
1. Install deps:
   - In `backend/`: `npm ci`
2. Build and run:
   - `npm run build`
   - Start server: `node dist/index.js`
   - Health: `curl http://localhost:8080/healthz`
3. WebSocket smoke test:
   - In a new terminal: `BASE_URL=http://localhost:8080 npm run smoke --prefix backend`

### Local (Docker Compose)
1. Build and run:
   - From repo root: `docker compose up -d --build`
2. Health check:
   - `curl http://localhost:8080/healthz`
3. WebSocket smoke:
   - `BASE_URL=http://localhost:8080 npm run smoke --prefix backend`
4. Stop:
   - `docker compose down`

### Kubernetes (dev)
1. Ensure a cluster with ingress (e.g., minikube with ingress addon).
2. Load local image or set a registry image:
   - Local: `minikube image load voxassist-backend:dev`
   - Or edit `k8s/deployment.yaml` image to GHCR image.
3. Apply manifests:
   - `kubectl apply -k k8s/`
4. Add DNS entry `/etc/hosts` -> `127.0.0.1 voxassist.local` (or use minikube tunnel):
   - `kubectl port-forward svc/voxassist-backend 8080:80` (alternative to ingress)
5. Verify:
   - `curl http://voxassist.local/healthz` or `http://127.0.0.1:8080/healthz`
6. Smoke test:
   - `BASE_URL=http://voxassist.local npm run smoke --prefix backend`

### CI (GitHub Actions)
- Workflow builds TS, runs local smoke test, then builds and pushes Docker image to GHCR: `ghcr.io/<owner>/voxassist-backend:latest`.
- Ensure repo has GitHub Packages enabled. Push to any branch to trigger.

### Postman
- Import `api/postman_environment.json` and `api/postman_collection.json`.
- Set `baseUrl` to your endpoint (local, compose, or ingress host).

### Notes
- JWT validation is stubbed; do not use in prod. Set `JWT_SECRET`.
- WebSocket auth is not enforced in stub; add JWT verify before production.
