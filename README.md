# LocalDevAgent — Local AI Developer Workspace

A modern, production-ready full-stack developer workspace powered by Qwen 2.5 Coder 32B and Model Context Protocol (MCP), built with React Router, FastAPI, and local persistence.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- Streaming Server-Side responses via FastAPI and Server-Sent Events (SSE)
- Model Context Protocol (MCP) local developer integrations and memory management
- Persistent client-side chat history utilizing IndexedDB with server session auto-hydration
- TypeScript by default with zero-trust container security (restricted Kubernetes ServiceAccounts)
- TailwindCSS styling optimized for a dark-mode developer environment
- [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the frontend dependencies:
```bash
corepack enable
corepack prepare pnpm@10.12.4 --activate
pnpm install --frozen-lockfile
```
### Development

Start the development server with HMR:

`pnpm run dev`

Your application will be available at http://localhost:5173. Make sure your local FastAPI backend is running at http://127.0.0.1:8000.

## Building for Production

Create a production build:

`pnpm run build`

## Deployment

### Docker Deployment

To build and run using Docker:

`docker build -t mcp-website .`

# Run the container
docker run -p 3000:3000 mcp-website

The containerized application can be deployed securely to Kubernetes using a non-privileged ServiceAccount with automountServiceAccountToken: false.

---

Built with ❤️ using React Router and Qwen Coder.