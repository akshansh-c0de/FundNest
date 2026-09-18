import OpenAI from 'openai';

/**
 * FundNest Centralized Multi-Provider AI Service Client
 * Single shared wrapper module for all GenAI and embedding operations.
 * 
 * Supports:
 * - OpenAI (gpt-4o-mini / text-embedding-3-small)
 * - Google Gemini (free API via Google AI Studio, using OpenAI-compatible endpoint)
 * - Groq (free API via Groq console, using OpenAI-compatible endpoint)
 * - Intelligent offline / quota-exhausted fallback handling
 */

class OpenAIClientService {
    constructor() {
        this.apiKey = null;
        this.baseURL = undefined;
        this.provider = 'OpenAI';
        this.chatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
        this.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
        this.lastError = null;
        this.client = null;
        this.getClient();
    }

    /**
     * Resolve provider and config based on key format or environment
     */
    resolveConfig(key) {
        if (!key) return null;
        const trimmed = key.trim();

        // Google Gemini API Key (e.g. AIzaSy...)
        if (trimmed.startsWith('AIza')) {
            return {
                provider: 'Google Gemini',
                apiKey: trimmed,
                baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
                chatModel: 'gemini-1.5-flash',
                embeddingModel: 'text-embedding-004',
                billingUrl: 'https://aistudio.google.com/app/apikey',
            };
        }

        // Groq API Key (e.g. gsk_...)
        if (trimmed.startsWith('gsk_')) {
            return {
                provider: 'Groq',
                apiKey: trimmed,
                baseURL: 'https://api.groq.com/openai/v1',
                chatModel: 'llama-3.3-70b-versatile',
                embeddingModel: 'text-embedding-3-small',
                billingUrl: 'https://console.groq.com/keys',
            };
        }

        // OpenAI API Key (e.g. sk-...)
        if (trimmed.startsWith('sk-') && trimmed !== 'your_openai_api_key_here') {
            return {
                provider: 'OpenAI',
                apiKey: trimmed,
                baseURL: 'https://api.openai.com/v1',
                chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
                embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
                billingUrl: 'https://platform.openai.com/settings/organization/billing',
            };
        }

        return null;
    }

    /**
     * Dynamically resolve client instance using current environment
     */
    getClient() {
        const key = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;
        const config = this.resolveConfig(key);

        if (config) {
            if (!this.client || this.apiKey !== config.apiKey) {
                this.apiKey = config.apiKey;
                this.baseURL = config.baseURL;
                this.provider = config.provider;
                this.chatModel = config.chatModel;
                this.embeddingModel = config.embeddingModel;
                this.billingUrl = config.billingUrl;
                this.lastError = null;

                try {
                    this.client = new OpenAI({
                        apiKey: this.apiKey,
                        baseURL: this.baseURL,
                    });
                    console.log(`[AIClient] Initialized ${this.provider} client (${this.apiKey.slice(0, 7)}...${this.apiKey.slice(-4)}) using model ${this.chatModel}`);
                } catch (err) {
                    console.warn('[AIClient] Initialization warning:', err.message);
                }
            }
        }
        return this.client;
    }

