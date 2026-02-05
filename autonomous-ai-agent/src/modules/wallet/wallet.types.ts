export interface WalletInfo {
    address: string;
    encryptedPrivateKey: string;
}

export interface TransactionRequest {
    to: string;
    value: string;
    data?: string;
}

export interface TransactionResult {
    hash: string;
    from: string;
    to: string;
    value: string;
    gasUsed?: string;
}

export interface WalletBalance {
    address: string;
    balanceEth: string;
    balanceWei: string;
}
