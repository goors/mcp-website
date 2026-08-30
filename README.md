# LocalDevAgent — Local AI Developer Workspace

A modern, production-ready full-stack developer workspace powered by **Qwen 2.5 Coder 32B** and **Model Context Protocol (MCP)**, built with React Router, FastAPI, and local persistence.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Streaming Server-Side responses via FastAPI and Server-Sent Events (SSE)
- 🧠 Model Context Protocol (MCP) local developer integrations and memory management
- 💾 Persistent client-side chat history utilizing **IndexedDB** with server session auto-hydration
- 🔒 TypeScript by default with zero-trust container security (restricted Kubernetes ServiceAccounts)
- 🎉 TailwindCSS styling optimized for a dark-mode developer environment
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the frontend dependencies:

```bash
pnpm install
pnpm run dev
```