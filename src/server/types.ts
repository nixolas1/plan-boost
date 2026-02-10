export interface Plan {
  id: string;
  title: string;
  status: 'draft' | 'in_review' | 'approved' | 'changes_requested';
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  plan_id: string;
  title: string;
  content: string;
  previous_content: string | null;
  order_index: number;
  status: 'pending' | 'approved' | 'needs_changes' | 'edited_by_user';
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  section_id: string;
  text: string;
  is_question: number;
  answer: string | null;
  batch_id: string | null;
  resolved: number;
  created_at: string;
}

export interface UserEdit {
  id: string;
  section_id: string;
  original_content: string;
  edited_content: string;
  batch_id: string | null;
  applied: number;
  created_at: string;
}

export interface Provocation {
  id: string;
  section_id: string;
  type: 'what_if' | 'consider' | 'devils_advocate' | 'opportunity';
  text: string;
  user_reply: string | null;
  created_at: string;
}

export interface PlanWithSections extends Plan {
  sections: SectionWithDetails[];
}

export interface SectionWithDetails extends Section {
  comments: Comment[];
  user_edits: UserEdit[];
  provocations: Provocation[];
}

export interface FeedbackResult {
  plan_id: string;
  status: string;
  sections: SectionFeedback[];
}

export interface SectionFeedback {
  section_id: string;
  title: string;
  status: string;
  user_edits: { original: string; edited: string }[];
  comments: { id: string; text: string; is_question: boolean }[];
  provocation_replies: { provocation_text: string; user_reply: string }[];
}

export type WSMessage =
  | { type: 'plan:created'; plan: Plan }
  | { type: 'plan:updated'; plan: Plan }
  | { type: 'section:updated'; section: Section }
  | { type: 'comments:answered'; section_id: string; comments: Comment[] }
  | { type: 'provocations:added'; section_id: string; provocations: Provocation[] }
  | { type: 'review:submitted'; plan_id: string }
  | { type: 'connected'; message: string };
