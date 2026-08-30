import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, Loader2, ArrowUp } from "lucide-react"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: "user" | "assistant"
    content: string
}

// ==========================================
// IndexedDB Helper Utility
// ==========================================
const DB_NAME = "LocalDevAgentDB";
const STORE_NAME = "chat_history";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "userId" });
            }
        };
    });
}

async function loadMessagesFromDB(userId: string): Promise<Message[]> {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(userId);
            request.onsuccess = () => {
                resolve(request.result ? request.result.messages : []);
            };
            request.onerror = () => resolve([]);
        });
    } catch {
        return [];
    }
}

async function saveMessagesToDB(userId: string, messages: Message[]) {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        store.put({ userId, messages });
    } catch (err) {
        console.error("Failed to save to IndexedDB:", err);
    }
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [tokenCount, setTokenCount] = useState(0)

    const [userId, setUserId] = useState<string>('')
    const [isHistoryHydrated, setIsHistoryHydrated] = useState(false)

    // Initialize session ID from localStorage and load historical messages from IndexedDB
    useEffect(() => {
        let storedId = localStorage.getItem('agent_session_id');
        if (!storedId) {
            storedId = 'user_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('agent_session_id', storedId);
        }
        setUserId(storedId);

        loadMessagesFromDB(storedId).then((savedMsgs) => {
            if (savedMsgs && savedMsgs.length > 0) {
                setMessages(savedMsgs);
                const totalChars = savedMsgs.reduce((acc, m) => acc + m.content.length, 0);
                setTokenCount(Math.round(totalChars / 4));
            }
            setIsHistoryHydrated(true);
        });
    }, [])

    // Persist messages to IndexedDB whenever they update
    useEffect(() => {
        if (userId && messages.length > 0) {
            saveMessagesToDB(userId, messages);
        }
    }, [messages, userId])

    const scrollRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isLoading])

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
        }
    }, [input])

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !userId || !isHistoryHydrated) return

        const userMessage = input.trim()
        const userTokens = Math.round(userMessage.length / 4)
        setTokenCount((prev) => prev + userTokens)

        setInput("")
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
        }

        const updatedMessages = [
            ...messages,
            { role: "user" as const, content: userMessage },
            { role: "assistant" as const, content: "" }
        ];
        setMessages(updatedMessages)
        setIsLoading(true)

        try {
            const res = await fetch("https://mcp.api.intovoid.dev/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    prompt: userMessage,
                    history: messages // Pass local history so server can hydrate if restarted
                }),
            })

            if (!res.ok || !res.body) {
                throw new Error("Failed to connect to streaming API.")
            }

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let assistantMessage = ""
            let buffer = ""

            while (true) {
                const { value, done } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split("\n\n")
                buffer = lines.pop() || ""

                for (const line of lines) {
                    const trimmed = line.trim()
                    if (trimmed.startsWith("data: ")) {
                        try {
                            const parsed = JSON.parse(trimmed.replace("data: ", ""))
                            if (parsed.content) {
                                const chunk = parsed.content
                                assistantMessage += chunk
                                setMessages((prev) => {
                                    const newMsgs = [...prev]
                                    newMsgs[newMsgs.length - 1].content = assistantMessage
                                    return newMsgs
                                })
                            }
                            if (parsed.error) {
                                const errStr = `\n[Error: ${parsed.error}]`
                                assistantMessage += errStr
                                setMessages((prev) => {
                                    const newMsgs = [...prev]
                                    newMsgs[newMsgs.length - 1].content = assistantMessage
                                    return newMsgs
                                })
                            }
                        } catch (err) {
                            // Ignore partial chunks
                        }
                    }
                }
            }

            const assistantTokens = Math.round(assistantMessage.length / 4)
            setTokenCount((prev) => prev + assistantTokens)

        } catch (error) {
            const errorMsg = "Error: Could not establish a streaming connection to the local backend."
            const errorTokens = Math.round(errorMsg.length / 4)
            setTokenCount((prev) => prev + errorTokens)
            setMessages((prev) => {
                const newMsgs = [...prev]
                newMsgs[newMsgs.length - 1].content = errorMsg
                return newMsgs
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <main className="h-screen bg-[#131314] text-[#E3E3E3] flex flex-col justify-between font-sans overflow-hidden selection:bg-[#8AB4F8]/30 relative">

            {/* FLOATING TOKEN COUNT BADGE (Top Right) */}
            <div className="absolute top-4 right-4 z-50 bg-[#1E1F20]/80 backdrop-blur-md border border-[#333538] px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8AB4F8] animate-pulse"></span>
                <span className="text-xs text-[#8E918F]">Tokens:</span>
                <span className="text-xs font-semibold text-[#E3E3E3]">{tokenCount} / 32,768</span>
            </div>

            {/* MAIN CONTAINER */}
            <div
                ref={scrollRef}
                className={`flex-1 max-w-4xl w-full mx-auto px-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
                    messages.length === 0 ? "flex flex-col items-center justify-center" : "pt-16 pb-32"
                }`}
            >
                {messages.length === 0 ? (
                    <div className="w-full flex flex-col items-center justify-center text-center space-y-8 -mt-12">
                        <div className="space-y-3">
                            <div className="text-3xl font-bold tracking-tight text-[#E3E3E3]">
                                Hello, Guest
                            </div>
                            <p className="text-[#8E918F] text-sm">How can I help you code today?</p>
                        </div>

                        {/* CENTERED INPUT WHEN EMPTY */}
                        <div className="w-full max-w-3xl px-4">
                            <div className="bg-[#1E1F20] rounded-3xl px-4 py-3 flex items-end gap-3 shadow-2xl ring-1 ring-white/5 focus-within:ring-[#8AB4F8]/50 transition-all text-left">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={!isHistoryHydrated ? "Loading history..." : "Enter a prompt here... (Press Enter for new line, Cmd/Ctrl + Enter to send)"}
                                    disabled={isLoading || !isHistoryHydrated}
                                    rows={1}
                                    className="flex-1 bg-transparent border-none focus:outline-none resize-none text-sm text-[#E3E3E3] placeholder:text-[#8E918F] py-1 max-h-48"
                                />
                                <button
                                    type="button"
                                    onClick={handleSendMessage}
                                    disabled={isLoading || !input.trim() || !isHistoryHydrated}
                                    className="bg-[#E3E3E3] hover:bg-white text-[#131314] rounded-full h-8 w-8 flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-20 disabled:bg-[#8E918F]"
                                >
                                    <ArrowUp className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <span className="text-[11px] text-[#8E918F]">Qwen 2.5 Coder 32B · Local MCP Dev Environment</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start items-start"}`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="w-8 h-8 rounded-full bg-[#1E1F20] text-[#8AB4F8] flex items-center justify-center shrink-0 mt-0.5 border border-[#333538]">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                )}

                                <div className={`max-w-[85%] text-sm leading-relaxed ${
                                    msg.role === "user"
                                        ? "bg-[#2b2d31] text-[#E3E3E3] px-5 py-3.5 rounded-3xl rounded-tr-sm"
                                        : "text-[#E3E3E3] w-full"
                                }`}>
                                    {msg.content ? (
                                        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <span className="flex items-center gap-2 text-[#8E918F]">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8AB4F8]" />
                                            Thinking...
                                        </span>
                                    )}
                                </div>

                                {msg.role === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-[#2D2E30] text-[#E3E3E3] flex items-center justify-center shrink-0 mt-0.5 border border-[#444746]">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FIXED BOTTOM INPUT BAR */}
            {messages.length > 0 && (
                <div className="bg-gradient-to-t from-[#131314] via-[#131314]/95 to-transparent pt-4 pb-6 px-4 shrink-0">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-[#1E1F20] rounded-3xl px-4 py-3 flex items-end gap-3 shadow-2xl ring-1 ring-white/5 focus-within:ring-[#8AB4F8]/50 transition-all">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={!isHistoryHydrated ? "Loading history..." : "Enter a prompt here... (Press Enter for new line, Cmd/Ctrl + Enter to send)"}
                                disabled={isLoading || !isHistoryHydrated}
                                rows={1}
                                className="flex-1 bg-transparent border-none focus:outline-none resize-none text-sm text-[#E3E3E3] placeholder:text-[#8E918F] py-1 max-h-48"
                            />
                            <button
                                type="button"
                                onClick={handleSendMessage}
                                disabled={isLoading || !input.trim() || !isHistoryHydrated}
                                className="bg-[#E3E3E3] hover:bg-white text-[#131314] rounded-full h-8 w-8 flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-20 disabled:bg-[#8E918F]"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-[11px] text-[#8E918F]">Qwen 2.5 Coder 32B · Local MCP Dev Environment</span>
                        </div>
                    </div>
                </div>
            )}

        </main>
    )
}