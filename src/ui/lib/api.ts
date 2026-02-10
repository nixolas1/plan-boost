const BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export function listPlans() {
  return request<any[]>('/api/plans');
}

export function getPlan(id: string) {
  return request<any>(`/api/plans/${id}`);
}

export function addComment(planId: string, sectionId: string, text: string, isQuestion: boolean, batchId: string | null) {
  return request<any>(`/api/plans/${planId}/sections/${sectionId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text, is_question: isQuestion, batch_id: batchId }),
  });
}

export function saveEdit(planId: string, sectionId: string, editedContent: string, batchId: string | null) {
  return request<any>(`/api/plans/${planId}/sections/${sectionId}/edit`, {
    method: 'PUT',
    body: JSON.stringify({ edited_content: editedContent, batch_id: batchId }),
  });
}

export function setSectionStatus(planId: string, sectionId: string, status: string) {
  return request<any>(`/api/plans/${planId}/sections/${sectionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function resolveComment(commentId: string) {
  return request<any>(`/api/comments/${commentId}/resolve`, { method: 'PATCH' });
}

export function replyToProvocation(provocationId: string, reply: string) {
  return request<any>(`/api/provocations/${provocationId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ reply }),
  });
}

export function submitReview(planId: string) {
  return request<any>(`/api/plans/${planId}/submit-review`, { method: 'POST' });
}

export function getSectionDiff(planId: string, sectionId: string) {
  return request<any>(`/api/plans/${planId}/sections/${sectionId}/diff`);
}
