import Dexie, { type Table } from 'dexie';

export interface SoulRecord {
  key: string;
  value: any;
  updatedAt: number;
  version: number;
}

export interface EpisodicMemory {
  id?: number | string;
  sessionId: string;
  type: 'conversation' | 'tool_call' | 'milestone' | 'error' | 'reflection';
  summary: string;
  timestamp: number;
  tags?: string[];
  metadata?: Record<string, any>;
  payload?: any;
}

export interface SemanticFact {
  id?: number | string;
  category: 'preference' | 'tech_stack' | 'domain_knowledge' | 'system_rule' | 'code_snippet';
  title: string;
  content: string;
  keywords: string[];
  confidence: number;
  accessCount: number;
  lastAccessedAt: number;
  createdAt: number;
}

export interface WorkingMemoryItem {
  key: string;
  value: any;
  expiresAt?: number;
  updatedAt: number;
}

export class GSoulDatabase extends Dexie {
  soul!: Table<SoulRecord, string>;
  episodic!: Table<EpisodicMemory, number | string>;
  semantic!: Table<SemanticFact, number | string>;
  working!: Table<WorkingMemoryItem, string>;

  constructor() {
    super('GSoul_Beast_v14');
    this.version(1).stores({
      soul: 'key, updatedAt, version',
      episodic: '++id, sessionId, type, timestamp, *tags',
      semantic: '++id, category, title, *keywords, confidence, lastAccessedAt',
      working: 'key, updatedAt, expiresAt'
    });
  }
}

export class GSoulEngine {
  private static instance: GSoulEngine | null = null;
  public db: GSoulDatabase;
  private syncChannel: BroadcastChannel | null = null;
  private subscribers: Set<(event: string, payload: any) => void> = new Set();
  private initialized: boolean = false;

  private constructor() {
    this.db = new GSoulDatabase();
    this.setupBroadcastChannel();
    this.initDefaultSoul();
  }

  public static getInstance(): GSoulEngine {
    if (!GSoulEngine.instance) {
      GSoulEngine.instance = new GSoulEngine();
    }
    return GSoulEngine.instance;
  }

