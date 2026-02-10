<script lang="ts">
  import { replyToProvocation } from './api';

  interface Props {
    provocations: any[];
    onchange: () => void;
  }
  let { provocations, onchange }: Props = $props();

  let expanded = $state(false);
  let replyingTo = $state<string | null>(null);
  let replyText = $state('');
  let submitting = $state(false);

  const typeLabels: Record<string, string> = {
    what_if: 'What If',
    consider: 'Consider',
    devils_advocate: "Devil's Advocate",
    opportunity: 'Opportunity',
  };

  const typeColors: Record<string, string> = {
    what_if: '#d2a8ff',
    consider: '#79c0ff',
    devils_advocate: '#f85149',
    opportunity: '#3fb950',
  };

  async function submitReply(provId: string) {
    if (!replyText.trim()) return;
    submitting = true;
    await replyToProvocation(provId, replyText.trim());
    replyText = '';
    replyingTo = null;
    submitting = false;
    onchange();
  }
</script>

{#if provocations.length > 0}
  <div class="provocations">
    <button class="toggle-btn" onclick={() => expanded = !expanded}>
      {expanded ? '▾' : '▸'} Challenge my thinking ({provocations.length})
    </button>

    {#if expanded}
      <div class="prov-list">
        {#each provocations as prov (prov.id)}
          <div class="prov-card">
            <div class="prov-header">
              <span class="prov-type" style="color: {typeColors[prov.type] || '#8b949e'}">
                {typeLabels[prov.type] || prov.type}
              </span>
            </div>
            <div class="prov-text">{prov.text}</div>

            {#if prov.user_reply}
              <div class="prov-reply">
                <span class="reply-label">Your reply:</span>
                <div class="reply-text">{prov.user_reply}</div>
              </div>
            {:else if replyingTo === prov.id}
              <div class="reply-form">
                <textarea
                  class="reply-input"
                  bind:value={replyText}
                  placeholder="Your response to this challenge..."
                  rows="3"
                ></textarea>
                <div class="reply-actions">
                  <button class="btn btn-cancel" onclick={() => { replyingTo = null; replyText = ''; }}>Cancel</button>
                  <button class="btn btn-submit" onclick={() => submitReply(prov.id)} disabled={submitting || !replyText.trim()}>
                    {submitting ? 'Sending...' : 'Reply'}
                  </button>
                </div>
              </div>
            {:else}
              <button class="btn btn-reply" onclick={() => replyingTo = prov.id}>Reply</button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .provocations {
    border-top: 1px solid #21262d;
    padding: 0.75rem 1.25rem;
  }
  .toggle-btn {
    background: transparent;
    border: none;
    color: #d2a8ff;
    cursor: pointer;
    font-size: 0.8125rem;
    font-family: inherit;
    font-weight: 500;
    padding: 0;
  }
  .toggle-btn:hover {
    color: #e2c4ff;
  }
  .prov-list {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }
  .prov-card {
    padding: 0.75rem;
    background: rgba(255,255,255,0.03);
    border-radius: 6px;
    border-left: 3px solid #30363d;
  }
  .prov-header {
    margin-bottom: 0.375rem;
  }
  .prov-type {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .prov-text {
    font-size: 0.875rem;
    color: #c9d1d9;
    line-height: 1.5;
  }
  .prov-reply {
    margin-top: 0.5rem;
    padding: 0.5rem 0.625rem;
    background: rgba(63,185,80,0.08);
    border-radius: 6px;
    border-left: 3px solid #238636;
  }
  .reply-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: #3fb950;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .reply-text {
    font-size: 0.875rem;
    margin-top: 0.25rem;
    color: #c9d1d9;
  }
  .reply-form {
    margin-top: 0.5rem;
  }
  .reply-input {
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
  .reply-input:focus {
    border-color: #d2a8ff;
  }
  .reply-actions {
    display: flex;
    gap: 0.375rem;
    justify-content: flex-end;
    margin-top: 0.375rem;
  }
  .btn {
    font-size: 0.8125rem;
    padding: 0.3125rem 0.625rem;
    border-radius: 6px;
    border: 1px solid #30363d;
    cursor: pointer;
    font-family: inherit;
  }
  .btn-reply {
    margin-top: 0.5rem;
    background: transparent;
    color: #d2a8ff;
    border-color: rgba(210,168,255,0.3);
    font-size: 0.75rem;
  }
  .btn-reply:hover {
    background: rgba(210,168,255,0.1);
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
