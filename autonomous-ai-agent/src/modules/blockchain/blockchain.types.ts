export interface BlockchainLog {
    id: string;
    agentId: string;
    txHash: string;
    action: string;
    cost: number;
    gasUsed?: number;
    timestamp: Date;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

export interface TransactionVerification {
    confirmed: boolean;
    blockNumber?: number;
    gasUsed?: string;
}

export interface OnChainAction {
    agent: string;
    actionHash: string;
    cost: string;
    timestamp: number;
}
