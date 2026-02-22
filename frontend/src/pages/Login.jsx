import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Login.css'

export default function Login() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.email || !form.password) {
            setToast({ type: 'error', message: 'Please fill in all fields' })
            setTimeout(() => setToast(null), 4000)
            return
        }

        setLoading(true)
        try {
            const res = await api.post('/api/login', form)
            localStorage.setItem('kodbank_user', res.data.username)
            navigate('/dashboard')
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed'
            setToast({ type: 'error', message: msg })
            setTimeout(() => setToast(null), 4000)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            {/* Floating orbs */}
            <div className="floating-orbs">
                <div className="orb" />
                <div className="orb" />
                <div className="orb" />
            </div>

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                    {toast.message}
                </div>
            )}

            {/* Login Card */}
            <div className="login-card glass-card">
                {/* Left Section */}
                <div className="login-left">
                    <h2 className="login-welcome">Welcome to</h2>
                    <div className="kodbank-logo" style={{ fontSize: '20px', marginTop: '2px' }}>
                        <span className="kod">Kod</span>
                        <span className="bank">Bank</span>
                    </div>
                    <p className="login-continue">Sign in to continue</p>
                    <div className="login-divider" />
                    <div className="kodbank-logo" style={{ fontSize: '18px' }}>
                        <span className="kod">Kod</span>
                        <span className="bank">Bank</span>
                    </div>
                    <div className="secure-badge">
                        <span>🔒</span>
                        <span>Secure Banking</span>
                    </div>
                </div>

                {/* Middle Section */}
                <div className="login-middle">
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label">USER EMAIL</label>
                            <input
                                type="email"
                                name="email"
                                className="glass-input"
                                placeholder="Enter your email"
                                value={form.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group" style={{ marginTop: '16px' }}>
                            <label className="input-label">PASSWORD</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="glass-input"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Right Section */}
                <div className="login-right-section">
                    <div className="login-right-inner">
                        <p className="signin-hint">Access your<br />KodBank account</p>
                        <p className="signin-secure">🔒 Secure Login</p>
                        <button
                            className="login-signin-btn"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="spinner" />
                            ) : (
                                <>
                                    <span className="signin-text">Sign In</span>
                                    <span className="signin-arrow">→</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <p className="login-footer">
                Don't have an account?{' '}
                <span className="link-green" onClick={() => navigate('/register')}>Register Now</span>
            </p>
        </div>
    )
}
