/**
 * Vector Math Utilities for Semantic Matching
 * Computes dot products, vector norms, and cosine similarity for OpenAI 1536-dim embeddings.
 */

export function cosineSimilarity(vecA, vecB) {
    if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0) {
        return 0;
    }

    const minLen = Math.min(vecA.length, vecB.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < minLen; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
        return 0;
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    // Clamp to [-1, 1] for floating point stability
    return Math.max(-1, Math.min(1, similarity));
}

export function formatSimilarityPercentage(score) {
    // Convert cosine range [0, 1] into readable 0-100%
    const normalized = Math.max(0, score);
    return Math.round(normalized * 100);
}
