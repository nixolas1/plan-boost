<script lang="ts">
  import { addComment, resolveComment } from './api';

  interface Props {
    comments: any[];
    sectionId: string;
    planId: string;
    batchId: string;
    onchange: () => void;
  }
  let { comments, sectionId, planId, batchId, onchange }: Props = $props();

  let showForm = $state(false);
  let text = $state('');
  let isQuestion = $state(false);
  let submitting = $state(false);

  async function submit() {
    if (!text.trim()) return;
    submitting = true;
    await addComment(planId, sectionId, text.trim(), isQuestion, batchId);
    text = '';
    isQuestion = false;
    submitting = false;
    showForm = false;
    onchange();
  }

  async function resolve(id: string) {
    await resolveComment(id);
    onchange();
  }
</script>

{#if comments.length > 0 || showForm}
  <div class="thread">
    {#each comments as comment (comment.id)}
      <div class="comment" class:resolved={comment.resolved}>
        <div class="comment-header">
          {#if comment.is_question}
            <span class="tag tag-question">Question</span>
          {:else}
            <span class="tag tag-comment">Comment</span>
          {/if}
          <span class="comment-time">{new Date(comment.created_at).toLocaleString()}</span>
          {#if !comment.resolved}
            <button class="resolve-btn" onclick={() => resolve(comment.id)}>Resolve</button>
          {:else}
            <span class="resolved-label">Resolved</span>
          {/if}
        </div>
        <div class="comment-body">{comment.text}</div>

        {#if comment.is_question && comment.answer}
          <div class="answer">
            <span class="answer-label">Claude:</span>
            <div class="answer-body">{comment.answer}</div>
          </div>
        {:else if comment.is_question && !comment.answer && comment.batch_id}
          <div class="awaiting">Awaiting response...</div>
        {/if}
      </div>
    {/each}

    {#if showForm}
      <div class="comment-form">
        <textarea
          class="comment-input"
          bind:value={text}
          placeholder="Add a comment or question..."
          rows="3"
        ></textarea>
        <div class="form-footer">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={isQuestion} />
            This is a question for Claude
          </label>
          <div class="form-actions">
            <button class="btn btn-cancel" onclick={() => { showForm = false; text = ''; }}>Cancel</button>
            <button class="btn btn-submit" onclick={submit} disabled={submitting || !text.trim()}>
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

{#if !showForm}
  <div class="add-comment-bar">
    <button class="btn btn-ghost" onclick={() => showForm = true}>
      + Add Comment
    </button>
  </div>
{/if}

<style>
  .thread {
    border-top: 1px solid #21262d;
    padding: 0.75rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .comment {
    padding: 0.625rem 0.75rem;
    background: rgba(255,255,255,0.03);
    border-radius: 6px;
    border-left: 3px solid #30363d;
  }
  .comment.resolved {
    opacity: 0.5;
  }
  .comment-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
    font-size: 0.75rem;
  }
  .tag {
    padding: 0.0625rem 0.375rem;
    border-radius: 4px;
    font-weight: 500;
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .tag-question {
    background: rgba(88,166,255,0.15);
    color: #58a6ff;
  }
  .tag-comment {
    background: rgba(139,148,158,0.15);
    color: #8b949e;
  }
  .comment-time {
    color: #484f58;
  }
  .resolve-btn {
    margin-left: auto;
    background: transparent;
    border: none;
    color: #8b949e;
    cursor: pointer;
    font-size: 0.75rem;
    font-family: inherit;
  }
  .resolve-btn:hover {
    color: #e1e4e8;
  }
  .resolved-label {
    margin-left: auto;
    color: #3fb950;
    font-size: 0.75rem;
  }
  .comment-body {
    font-size: 0.875rem;
    color: #e1e4e8;
  }
  .answer {
    margin-top: 0.5rem;
    padding: 0.5rem 0.625rem;
    background: rgba(31,111,235,0.08);
    border-radius: 6px;
    border-left: 3px solid #1f6feb;
  }
  .answer-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: #58a6ff;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .answer-body {
    font-size: 0.875rem;
    margin-top: 0.25rem;
    color: #c9d1d9;
  }
  .awaiting {
    margin-top: 0.375rem;
    font-size: 0.8125rem;
    color: #8b949e;
    font-style: italic;
  }
  .add-comment-bar {
    padding: 0.375rem 1.25rem 0.75rem;
  }
  .comment-form {
    padding: 0.5rem;
    background: rgba(255,255,255,0.02);
    border-radius: 6px;
    border: 1px solid #30363d;
  }
  .comment-input {
    width: 100%;
    padding: 0.5rem;
    background: #0d1117;
    color: #e1e4e8;
    border: 1px solid #30363d;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.875rem;
    resize: vertical;
    outline: none;
  }
  .comment-input:focus {
    border-color: #58a6ff;
  }
  .form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.5rem;
    gap: 0.5rem;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: #8b949e;
    cursor: pointer;
  }
  .form-actions {
    display: flex;
    gap: 0.375rem;
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
    border: none;
    padding: 0;
    font-size: 0.8125rem;
  }
  .btn-ghost:hover {
    color: #58a6ff;
  }
  .btn-cancel {
    background: transparent;
    color: #8b949e;
  }
  .btn-submit {
    background: #238636;
    color: #fff;
    border-color: #238636;
  }
  .btn-submit:hover {
    background: #2ea043;
  }
  .btn-submit:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
