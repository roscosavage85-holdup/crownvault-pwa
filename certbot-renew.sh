18. AUTOMATED SSL RENEWAL SCRIPT (certbot-renew.sh)
 * FILE: certbot-renew.sh
 ******************************************************************************/

#!/bin/bash
# ==============================================================================
# Automated Certbot SSL Renewal & NGINX Reload Script
# ==============================================================================
# Usage: Run via root crontab twice daily or via systemd timer
# Example crontab entry:
# 0 3,15 * * * /usr/local/bin/certbot-renew.sh >> /var/log/certbot-renew.log 2>&1
# ==============================================================================

set -euo pipefail

DOMAIN="yourdomain.com"
EMAIL="admin@yourdomain.com"
WEBROOT="/var/www/html"
LOG_PREFIX="[Certbot Auto-Renew $(date '+%Y-%m-%d %H:%M:%S')]"

echo "${LOG_PREFIX} Starting SSL certificate check and renewal cycle for ${DOMAIN}..."

# 1. Attempt Certificate Renewal via Certbot (Webroot mode)
if certbot renew --webroot --webroot-path="${WEBROOT}" --quiet --no-self-upgrade; then
    echo "${LOG_PREFIX} Certbot evaluation complete."
    
    # 2. Test NGINX Configuration for Syntax Errors
    if nginx -t >/dev/null 2>&1; then
        echo "${LOG_PREFIX} NGINX configuration test passed. Reloading NGINX..."
        systemctl reload nginx || docker-compose exec -T nginx nginx -s reload
        echo "${LOG_PREFIX} NGINX reloaded successfully. SSL certificates updated."
    else
        echo "${LOG_PREFIX} ERROR: NGINX configuration test failed! Skipping reload to prevent downtime."
        exit 1
    fi
else
    echo "${LOG_PREFIX} ERROR: Certbot renewal process failed. Check Certbot logs at /var/log/letsencrypt/."
    exit 1
fi

echo "${LOG_PREFIX} SSL Maintenance complete."
