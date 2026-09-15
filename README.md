# THREXIS

Threat Hunting & Real-Time Exploitation Exposure Intelligent System — an interactive Security Operations Command Center with a Next.js console and FastAPI orchestration service.

## Run locally

Start the backend:

```sh
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
.venv/bin/uvicorn backend.main:app --reload --port 8000
```

In a second terminal, start the frontend:

```sh
npm install --prefix frontend
npm run dev
```

Open `http://localhost:3000`. The API runs on `http://localhost:8000`; override it with `NEXT_PUBLIC_API_BASE_URL` when needed. An OpenAI key is optional—copy `backend/.env.example` to `backend/.env` to enable AI-refined narratives. Without a valid key, the built-in classification engine remains fully operational.

## Capabilities

- Five controlled attack simulations mapped to MITRE ATT&CK
- Live matrix telemetry with visual and spoken threat alerts
- Automated containment playbooks with step-by-step SOC execution logs
- Downloadable, timestamped CISO incident reports
- Deterministic local threat classification when external AI is unavailable

## Legacy prototype

The original Vite learning-assistant source remains under `src/` for reference. Root `dev`, `build`, and `preview` commands now target the THREXIS frontend in `frontend/`.

<!--

## Project info

**URL**: https://lovable.dev/projects/b76ff1f9-4aa2-4e5a-9634-7c1e98914e55

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b76ff1f9-4aa2-4e5a-9634-7c1e98914e55) and start prompting.

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

Simply open [Lovable](https://lovable.dev/projects/b76ff1f9-4aa2-4e5a-9634-7c1e98914e55) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
-->
