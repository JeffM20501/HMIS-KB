# Runbook - HMIS-KB on AWS EKS

This document covers troubleshooting common issues encountered during deployment and operation of the HMIS-KB application on the shared EKS cluster.

---

## How to check status

### Pods

```bash
kubectl get pods -n <your-namespace>
kubectl describe pod <pod-name> -n <your-namespace>
kubectl logs <pod-name> -n <your-namespace>
kubectl logs <pod-name> -n <your-namespace> --previous   # previous crash logS
```

## Services and Ingress

```bash
kubectl get svc -n <your-namespace>
kubectl get ingress -n <your-namespace>
kubectl describe ingress -n <your-namespace>
```

## Deployment

```bash
kubectl get deployments -n <your-namespace>
kubectl rollout status deployment/<deployment-name> -n <your-namespace>
```

## Common Issues & Solutions

**1. Pod in `CrashLoopBackOff`**
**Symptoms**: Pod restarts repeatedly, health checks fail.

**Causes:**

- OOM (Out of Memory) – check limits.
- Startup error (missing env, database connection, import error).
- Health check failing (wrong port or path).

**Diagnostics:**

```bash
kubectl logs <pod-name> -n <your-namespace> --previous
kubectl describe pod <pod-name> -n <your-namespace> | grep -A10 "Events"
```

**Solutions:**

- Increase memory limit in Deployment (e.g., from 128Mi to 1Gi).
- Check environment variables:
    `kubectl exec -it <pod> -n <your-namespace> -- env | grep DB_`
- Verify `ALLOWED_HOSTS` includes the pod's internal IP or use `['*']` in DEBUG mode.
- Correct the health check path and `port` (e.g., `/health/` on port `8080` for backend).

**2. ImagePullBackOff**
**Symptoms:** Pod status shows `ImagePullBackOff` or `ErrImagePull`.

**Causes:**

- Incorrect image name or tag.
- ECR credentials missing or invalid.

**Diagnostics:**

```bash
kubectl describe pod <pod-name> -n <your-namespace> | grep -i "pull"
```

**Solutions:**

- Verify the image URL in the Deployment matches the ECR repository.
- Ensure the imagePullSecrets is present and correct

```bash
kubectl get secret ecr-registry-secret -n <your-namespace>
```

> If missing, recreate it (see below).

**3. Database Connection Errors**
**Symptoms:** Logs show django.db.utils.OperationalError or Can't connect to MySQL server.

**Causes:**

- Wrong `DB_HOST`, `DB_USER`, `DB_PASSWORD`, or `DB_PORT`.
- Database unreachable from inside the cluster.

**Solutions:**

- Override `DB_HOST` in the Deployment environment variables:

```yaml
env:
- name: `DB_HOST`
  value: "your-db-host"
```

- Test connectivity from inside the pod:

```bash
kubectl exec -it <pod> -n <your-namespace> -- bash
apt-get update && apt-get install -y mysql-client
mysql -h $`DB_HOST` -u $DB_USER -p$DB_PASSWORD -P $DB_PORT -D $DB_NAME -e "SELECT 1;"
```

> If it fails, credentials are wrong or network is blocked.

**4. Migration Errors (MySQL syntax)**
**Symptoms:** Logs show`pymysql.err.ProgrammingError: (1064, "You have an error in your SQL syntax")`

**Cause:** A migration uses `default=None` which is invalid for MySQL.

**Fix:**

- Edit  and edit the migration file causing the error. eg:
    --> Change default=None to default='article' (or a suitable default)
- Rebuild the image and redeploy.

Rebuild the image and redeploy.

**5. Health Checks Failing (DisallowedHost)**
**Symptoms:** Logs show Invalid HTTP_HOST header: '192.168.x.x:8080'.

**Fix:** Update settings.py:

```python
if DEBUG:
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver').split(',')
```

> Then rebuild image.

**6. OOM Kills (Exit Code 137)**
**Symptoms:** Pod killed with exit code 137.

Fix: Increase `resources.limits.memory` in the Deployment, e.g.:

```yaml
resources:
  limits:
    memory: "2Gi"
    cpu: "500m"
  requests:
    memory: "512Mi"
    cpu: "250m"
```

**7. Ingress Not Routing**
**Symptoms:** Ingress URL returns 404 or 502.

**Checks:**

- Ensure the Ingress host matches the DNS record.
- Verify the Service is of type ClusterIP and the backend service name/port are correct.
- Check the Ingress Controller logs:

```bash
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx --tail=50
```

## Managing Secrets

### ECR imagePullSecret

If the secret is missing, recreate it:

```bash
kubectl create secret docker-registry ecr-registry-secret \
  --docker-server=<account-id>.dkr.ecr.<your-region>.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region <you-region> --profile <you-aws-cli-profile>) \
  --docker-email=your-email@example.com \
  -n <your-namspace>
```

### Django Secret Key

Create the secret if missing:

```bash
kubectl create secret generic django-secrets \
  --namespace <your-namespace> \
  --from-literal=SECRET_KEY="your-django-secret-key"
```

## Running Migrations Manually

If migrations fail during deployment, you can run them inside the pod:

```bash
kubectl exec -it <backend-pod> -n <your-namespace> -- python manage.py migrate
```

## Rolling Back a Deployment

To revert to a previous image tag:

```bash
kubectl rollout undo deployment/<your-app-name> -n <your-namespace>
kubectl rollout status deployment/<your-app-name> -n <your-namespace>
```

## Monitoring

- **Pod logs:** Use `kubectl logs -f <pod-name> -n <your-namespace>`

- **Resource usage:** `kubectl top pods -n <your-namespace>`

- **Events:** `kubectl get events -n <your-namespace> --sort-by='.lastTimestamp'`