    /**
     * Update API key at runtime and sync with environment
     */
    setApiKey(newKey) {
        if (!newKey || typeof newKey !== 'string') return false;
        const config = this.resolveConfig(newKey);
        if (!config) return false;

        if (config.provider === 'Google Gemini') {
            process.env.GEMINI_API_KEY = config.apiKey;
        } else if (config.provider === 'Groq') {
            process.env.GROQ_API_KEY = config.apiKey;
        } else {
            process.env.OPENAI_API_KEY = config.apiKey;
        }

        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL;
        this.provider = config.provider;
        this.chatModel = config.chatModel;
        this.embeddingModel = config.embeddingModel;
        this.billingUrl = config.billingUrl;
        this.lastError = null;

        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
        });

        console.log(`[AIClient] Runtime API key updated for ${this.provider} (${config.apiKey.slice(0, 7)}...${config.apiKey.slice(-4)})`);
        return true;
    }

    /**
     * Check if a valid live AI API key is configured
     */
    isConfigured() {
        const client = this.getClient();
        return Boolean(client && this.apiKey);
    }

    /**
     * Get real-time status of AI integration
     */
    getStatus() {
        const isReady = this.isConfigured();
        const hasQuotaError = Boolean(
            this.lastError &&
            (this.lastError.status === 429 ||
             this.lastError.code === 'credit_balance_exhausted' ||
             this.lastError.code === 'insufficient_quota')
        );

        return {
            configured: isReady,
            mode: hasQuotaError ? 'quota_exhausted' : (isReady ? 'live' : 'offline_fallback'),
            provider: this.provider || 'OpenAI',
            chatModel: this.chatModel,
            embeddingModel: this.embeddingModel,
            maskedKey: this.apiKey ? `${this.apiKey.slice(0, 7)}...${this.apiKey.slice(-4)}` : null,
            error: this.lastError ? this.lastError.message : null,
            errorCode: this.lastError ? this.lastError.code : null,
            billingUrl: this.billingUrl || 'https://platform.openai.com/settings/organization/billing',
        };
    }

    /**
     * Generate text completion
     */
    async generateChatCompletion({ messages = [], systemPrompt, temperature = 0.7, maxTokens = 1200, fallbackText = '' }) {
        if (!this.isConfigured()) {
            console.warn('[AIClient] API key not configured or invalid. Using intelligent fallback.');
            return fallbackText;
        }

        const formattedMessages = [];
        if (systemPrompt) {
            formattedMessages.push({ role: 'system', content: systemPrompt });
        }
        formattedMessages.push(...messages);

        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const response = await this.client.chat.completions.create({
                    model: this.chatModel,
                    messages: formattedMessages,
                    temperature,
                    max_tokens: maxTokens,
                });

                return response.choices?.[0]?.message?.content?.trim() || fallbackText;
            } catch (error) {
                this.lastError = {
                    status: error.status,
                    code: error.code || error.error?.code || (error.status === 429 ? 'credit_balance_exhausted' : 'api_error'),
                    message: error.message,
                };
                console.error(`[AIClient] Chat Completion Attempt ${attempts} failed (${error.status}):`, error.message);
                if (error.status === 429 || attempts >= maxAttempts) {
                    return fallbackText;
                }
                await new Promise(r => setTimeout(r, 800));
            }
        }
        return fallbackText;
    }

    /**
     * Generate structured JSON output (SWOT analysis, risk narrative, pitch scores)
     */
    async generateStructuredJson({ systemPrompt, userPrompt, fallbackData = {} }) {
        if (!this.isConfigured()) {
            console.warn('[AIClient] API key not configured. Returning fallback structured data.');
            return fallbackData;
        }

        const messages = [
            {
                role: 'system',
                content: `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with valid JSON matching the requested structure. Do not include markdown code blocks or explanatory text outside the JSON object.`,
            },
            {
                role: 'user',
                content: userPrompt,
            },
        ];

        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const response = await this.client.chat.completions.create({
                    model: this.chatModel,
                    messages,
                    response_format: { type: 'json_object' },
                    temperature: 0.3,
                });

                const rawContent = response.choices?.[0]?.message?.content?.trim();
                if (!rawContent) return fallbackData;

                const cleanJson = rawContent
                    .replace(/^```json\s*/i, '')
                    .replace(/^```\s*/i, '')
                    .replace(/```\s*$/i, '')
                    .trim();

                return JSON.parse(cleanJson);
            } catch (error) {
                this.lastError = {
                    status: error.status,
                    code: error.code || error.error?.code || (error.status === 429 ? 'credit_balance_exhausted' : 'api_error'),
                    message: error.message,
                };
                console.error(`[AIClient] Structured JSON Attempt ${attempts} failed:`, error.message);
                if (error.status === 429 || attempts >= maxAttempts) {
                    return fallbackData;
                }
                await new Promise(r => setTimeout(r, 800));
            }
        }
        return fallbackData;
    }

    /**
     * Generate vector embedding for semantic matching
     */
    async generateEmbedding(text) {
        const cleanText = (text || '').replace(/\n+/g, ' ').trim();
        if (!cleanText) {
            return this.generateDeterministicPseudoEmbedding('empty');
        }

        if (!this.isConfigured() || this.provider !== 'OpenAI') {
            return this.generateDeterministicPseudoEmbedding(cleanText);
        }

        try {
            const response = await this.client.embeddings.create({
                model: this.embeddingModel,
                input: cleanText,
                encoding_format: 'float',
            });

            return response.data?.[0]?.embedding || this.generateDeterministicPseudoEmbedding(cleanText);
        } catch (error) {
            console.error('[AIClient] Embedding generation failed:', error.message);
            return this.generateDeterministicPseudoEmbedding(cleanText);
        }
    }

    /**
     * Offline deterministic pseudo-embedding generator (1536-dim normalized vector)
     * Ensures demo/viva never crashes even if offline or API key runs out of quota.
     */
    generateDeterministicPseudoEmbedding(seedText) {
        const dim = 1536;
        const embedding = new Array(dim);
        let h = 0x811c9dc5;
        for (let i = 0; i < seedText.length; i++) {
            h ^= seedText.charCodeAt(i);
            h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
        }

        let norm = 0;
        for (let i = 0; i < dim; i++) {
            h = (h ^ (h << 13)) >>> 0;
            h = (h ^ (h >>> 17)) >>> 0;
            h = (h ^ (h << 5)) >>> 0;
            const val = ((h % 1000) - 500) / 500;
            embedding[i] = val;
            norm += val * val;
        }

        norm = Math.sqrt(norm) || 1;
        for (let i = 0; i < dim; i++) {
            embedding[i] = Number((embedding[i] / norm).toFixed(6));
        }

        return embedding;
    }
}

const openaiClient = new OpenAIClientService();
export default openaiClient;
