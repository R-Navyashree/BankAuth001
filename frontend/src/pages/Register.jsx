import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Register.css'

export default function Register() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ username: '', email: '', password: '', phone: '' })
    const [role] = useState('Customer')
    const [showPassword, setShowPassword] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [toast, setToast] = useState(null)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setErrors({ ...errors, [e.target.name]: '' })
    }

    const validate = () => {
        const errs = {}
        if (!form.username.trim()) errs.username = 'Username is required'
        if (!form.email.trim()) errs.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format'
        if (!form.password) errs.password = 'Password is required'
        else if (form.password.length < 6) errs.password = 'Minimum 6 characters'
        return errs
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length > 0) {
            setErrors(errs)
            return
        }

        setLoading(true)
        try {
            await api.post('/api/register', {
                username: form.username,
                email: form.email,
                password: form.password,
                phone: form.phone
            })
            setToast({ type: 'success', message: 'Account created successfully ✅' })
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed'
            setToast({ type: 'error', message: msg })
        } finally {
            setLoading(false)
            setTimeout(() => setToast(null), 4000)
        }
    }

    return (
        <div className="register-page">
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

            {/* Left Panel */}
            <div className="register-left">
                <div className="register-left-content">
                    <div className="kodbank-logo" style={{ fontSize: '22px' }}>
                        <span className="kod">Kod</span>
                        <span className="bank">Bank</span>
                    </div>
                    <div className="green-underline" />

                    <h1 className="register-tagline">Bank Bold.</h1>
                    <p className="register-subtitle">The new way to own your money.</p>

                    <div className="register-features">
                        <div className="feature-row">
                            <span className="feature-bullet">■</span>
                            <span>256-bit encryption</span>
                        </div>
                        <div className="feature-row">
                            <span className="feature-bullet">■</span>
                            <span>JWT secured sessions</span>
                        </div>
                        <div className="feature-row">
                            <span className="feature-bullet">■</span>
                            <span>Real-time balance</span>
                        </div>
                    </div>

                    <div className="register-powered">⚡ Powered by KodBank</div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="register-right">
                <div className="register-form-container">
                    <h2 className="form-title">Create Account</h2>
                    <p className="form-subtitle">Takes less than a minute</p>
                    <div className="form-divider" />

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            {/* Username */}
                            <div className="input-group">
                                <label className="input-label">USERNAME</label>
                                <input
                                    type="text"
                                    name="username"
                                    className="glass-input"
                                    placeholder="johndoe"
                                    value={form.username}
                                    onChange={handleChange}
                                />
                                {errors.username && <span className="field-error">{errors.username}</span>}
                            </div>

                            {/* Email */}
                            <div className="input-group">
                                <label className="input-label">EMAIL</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="glass-input"
                                    placeholder="john@email.com"
                                    value={form.email}
                                    onChange={handleChange}
                                />
                                {errors.email && <span className="field-error">{errors.email}</span>}
                            </div>

                            {/* Password */}
                            <div className="input-group">
                                <label className="input-label">PASSWORD</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className="glass-input"
                                        placeholder="••••••••"
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
                                {errors.password && <span className="field-error">{errors.password}</span>}
                            </div>

                            {/* Phone */}
                            <div className="input-group">
                                <label className="input-label">PHONE</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="glass-input"
                                    placeholder="+91 9876543210"
                                    value={form.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Role Dropdown */}
                            <div className="input-group full-width">
                                <label className="input-label">ROLE</label>
                                <div
                                    className="custom-dropdown"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    <div className="dropdown-selected">
                                        <span>🏦 {role}</span>
                                        <span className={`dropdown-chevron ${dropdownOpen ? 'open' : ''}`}>▼</span>
                                    </div>
                                    {dropdownOpen && (
                                        <div className="dropdown-panel">
                                            <div
                                                className="dropdown-option"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <span>🏦 Customer</span>
                                                <span className="lock-icon">🔒</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="btn-pill btn-primary submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="spinner" />
                            ) : (
                                'Create Account →'
                            )}
                        </button>
                    </form>

                    <p className="form-footer">
                        Already have an account?{' '}
                        <span className="link-green" onClick={() => navigate('/login')}>Sign In</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
