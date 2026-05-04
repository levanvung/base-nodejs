# Node.js 3.0 Deployment

## Production architecture

- `app` and `worker` run in Docker on the VPS.
- `postgres`, `redis`, and `rabbitmq` stay on the private Docker network.
- `caddy` is optional and only used when a real domain is available.

## Temporary mode (no domain yet)

- Access API by IP: `http://<vps-ip>:3008`
- Keep port `3008` open in firewall.
- Deploy pipeline currently pulls only `app` and `worker` so it works without domain.

## HTTPS setup

Set these values in the VPS `.env` file:

- `APP_DOMAIN=api.example.com`
- `CADDY_EMAIL=admin@example.com`

Create a DNS `A` record for `APP_DOMAIN` that points to the VPS IP. Caddy will request and renew the TLS certificate automatically.

When domain and DNS are ready, start Caddy with the `https` profile:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile https up -d caddy
```

## Firewall

Without domain: expose `3008` temporarily.

With domain + HTTPS: expose only `80` and `443`; keep `3008`, `5432`, `6379`, `5672`, and `15672` private.

Example with UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3008/tcp
sudo ufw deny 5432/tcp
sudo ufw deny 6379/tcp
sudo ufw deny 5672/tcp
sudo ufw deny 15672/tcp
sudo ufw enable
```

If you prefer DigitalOcean Cloud Firewall, allow `22` and `3008` for temporary mode.

For HTTPS mode, update firewall rules to allow `22`, `80`, `443`, and close `3008`.

## Monitoring and alerts

- GitHub Actions already fails the deploy when the app does not become healthy.
- Add these GitHub secrets to enable Slack alerts:
	- `SLACK_WEBHOOK_URL`
	- `APP_PUBLIC_URL`
- The scheduled workflow checks `APP_PUBLIC_URL` every 5 minutes and sends a Slack alert if the health check fails.

## Deploy flow

1. Push code to `main` or `master`.
2. GitHub Actions builds and pushes the image.
3. The VPS pulls the image and restarts the stack.
4. Optional: after buying a domain, enable Caddy profile for HTTPS.