  private setupBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.syncChannel = new BroadcastChannel('gsoul_sync_v14');
        this.syncChannel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          this.notifySubscribers(type, payload);
        };
      }
    } catch {
      // Fallback gracefully if BroadcastChannel is blocked
    }
  }

  private notifySubscribers(event: string, payload: any) {
    this.subscribers.forEach(cb => {
      try { cb(event, payload); } catch (e) { console.error('GSoul subscriber error:', e); }
    });
  }

  public subscribe(cb: (event: string, payload: any) => void): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private async initDefaultSoul() {
    if (this.initialized) return;
    try {
      const existing = await this.db.soul.get('identity');
      if (!existing) {
        const defaultIdentity = {
          name: 'G',
          version: 'Beast v14',
          archetype: 'Capricorn ♑ — Discipline, Mountain Builder, Patient',
          languageMode: 'Darija Maghribia & High-Precision Technical English',
          systemPhilosophy: 'Build resilient systems step-by-step. Never hallucinate. Real tools, exact registers, deep persistence.',
          evolutionLevel: 14,
          createdTimestamp: Date.now(),
          lastBootTimestamp: Date.now()
        };
        await this.db.soul.put({
          key: 'identity',
          value: defaultIdentity,
          updatedAt: Date.now(),
          version: 14
        });
        localStorage.setItem('gsoul_mirror_identity', JSON.stringify(defaultIdentity));
      }
      this.initialized = true;
    } catch (e) {
      console.warn('GSoul initial load fallback to localStorage:', e);
      this.initialized = true;
    }
  }

  /* ─────────────────────────────────────────────────────────────
     1. SOUL CORE IDENTITY & ARCHETYPE
     ───────────────────────────────────────────────────────────── */
  public async getSoulIdentity(): Promise<any> {
    try {
      const record = await this.db.soul.get('identity');
      if (record) return record.value;
    } catch {}
    const local = localStorage.getItem('gsoul_mirror_identity');
    return local ? JSON.parse(local) : {
      name: 'G',
      version: 'Beast v14',
      archetype: 'Capricorn ♑ — Mountain Builder',
      languageMode: 'Darija + English Code'
    };
  }

  public async updateSoulIdentity(updates: Record<string, any>): Promise<void> {
    const current = await this.getSoulIdentity();
    const updated = { ...current, ...updates, lastUpdated: Date.now() };
    try {
      await this.db.soul.put({
        key: 'identity',
        value: updated,
        updatedAt: Date.now(),
        version: (current.version || 14) + 1
      });
    } catch {}
    localStorage.setItem('gsoul_mirror_identity', JSON.stringify(updated));
    this.broadcast('soul_updated', updated);
  }

  /* ─────────────────────────────────────────────────────────────
     2. EPISODIC MEMORY (Events, tool logs, milestone timelines)
     ───────────────────────────────────────────────────────────── */
  public async addEpisode(episode: Omit<EpisodicMemory, 'id' | 'timestamp'> & { timestamp?: number }): Promise<number | string> {
    const item: EpisodicMemory = {
      ...episode,
      timestamp: episode.timestamp || Date.now()
    };
    let id: number | string = Date.now();
    try {
      id = await this.db.episodic.add(item);
    } catch {
      // Fallback
      const key = `gsoul_episodes_${item.sessionId}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push(item);
      localStorage.setItem(key, JSON.stringify(list.slice(-50)));
    }
    this.broadcast('episode_added', item);
    return id;
  }

  public async getRecentEpisodes(sessionId?: string, limit: number = 20): Promise<EpisodicMemory[]> {
    try {
      let query = this.db.episodic.orderBy('timestamp').reverse();
      if (sessionId) {
        return await this.db.episodic.where('sessionId').equals(sessionId).reverse().limit(limit).toArray();
      }
      return await query.limit(limit).toArray();
    } catch {
      if (sessionId) {
        const list = JSON.parse(localStorage.getItem(`gsoul_episodes_${sessionId}`) || '[]');
        return list.slice(-limit).reverse();
      }
      return [];
    }
  }

  public async clearEpisodes(sessionId?: string): Promise<void> {
    try {
      if (sessionId) {
        await this.db.episodic.where('sessionId').equals(sessionId).delete();
      } else {
        await this.db.episodic.clear();
      }
    } catch {}
  }

  /* ─────────────────────────────────────────────────────────────
     3. SEMANTIC MEMORY (Long-term Facts, Knowledge Base, Rules)
     ───────────────────────────────────────────────────────────── */
  public async storeFact(fact: Omit<SemanticFact, 'id' | 'accessCount' | 'lastAccessedAt' | 'createdAt'>): Promise<number | string> {
    const item: SemanticFact = {
      ...fact,
      accessCount: 0,
      lastAccessedAt: Date.now(),
      createdAt: Date.now()
    };
    let id: number | string = Date.now();
    try {
      // Check if similar title exists
      const existing = await this.db.semantic.where('title').equalsIgnoreCase(fact.title).first();
      if (existing && existing.id) {
        await this.db.semantic.update(existing.id, {
          content: fact.content,
          keywords: Array.from(new Set([...existing.keywords, ...fact.keywords])),
          confidence: Math.max(existing.confidence, fact.confidence),
          lastAccessedAt: Date.now()
        });
        id = existing.id;
      } else {
        id = await this.db.semantic.add(item);
      }
    } catch {
      const all = JSON.parse(localStorage.getItem('gsoul_semantic_facts') || '[]');
      all.push(item);
      localStorage.setItem('gsoul_semantic_facts', JSON.stringify(all.slice(-100)));
    }
    this.broadcast('fact_stored', item);
    return id;
  }

  public async searchSemantic(query: string, limit: number = 5): Promise<SemanticFact[]> {
    const qLower = query.toLowerCase().trim();
    const tokens = qLower.split(/\s+/).filter(t => t.length > 2);
    try {
      const all = await this.db.semantic.toArray();
      const scored = all.map(fact => {
        let score = 0;
        if (fact.title.toLowerCase().includes(qLower)) score += 10;
        if (fact.content.toLowerCase().includes(qLower)) score += 5;
        for (const kw of fact.keywords || []) {
          if (tokens.some(t => kw.toLowerCase().includes(t))) score += 4;
        }
        return { fact, score };
      });
      return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.fact);
    } catch {
      const list: SemanticFact[] = JSON.parse(localStorage.getItem('gsoul_semantic_facts') || '[]');
      return list.filter(f => f.title.toLowerCase().includes(qLower) || f.content.toLowerCase().includes(qLower)).slice(0, limit);
    }
  }

  public async getAllFacts(): Promise<SemanticFact[]> {
    try {
      return await this.db.semantic.toArray();
    } catch {
      return JSON.parse(localStorage.getItem('gsoul_semantic_facts') || '[]');
    }
  }

  public async deleteFact(id: number | string): Promise<void> {
    try {
      await this.db.semantic.delete(id);
    } catch {}
  }

  /* ─────────────────────────────────────────────────────────────
     4. WORKING MEMORY (Scratchpad, active ReAct steps, temporary cache)
     ───────────────────────────────────────────────────────────── */
  public async setWorking(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const item: WorkingMemoryItem = {
      key,
      value,
      expiresAt: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined,
      updatedAt: Date.now()
    };
    try {
      await this.db.working.put(item);
    } catch {
      sessionStorage.setItem(`gsoul_working_${key}`, JSON.stringify(item));
    }
    this.broadcast('working_set', { key, value });
  }

  public async getWorking(key: string): Promise<any | null> {
    try {
      const item = await this.db.working.get(key);
      if (!item) return null;
      if (item.expiresAt && Date.now() > item.expiresAt) {
        await this.db.working.delete(key);
        return null;
      }
      return item.value;
    } catch {
      const raw = sessionStorage.getItem(`gsoul_working_${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        sessionStorage.removeItem(`gsoul_working_${key}`);
        return null;
      }
      return parsed.value;
    }
  }

  public async clearWorking(): Promise<void> {
    try {
      await this.db.working.clear();
    } catch {}
    sessionStorage.clear();
  }

  /* ─────────────────────────────────────────────────────────────
     5. TELEMETRY, STATS & EXPORT/IMPORT
     ───────────────────────────────────────────────────────────── */
  public async getMetrics(): Promise<{
    soulCount: number;
    episodesCount: number;
    semanticCount: number;
    workingCount: number;
    storageUsageBytes: number;
  }> {
    try {
      const [soulCount, episodesCount, semanticCount, workingCount] = await Promise.all([
        this.db.soul.count(),
        this.db.episodic.count(),
        this.db.semantic.count(),
        this.db.working.count()
      ]);
      return {
        soulCount,
        episodesCount,
        semanticCount,
        workingCount,
        storageUsageBytes: (episodesCount * 256) + (semanticCount * 512) + (workingCount * 128)
      };
    } catch {
      return { soulCount: 1, episodesCount: 0, semanticCount: 0, workingCount: 0, storageUsageBytes: 1024 };
    }
  }

  public async exportSoulArchive(): Promise<string> {
    try {
      const [soul, episodic, semantic] = await Promise.all([
        this.db.soul.toArray(),
        this.db.episodic.toArray(),
        this.db.semantic.toArray()
      ]);
      const archive = {
        version: 'Beast v14',
        exportedAt: Date.now(),
        soul,
        episodic,
        semantic
      };
      return JSON.stringify(archive, null, 2);
    } catch (e: any) {
      throw new Error(`Export failed: ${e.message}`);
    }
  }

  public async importSoulArchive(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (data.soul && Array.isArray(data.soul)) {
        await this.db.soul.bulkPut(data.soul);
      }
      if (data.episodic && Array.isArray(data.episodic)) {
        await this.db.episodic.bulkPut(data.episodic);
      }
      if (data.semantic && Array.isArray(data.semantic)) {
        await this.db.semantic.bulkPut(data.semantic);
      }
      this.broadcast('soul_restored', { timestamp: Date.now() });
      return true;
    } catch (e) {
      console.error('Failed to import soul archive:', e);
      return false;
    }
  }

  private broadcast(type: string, payload: any) {
    if (this.syncChannel) {
      try {
        this.syncChannel.postMessage({ type, payload });
      } catch {}
    }
    this.notifySubscribers(type, payload);
  }
}

export const gSoulEngine = GSoulEngine.getInstance();
