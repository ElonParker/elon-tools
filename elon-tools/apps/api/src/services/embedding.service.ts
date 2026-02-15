/**
 * Embedding service: generate embeddings via Workers AI.
 */

const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
const MAX_CHUNK_CHARS = 2000;
const MAX_CHUNKS_PER_SOURCE = 5;
const CHUNK_OVERLAP_CHARS = 200;

export interface EmbeddingChunk {
  text: string;
  index: number;
  hash: string;
}

export class EmbeddingService {
  constructor(private ai: Ai) {}

  /**
   * Generate embedding vector for a single text.
   */
  async embed(text: string): Promise<number[]> {
    const result = await this.ai.run(EMBEDDING_MODEL as any, {
      text: [text.slice(0, MAX_CHUNK_CHARS)],
    } as any) as any;

    // Workers AI returns { data: [{ values: number[] }] } or similar
    const vectors = result?.data?.[0]?.values ?? result?.data?.[0] ?? result?.[0]?.values ?? result?.[0] ?? [];
    if (!Array.isArray(vectors) || vectors.length === 0) {
      throw new Error('Failed to generate embedding');
    }
    return vectors;
  }

  /**
   * Generate embeddings for multiple texts (batched).
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const truncated = texts.map((t) => t.slice(0, MAX_CHUNK_CHARS));
    const result = await this.ai.run(EMBEDDING_MODEL as any, {
      text: truncated,
    } as any) as any;

    const data = result?.data ?? result ?? [];
    return data.map((item: any) => item?.values ?? item ?? []);
  }

  /**
   * Chunk text into pieces with overlap for embedding.
   */
  static chunk(text: string): EmbeddingChunk[] {
    if (!text || text.length < 50) return []; // too short to embed

    const chunks: EmbeddingChunk[] = [];
    
    // If text fits in one chunk, return as-is
    if (text.length <= MAX_CHUNK_CHARS) {
      return [{
        text,
        index: 0,
        hash: hashString(text),
      }];
    }

    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 20);
    
    let currentChunk = '';
    let chunkIndex = 0;

    for (const para of paragraphs) {
      if (currentChunk.length + para.length + 2 > MAX_CHUNK_CHARS) {
        if (currentChunk.length > 50) {
          chunks.push({
            text: currentChunk.trim(),
            index: chunkIndex++,
            hash: hashString(currentChunk.trim()),
          });
          if (chunks.length >= MAX_CHUNKS_PER_SOURCE) break;
        }
        // Start new chunk with overlap from end of previous
        const overlap = currentChunk.slice(-CHUNK_OVERLAP_CHARS);
        currentChunk = overlap + '\n\n' + para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }

    // Last chunk
    if (currentChunk.length > 50 && chunks.length < MAX_CHUNKS_PER_SOURCE) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex,
        hash: hashString(currentChunk.trim()),
      });
    }

    return chunks;
  }
}

/**
 * Simple FNV-1a hash for dedup (fast, not crypto).
 */
function hashString(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
