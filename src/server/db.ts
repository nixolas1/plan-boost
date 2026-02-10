import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir, platform } from 'os';
import { v4 as uuid } from 'uuid';
import type {
  Plan,
  Section,
  Comment,
  UserEdit,
  Provocation,
  PlanWithSections,
  SectionWithDetails,
  FeedbackResult,
} from './types.js';

function getDbPath(): string {
  const home = homedir();
  const plat = platform();
  
  if (plat === 'darwin') {
    // macOS: ~/Library/boost/boost.db
    return join(home, 'Library', 'boost', 'boost.db');
  } else {
    // Linux and others: $XDG_DATA_HOME/boost/boost.db or $HOME/.local/state/boost/boost.db
    // Note: Using .local/state instead of .local/share (XDG_DATA_HOME default) for state data
    const xdgDataHome = process.env.XDG_DATA_HOME;
    if (xdgDataHome) {
      return join(xdgDataHome, 'boost', 'boost.db');
    } else {
      return join(home, '.local', 'state', 'boost', 'boost.db');
    }
  }
}

const dbPath = getDbPath();
const dbDir = dirname(dbPath);
mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema
db.exec(`
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  previous_content TEXT,
  order_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_question INTEGER NOT NULL DEFAULT 0,
  answer TEXT,
  batch_id TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_edits (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  original_content TEXT NOT NULL,
  edited_content TEXT NOT NULL,
  batch_id TEXT,
  applied INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS provocations (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  user_reply TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sections_plan ON sections(plan_id);
CREATE INDEX IF NOT EXISTS idx_comments_section ON comments(section_id);
CREATE INDEX IF NOT EXISTS idx_comments_batch ON comments(batch_id);
CREATE INDEX IF NOT EXISTS idx_edits_section ON user_edits(section_id);
CREATE INDEX IF NOT EXISTS idx_edits_batch ON user_edits(batch_id);
CREATE INDEX IF NOT EXISTS idx_provocations_section ON provocations(section_id);
`);

// --- Plans ---

export function createPlan(title: string, sections: { title: string; content: string }[]): { plan_id: string; section_ids: string[] } {
  const planId = uuid();
  const sectionIds: string[] = [];

  const insertPlan = db.prepare('INSERT INTO plans (id, title) VALUES (?, ?)');
  const insertSection = db.prepare('INSERT INTO sections (id, plan_id, title, content, order_index) VALUES (?, ?, ?, ?, ?)');

  const transaction = db.transaction(() => {
    insertPlan.run(planId, title);
    sections.forEach((s, i) => {
      const sid = uuid();
      sectionIds.push(sid);
      insertSection.run(sid, planId, s.title, s.content, i);
    });
  });
  transaction();

  return { plan_id: planId, section_ids: sectionIds };
}

export function getPlan(id: string): Plan | undefined {
  return db.prepare('SELECT * FROM plans WHERE id = ?').get(id) as Plan | undefined;
}

export function listPlans(): Plan[] {
  return db.prepare('SELECT * FROM plans ORDER BY updated_at DESC').all() as Plan[];
}

