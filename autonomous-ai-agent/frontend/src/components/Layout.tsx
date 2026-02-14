import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from './ThemeProvider';
import {
    LayoutDashboard,
    Bot,
    LogOut,
    Sun,
    Moon,
    Brain,
} from 'lucide-react';

export const Layout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';

    return (
        <div className="app">
            <aside className="sidebar">
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="logo-icon">
                        <Brain size={22} />
                    </div>
                    <div>
                        <div className="logo-text">AI Agent</div>
                        <div className="logo-subtitle">Autonomous Wallet</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <LayoutDashboard size={20} className="nav-icon" />
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/agents"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Bot size={20} className="nav-icon" />
                        Agents
                    </NavLink>
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="user-avatar">{userInitial}</div>
                        <div className="user-email">{user?.email}</div>
                    </div>

                    <button className="theme-toggle" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>

                    <button className="sidebar-logout-btn" onClick={handleLogout}>
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};
