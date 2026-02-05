import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
    // Server
    PORT: z.string().default('4000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // Gemini AI
    GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),

    // Blockchain
    POLYGON_RPC_URL: z.string().url('POLYGON_RPC_URL must be a valid URL'),
    CHAIN_ID: z.string().default('80002'),
    CONTRACT_ADDRESS: z.string().optional(),

    // Wallet Security
    WALLET_ENCRYPTION_KEY: z.string().length(64, 'WALLET_ENCRYPTION_KEY must be a 32-byte hex string (64 characters)'),

    // Agent Defaults
    DEFAULT_SPENDING_LIMIT: z.string().default('0.1'),
});

// Parse and validate environment
const parseEnv = () => {
    try {
        const parsed = envSchema.parse(process.env);
        return {
            server: {
                port: parseInt(parsed.PORT, 10),
                nodeEnv: parsed.NODE_ENV,
                isDev: parsed.NODE_ENV === 'development',
                isProd: parsed.NODE_ENV === 'production',
            },
            database: {
                url: parsed.DATABASE_URL,
            },
            jwt: {
                secret: parsed.JWT_SECRET,
                expiresIn: parsed.JWT_EXPIRES_IN,
            },
            gemini: {
                apiKey: parsed.GEMINI_API_KEY,
            },
            blockchain: {
                rpcUrl: parsed.POLYGON_RPC_URL,
                chainId: parseInt(parsed.CHAIN_ID, 10),
                contractAddress: parsed.CONTRACT_ADDRESS || '',
            },
            wallet: {
                encryptionKey: parsed.WALLET_ENCRYPTION_KEY,
            },
            agent: {
                defaultSpendingLimit: parseFloat(parsed.DEFAULT_SPENDING_LIMIT),
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
            console.error('❌ Environment validation failed:');
            missingVars.forEach(v => console.error(`   - ${v}`));
            process.exit(1);
        }
        throw error;
    }
};

export const env = parseEnv();
export type Env = ReturnType<typeof parseEnv>;
