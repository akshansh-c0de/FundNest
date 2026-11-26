import numpy as np
from sklearn.feature_extraction.text import HashingVectorizer
from typing import List
import os


class EmbeddingService:
    """Text embedding service with SentenceTransformer and HashingVectorizer fallback."""

    def __init__(self, model_name: str = None):
        self.model_name = model_name or os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        self.model = None
        self.fallback_vectorizer = None
        self._load_model()

    def _load_model(self):
        print(f"Loading embedding model: {self.model_name}")
        try:
            from sentence_transformers import SentenceTransformer

            self.model = SentenceTransformer(self.model_name)
            print("Embedding model loaded successfully")
        except (ImportError, OSError, Exception) as exc:
            print(
                f"SentenceTransformer unavailable ({exc}); using 384-dim HashingVectorizer fallback."
            )
            self.model = None
            self.fallback_vectorizer = HashingVectorizer(
                n_features=384,
                ngram_range=(1, 2),
                alternate_sign=False,
                norm="l2",
            )

    def get_embedding(self, text: str) -> np.ndarray:
        """Generate a 384-dimensional embedding for a single text."""
        if self.model is not None:
            return self.model.encode(text, convert_to_numpy=True)
        vec = self.fallback_vectorizer.transform([text or ""]).toarray()[0]
        return vec.astype(np.float32)

    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate 384-dimensional embeddings for multiple texts."""
        if self.model is not None:
            return self.model.encode(texts, convert_to_numpy=True)
        if not texts:
            return np.zeros((0, 384), dtype=np.float32)
        vecs = self.fallback_vectorizer.transform([t or "" for t in texts]).toarray()
        return vecs.astype(np.float32)

    def similarity(self, text1: str, text2: str) -> float:
        """Calculate cosine similarity between two texts."""
        emb1 = self.get_embedding(text1)
        emb2 = self.get_embedding(text2)
        denom = np.linalg.norm(emb1) * np.linalg.norm(emb2)
        if denom == 0:
            return 0.0
        return float(np.dot(emb1, emb2) / denom)


# Singleton instance
_embedding_service = None


def get_embedding_service() -> EmbeddingService:
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
