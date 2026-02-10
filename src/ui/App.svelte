<script lang="ts">
  import { initWs } from './lib/ws';
  import PlanList from './lib/PlanList.svelte';
  import PlanView from './lib/PlanView.svelte';

  let route = $state(window.location.hash || '#/');

  function handleHash() {
    route = window.location.hash || '#/';
  }

  $effect(() => {
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  });

  initWs();

  let planId = $derived(route.startsWith('#/plans/') ? route.slice('#/plans/'.length) : null);
</script>

<div class="app">
  <header class="app-header">
    <a href="#/" class="logo">Boost</a>
    {#if planId}
      <a href="#/" class="back-link">&larr; All Plans</a>
    {/if}
  </header>

  <main class="app-main">
    {#if planId}
      <PlanView {planId} />
    {:else}
      <PlanList />
    {/if}
  </main>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f1117;
    color: #e1e4e8;
    line-height: 1.6;
  }
  :global(a) {
    color: #58a6ff;
    text-decoration: none;
  }
  :global(a:hover) {
    text-decoration: underline;
  }
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .app-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.75rem 1.5rem;
    background: #161b22;
    border-bottom: 1px solid #30363d;
  }
  .logo {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f0f6fc !important;
    letter-spacing: -0.02em;
  }
  .back-link {
    font-size: 0.875rem;
    color: #8b949e !important;
  }
  .app-main {
    flex: 1;
    max-width: 960px;
    width: 100%;
    margin: 0 auto;
    padding: 1.5rem;
    padding-bottom: 5rem;
  }
</style>
