<script lang="ts">
  import { getPlan } from './api';
  import { onMessage } from './ws';
  import Section from './Section.svelte';
  import ReviewBar from './ReviewBar.svelte';

  interface Props {
    planId: string;
  }
  let { planId }: Props = $props();

  let plan = $state<any>(null);
  let loading = $state(true);
  let batchId = $state(crypto.randomUUID());

  // Track pending items for ReviewBar
  let pendingEdits = $state(0);
  let pendingComments = $state(0);
  let pendingReplies = $state(0);

  async function load() {
    plan = await getPlan(planId);
    loading = false;
    countPending();
  }

  function countPending() {
    if (!plan) return;
    let edits = 0, comments = 0, replies = 0;
    for (const s of plan.sections) {
      edits += s.user_edits.filter((e: any) => !e.applied).length;
      comments += s.comments.filter((c: any) => !c.resolved && !c.answer).length;
      replies += s.provocations.filter((p: any) => p.user_reply).length;
    }
    pendingEdits = edits;
    pendingComments = comments;
    pendingReplies = replies;
  }

  $effect(() => {
    load();
    const unsub = onMessage((msg) => {
      if (
        msg.type === 'plan:updated' ||
        msg.type === 'section:updated' ||
        msg.type === 'comments:answered' ||
        msg.type === 'provocations:added' ||
        msg.type === 'review:submitted'
      ) {
        load();
      }
    });
    return unsub;
  });

  function onPendingChange() {
    load();
  }

  function onReviewSubmitted() {
    batchId = crypto.randomUUID();
    load();
  }

  const statusColors: Record<string, string> = {
    draft: '#8b949e',
    in_review: '#d29922',
    approved: '#3fb950',
    changes_requested: '#f85149',
  };
</script>

{#if loading}
  <p class="muted">Loading plan...</p>
{:else if !plan}
  <p class="muted">Plan not found.</p>
{:else}
  <div class="plan-view">
    <div class="plan-header">
      <h1>{plan.title}</h1>
      <span class="status-badge" style="color: {statusColors[plan.status] || '#8b949e'}">
        {plan.status.replace('_', ' ')}
      </span>
    </div>

    <div class="sections">
      {#each plan.sections as section, i (section.id)}
        <Section
          {section}
          planId={plan.id}
          {batchId}
          index={i}
          onchange={onPendingChange}
        />
      {/each}
    </div>
  </div>

  <ReviewBar
    planId={plan.id}
    {pendingEdits}
    {pendingComments}
    {pendingReplies}
    planStatus={plan.status}
    onsubmitted={onReviewSubmitted}
  />
{/if}

<style>
  .muted {
    color: #8b949e;
  }
  .plan-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .plan-header h1 {
    font-size: 1.75rem;
    font-weight: 700;
  }
  .status-badge {
    text-transform: capitalize;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    background: rgba(255,255,255,0.06);
  }
  .sections {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
</style>
