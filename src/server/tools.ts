import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  createPlan,
  updateSection,
  answerComment,
  addProvocations,
  getFeedback,
  getPlanStatus,
  updatePlanStatus,
  markEditsApplied,
  getPlan,
  getSection,
  getComment,
} from './db.js';
import { bus } from './events.js';

export function registerTools(server: McpServer, getPort: () => number) {
  // --- create_plan ---
  server.tool(
    'create_plan',
    'Create a new plan with sections for collaborative review',
    {
      title: z.string().describe('Title of the plan'),
      sections: z.array(z.object({
        title: z.string().describe('Section title'),
        content: z.string().describe('Section content (markdown)'),
      })).describe('Plan sections'),
    },
    async ({ title, sections }) => {
      const result = createPlan(title, sections);
      const plan = getPlan(result.plan_id);
      if (plan) bus.emit('plan:created', plan);

      const port = getPort();
      const url = `http://127.0.0.1:${port}/#/plans/${result.plan_id}`;

      // Auto-open browser
      try {
        const { exec } = await import('child_process');
        const cmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
        exec(`${cmd} "${url}"`);
      } catch { /* ignore */ }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ plan_id: result.plan_id, url, section_ids: result.section_ids }),
        }],
      };
    }
  );

  // --- update_section ---
  server.tool(
    'update_section',
    'Update a section\'s title or content. Saves previous content for diff view.',
    {
      section_id: z.string().describe('Section ID to update'),
      title: z.string().optional().describe('New title'),
      content: z.string().optional().describe('New content (markdown)'),
    },
    async ({ section_id, title, content }) => {
      const success = updateSection(section_id, { title, content });
      if (success) {
        const section = getSection(section_id);
        if (section) bus.emit('section:updated', section);
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success }) }],
      };
    }
  );

  // --- answer_comments ---
  server.tool(
    'answer_comments',
    'Answer user questions/comments on plan sections',
    {
      answers: z.array(z.object({
        comment_id: z.string().describe('Comment ID to answer'),
        answer: z.string().describe('Answer text'),
      })).describe('Answers to user comments'),
    },
    async ({ answers }) => {
      let answeredCount = 0;
      const answeredBySection = new Map<string, string[]>();

      for (const { comment_id, answer } of answers) {
        const comment = getComment(comment_id);
        if (comment) {
          answerComment(comment_id, answer);
          answeredCount++;
          const ids = answeredBySection.get(comment.section_id) || [];
          ids.push(comment_id);
          answeredBySection.set(comment.section_id, ids);
        }
      }

      // Emit per-section events
      for (const [sectionId, commentIds] of answeredBySection) {
        const updatedComments = commentIds.map((cid) => getComment(cid)).filter(Boolean);
        bus.emit('comments:answered', sectionId, updatedComments);
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ answered_count: answeredCount }) }],
      };
    }
  );

  // --- add_provocations ---
  server.tool(
    'add_provocations',
    'Add thought-provoking challenges to a section',
    {
      section_id: z.string().describe('Section ID'),
      provocations: z.array(z.object({
        type: z.enum(['what_if', 'consider', 'devils_advocate', 'opportunity']).describe('Provocation type'),
        text: z.string().describe('Provocation text'),
      })).describe('Provocations to add'),
    },
    async ({ section_id, provocations }) => {
      const added = addProvocations(section_id, provocations);
      bus.emit('provocations:added', section_id, added);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ count: added.length }) }],
      };
    }
  );

  // --- get_feedback ---
  server.tool(
    'get_feedback',
    'Get all user feedback (edits, comments, provocation replies) for a plan',
    {
      plan_id: z.string().describe('Plan ID'),
    },
    async ({ plan_id }) => {
      const feedback = getFeedback(plan_id);
      if (!feedback) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Plan not found' }) }] };
      }
      markEditsApplied(plan_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(feedback) }],
      };
    }
  );

  // --- get_plan_status ---
  server.tool(
    'get_plan_status',
    'Quick check on plan status and pending feedback counts',
    {
      plan_id: z.string().describe('Plan ID'),
    },
    async ({ plan_id }) => {
      const status = getPlanStatus(plan_id);
      if (!status) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Plan not found' }) }] };
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(status) }],
      };
    }
  );

  // --- wait_for_review ---
  server.tool(
    'wait_for_review',
    'Set plan to in_review and wait for user to submit their review. Blocks until submission or timeout.',
    {
      plan_id: z.string().describe('Plan ID'),
      timeout_seconds: z.number().optional().default(600).describe('Timeout in seconds (default 600)'),
    },
    async ({ plan_id, timeout_seconds }) => {
      const plan = getPlan(plan_id);
      if (!plan) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Plan not found' }) }] };
      }

      // If already submitted, return immediately
      if (plan.status === 'changes_requested') {
        const feedback = getFeedback(plan_id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(feedback) }] };
      }

      updatePlanStatus(plan_id, 'in_review');
      const updatedPlan = getPlan(plan_id);
      if (updatedPlan) bus.emit('plan:updated', updatedPlan);

      // Wait for review submission
      const feedback = await new Promise<unknown>((resolve, reject) => {
        const timeout = setTimeout(() => {
          bus.removeListener('review:submitted', onSubmit);
          reject(new Error('Timeout waiting for review'));
        }, (timeout_seconds ?? 600) * 1000);

        function onSubmit(submittedPlanId: string) {
          if (submittedPlanId === plan_id) {
            clearTimeout(timeout);
            bus.removeListener('review:submitted', onSubmit);
            const fb = getFeedback(plan_id);
            resolve(fb);
          }
        }

        bus.on('review:submitted', onSubmit);
      });

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(feedback) }],
      };
    }
  );
}
