import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../components/ThemeProvider';
import { NetworkBackground } from '../components/NetworkBackground';
import {
    Brain,
    Eye,
    EyeOff,
    Sun,
    Moon,
    Mail,
    Lock,
    ArrowRight,
    Sparkles,
} from 'lucide-react';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const { theme, toggleTheme } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(error.response?.data?.error?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <NetworkBackground />

            <button className="auth-theme-toggle" onClick={toggleTheme} title="Toggle theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="auth-content">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">
                            <Brain size={28} />
                        </div>
                        <h1 className="auth-title">AI Agent</h1>
                    </div>

                    <p className="auth-subtitle">Sign in to manage your autonomous blockchain agents</p>

                    {error && (
                        <div className="error">
                            <span>{error}</span>
                            <button className="error-dismiss" onClick={() => setError('')}>×</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>
                                <Mail size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                Email
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>
                                <Lock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                Password
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    className="input-icon"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: 4 }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Sign In
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="auth-link">
                        Don't have an account? <Link to="/register">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const register = useAuthStore((state) => state.register);
    const { theme, toggleTheme } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            await register(email, password);
            navigate('/');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(error.response?.data?.error?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <NetworkBackground />

            <button className="auth-theme-toggle" onClick={toggleTheme} title="Toggle theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="auth-content">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">
                            <Brain size={28} />
                        </div>
                        <h1 className="auth-title">Create Account</h1>
                    </div>

                    <p className="auth-subtitle">Start managing your AI-powered blockchain agents</p>

                    {error && (
                        <div className="error">
                            <span>{error}</span>
                            <button className="error-dismiss" onClick={() => setError('')}>×</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>
                                <Mail size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                Email
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>
                                <Lock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                Password
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    className="input-icon"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>
                                <Lock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                Confirm Password
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: 4 }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Create Account
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="auth-link">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
