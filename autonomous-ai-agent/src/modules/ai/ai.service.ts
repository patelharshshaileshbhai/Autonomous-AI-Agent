import { GoogleGenerativeAI, GenerativeModel, Content } from '@google/generative-ai';
import { env } from '../../config/env';
import prisma from '../../config/prisma';
import { AIServiceError } from '../../utils/errors';
import { createLogger } from '../../utils/logger';
import { AI_PROMPTS } from './ai.prompts';

const logger = createLogger('AIService');

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

interface AgentMemoryRecord {
    context: string;
    role: string;
}

class AIService {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor() {
        this.genAI = new GoogleGenerativeAI(env.gemini.apiKey);
        // Use configurable model name, default to gemini-2.0-flash-exp (latest)
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
        logger.info(`Using Gemini model: ${modelName}`);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
    }

    /**
     * Analyze a task and determine if it should be executed
     */
    async analyzeTask(input: DecisionInput): Promise<TaskAnalysis> {
        try {
            const prompt = AI_PROMPTS.taskAnalysis(input);

            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            logger.debug('Task analysis response', { text });

            // Parse JSON response
            const analysis = this.parseJsonResponse<TaskAnalysis>(text);

            return analysis;
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            logger.error('Failed to analyze task', error);

            if (err.status === 404) {
                throw new AIServiceError('Gemini API key is invalid or model not found. Please check your GEMINI_API_KEY.');
            } else if (err.status === 403) {
                throw new AIServiceError('Gemini API access denied. Please verify your API key permissions.');
            } else if (err.status === 429) {
                throw new AIServiceError('Gemini API rate limit exceeded. Please try again later.');
            }

            throw new AIServiceError(err.message || 'Failed to analyze task with AI');
        }
    }

    /**
     * Execute a task and get the AI's response
     */
    async executeTask(input: DecisionInput): Promise<TaskExecutionResult> {
        try {
            const prompt = AI_PROMPTS.taskExecution(input);

            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            logger.debug('Task execution response', { text });

            // Parse JSON response
            const executionResult = this.parseJsonResponse<TaskExecutionResult>(text);

            return executionResult;
        } catch (error) {
            logger.error('Failed to execute task', error);
            throw new AIServiceError('Failed to execute task with AI');
        }
    }

    /**
     * Generate a chat response with memory context
     */
    async chat(agentId: string, message: string): Promise<string> {
        try {
            // Get agent memory for context
            const memories = await prisma.agentMemory.findMany({
                where: { agentId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });

            // Build conversation history
            const history: Content[] = memories.reverse().map((m: AgentMemoryRecord) => ({
                role: m.role as 'user' | 'model',
                parts: [{ text: m.context }],
            }));

            // Start chat with history
            const chat = this.model.startChat({
                history,
                generationConfig: {
                    maxOutputTokens: 2048,
                },
            });

            const result = await chat.sendMessage(message);
            const response = result.response.text();

            // Store the conversation in memory
            await prisma.agentMemory.createMany({
                data: [
                    { agentId, context: message, role: 'user' },
                    { agentId, context: response, role: 'assistant' },
                ],
            });

            return response;
        } catch (error) {
            logger.error('Chat failed', error);
            throw new AIServiceError('Failed to generate chat response');
        }
    }

    /**
     * Store context in agent memory
     */
    async storeMemory(agentId: string, context: string, role: string = 'system'): Promise<void> {
        await prisma.agentMemory.create({
            data: {
                agentId,
                context,
                role,
            },
        });
    }

    /**
     * Get agent memory/context
     */
    async getMemory(agentId: string, limit: number = 20): Promise<string[]> {
        const memories = await prisma.agentMemory.findMany({
            where: { agentId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return memories.map((m: AgentMemoryRecord) => m.context);
    }

    /**
     * Clear agent memory
     */
    async clearMemory(agentId: string): Promise<void> {
        await prisma.agentMemory.deleteMany({
            where: { agentId },
        });
        logger.info('Agent memory cleared', { agentId });
    }

    /**
     * Parse JSON from AI response (handles markdown code blocks)
     */
    private parseJsonResponse<T>(text: string): T {
        // Remove markdown code blocks if present
        let cleanText = text.trim();

        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.slice(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.slice(3);
        }

        if (cleanText.endsWith('```')) {
            cleanText = cleanText.slice(0, -3);
        }

        cleanText = cleanText.trim();

        try {
            return JSON.parse(cleanText) as T;
        } catch {
            logger.error('Failed to parse AI response as JSON', { text });
            throw new AIServiceError('Invalid AI response format');
        }
    }
}

export const aiService = new AIService();
export default aiService;
