<script lang="ts">
  import { listPlans } from './api';
  import { onMessage } from './ws';

  let plans = $state<any[]>([]);
  let loading = $state(true);

  async function load() {
    plans = await listPlans();
    loading = false;
  }

  $effect(() => {
    load();
    const unsub = onMessage((msg) => {
      if (msg.type === 'plan:created' || msg.type === 'plan:updated') {
        load();
      }
    });
    return unsub;
  });

  const statusColors: Record<string, string> = {
    draft: '#8b949e',
    in_review: '#d29922',
    approved: '#3fb950',
    changes_requested: '#f85149',
  };
</script>

<div class="plan-list">
  <h1>Plans</h1>

  {#if loading}
    <p class="muted">Loading...</p>
  {:else if plans.length === 0}
    <p class="muted">No plans yet. Ask Claude to create one.</p>
  {:else}
    <div class="plans">
      {#each plans as plan}
        <a href="#/plans/{plan.id}" class="plan-card">
          <div class="plan-title">{plan.title}</div>
          <div class="plan-meta">
            <span class="status-badge" style="color: {statusColors[plan.status] || '#8b949e'}">
              {plan.status.replace('_', ' ')}
            </span>
            <span class="date">{new Date(plan.created_at).toLocaleDateString()}</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .plan-list h1 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
  }
  .muted {
    color: #8b949e;
  }
  .plans {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .plan-card {
    display: block;
    padding: 1rem 1.25rem;
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    transition: border-color 0.15s;
  }
  .plan-card:hover {
    border-color: #58a6ff;
    text-decoration: none;
  }
  .plan-title {
    font-weight: 600;
    color: #f0f6fc;
    margin-bottom: 0.375rem;
  }
  .plan-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.8125rem;
  }
  .status-badge {
    text-transform: capitalize;
    font-weight: 500;
  }
  .date {
    color: #8b949e;
  }
</style>
