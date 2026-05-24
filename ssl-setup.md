# 🔒 SSL Certificate Setup Guide

## Automatic SSL (Recommended)

### Option 1: Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Cloudflare (Free + CDN)
1. Sign up at cloudflare.com
2. Add your domain
3. Update nameservers
4. Enable "Always Use HTTPS"
5. Set SSL/TLS mode to "Full (strict)"

### Option 3: Platform SSL
- **Vercel**: Automatic SSL for all deployments
- **Netlify**: Automatic SSL with custom domains
- **Railway**: Automatic SSL for custom domains
- **Render**: Automatic SSL included

## Manual SSL Certificate
```nginx
# Add to nginx.production.conf
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```