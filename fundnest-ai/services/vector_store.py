import faiss
import numpy as np
import pickle
import os
from typing import List, Tuple, Optional
from services.embedding_service import get_embedding_service

class VectorStore:
    def __init__(self, dimension: int = 384, index_path: str = None):
        self.dimension = dimension
        self.index_path = index_path or os.getenv("VECTOR_DB_PATH", "./vector_store")
        self.index = None
        self.documents = []
        self._initialize_index()
    
    def _initialize_index(self):
        os.makedirs(self.index_path, exist_ok=True)
        index_file = os.path.join(self.index_path, "faiss.index")
        docs_file = os.path.join(self.index_path, "documents.pkl")
        
        if os.path.exists(index_file) and os.path.exists(docs_file):
            print("Loading existing vector store...")
            self.index = faiss.read_index(index_file)
            with open(docs_file, 'rb') as f:
                self.documents = pickle.load(f)
            print(f"Loaded {len(self.documents)} documents")
        else:
            print("Creating new vector store...")
            self.index = faiss.IndexFlatL2(self.dimension)
    
    def add_documents(self, texts: List[str], metadata: List[dict] = None):
        """Add documents to the vector store"""
        embedding_service = get_embedding_service()
        embeddings = embedding_service.get_embeddings(texts)
        
        embeddings = np.array(embeddings).astype('float32')
        self.index.add(embeddings)
        
        if metadata is None:
            metadata = [{}] * len(texts)
        
        for i, text in enumerate(texts):
            self.documents.append({
                'text': text,
                'metadata': metadata[i] if i < len(metadata) else {}
            })
        
        self._save()
    
    def search(self, query: str, k: int = 5) -> List[Tuple[str, dict, float]]:
        """Search for similar documents"""
        embedding_service = get_embedding_service()
        query_embedding = embedding_service.get_embedding(query)
        query_embedding = np.array([query_embedding]).astype('float32')
        
        distances, indices = self.index.search(query_embedding, k)
        
        results = []
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(self.documents):
                doc = self.documents[idx]
                # Convert L2 distance to similarity score
                similarity = 1 / (1 + dist)
                results.append((doc['text'], doc['metadata'], similarity))
        
        return results
    
    def _save(self):
        """Save the index and documents to disk"""
        index_file = os.path.join(self.index_path, "faiss.index")
        docs_file = os.path.join(self.index_path, "documents.pkl")
        
        faiss.write_index(self.index, index_file)
        with open(docs_file, 'wb') as f:
            pickle.dump(self.documents, f)
        print(f"Saved {len(self.documents)} documents to vector store")

# Singleton instance
_vector_store = None

def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
