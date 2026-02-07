import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const Layout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="logo">🤖 AI Agent</div>

                <nav style={{ flex: 1 }}>
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        📊 Dashboard
                    </NavLink>
                    <NavLink to="/agents" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        🤖 Agents
                    </NavLink>
                </nav>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <div style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {user?.email}
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
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
