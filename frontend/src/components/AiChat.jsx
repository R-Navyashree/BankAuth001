import { useState, useRef, useEffect } from 'react'
import { Client } from '@gradio/client'
import api from '../api'
import './AiChat.css'

const WELCOME_MSG =
    "Hello! I'm your KodBank AI Assistant. Ask me anything about your account, balance, or banking tips! 💰"

export default function AiChat() {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: 'assistant', text: WELCOME_MSG }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [userData, setUserData] = useState(null)
    const messagesEndRef = useRef(null)

    // Fetch real user account data on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await api.get('/api/getBalance')
                setUserData(res.data)
            } catch {
                // Silently fail — AI will work without context
            }
        }
        fetchUserData()
    }, [])

    // Auto-scroll to bottom whenever messages or loading state change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const buildHistory = () => {
        const pairs = []
        let i = 1 // skip welcome message
        while (i < messages.length) {
            if (messages[i].role === 'user') {
                const userText = messages[i].text
                const assistantText =
                    i + 1 < messages.length && messages[i + 1].role === 'assistant'
                        ? messages[i + 1].text
                        : ''
                pairs.push([userText, assistantText])
                i += assistantText ? 2 : 1
            } else {
                i++
            }
        }
        return pairs
    }

    const sendMessage = async () => {
        const trimmed = input.trim()
        if (!trimmed || loading) return

        const userMsg = { role: 'user', text: trimmed }
        setMessages((prev) => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            let contextMessage = trimmed
            if (userData) {
                contextMessage = `You are KodBank AI Assistant. Always be helpful and friendly.
Here is the authenticated user's real account data:
- Username: ${userData.username}
- Email: ${userData.email}
- Balance: ₹${userData.balance}
- Phone: ${userData.phone}
- Role: ${userData.role}
- Account Status: Active

Answer this: ${trimmed}

If the question is casual like "hii" or "hello", just greet them by name and offer help.
If you don't know something like join date, say "This information is not available currently."`
            }

            const callGradio = async () => {
                const client = await Client.connect("navyashreer/my-deepseek-chat")
                const result = await client.predict("/chat", {
                    message: contextMessage,
                })
                return result?.data?.[0] ?? "Sorry, I couldn't get a response."
            }

            let reply
            try {
                reply = await callGradio()
            } catch {
                // Wait 2 seconds and retry once
                await new Promise((r) => setTimeout(r, 2000))
                try {
                    reply = await callGradio()
                } catch {
                    reply = "I'm a bit busy right now, please try again in a moment! 🙏"
                }
            }

            setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    text: '⚠️ Something went wrong. Please check your connection and try again.'
                }
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <>
            {/* Floating toggle */}
            <button
                className={`ai-chat-toggle ${open ? 'open' : ''}`}
                onClick={() => setOpen(!open)}
                aria-label={open ? 'Close chat' : 'Open chat'}
            >
                {open ? '✕' : '💬'}
            </button>

            {/* Chat panel */}
            {open && (
                <div className="ai-chat-panel">
                    {/* Header */}
                    <div className="ai-chat-header">
                        <div className="ai-chat-header-icon">🤖</div>
                        <div className="ai-chat-header-text">
                            <h4>KodBank AI Assistant</h4>
                            <p>● Online</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="ai-chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`ai-msg ${msg.role}`}>
                                {msg.text}
                            </div>
                        ))}

                        {loading && (
                            <div className="ai-msg assistant typing">
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="ai-chat-input-area">
                        <input
                            type="text"
                            placeholder="Ask anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />
                        <button
                            className="ai-chat-send-btn"
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            aria-label="Send message"
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
