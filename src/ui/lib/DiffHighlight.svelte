<script lang="ts">
  import DiffMatchPatch from 'diff-match-patch';

  interface Props {
    previousContent: string;
    currentContent: string;
    ondismiss: () => void;
  }
  let { previousContent, currentContent, ondismiss }: Props = $props();

  const dmp = new DiffMatchPatch();

  let diffHtml = $derived.by(() => {
    const diffs = dmp.diff_main(previousContent || '', currentContent || '');
    dmp.diff_cleanupSemantic(diffs);

    return diffs.map(([op, text]: [number, string]) => {
      const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
      if (op === 1) return `<span class="diff-add">${escaped}</span>`;
      if (op === -1) return `<span class="diff-del">${escaped}</span>`;
      return `<span>${escaped}</span>`;
    }).join('');
  });
</script>

<div class="diff-container">
  <div class="diff-header">
    <span class="diff-title">Changes</span>
    <button class="dismiss-btn" onclick={ondismiss}>Dismiss</button>
  </div>
  <div class="diff-body">
    {@html diffHtml}
  </div>
</div>

<style>
  .diff-container {
    margin: 0.5rem 1.25rem;
    border: 1px solid #30363d;
    border-radius: 6px;
    overflow: hidden;
  }
  .diff-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid #21262d;
  }
  .diff-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #8b949e;
  }
  .dismiss-btn {
    background: transparent;
    border: none;
    color: #8b949e;
    cursor: pointer;
    font-size: 0.75rem;
    font-family: inherit;
  }
  .dismiss-btn:hover {
    color: #e1e4e8;
  }
  .diff-body {
    padding: 0.75rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.8125rem;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
    background: #0d1117;
  }
  :global(.diff-add) {
    background: rgba(63,185,80,0.2);
    color: #3fb950;
  }
  :global(.diff-del) {
    background: rgba(248,81,73,0.2);
    color: #f85149;
    text-decoration: line-through;
  }
</style>