export function updatePlanStatus(id: string, status: string): void {
  db.prepare('UPDATE plans SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);
}

export function getPlanWithSections(id: string): PlanWithSections | undefined {
  const plan = getPlan(id);
  if (!plan) return undefined;

  const sections = db.prepare('SELECT * FROM sections WHERE plan_id = ? ORDER BY order_index').all(id) as Section[];

  const sectionDetails: SectionWithDetails[] = sections.map((s) => ({
    ...s,
    comments: db.prepare('SELECT * FROM comments WHERE section_id = ? ORDER BY created_at').all(s.id) as Comment[],
    user_edits: db.prepare('SELECT * FROM user_edits WHERE section_id = ? ORDER BY created_at').all(s.id) as UserEdit[],
    provocations: db.prepare('SELECT * FROM provocations WHERE section_id = ? ORDER BY created_at').all(s.id) as Provocation[],
  }));

  return { ...plan, sections: sectionDetails };
}

// --- Sections ---

export function getSection(id: string): Section | undefined {
  return db.prepare('SELECT * FROM sections WHERE id = ?').get(id) as Section | undefined;
}

export function updateSection(id: string, updates: { title?: string; content?: string }): boolean {
  const section = getSection(id);
  if (!section) return false;

  if (updates.content !== undefined && updates.content !== section.content) {
    db.prepare('UPDATE sections SET previous_content = content WHERE id = ?').run(id);
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content); }
  fields.push('status = ?'); values.push('pending');
  fields.push("updated_at = datetime('now')");

  values.push(id);
  db.prepare(`UPDATE sections SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return true;
}

export function updateSectionStatus(id: string, status: string): void {
  db.prepare('UPDATE sections SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);
}

// --- Comments ---

export function addComment(sectionId: string, text: string, isQuestion: boolean, batchId: string | null): Comment {
  const id = uuid();
  db.prepare('INSERT INTO comments (id, section_id, text, is_question, batch_id) VALUES (?, ?, ?, ?, ?)').run(id, sectionId, text, isQuestion ? 1 : 0, batchId);
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(id) as Comment;
}

export function answerComment(id: string, answer: string): void {
  db.prepare('UPDATE comments SET answer = ? WHERE id = ?').run(answer, id);
}

export function resolveComment(id: string): void {
  db.prepare('UPDATE comments SET resolved = 1 WHERE id = ?').run(id);
}

export function getComment(id: string): Comment | undefined {
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(id) as Comment | undefined;
}

// --- User Edits ---

export function addUserEdit(sectionId: string, originalContent: string, editedContent: string, batchId: string | null): UserEdit {
  const id = uuid();
  db.prepare('INSERT INTO user_edits (id, section_id, original_content, edited_content, batch_id) VALUES (?, ?, ?, ?, ?)').run(id, sectionId, originalContent, editedContent, batchId);
  updateSectionStatus(sectionId, 'edited_by_user');
  return db.prepare('SELECT * FROM user_edits WHERE id = ?').get(id) as UserEdit;
}

// --- Provocations ---

export function addProvocations(sectionId: string, provs: { type: string; text: string }[]): Provocation[] {
  const insert = db.prepare('INSERT INTO provocations (id, section_id, type, text) VALUES (?, ?, ?, ?)');
  const ids: string[] = [];
  const transaction = db.transaction(() => {
    provs.forEach((p) => {
      const id = uuid();
      ids.push(id);
      insert.run(id, sectionId, p.type, p.text);
    });
  });
  transaction();
  return ids.map((id) => db.prepare('SELECT * FROM provocations WHERE id = ?').get(id) as Provocation);
}

export function replyToProvocation(id: string, reply: string): Provocation | undefined {
  db.prepare('UPDATE provocations SET user_reply = ? WHERE id = ?').run(reply, id);
  return db.prepare('SELECT * FROM provocations WHERE id = ?').get(id) as Provocation | undefined;
}

// --- Feedback ---

export function getFeedback(planId: string): FeedbackResult | undefined {
  const plan = getPlan(planId);
  if (!plan) return undefined;

  const sections = db.prepare('SELECT * FROM sections WHERE plan_id = ? ORDER BY order_index').all(planId) as Section[];

  const sectionFeedback = sections.map((s) => {
    const edits = db.prepare('SELECT * FROM user_edits WHERE section_id = ? AND applied = 0').all(s.id) as UserEdit[];
    const comments = db.prepare('SELECT * FROM comments WHERE section_id = ? AND resolved = 0 AND answer IS NULL').all(s.id) as Comment[];
    const provReplies = db.prepare('SELECT * FROM provocations WHERE section_id = ? AND user_reply IS NOT NULL').all(s.id) as Provocation[];

    return {
      section_id: s.id,
      title: s.title,
      status: s.status,
      user_edits: edits.map((e) => ({ original: e.original_content, edited: e.edited_content })),
      comments: comments.map((c) => ({ id: c.id, text: c.text, is_question: c.is_question === 1 })),
      provocation_replies: provReplies.map((p) => ({ provocation_text: p.text, user_reply: p.user_reply! })),
    };
  });

  return { plan_id: planId, status: plan.status, sections: sectionFeedback };
}

export function markEditsApplied(planId: string): void {
  const sections = db.prepare('SELECT id FROM sections WHERE plan_id = ?').all(planId) as { id: string }[];
  const update = db.prepare('UPDATE user_edits SET applied = 1 WHERE section_id = ? AND applied = 0');
  sections.forEach((s) => update.run(s.id));
}

export function getPlanStatus(planId: string): { status: string; pending_comments: number; pending_edits: number } | undefined {
  const plan = getPlan(planId);
  if (!plan) return undefined;

  const sections = db.prepare('SELECT id FROM sections WHERE plan_id = ?').all(planId) as { id: string }[];
  const sectionIds = sections.map((s) => s.id);

  if (sectionIds.length === 0) return { status: plan.status, pending_comments: 0, pending_edits: 0 };

  const placeholders = sectionIds.map(() => '?').join(',');
  const pendingComments = (db.prepare(`SELECT COUNT(*) as cnt FROM comments WHERE section_id IN (${placeholders}) AND resolved = 0 AND answer IS NULL`).get(...sectionIds) as { cnt: number }).cnt;
  const pendingEdits = (db.prepare(`SELECT COUNT(*) as cnt FROM user_edits WHERE section_id IN (${placeholders}) AND applied = 0`).get(...sectionIds) as { cnt: number }).cnt;

  return { status: plan.status, pending_comments: pendingComments, pending_edits: pendingEdits };
}

export function getSectionDiff(sectionId: string): { previous_content: string | null; content: string } | undefined {
  const section = getSection(sectionId);
  if (!section) return undefined;
  return { previous_content: section.previous_content, content: section.content };
}

export { db };
