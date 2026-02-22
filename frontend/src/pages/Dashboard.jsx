import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import confetti from 'canvas-confetti'
import './Dashboard.css'

export default function Dashboard() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [balance, setBalance] = useState(null)
    const [balanceRevealed, setBalanceRevealed] = useState(false)
    const [displayBalance, setDisplayBalance] = useState(0)
    const [loading, setLoading] = useState(false)
    const [showCelebration, setShowCelebration] = useState(false)
    const [activeNav, setActiveNav] = useState('Home')

    useEffect(() => {
        const user = localStorage.getItem('kodbank_user')
        if (!user) {
            navigate('/login')
            return
        }
        setUsername(user)
    }, [navigate])

    const revealBalance = async () => {
        if (balanceRevealed) return
        setLoading(true)
        try {
            const res = await api.get('/api/getBalance')
            const bal = parseFloat(res.data.balance)
            setBalance(bal)
            animateBalance(bal)
            triggerConfetti()
            setBalanceRevealed(true)
            setTimeout(() => setShowCelebration(true), 800)
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('kodbank_user')
                navigate('/login')
            }
        } finally {
            setLoading(false)
        }
    }

    const animateBalance = (target) => {
        const duration = 1500
        const start = Date.now()
        const tick = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayBalance(Math.floor(target * eased))
            if (progress < 1) requestAnimationFrame(tick)
            else setDisplayBalance(target)
        }
        tick()
    }

    const triggerConfetti = () => {
        confetti({ particleCount: 120, spread: 80, origin: { x: 0.2, y: 0.6 }, colors: ['#6AAF45', '#A0522D', '#F5ECD7', '#C8762A', '#86BC64'] })
        confetti({ particleCount: 120, spread: 80, origin: { x: 0.8, y: 0.6 }, colors: ['#6AAF45', '#A0522D', '#F5ECD7', '#C8762A', '#86BC64'] })
        confetti({ particleCount: 80, spread: 120, origin: { x: 0.5, y: 0.5 }, colors: ['#6AAF45', '#A0522D', '#F5ECD7'] })
        confetti({ particleCount: 40, spread: 60, shapes: ['star'], origin: { x: 0.5, y: 0.4 }, colors: ['#6AAF45', '#A0522D', '#F5ECD7'] })
    }

    const handleLogout = async () => {
        try {
            await api.post('/api/logout')
        } catch (e) { /* ignore */ }
        localStorage.removeItem('kodbank_user')
        navigate('/login')
    }

    const memberDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })

    const formatCurrency = (num) => {
        return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const navItems = ['Home', 'Balance', 'Security', 'Profile']

    return (
        <div className="dashboard-page">
            {/* Navbar */}
            <nav className="dashboard-nav">
                <div className="nav-left">
                    <div className="kodbank-logo" style={{ fontSize: '22px' }}>
                        <span className="kod">Kod</span>
                        <span className="bank">Bank</span>
                    </div>
                </div>
                <div className="nav-center">
                    {navItems.map((item) => (
                        <button
                            key={item}
                            className={`nav-link ${activeNav === item ? 'nav-link-active' : ''}`}
                            onClick={() => setActiveNav(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>
                <div className="nav-right">
                    <span className="nav-greeting">Hey, {username}! 👋</span>
                    <div className="nav-avatar">
                        {username ? username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="dashboard-content">
                {/* Top Row: Overview Left + Details Right */}
                <div className="dashboard-top-row">
                    {/* Left: Account Overview (vertical) */}
                    <div className="hero-banner glass-card">
                        <span className="hero-label">YOUR ACCOUNT OVERVIEW</span>
                        <h1 className="hero-heading">Welcome back, {username}!</h1>
                        <p className="hero-subtitle">Your finances are secure and up to date.</p>
                        <div className="hero-pills">
                            <span className="hero-pill">🔒 Secure</span>
                            <span className="hero-pill">🚀 Active</span>
                            <span className="hero-pill">🎯 JWT Protected</span>
                        </div>

                        <div className="balance-card">
                            <div className="balance-icon-row">
                                <div className="balance-icon-circle">💰</div>
                                <span className="balance-title">Your Balance</span>
                            </div>
                            <p className="balance-subtitle">
                                {balanceRevealed ? 'Current available balance' : 'Tap reveal to see your balance'}
                            </p>
                            <div className="balance-amount">
                                {balanceRevealed
                                    ? formatCurrency(displayBalance)
                                    : '₹  •   •   •   •   •   •   •'
                                }
                            </div>
                            <button
                                className="btn-pill btn-show-balance"
                                onClick={revealBalance}
                                disabled={balanceRevealed || loading}
                            >
                                {loading ? <span className="spinner" /> : 'Show Balance →'}
                            </button>
                            {showCelebration && (
                                <p className="celebration-text">🎉 Looking good, {username}!</p>
                            )}
                        </div>
                    </div>

                    {/* Right: Account Details */}
                    <div className="account-details-section">
                        <h2 className="section-title">Account Details</h2>
                        <div className="info-cards">
                            <div className="info-card glass-card">
                                <div className="info-icon-circle icon-brown">🏦</div>
                                <span className="info-label">ACCOUNT TYPE</span>
                                <span className="info-value">Customer</span>
                                <span className="info-subtext">Personal account</span>
                            </div>
                            <div className="info-card glass-card">
                                <div className="info-icon-circle icon-green">✅</div>
                                <span className="info-label">STATUS</span>
                                <span className="info-value" style={{ color: '#6AAF45' }}>Active</span>
                                <span className="info-subtext">All systems normal</span>
                            </div>
                            <div className="info-card glass-card">
                                <div className="info-icon-circle icon-orange">🔒</div>
                                <span className="info-label">SECURITY</span>
                                <span className="info-value">JWT Auth</span>
                                <span className="info-subtext">Token based</span>
                            </div>
                            <div className="info-card glass-card">
                                <div className="info-icon-circle icon-gold">📅</div>
                                <span className="info-label">MEMBER SINCE</span>
                                <span className="info-value">{memberDate}</span>
                                <span className="info-subtext">Account age</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="features-section">
                    <h2 className="section-title">Why KodBank?</h2>
                    <div className="features-grid">
                        <div className="feature-card glass-card">
                            <div className="feature-icon-circle" style={{ color: '#6AAF45' }}>🔐</div>
                            <h3 className="feature-card-title">Bank-grade Security</h3>
                            <p className="feature-card-desc">Your data is always encrypted</p>
                        </div>
                        <div className="feature-card glass-card">
                            <div className="feature-icon-circle" style={{ color: '#A0522D' }}>⚡</div>
                            <h3 className="feature-card-title">Instant Updates</h3>
                            <p className="feature-card-desc">Real-time balance and activity</p>
                        </div>
                        <div className="feature-card glass-card">
                            <div className="feature-icon-circle" style={{ color: '#6AAF45' }}>📊</div>
                            <h3 className="feature-card-title">Smart Dashboard</h3>
                            <p className="feature-card-desc">Everything in one place</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
