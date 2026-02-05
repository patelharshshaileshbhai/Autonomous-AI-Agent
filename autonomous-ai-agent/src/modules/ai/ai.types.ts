export interface TaskAnalysis {
    isValid: boolean;
    requiresPayment: boolean;
    estimatedCost: number;
    reasoning: string;
    suggestedAction: string;
    riskLevel: 'low' | 'medium' | 'high';
}

export interface TaskExecutionResult {
    success: boolean;
    output: string;
    reasoning: string;
    cost: number;
    actions: string[];
}

export interface DecisionInput {
    task: string;
    agentContext: {
        name: string;
        spendingLimit: number;
        totalSpent: number;
        isActive: boolean;
    };
    memory?: string[];
}

export interface CostEstimation {
    estimatedCost: number;
    breakdown: {
        computation: number;
        transactions: number;
        apiCalls: number;
    };
    reasoning: string;
}
