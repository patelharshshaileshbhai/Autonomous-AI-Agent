import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agentApi, taskApi } from '../services/api';
import {
    ArrowLeft,
    Bot,
    Wallet,
    TrendingUp,
    Shield,
    Activity,
    Sparkles,
    Play,
    RotateCcw,
    Copy,
    Check,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Zap,
    ListTodo,
} from 'lucide-react';

interface Task {
    id: string;
    prompt: string;
    status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
    cost: number | null;
    result: string | null;
    reasoning: string | null;
    executedAt: string | null;
    createdAt: string;
}

interface AgentDetailData {
    id: string;
    name: string;
    walletAddress: string;
    spendingLimit: number;
    totalSpent: number;
    isActive: boolean;
    balance: string;
    createdAt: string;
}

export const AgentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [agent, setAgent] = useState<AgentDetailData | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [newPrompt, setNewPrompt] = useState('');
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [isExecuting, setIsExecuting] = useState<string | null>(null);
    const [copiedAddress, setCopiedAddress] = useState(false);

    // Auto-dismiss error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (id) {
            loadAgentData();
        }
    }, [id]);

    const loadAgentData = async () => {
        try {
            const [agentRes, tasksRes] = await Promise.all([
                agentApi.getById(id!),
                taskApi.getByAgent(id!),
            ]);
            setAgent(agentRes.data.data.agent);
            setTasks(tasksRes.data.data.tasks);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(error.response?.data?.error?.message || 'Failed to load agent');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPrompt.trim()) return;

        setIsCreatingTask(true);
        setError('');
        try {
            const res = await taskApi.create(id!, newPrompt);
            setTasks([res.data.data.task, ...tasks]);
            setNewPrompt('');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(error.response?.data?.error?.message || 'Failed to create task');
        } finally {
            setIsCreatingTask(false);
        }
    };

    const handleExecuteTask = async (taskId: string) => {
        setIsExecuting(taskId);
        setError('');
        try {
            const res = await taskApi.execute(taskId);
            setTasks(tasks.map((t) => (t.id === taskId ? res.data.data.task : t)));
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(error.response?.data?.error?.message || 'Failed to execute task');
            loadAgentData();
        } finally {
            setIsExecuting(null);
        }
    };

    const handleRetryTask = async (task: Task) => {
        setIsCreatingTask(true);
        setError('');
        try {
            const res = await taskApi.retry(task.id);
            // Update the existing task in the list with the reset task data
            setTasks(tasks.map((t) => (t.id === task.id ? res.data.data.task : t)));
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(error.response?.data?.error?.message || 'Failed to retry task');
        } finally {
            setIsCreatingTask(false);
        }
    };

    const handleToggleActive = async () => {
        if (!agent) return;
        setError('');
        try {
            await agentApi.setActive(agent.id, !agent.isActive);
            setAgent({ ...agent, isActive: !agent.isActive });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(error.response?.data?.error?.message || 'Failed to update agent');
        }
    };

    const handleCopyAddress = () => {
        if (!agent) return;
        navigator.clipboard.writeText(agent.walletAddress);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
    };

    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'PENDING':
                return <Clock size={14} />;
            case 'RUNNING':
                return <Zap size={14} />;
            case 'DONE':
                return <CheckCircle size={14} />;
            case 'FAILED':
                return <XCircle size={14} />;
        }
    };

    const getStatusBadge = (status: Task['status']) => {
        const classes: Record<string, string> = {
            PENDING: 'badge-pending',
            RUNNING: 'badge-warning',
            DONE: 'badge-success',
            FAILED: 'badge-danger',
        };
        return (
            <span className={`badge ${classes[status]}`}>
                {getStatusIcon(status)}
                {status}
            </span>
        );
    };

    const getTimelineDotClass = (status: Task['status']) => {
        return `task-timeline-dot ${status.toLowerCase()}`;
    };

    if (isLoading) {
        return (
            <div className="loading">
                <div className="spinner" />
                <div className="loading-text">Loading agent...</div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="card">
                <div className="empty-state">
                    <div className="empty-state-icon" style={{ background: 'var(--danger-bg)' }}>
                        <AlertTriangle size={36} style={{ color: 'var(--danger)' }} />
                    </div>
                    <h3>Agent not found</h3>
                    <p>The agent you're looking for doesn't exist or you don't have access.</p>
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const remainingBudget = agent.spendingLimit - agent.totalSpent;
    const shortAddress = `${agent.walletAddress.slice(0, 10)}...${agent.walletAddress.slice(-8)}`;

    return (
        <div>
            {/* Back Button */}
            <button className="back-btn" onClick={() => navigate('/')}>
                <ArrowLeft size={16} />
                Back to Dashboard
            </button>

            {/* Error */}
            {error && (
                <div className="error">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                    <button className="error-dismiss" onClick={() => setError('')}>×</button>
                </div>
            )}

            {/* Agent Header */}
            <div className="card mb-lg">
                <div className="detail-header">
                    <div className="detail-avatar">
                        <Bot size={28} />
                    </div>
                    <div className="detail-info">
                        <h1 className="detail-title">{agent.name}</h1>
                        <div
                            className="agent-address"
                            onClick={handleCopyAddress}
                            style={{ cursor: 'pointer' }}
                            title="Click to copy full address"
                        >
                            <span>{shortAddress}</span>
                            {copiedAddress ? (
                                <Check size={12} style={{ color: 'var(--success)' }} />
                            ) : (
                                <Copy size={12} />
                            )}
                        </div>
                    </div>
                    <div className="detail-actions">
                        <button
                            className={`btn ${agent.isActive ? 'btn-danger' : 'btn-primary'} btn-sm`}
                            onClick={handleToggleActive}
                        >
                            {agent.isActive ? (
                                <>
                                    <Shield size={15} />
                                    Deactivate
                                </>
                            ) : (
                                <>
                                    <Activity size={15} />
                                    Activate
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="grid grid-4" style={{ marginTop: 20 }}>
                    <div className="stat-card">
                        <div className="stat-card-icon green">
                            <Activity size={20} />
                        </div>
                        <div className="stat-label">Status</div>
                        <span className={`badge ${agent.isActive ? 'badge-success' : 'badge-warning'}`}>
                            <span className={`status-dot ${agent.isActive ? 'active' : 'inactive'}`} />
                            {agent.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon purple">
                            <Wallet size={20} />
                        </div>
                        <div className="stat-label">Balance</div>
                        <div className="stat-value">{parseFloat(agent.balance).toFixed(4)} <span className="text-xs text-muted">ETH</span></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon amber">
                            <TrendingUp size={20} />
                        </div>
                        <div className="stat-label">Total Spent</div>
                        <div className="stat-value warning">{agent.totalSpent.toFixed(4)} <span className="text-xs text-muted">ETH</span></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon blue">
                            <Shield size={20} />
                        </div>
                        <div className="stat-label">Remaining</div>
                        <div className="stat-value success">{remainingBudget.toFixed(4)} <span className="text-xs text-muted">ETH</span></div>
                    </div>
                </div>
            </div>

            {/* Create Task */}
            <div className="card mb-lg">
                <div className="section-header">
                    <div className="section-title">
                        <Sparkles size={18} />
                        Create Task
                    </div>
                </div>
                <form onSubmit={handleCreateTask} className="task-input-form">
                    <div className="task-input-wrapper">
                        <Sparkles size={18} className="task-input-icon" />
                        <input
                            type="text"
                            className="input"
                            placeholder="Enter a task for your AI agent..."
                            value={newPrompt}
                            onChange={(e) => setNewPrompt(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isCreatingTask || !agent.isActive}
                    >
                        {isCreatingTask ? (
                            <>
                                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Create
                            </>
                        )}
                    </button>
                </form>
                {!agent.isActive && (
                    <div className="task-inactive-notice">
                        <AlertTriangle size={14} />
                        Activate the agent to create and execute tasks
                    </div>
                )}
            </div>

            {/* Tasks List */}
            <div className="card">
                <div className="section-header">
                    <div className="section-title">
                        <ListTodo size={18} />
                        Tasks
                        <span className="section-count">{tasks.length}</span>
                    </div>
                </div>

                {tasks.length === 0 && (
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <div className="empty-state-icon" style={{ width: 60, height: 60, borderRadius: 16 }}>
                            <ListTodo size={28} />
                        </div>
                        <h3>No tasks yet</h3>
                        <p>Create a task above to get started</p>
                    </div>
                )}

                {tasks.map((task, index) => (
                    <div
                        key={task.id}
                        className="task-item"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className={getTimelineDotClass(task.status)} />

                        <div className="task-content">
                            <div className="task-prompt">{task.prompt}</div>

                            {task.result && (
                                <div className={`task-result ${task.status === 'FAILED' ? 'failed' : 'success'}`}>
                                    {task.status === 'FAILED' ? (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                            <XCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                                            <span>{task.result}</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--success)' }} />
                                            <span>{task.result}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {task.cost !== null && task.cost > 0 && (
                                <div className="task-cost">
                                    <Wallet size={12} style={{ marginRight: 4 }} />
                                    Cost: {task.cost} ETH
                                </div>
                            )}
                        </div>

                        <div className="task-actions">
                            {getStatusBadge(task.status)}
                            {task.status === 'PENDING' && (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleExecuteTask(task.id)}
                                    disabled={isExecuting === task.id || !agent.isActive}
                                    style={
                                        isExecuting === task.id
                                            ? { animation: 'pulseGlow 1.5s ease-in-out infinite' }
                                            : {}
                                    }
                                >
                                    {isExecuting === task.id ? (
                                        <>
                                            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                            Running...
                                        </>
                                    ) : (
                                        <>
                                            <Play size={14} />
                                            Execute
                                        </>
                                    )}
                                </button>
                            )}
                            {task.status === 'FAILED' && (
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleRetryTask(task)}
                                    disabled={isCreatingTask || !agent.isActive}
                                >
                                    <RotateCcw size={14} />
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
