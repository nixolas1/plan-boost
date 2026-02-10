import { Router, type Request, type Response } from 'express';
import {
  listPlans,
  getPlanWithSections,
  addComment,
  addUserEdit,
  updateSectionStatus,
  resolveComment,
  replyToProvocation,
  updatePlanStatus,
  getFeedback,
  markEditsApplied,
  getSection,
  getSectionDiff,
} from './db.js';
import { bus } from './events.js';

export const router = Router();

function param(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
}

// List all plans
router.get('/api/plans', (_req: Request, res: Response) => {
  res.json(listPlans());
});

// Get full plan with sections, comments, edits, provocations
router.get('/api/plans/:id', (req: Request, res: Response) => {
  const plan = getPlanWithSections(param(req, 'id'));
  if (!plan) { res.status(404).json({ error: 'Plan not found' }); return; }
  res.json(plan);
});

// Add comment to a section
router.post('/api/plans/:id/sections/:sid/comments', (req: Request, res: Response) => {
  const { text, is_question, batch_id } = req.body;
  if (!text) { res.status(400).json({ error: 'text is required' }); return; }
  const comment = addComment(param(req, 'sid'), text, !!is_question, batch_id || null);
  res.status(201).json(comment);
});

// Save user edit to a section
router.put('/api/plans/:id/sections/:sid/edit', (req: Request, res: Response) => {
  const { edited_content, batch_id } = req.body;
  if (edited_content === undefined) { res.status(400).json({ error: 'edited_content is required' }); return; }
  const sid = param(req, 'sid');
  const section = getSection(sid);
  if (!section) { res.status(404).json({ error: 'Section not found' }); return; }
  const edit = addUserEdit(sid, section.content, edited_content, batch_id || null);
  res.status(201).json(edit);
});

// Set section status
router.patch('/api/plans/:id/sections/:sid/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) { res.status(400).json({ error: 'status is required' }); return; }
  updateSectionStatus(param(req, 'sid'), status);
  res.json({ success: true });
});

// Resolve a comment
router.patch('/api/comments/:cid/resolve', (req: Request, res: Response) => {
  resolveComment(param(req, 'cid'));
  res.json({ success: true });
});

// Reply to a provocation
router.post('/api/provocations/:pid/reply', (req: Request, res: Response) => {
  const { reply } = req.body;
  if (!reply) { res.status(400).json({ error: 'reply is required' }); return; }
  const prov = replyToProvocation(param(req, 'pid'), reply);
  if (!prov) { res.status(404).json({ error: 'Provocation not found' }); return; }
  res.json(prov);
});

// Submit review batch
router.post('/api/plans/:id/submit-review', (req: Request, res: Response) => {
  const planId = param(req, 'id');
  updatePlanStatus(planId, 'changes_requested');
  bus.emit('review:submitted', planId);
  res.json({ success: true, plan_id: planId });
});

// Get diff for a section
router.get('/api/plans/:id/sections/:sid/diff', (req: Request, res: Response) => {
  const diff = getSectionDiff(param(req, 'sid'));
  if (!diff) { res.status(404).json({ error: 'Section not found' }); return; }
  res.json(diff);
});
