# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NewHome Clothes — a second-hand clothes resale marketplace. The motto is "Wear it, pass it on." Sellers list garments with a photo, short description (2 lines max, no tags), and a backstory ("Where did you find it?"). The action to publish is called "Send it to the circle." The community vibe is: good vibes only.

## Build & Dev Commands

### Frontend (React + Vite)
```bash
cd frontend
npm install          # install dependencies
npm run dev          # dev server (http://localhost:5173)
npm run build        # production build to frontend/dist/
npm run lint         # ESLint
npm run preview      # preview production build locally
```

Set `VITE_API_URL` in a `.env.local` file to point at the deployed API Gateway URL.

### Backend (AWS Lambda, Node.js 20)
Each Lambda is in its own directory with its own `package.json`:
```bash
cd backend/functions/listings && npm install
cd backend/functions/upload && npm install
```

### Infrastructure (Terraform)
```bash
cd infra
terraform init
terraform plan
terraform apply
```
Outputs: API Gateway URL, CloudFront domain, S3 bucket name, DynamoDB table name.

Set `allowed_origins` variable to your production frontend domain before deploying.

## Architecture

```
frontend/          React SPA (Vite)
├── src/api/       API client + sanitize.js (image URL validation)
├── src/components/  Layout, ListingCard
├── src/pages/     Landing, Browse (paginated), CreateListing, ListingDetail

backend/functions/
├── listings/      Lambda: GET /listings (paginated), GET /listings/{id}, POST /listings
├── upload/        Lambda: POST /upload-url (returns S3 pre-signed PUT URL)

infra/             Terraform (AWS provider ~> 5.0)
```

**Request flow:** Frontend → API Gateway (HTTP API, throttled) → Lambda → DynamoDB / S3

- **Image uploads:** Frontend gets a pre-signed PUT URL from the upload Lambda, uploads directly to S3. The pre-signed URL enforces a 10 MB Content-Length limit. Images are served via CloudFront (OAC) — the S3 bucket is private.
- **Image serving:** S3 → CloudFront with Origin Access Control. No direct S3 public access.
- **Listings:** DynamoDB table keyed by `id` (UUID). GET /listings is paginated (cursor-based, 50 items/page).
- **No auth** is implemented yet.

## Security Architecture

- **S3 is fully private.** All public access blocks enabled. Images served only via CloudFront OAC.
- **CORS locked to `allowed_origins`** on both API Gateway and S3 (defaults to `localhost:5173` for dev).
- **Separate IAM roles per Lambda** — listings Lambda has DynamoDB-only access, upload Lambda has S3 PutObject-only access (scoped to `uploads/*`).
- **API Gateway throttling:** 20 req/sec sustained, 50 burst.
- **API Gateway access logging** to CloudWatch (30-day retention).
- **Input validation (backend):** price range 0–100,000, `imageUrl` validated against CloudFront domain, UUID format enforced on path params, all strings truncated.
- **Image URL sanitization (frontend):** `src/api/sanitize.js` validates URLs are `https://` from `*.cloudfront.net` or `*.s3.amazonaws.com` before rendering in `<img>` tags.
- **CSP and security meta tags** in `index.html`: script-src, img-src, connect-src, style-src scoped; `X-Content-Type-Options: nosniff`; strict referrer policy.
- **Lambda responses** include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Cache-Control: no-store`.
- **DynamoDB:** Point-in-time recovery enabled.
- **S3:** Server-side encryption (AES256) and versioning enabled.

## Branding & Design

- **Brand:** "NewHome" (site name), by "chewie&co" (company)
- **Colors:** Black `#000000` (primary), Off-white `#FAF9F6` (light bg), White `#FFFFFF` (page bg), Gray `#E0E0E0` (borders)
- **Fonts:** Playfair Display (headings / editorial serif), Inter (body / clean sans-serif)
- CSS variables are defined in `frontend/src/index.css` as `--primary`, `--bg-light`, `--bg-dark`, `--text-primary`, `--text-secondary`, `--text-on-dark`, `--border`, `--font-heading`, `--font-body`
- Each component/page has a co-located `.css` file (BEM-ish naming)
- **Assets:** `recycling-logo.svg` and `hero-banner.jpg` in `frontend/public/` (user-provided, not AI-generated)

## Dependencies Policy

Minimal dependencies only. All packages must be well-established (millions of weekly downloads, first-party or major-org maintained). Run `npm audit` after any install — zero vulnerabilities required before proceeding.

**Frontend:** react, react-dom, react-router-dom + Vite toolchain. Use native `fetch()` for HTTP.
**Backend:** Only `@aws-sdk/*` official packages.
