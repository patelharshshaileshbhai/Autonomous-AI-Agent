import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore, type Agent } from '../stores/agentStore';
import {
    Plus,
    Bot,
    Wallet,
    Activity,
    TrendingUp,
    X,
    Sparkles,
    Copy,
    Check,
} from 'lucide-react';

/* ==================== CREATE AGENT MODAL ==================== */
interface CreateAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateAgentModal: React.FC<CreateAgentModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [spendingLimit, setSpendingLimit] = useState('0.1');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const createAgent = useAgentStore((state) => state.createAgent);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await createAgent(name, parseFloat(spendingLimit));
            setName('');
            setSpendingLimit('0.1');
            onClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(error.response?.data?.error?.message || 'Failed to create agent');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="flex-between mb-lg">
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                                    borderRadius: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                }}
                            >
                                <Bot size={18} />
                            </div>
                            Create New Agent
                        </div>
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <div className="error">
                        <span>{error}</span>
                        <button className="error-dismiss" onClick={() => setError('')}>×</button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Agent Name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="My AI Agent"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Spending Limit (ETH)</label>
                        <input
                            type="number"
                            className="input"
                            step="0.01"
                            min="0"
                            value={spendingLimit}
                            onChange={(e) => setSpendingLimit(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Create Agent
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ==================== AGENT CARD ==================== */
const AgentCard: React.FC<{ agent: Agent; onClick: () => void; index: number }> = ({
    agent,
    onClick,
    index,
}) => {
    const shortAddress = `${agent.walletAddress.slice(0, 6)}...${agent.walletAddress.slice(-4)}`;
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(agent.walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="agent-card"
            onClick={onClick}
            style={{ animationDelay: `${index * 0.08}s` }}
        >
            <div className="agent-card-header">
                <div>
                    <div className="agent-avatar">
                        <Bot size={22} />
                    </div>
                    <h3 className="agent-name">{agent.name}</h3>
                </div>
                <span className={`badge ${agent.isActive ? 'badge-success' : 'badge-warning'}`}>
                    <span className={`status-dot ${agent.isActive ? 'active' : 'inactive'}`} />
                    {agent.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="agent-address" onClick={handleCopy} title="Click to copy">
                <span>{shortAddress}</span>
                {copied ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
            </div>

            <div className="agent-stats">
                <div className="agent-stat">
                    <div className="agent-stat-label">Balance</div>
                    <div className="agent-stat-value">{parseFloat(agent.balance).toFixed(4)} ETH</div>
                </div>
                <div className="agent-stat">
                    <div className="agent-stat-label">Total Spent</div>
                    <div className="agent-stat-value">{agent.totalSpent.toFixed(4)} ETH</div>
                </div>
                <div className="agent-stat">
                    <div className="agent-stat-label">Limit</div>
                    <div className="agent-stat-value">{agent.spendingLimit} ETH</div>
                </div>
                <div className="agent-stat">
                    <div className="agent-stat-label">Remaining</div>
                    <div className="agent-stat-value" style={{ color: 'var(--success)' }}>
                        {(agent.spendingLimit - agent.totalSpent).toFixed(4)} ETH
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ==================== DASHBOARD ==================== */
export const Dashboard: React.FC = () => {
    const { agents, isLoading, error, fetchAgents } = useAgentStore();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    const totalBalance = agents.reduce((sum, a) => sum + parseFloat(a.balance), 0);
    const totalSpent = agents.reduce((sum, a) => sum + a.totalSpent, 0);
    const activeAgents = agents.filter((a) => a.isActive).length;

    const handleAgentClick = (agent: Agent) => {
        navigate(`/agents/${agent.id}`);
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Manage your autonomous AI agents on the blockchain</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} />
                    New Agent
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-4 mb-lg">
                <div className="stat-card" style={{ animationDelay: '0s' }}>
                    <div className="stat-card-icon blue">
                        <Bot size={22} />
                    </div>
                    <div className="stat-label">Total Agents</div>
                    <div className="stat-value info">{agents.length}</div>
                </div>
                <div className="stat-card" style={{ animationDelay: '0.05s' }}>
                    <div className="stat-card-icon green">
                        <Activity size={22} />
                    </div>
                    <div className="stat-label">Active Agents</div>
                    <div className="stat-value success">{activeAgents}</div>
                </div>
                <div className="stat-card" style={{ animationDelay: '0.1s' }}>
                    <div className="stat-card-icon purple">
                        <Wallet size={22} />
                    </div>
                    <div className="stat-label">Total Balance</div>
                    <div className="stat-value">{totalBalance.toFixed(4)} <span className="text-sm text-muted">ETH</span></div>
                </div>
                <div className="stat-card" style={{ animationDelay: '0.15s' }}>
                    <div className="stat-card-icon amber">
                        <TrendingUp size={22} />
                    </div>
                    <div className="stat-label">Total Spent</div>
                    <div className="stat-value warning">{totalSpent.toFixed(4)} <span className="text-sm text-muted">ETH</span></div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="error">
                    <span>{error}</span>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="loading">
                    <div className="spinner" />
                    <div className="loading-text">Loading agents...</div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && agents.length === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Bot size={36} />
                        </div>
                        <h3>No agents yet</h3>
                        <p>Create your first AI agent to start managing autonomous blockchain wallets</p>
                        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                            <Sparkles size={16} />
                            Create Your First Agent
                        </button>
                    </div>
                </div>
            )}

            {/* Agents Grid */}
            {!isLoading && agents.length > 0 && (
                <div>
                    <div className="section-header">
                        <div className="section-title">
                            <Bot size={18} />
                            Your Agents
                            <span className="section-count">{agents.length}</span>
                        </div>
                    </div>
                    <div className="grid grid-3">
                        {agents.map((agent, index) => (
                            <AgentCard
                                key={agent.id}
                                agent={agent}
                                onClick={() => handleAgentClick(agent)}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            )}

            <CreateAgentModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
        </div>
    );
};
