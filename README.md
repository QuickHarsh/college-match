# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/978f9972-97c2-4285-b8b2-862deda09ab8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/978f9972-97c2-4285-b8b2-862deda09ab8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/978f9972-97c2-4285-b8b2-862deda09ab8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

# Deploying to Render (Static Site)

This project is a Vite + React SPA and is ready to deploy on Render as a Static Site.

## Prerequisites
- A GitHub repository with this code.
- Node 18+ on Render (Render uses a recent Node by default).

## Build settings on Render
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`

A `render.yaml` is included which configures:
- A Static Site service named `uni-linkup`
- SPA rewrites so all routes are served by `index.html`
- Long-term caching for `/assets/*`

## SPA rewrite rule
If you create the Static Site via the dashboard, add a rewrite:
- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

## Environment variables
The app reads Vite env variables at build time:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

Set these in Render under the Static Site's Environment tab, or commit values via `render.yaml` (not recommended for secrets). A safe template is provided in `.env.example`.

## Local development
1. Copy `.env.example` to `.env` and fill values.
2. Install deps: `npm i`
3. Start dev server: `npm run dev`
