<script lang="ts">
  import { submitReview } from './api';
  import { setSectionStatus } from './api';

  interface Props {
    planId: string;
    pendingEdits: number;
    pendingComments: number;
    pendingReplies: number;
    planStatus: string;
    onsubmitted: () => void;
  }
  let { planId, pendingEdits, pendingComments, pendingReplies, planStatus, onsubmitted }: Props = $props();

  let submitting = $state(false);

  let totalPending = $derived(pendingEdits + pendingComments + pendingReplies);

  let summaryParts = $derived.by(() => {
    const parts: string[] = [];
    if (pendingEdits > 0) parts.push(`${pendingEdits} edit${pendingEdits !== 1 ? 's' : ''}`);
    if (pendingComments > 0) parts.push(`${pendingComments} comment${pendingComments !== 1 ? 's' : ''}`);
    if (pendingReplies > 0) parts.push(`${pendingReplies} repl${pendingReplies !== 1 ? 'ies' : 'y'}`);
    return parts.join(', ');
  });

  async function submit() {
    submitting = true;
    await submitReview(planId);
    submitting = false;
    onsubmitted();
  }

  async function approveAll() {
    submitting = true;
    await submitReview(planId);
    submitting = false;
    onsubmitted();
  }
</script>

<div class="review-bar">
  <div class="bar-content">
    {#if totalPending > 0}
      <span class="pending-summary">{summaryParts} pending</span>
    {:else}
      <span class="pending-summary muted">No pending changes</span>
    {/if}

    <div class="bar-actions">
      <button
        class="btn btn-submit"
        onclick={submit}
        disabled={submitting || totalPending === 0}
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
      <button
        class="btn btn-approve"
        onclick={approveAll}
        disabled={submitting}
      >
        Approve Plan
      </button>
    </div>
  </div>
</div>

<style>
  .review-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #161b22;
    border-top: 1px solid #30363d;
    z-index: 100;
  }
  .bar-content {
    max-width: 960px;
    margin: 0 auto;
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .pending-summary {
    font-size: 0.875rem;
    color: #d29922;
    font-weight: 500;
  }
  .muted {
    color: #484f58 !important;
  }
  .bar-actions {
    display: flex;
    gap: 0.5rem;
  }
  .btn {
    font-size: 0.8125rem;
    padding: 0.4375rem 1rem;
    border-radius: 6px;
    border: 1px solid #30363d;
    cursor: pointer;
    font-family: inherit;
    font-weight: 500;
  }
  .btn-submit {
    background: #1f6feb;
    color: #fff;
    border-color: #1f6feb;
  }
  .btn-submit:hover {
    background: #388bfd;
  }
  .btn-submit:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .btn-approve {
    background: #238636;
    color: #fff;
    border-color: #238636;
  }
  .btn-approve:hover {
    background: #2ea043;
  }
  .btn-approve:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
