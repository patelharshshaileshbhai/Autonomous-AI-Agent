import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agentApi, taskApi } from '../services/api';

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

interface AgentDetail {
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
    const [agent, setAgent] = useState<AgentDetail | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [newPrompt, setNewPrompt] = useState('');
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [isExecuting, setIsExecuting] = useState<string | null>(null);

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
            // Reload tasks to get updated status
            loadAgentData();
        } finally {
            setIsExecuting(null);
        }
    };

    const handleRetryTask = async (task: Task) => {
        // Create a new task with the same prompt
        setIsCreatingTask(true);
        setError('');
        try {
            const res = await taskApi.create(id!, task.prompt);
            setTasks([res.data.data.task, ...tasks]);
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

    const getStatusBadge = (status: Task['status']) => {
        const classes = {
            PENDING: 'badge-pending',
            RUNNING: 'badge-warning',
            DONE: 'badge-success',
            FAILED: 'badge-danger',
        };
        return <span className={`badge ${classes[status]}`}>{status}</span>;
    };

    if (isLoading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!agent) {
        return <div className="error">Agent not found</div>;
    }

    return (
        <div>
            <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/')}
                style={{ marginBottom: '24px' }}
            >
                ← Back to Dashboard
            </button>

            {error && (
                <div className="error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{error}</span>
                    <button
                        onClick={() => setError('')}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Agent Header */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <div>
                        <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>{agent.name}</h1>
                        <div className="agent-address">{agent.walletAddress}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            className={`btn ${agent.isActive ? 'btn-danger' : 'btn-primary'} btn-sm`}
                            onClick={handleToggleActive}
                        >
                            {agent.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-4">
                    <div className="stat-card">
                        <div className="stat-label">Status</div>
                        <span className={`badge ${agent.isActive ? 'badge-success' : 'badge-warning'}`}>
                            {agent.isActive ? '● Active' : '○ Inactive'}
                        </span>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Balance</div>
                        <div className="stat-value">{parseFloat(agent.balance).toFixed(4)} ETH</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Spent</div>
                        <div className="stat-value warning">{agent.totalSpent.toFixed(4)} ETH</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Remaining</div>
                        <div className="stat-value success">
                            {(agent.spendingLimit - agent.totalSpent).toFixed(4)} ETH
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Task */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h2 className="card-title" style={{ marginBottom: '16px' }}>Create Task</h2>
                <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '12px' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Enter a task for your AI agent..."
                        value={newPrompt}
                        onChange={(e) => setNewPrompt(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={isCreatingTask || !agent.isActive}>
                        {isCreatingTask ? 'Creating...' : 'Create Task'}
                    </button>
                </form>
                {!agent.isActive && (
                    <p style={{ marginTop: '8px', color: 'var(--warning)', fontSize: '0.85rem' }}>
                        ⚠️ Activate the agent to create and execute tasks
                    </p>
                )}
            </div>

            {/* Tasks List */}
            <div className="card">
                <h2 className="card-title" style={{ marginBottom: '16px' }}>Tasks ({tasks.length})</h2>

                {tasks.length === 0 && (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px' }}>
                        No tasks yet. Create one above.
                    </p>
                )}

                {tasks.map((task) => (
                    <div key={task.id} className="task-item">
                        <div style={{ flex: 1 }}>
                            <div className="task-prompt">{task.prompt}</div>
                            {task.result && (
                                <div style={{
                                    marginTop: '8px',
                                    color: task.status === 'FAILED' ? 'var(--danger)' : 'var(--text-secondary)',
                                    fontSize: '0.9rem'
                                }}>
                                    {task.status === 'FAILED' ? '❌ Error: ' : '✅ Result: '}
                                    {task.result}
                                </div>
                            )}
                            {task.cost !== null && task.cost > 0 && (
                                <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--warning)' }}>
                                    Cost: {task.cost} ETH
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {getStatusBadge(task.status)}
                            {task.status === 'PENDING' && (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleExecuteTask(task.id)}
                                    disabled={isExecuting === task.id || !agent.isActive}
                                >
                                    {isExecuting === task.id ? 'Running...' : 'Execute'}
                                </button>
                            )}
                            {task.status === 'FAILED' && (
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleRetryTask(task)}
                                    disabled={isCreatingTask || !agent.isActive}
                                >
                                    🔄 Retry
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
