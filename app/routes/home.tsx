import HomePage from "~/pages/home/home";

export function meta() {
    return [
        {
            title: "LocalDevAgent — Local AI Developer Workspace with MCP",
        },
        {
            name: "description",
            content:
                "Autonomous local AI developer assistant powered by Qwen 2.5 Coder 32B and Model Context Protocol (MCP). Features persistent IndexedDB chat storage, memory management, and secure multi-tool integration.",
        },
        {
            name: "keywords",
            content:
                "LocalDevAgent, Qwen Coder, Model Context Protocol, MCP, local AI developer, AI workspace, IndexedDB chat history, local LLM streaming",
        },
        {
            property: "og:title",
            content: "LocalDevAgent — Local AI Developer Workspace",
        },
        {
            property: "og:description",
            content:
                "Your private local developer workspace running Qwen 2.5 Coder via MCP and streaming FastAPI backends with seamless session persistence.",
        },
        {
            property: "og:type",
            content: "website",
        },
        {
            property: "og:locale",
            content: "en_US",
        },
    ];
}

export default function Home() {
    return <HomePage />;
}