# Brickell Bridge Status App

A lightweight Next.js app that shows whether the **Brickell Avenue Bridge** is **UP** or **DOWN** using a server-side fetch against Florida 511.

## What this app does

- Polls a server-side API route every 30 seconds
- Fetches the FL511 drawbridge page from the server
- Tries to locate **Brickell Avenue Bridge** and parse its current status
- Shows a simple mobile-friendly status card
- Avoids browser-side CORS issues by proxying through the app server

## Important note

Florida 511 clearly exposes a public drawbridge status page, but the exact machine-readable endpoint is not documented on the public page I inspected. This starter app therefore uses **HTML parsing** by default. If FL511 changes the page structure, parsing may break.

For a more durable version, replace the source URL with a direct JSON/XML feed if you uncover one.

## Local run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## Environment variables

Create `.env.local` if needed:

```bash
FL511_SOURCE_URL=https://fl511.com/list/bridge
BRIDGE_NAME_MATCH=Brickell Avenue Bridge
```

## Deploy to AWS Amplify

This is the easiest AWS path for a Next.js app:

1. Push this folder to GitHub
2. In AWS Amplify Hosting, create a new app from the Git repo
3. Use Node 20+
4. Add environment variables:
   - `FL511_SOURCE_URL=https://fl511.com/list/bridge`
   - `BRIDGE_NAME_MATCH=Brickell Avenue Bridge`
5. Deploy

### Suggested Amplify build settings

Create `amplify.yml`:

```yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## Alternative AWS options

- **AWS App Runner** with a Dockerfile
- **Elastic Beanstalk** for a Node server
- **Lambda + API Gateway + S3/CloudFront** if you want a split frontend/backend architecture

## Hardening ideas

- Add FL511 camera snapshot support for the Brickell bridge area
- Cache results for 5–15 seconds to reduce load on FL511
- Add push notifications using SNS
- Add fallback logic based on the published opening schedule when live parsing fails
- Add bridge history logging with DynamoDB
