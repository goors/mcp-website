import { useState, useRef, useEffect, useMemo } from "react"
import {Send, Bot, User, Sparkles, Loader2, ArrowUp, Brain} from "lucide-react"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {History} from "~/validators/chat/ask";
import {chatAskMutation} from "~/mutations/ask-mutation";
import {useMutation} from "@tanstack/react-query";


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

async function loadMessagesFromDB(userId: string): Promise<History> {
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

async function saveMessagesToDB(userId: string, messages: History) {
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
    const [messages, setMessages] = useState<History>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [tokenCount, setTokenCount] = useState(0)

    const [activeTags, setActiveTags] = useState<string[]>(["general"])
    const [tagPickerOpen, setTagPickerOpen] = useState(false)
    const [tagQuery, setTagQuery] = useState("")
    const [tagHighlight, setTagHighlight] = useState(0)
    const [userId, setUserId] = useState<string>('')
    const [isHistoryHydrated, setIsHistoryHydrated] = useState(false)
    const [deepThink, setDeepThink] = useState(true)

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

    const { mutateAsync: askQuestionMutation, error: mutationError } = useMutation(chatAskMutation);

    // Collect every tag ever used in this session — that's the autocomplete source.
    const allKnownTags = useMemo(() => {
        const set = new Set<string>()
        set.add("general")
        for (const m of messages) {
            if (m.tags) for (const t of m.tags) set.add(t)
        }
        return Array.from(set).sort()
    }, [messages])

    // Tags matching the current "/query", excluding ones already active.
    const tagSuggestions = useMemo(() => {
        if (!tagPickerOpen) return []
        const q = tagQuery.toLowerCase()
        return allKnownTags
            .filter(t => !activeTags.includes(t))
            .filter(t => t.toLowerCase().includes(q))
            .slice(0, 8)
    }, [tagPickerOpen, tagQuery, allKnownTags, activeTags])

    // Reset highlight whenever the query or picker visibility changes.
    useEffect(() => {
        setTagHighlight(0)
    }, [tagQuery, tagPickerOpen])

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        setInput(value)

        const caret = e.target.selectionStart ?? value.length
        const before = value.slice(0, caret)
        const match = before.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/)

        if (match) {
            setTagPickerOpen(true)
            setTagQuery(match[1])
        } else {
            setTagPickerOpen(false)
            setTagQuery("")
        }
    }

    const commitTag = (tagOverride?: string) => {
        const tag = (tagOverride ?? tagQuery).trim().toLowerCase()
        if (tag) {
            setActiveTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
        }

        const caret = textareaRef.current?.selectionStart ?? input.length
        const before = input.slice(0, caret)
        const after = input.slice(caret)
        const cleanedBefore = before.replace(/(?:^|\s)\/[a-zA-Z0-9_-]*$/, " ")
        setInput(cleanedBefore + after)

        setTagPickerOpen(false)
        setTagQuery("")
        textareaRef.current?.focus()
    }

    const removeTag = (tag: string) => {
        setActiveTags((prev) => prev.filter((t) => t !== tag))
    }

    const renderDeepThinkButton = () => (
        <button
            type="button"
            onClick={() => setDeepThink(v => !v)}
            disabled={isLoading}
            title={deepThink ? "Deep think: ON" : "Deep think: OFF"}
            aria-pressed={deepThink}
            className={`h-8 px-2 rounded-full flex items-center gap-1 shrink-0 border transition-colors ${
                deepThink
                    ? "bg-[#8AB4F8] text-[#131314] border-[#8AB4F8]"
                    : "bg-[#1E1F20] text-[#8E918F] border-[#333538] hover:text-[#E3E3E3]"
            } disabled:opacity-40`}
        >
            <Brain className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">{deepThink ? "ON" : "OFF"}</span>
        </button>
    )

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !userId || !isHistoryHydrated) return

        const userMessage = input.trim()
        const userTokens = Math.round(userMessage.length / 4)
        setTokenCount((prev) => prev + userTokens)

        setInput("")
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
        }

        const tagsForMessage = activeTags.length > 0 ? [...activeTags] : ["general"]

        const updatedMessages: History = [
            ...messages,
            { role: "user", content: userMessage, tags: tagsForMessage },
            { role: "assistant", content: "", tags: tagsForMessage },
        ]
        setMessages(updatedMessages)
        setIsLoading(true)

        try {
            const res = await askQuestionMutation(
                {
                    data: {
                        user_id: userId,
                        prompt: userMessage,
                        history: messages,
                        deepThink,
                        tags: tagsForMessage
                    }
                }
            )

            if (!res.ok || !res.body) {
                throw new Error(`Failed to connect to streaming API: ${res.status}`);
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
            console.log(error)
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
        if (tagPickerOpen) {
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setTagHighlight(h => Math.min(h + 1, Math.max(tagSuggestions.length - 1, 0)))
                return
            }
            if (e.key === "ArrowUp") {
                e.preventDefault()
                setTagHighlight(h => Math.max(h - 1, 0))
                return
            }
            if (e.key === "Enter" || e.key === "Tab" || e.key === " ") {
                e.preventDefault()
                if (tagSuggestions[tagHighlight]) {
                    commitTag(tagSuggestions[tagHighlight])
                } else if (tagQuery.trim()) {
                    commitTag()
                } else {
                    setTagPickerOpen(false)
                }
                return
            }
            if (e.key === "Escape") {
                e.preventDefault()
                setTagPickerOpen(false)
                setTagQuery("")
                return
            }
        }

        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleSendMessage()
        }

        if (e.key === "Backspace" && input === "" && activeTags.length > 0) {
            e.preventDefault()
            removeTag(activeTags[activeTags.length - 1])
        }
    }

    const renderTagChips = () => {
        if (activeTags.length === 0) return null
        return (
            <div className="flex flex-wrap gap-1.5 mb-2">
                {activeTags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[11px] bg-[#8AB4F8]/15 text-[#8AB4F8] border border-[#8AB4F8]/30 rounded-full px-2 py-0.5"
                    >
                        #{tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-white"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
        )
    }

    const renderMessageTags = (tags?: string[]) => {
        if (!tags || tags.length === 0) return null
        return (
            <div className="flex flex-wrap gap-1 mb-1">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="text-[10px] text-[#8AB4F8] bg-[#8AB4F8]/10 border border-[#8AB4F8]/20 rounded-full px-1.5 py-0.5"
                    >
                        #{tag}
                    </span>
                ))}
            </div>
        )
    }

    const renderTagSuggestions = () => {
        if (!tagPickerOpen) return null

        const exactMatchExists = tagSuggestions.some(t => t === tagQuery.trim().toLowerCase())
        const showCreateOption = tagQuery.trim().length > 0 && !exactMatchExists

        if (tagSuggestions.length === 0 && !showCreateOption) {
            return null
        }

        return (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1E1F20] border border-[#333538] rounded-xl shadow-2xl overflow-hidden z-50">
                {tagSuggestions.map((tag, i) => (
                    <button
                        key={tag}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); commitTag(tag) }}
                        onMouseEnter={() => setTagHighlight(i)}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                            i === tagHighlight
                                ? "bg-[#8AB4F8]/15 text-[#8AB4F8]"
                                : "text-[#E3E3E3] hover:bg-[#2b2d31]"
                        }`}
                    >
                        <span className="text-[#8E918F]">#</span>
                        <span className="flex-1">{tag}</span>
                        {i === tagHighlight && (
                            <span className="text-[10px] text-[#8E918F]">↵</span>
                        )}
                    </button>
                ))}
                {showCreateOption && (
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); commitTag() }}
                        className="w-full text-left px-3 py-1.5 text-xs text-[#8AB4F8] border-t border-[#333538] hover:bg-[#2b2d31] flex items-center gap-2"
                    >
                        <span className="text-[#8E918F]">+</span>
                        <span>create <span className="font-semibold">#{tagQuery.trim().toLowerCase()}</span></span>
                    </button>
                )}
            </div>
        )
    }

    return (
        <main className="h-screen bg-[#131314] text-[#E3E3E3] flex flex-col justify-between font-sans overflow-hidden selection:bg-[#8AB4F8]/30 relative">

            <div className="absolute top-4 right-4 z-50 bg-[#1E1F20]/80 backdrop-blur-md border border-[#333538] px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8AB4F8] animate-pulse"></span>
                <span className="text-xs text-[#8E918F]">Tokens:</span>
                <span className="text-xs font-semibold text-[#E3E3E3]">{tokenCount} / 32,768</span>
            </div>

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

                        <div className="w-full max-w-3xl px-4">
                            <div className="relative">
                                {renderTagSuggestions()}
                                <div className="bg-[#1E1F20] rounded-3xl px-4 py-3 flex flex-col shadow-2xl ring-1 ring-white/5 focus-within:ring-[#8AB4F8]/50 transition-all text-left">
                                    {renderTagChips()}
                                    <div className="flex items-end gap-3">
                                        <textarea
                                            ref={textareaRef}
                                            value={input}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder={!isHistoryHydrated ? "Loading history..." : "Enter a prompt here... (Press Enter for new line, Cmd/Ctrl + Enter to send, / for tags)"}
                                            disabled={isLoading || !isHistoryHydrated}
                                            rows={1}
                                            className="flex-1 bg-transparent border-none focus:outline-none resize-none text-sm text-[#E3E3E3] placeholder:text-[#8E918F] py-1 max-h-48"
                                        />
                                        {renderDeepThinkButton()}
                                        <button
                                            type="button"
                                            onClick={handleSendMessage}
                                            disabled={isLoading || !input.trim() || !isHistoryHydrated}
                                            className="bg-[#E3E3E3] hover:bg-white text-[#131314] rounded-full h-8 w-8 flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-20 disabled:bg-[#8E918F]"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
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
                                    {renderMessageTags(msg.tags)}
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

            {messages.length > 0 && (
                <div className="bg-gradient-to-t from-[#131314] via-[#131314]/95 to-transparent pt-4 pb-6 px-4 shrink-0">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative">
                            {renderTagSuggestions()}
                            <div className="bg-[#1E1F20] rounded-3xl px-4 py-3 flex flex-col shadow-2xl ring-1 ring-white/5 focus-within:ring-[#8AB4F8]/50 transition-all">
                                {renderTagChips()}
                                <div className="flex items-end gap-3">
                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder={!isHistoryHydrated ? "Loading history..." : "Enter a prompt here... (Press Enter for new line, Cmd/Ctrl + Enter to send, / for tags)"}
                                        disabled={isLoading || !isHistoryHydrated}
                                        rows={1}
                                        className="flex-1 bg-transparent border-none focus:outline-none resize-none text-sm text-[#E3E3E3] placeholder:text-[#8E918F] py-1 max-h-48"
                                    />
                                    {renderDeepThinkButton()}
                                    <button
                                        type="button"
                                        onClick={handleSendMessage}
                                        disabled={isLoading || !input.trim() || !isHistoryHydrated}
                                        className="bg-[#E3E3E3] hover:bg-white text-[#131314] rounded-full h-8 w-8 flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-20 disabled:bg-[#8E918F]"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
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