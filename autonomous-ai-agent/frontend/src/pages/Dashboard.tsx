import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore, type Agent } from '../stores/agentStore';

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
                <h2 className="modal-title">Create New Agent</h2>

                {error && <div className="error">{error}</div>}

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

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Agent'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AgentCard: React.FC<{ agent: Agent; onClick: () => void }> = ({ agent, onClick }) => {
    const shortAddress = `${agent.walletAddress.slice(0, 6)}...${agent.walletAddress.slice(-4)}`;

    return (
        <div className="agent-card" onClick={onClick}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 className="agent-name">{agent.name}</h3>
                <span className={`badge ${agent.isActive ? 'badge-success' : 'badge-warning'}`}>
                    {agent.isActive ? '● Active' : '○ Inactive'}
                </span>
            </div>
            <div className="agent-address">{shortAddress}</div>
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
                    <div className="agent-stat-value" style={{ color: '#10b981' }}>
                        {(agent.spendingLimit - agent.totalSpent).toFixed(4)} ETH
                    </div>
                </div>
            </div>
        </div>
    );
};

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
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    + New Agent
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-4" style={{ marginBottom: '32px' }}>
                <div className="stat-card">
                    <div className="stat-label">Total Agents</div>
                    <div className="stat-value">{agents.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Active Agents</div>
                    <div className="stat-value success">{activeAgents}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Balance</div>
                    <div className="stat-value">{totalBalance.toFixed(4)} ETH</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Spent</div>
                    <div className="stat-value warning">{totalSpent.toFixed(4)} ETH</div>
                </div>
            </div>

            {/* Error */}
            {error && <div className="error">{error}</div>}

            {/* Loading */}
            {isLoading && (
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            )}

            {/* Agents Grid */}
            {!isLoading && agents.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <h3 style={{ marginBottom: '8px' }}>No agents yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Create your first AI agent to get started
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        Create Agent
                    </button>
                </div>
            )}

            {!isLoading && agents.length > 0 && (
                <div className="grid grid-3">
                    {agents.map((agent) => (
                        <AgentCard key={agent.id} agent={agent} onClick={() => handleAgentClick(agent)} />
                    ))}
                </div>
            )}

            <CreateAgentModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
        </div>
    );
};
