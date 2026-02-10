<script lang="ts">
  import { marked } from 'marked';
  import SectionEditor from './SectionEditor.svelte';
  import CommentThread from './CommentThread.svelte';
  import Provocations from './Provocations.svelte';
  import DiffHighlight from './DiffHighlight.svelte';
  import { setSectionStatus } from './api';

  interface Props {
    section: any;
    planId: string;
    batchId: string;
    index: number;
    onchange: () => void;
  }
  let { section, planId, batchId, index, onchange }: Props = $props();

  let editing = $state(false);
  let showDiff = $state(false);

  let hasUpdate = $derived(section.previous_content !== null && section.previous_content !== section.content);
  let hasEdits = $derived(section.user_edits.some((e: any) => !e.applied));
  let renderedContent = $derived(marked.parse(section.content));

  function startEdit() { editing = true; }
  function onEditDone() { editing = false; onchange(); }
  function toggleDiff() { showDiff = !showDiff; }

  async function approve() {
    await setSectionStatus(planId, section.id, 'approved');
    onchange();
  }

  async function requestChanges() {
    await setSectionStatus(planId, section.id, 'needs_changes');
    onchange();
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    needs_changes: 'Needs Changes',
    edited_by_user: 'You Edited',
  };

  const statusColors: Record<string, string> = {
    pending: '#8b949e',
    approved: '#3fb950',
    needs_changes: '#f85149',
    edited_by_user: '#d29922',
  };
</script>

<div class="section" class:has-update={hasUpdate}>
  <div class="section-header">
    <div class="section-title">
      <span class="section-num">{index + 1}.</span>
      <h2>{section.title}</h2>
    </div>
    <div class="section-badges">
      {#if hasUpdate}
        <button class="badge badge-updated" onclick={toggleDiff}>Updated</button>
      {/if}
      {#if hasEdits}
        <span class="badge badge-edited">You edited</span>
      {/if}
      <span class="badge" style="color: {statusColors[section.status] || '#8b949e'}">
        {statusLabels[section.status] || section.status}
      </span>
    </div>
  </div>

  {#if showDiff && hasUpdate}
    <DiffHighlight
      previousContent={section.previous_content}
      currentContent={section.content}
      ondismiss={() => showDiff = false}
    />
  {/if}

  {#if editing}
    <SectionEditor
      {section}
      {planId}
      {batchId}
      ondone={onEditDone}
    />
  {:else}
    <div class="section-content">
      {@html renderedContent}
    </div>
    <div class="section-actions">
      <button class="btn btn-ghost" onclick={startEdit}>Edit</button>
      <button class="btn btn-ghost btn-approve" onclick={approve}>Approve</button>
      <button class="btn btn-ghost btn-changes" onclick={requestChanges}>Needs Changes</button>
    </div>
  {/if}

  <CommentThread
    comments={section.comments}
    sectionId={section.id}
    {planId}
    {batchId}
    onchange={onchange}
  />

  <Provocations
    provocations={section.provocations}
    onchange={onchange}
  />
</div>

<style>
  .section {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    overflow: hidden;
  }
  .section.has-update {
    border-color: #1f6feb;
  }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.25rem;
    border-bottom: 1px solid #21262d;
    gap: 0.75rem;
  }
  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .section-num {
    color: #8b949e;
    font-weight: 600;
    font-size: 0.875rem;
  }
  .section-title h2 {
    font-size: 1.0625rem;
    font-weight: 600;
  }
  .section-badges {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .badge {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    background: rgba(255,255,255,0.06);
    border: none;
    cursor: default;
    white-space: nowrap;
  }
  .badge-updated {
    color: #58a6ff;
    cursor: pointer;
    border: 1px solid #1f6feb;
    background: rgba(31,111,235,0.1);
  }
  .badge-updated:hover {
    background: rgba(31,111,235,0.2);
  }
  .badge-edited {
    color: #d29922;
  }
  .section-content {
    padding: 1rem 1.25rem;
    font-size: 0.9375rem;
  }
  :global(.section-content h1, .section-content h2, .section-content h3) {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }
  :global(.section-content p) {
    margin-bottom: 0.75rem;
  }
  :global(.section-content ul, .section-content ol) {
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
  }
  :global(.section-content code) {
    background: rgba(255,255,255,0.08);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.875em;
  }
  :global(.section-content pre) {
    background: #0d1117;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin-bottom: 0.75rem;
  }
  :global(.section-content pre code) {
    background: none;
    padding: 0;
  }
  .section-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0 1.25rem 0.75rem;
  }
  .btn {
    font-size: 0.8125rem;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    border: 1px solid #30363d;
    cursor: pointer;
    font-family: inherit;
  }
  .btn-ghost {
    background: transparent;
    color: #8b949e;
  }
  .btn-ghost:hover {
    color: #e1e4e8;
    background: rgba(255,255,255,0.04);
  }
  .btn-approve:hover {
    color: #3fb950;
    border-color: #238636;
  }
  .btn-changes:hover {
    color: #f85149;
    border-color: #da3633;
  }
</style>
