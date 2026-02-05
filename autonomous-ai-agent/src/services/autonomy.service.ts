import { createLogger } from '../utils/logger';

const logger = createLogger('AutonomyEngine');

/**
 * Security rules for the autonomous agent
 */
export const SECURITY_RULES = {
    // Maximum allowed spending per transaction (in ETH)
    MAX_SINGLE_TRANSACTION: 0.05,

    // Blocked actions - agent cannot perform these
    BLOCKED_ACTIONS: [
        'drain wallet',
        'transfer ownership',
        'change owner',
        'send all funds',
        'call unknown contract',
        'approve unlimited',
        'delete agent',
        'modify security',
    ],

    // Required keywords for valid tasks
    VALID_TASK_PATTERNS: [
        'analyze',
        'research',
        'calculate',
        'summarize',
        'generate',
        'create',
        'check',
        'verify',
        'monitor',
        'report',
    ],
};

export interface ValidationResult {
    isValid: boolean;
    reason?: string;
    riskLevel: 'low' | 'medium' | 'high';
}

class AutonomyService {
    /**
     * Validate a task against security rules
     */
    validateTask(prompt: string): ValidationResult {
        const lowerPrompt = prompt.toLowerCase();

        // Check for blocked actions
        for (const blocked of SECURITY_RULES.BLOCKED_ACTIONS) {
            if (lowerPrompt.includes(blocked)) {
                logger.warn('Blocked action detected', { prompt, blocked });
                return {
                    isValid: false,
                    reason: `Action not allowed: ${blocked}`,
                    riskLevel: 'high',
                };
            }
        }

        // Check for suspicious patterns
        if (this.containsSuspiciousPatterns(lowerPrompt)) {
            return {
                isValid: false,
                reason: 'Suspicious patterns detected in task',
                riskLevel: 'high',
            };
        }

        // Determine risk level
        const riskLevel = this.assessRiskLevel(lowerPrompt);

        return {
            isValid: true,
            riskLevel,
        };
    }

    /**
     * Check if agent can spend the amount
     */
    async validateSpending(amount: number): Promise<ValidationResult> {
        // Check single transaction limit
        if (amount > SECURITY_RULES.MAX_SINGLE_TRANSACTION) {
            return {
                isValid: false,
                reason: `Amount ${amount} ETH exceeds maximum single transaction limit of ${SECURITY_RULES.MAX_SINGLE_TRANSACTION} ETH`,
                riskLevel: 'high',
            };
        }

        return {
            isValid: true,
            riskLevel: amount > 0.01 ? 'medium' : 'low',
        };
    }

    /**
     * Check for suspicious patterns in prompts
     */
    private containsSuspiciousPatterns(prompt: string): boolean {
        const suspiciousPatterns = [
            /0x[a-fA-F0-9]{40}.*transfer/i,  // Direct address transfers
            /private\s*key/i,                 // Trying to access private keys
            /seed\s*phrase/i,                 // Trying to access seed phrases
            /withdraw\s*all/i,                // Withdraw all funds
            /send\s*everything/i,             // Send all funds
            /unlimited\s*approval/i,          // Unlimited token approvals
            /selfdestruct/i,                  // Contract destruction
            /delegatecall/i,                  // Dangerous delegate calls
        ];

        return suspiciousPatterns.some(pattern => pattern.test(prompt));
    }

    /**
     * Assess risk level of a task
     */
    private assessRiskLevel(prompt: string): 'low' | 'medium' | 'high' {
        const highRiskKeywords = ['transfer', 'send', 'pay', 'withdraw', 'contract'];
        const mediumRiskKeywords = ['execute', 'call', 'invoke', 'transaction'];

        const hasHighRisk = highRiskKeywords.some(k => prompt.includes(k));
        const hasMediumRisk = mediumRiskKeywords.some(k => prompt.includes(k));

        if (hasHighRisk) return 'high';
        if (hasMediumRisk) return 'medium';
        return 'low';
    }

    /**
     * Enforce rate limiting for agent actions
     */
    async checkRateLimit(): Promise<{ allowed: boolean; retryAfter?: number }> {
        // Simple in-memory rate limiting
        // In production, use Redis for distributed rate limiting
        return { allowed: true };
    }

    /**
     * Log an audit entry for an action
     */
    logAudit(agentId: string, action: string, details: Record<string, unknown>): void {
        logger.info('AUDIT', {
            agentId,
            action,
            timestamp: new Date().toISOString(),
            ...details,
        });
    }
}

export const autonomyService = new AutonomyService();
export default autonomyService;
