# Custom Domains — Infrastructure Guide

## What Works Now (No Infrastructure Changes Needed)

| Feature | Status |
|---|---|
| Creator enters custom domain in UI | Working |
| Domain stored in `courses.custom_domain` | Working |
| Verification token generated (`excellion-{id}`) | Working |
| DNS verification via Cloudflare DoH (CNAME + TXT check) | Working |
| Verification status UI (pending/verified/remove) | Working |
| DNS setup instructions with provider links | Working |
| URL priority: custom domain > excellioncourses.com/course/:slug | Working |
| CoursePage hostname detection for custom domains | Working |

## What's Needed for Custom Domains to Actually Serve Traffic

The app-level code is ready. But when a user visits `courses.coachsarah.com`, their browser needs to reach Excellion's server. This requires a reverse proxy that:

1. Accepts HTTPS traffic on any hostname
2. Terminates SSL (with a valid certificate for that hostname)
3. Forwards the request to the Excellion app
4. The app reads `window.location.hostname` → looks up the course → renders it

---

## Option A: Cloudflare for SaaS (Recommended)

**Best for: Production launch with minimal maintenance**

### How It Works
- Excellion's domain (`excellioncourses.com`) is on Cloudflare
- Enable "Cloudflare for SaaS" (also called Custom Hostnames)
- When a creator adds `courses.coachsarah.com`:
  1. Creator adds CNAME → `excellioncourses.com`
  2. Excellion calls Cloudflare API to register the custom hostname
  3. Cloudflare auto-provisions SSL certificate
  4. Traffic flows: `courses.coachsarah.com` → Cloudflare → Lovable origin

### Setup Steps
1. Move excellioncourses.com DNS to Cloudflare (free plan)
2. Enable Cloudflare for SaaS ($2/month add-on on Pro plan)
3. Add API integration: when domain is verified in Excellion, call Cloudflare Custom Hostnames API
4. Configure Cloudflare to forward all traffic to Lovable's origin

### API Integration
```typescript
// After domain verification succeeds, register with Cloudflare
const response = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/custom_hostnames`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      hostname: "courses.coachsarah.com",
      ssl: { method: "http", type: "dv" },
    }),
  }
);
```

### Cost
- Cloudflare Pro: $20/month
- Custom Hostnames: $2/month + $0.10/hostname/month
- SSL: Included (auto-provisioned)

### Tradeoffs
- Cheapest and least maintenance
- Cloudflare handles SSL, DDoS, caching
- Requires moving DNS to Cloudflare
- Cloudflare for SaaS requires at least Pro plan

---

## Option B: Vercel or Netlify

**Best for: If you move hosting off Lovable**

### How It Works
- Move the React app from Lovable to Vercel/Netlify
- Both platforms support adding custom domains per project via API
- SSL is auto-provisioned via Let's Encrypt

### Setup Steps (Vercel)
1. Deploy Excellion app to Vercel
2. When a creator adds a domain, call Vercel Domains API:
   ```
   POST /v10/projects/{projectId}/domains
   { "name": "courses.coachsarah.com" }
   ```
3. Vercel provisions SSL automatically
4. Creator CNAME → `cname.vercel-dns.com`

### Cost
- Vercel Pro: $20/month (supports custom domains via API)
- No per-domain cost
- SSL: Included

### Tradeoffs
- Requires moving off Lovable
- Vercel has excellent performance (edge network)
- Simple API for domain management
- No proxy to maintain

---

## Option C: Self-Hosted Proxy (Caddy)

**Best for: Maximum control, if you have DevOps capacity**

### How It Works
- Run Caddy reverse proxy on a VPS (Railway, Fly.io, DigitalOcean)
- Caddy automatically provisions SSL via Let's Encrypt for any hostname
- Configure Caddy to look up custom domains from the database
- Forward all traffic to the Excellion app

### Caddy Configuration
```
{
  on_demand_tls {
    ask http://localhost:5555/check-domain
  }
}

:443 {
  tls {
    on_demand
  }
  reverse_proxy https://excellioncourses.lovable.app {
    header_up Host {upstream_hostport}
  }
}
```

### Cost
- VPS: $5-20/month (Railway, Fly.io, DigitalOcean)
- SSL: Free (Let's Encrypt)
- Maintenance: You manage the server

### Tradeoffs
- Most control and cheapest per-domain
- Requires server management
- Need to handle scaling, monitoring, updates
- Let's Encrypt has rate limits (50 certs/domain/week)

---

## Recommendation

**For launch: Option A (Cloudflare)**
- Minimal setup, reliable, cheap
- Cloudflare handles SSL and caching
- Can stay on Lovable hosting

**If moving off Lovable later: Option B (Vercel)**
- Native domain support, no proxy needed
- Better long-term architecture

**Don't use Option C unless** you have a DevOps person on the team.

---

## Creator Subdomains (Future: *.excellioncourses.com)

### What It Is
Instead of custom domains, offer branded subdomains:
- `coachsarah.excellioncourses.com`
- `fitnessjohn.excellioncourses.com`

### Database
- `profiles.creator_subdomain` column already exists (TEXT UNIQUE)
- Validated: 3-30 chars, lowercase alphanumeric + hyphens
- Reserved words blocked (www, api, app, admin, etc.)

### DNS Setup
1. Add wildcard DNS: `*.excellioncourses.com` → server
2. Add wildcard SSL (Cloudflare provides this automatically)

### Routing
1. Read `Host` header → extract subdomain
2. Look up `profiles.creator_subdomain`
3. Show creator's courses at that subdomain

### Implementation Order
1. Add subdomain picker in profile settings (UI ready, backend ready)
2. Add wildcard DNS record
3. Add routing logic to detect subdomain from hostname
