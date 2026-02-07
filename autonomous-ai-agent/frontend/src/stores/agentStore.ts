import { create } from 'zustand';
import { agentApi } from '../services/api';

export interface Agent {
    id: string;
    name: string;
    walletAddress: string;
    spendingLimit: number;
    totalSpent: number;
    isActive: boolean;
    createdAt: string;
    balance: string;
}

interface AgentState {
    agents: Agent[];
    selectedAgent: Agent | null;
    isLoading: boolean;
    error: string | null;
    fetchAgents: () => Promise<void>;
    createAgent: (name: string, spendingLimit?: number) => Promise<Agent>;
    selectAgent: (agent: Agent | null) => void;
    updateSpendingLimit: (id: string, limit: number) => Promise<void>;
    toggleActive: (id: string, isActive: boolean) => Promise<void>;
    deleteAgent: (id: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
    agents: [],
    selectedAgent: null,
    isLoading: false,
    error: null,

    fetchAgents: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await agentApi.getAll();
            set({ agents: response.data.data.agents, isLoading: false });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            set({ error: error.response?.data?.error?.message || 'Failed to fetch agents', isLoading: false });
        }
    },

    createAgent: async (name: string, spendingLimit?: number) => {
        const response = await agentApi.create(name, spendingLimit);
        const newAgent = response.data.data.agent;
        set({ agents: [newAgent, ...get().agents] });
        return newAgent;
    },

    selectAgent: (agent: Agent | null) => {
        set({ selectedAgent: agent });
    },

    updateSpendingLimit: async (id: string, limit: number) => {
        await agentApi.updateSpendingLimit(id, limit);
        set({
            agents: get().agents.map((a) =>
                a.id === id ? { ...a, spendingLimit: limit } : a
            ),
        });
    },

    toggleActive: async (id: string, isActive: boolean) => {
        await agentApi.setActive(id, isActive);
        set({
            agents: get().agents.map((a) =>
                a.id === id ? { ...a, isActive } : a
            ),
        });
    },

    deleteAgent: async (id: string) => {
        await agentApi.delete(id);
        set({ agents: get().agents.filter((a) => a.id !== id) });
    },
}));
