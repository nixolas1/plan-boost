<script lang="ts">
  import { marked } from 'marked';
  import { saveEdit } from './api';

  interface Props {
    section: any;
    planId: string;
    batchId: string;
    ondone: () => void;
  }
  let { section, planId, batchId, ondone }: Props = $props();

  let content = $state(section.content);
  let previewing = $state(false);
  let saving = $state(false);

  let preview = $derived(marked.parse(content));

  async function save() {
    if (content === section.content) { ondone(); return; }
    saving = true;
    await saveEdit(planId, section.id, content, batchId);
    saving = false;
    ondone();
  }

  function cancel() {
    ondone();
  }
</script>

<div class="editor">
  <div class="editor-tabs">
    <button class="tab" class:active={!previewing} onclick={() => previewing = false}>Edit</button>
    <button class="tab" class:active={previewing} onclick={() => previewing = true}>Preview</button>
  </div>

  {#if previewing}
    <div class="preview">
      {@html preview}
    </div>
  {:else}
    <textarea
      class="textarea"
      bind:value={content}
      rows="12"
    ></textarea>
  {/if}

  <div class="editor-actions">
    <button class="btn btn-save" onclick={save} disabled={saving}>
      {saving ? 'Saving...' : 'Save Edit'}
    </button>
    <button class="btn btn-cancel" onclick={cancel}>Cancel</button>
  </div>
</div>

<style>
  .editor {
    border-top: 1px solid #21262d;
  }
  .editor-tabs {
    display: flex;
    border-bottom: 1px solid #21262d;
  }
  .tab {
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
    background: transparent;
    border: none;
    color: #8b949e;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    font-family: inherit;
  }
  .tab.active {
    color: #e1e4e8;
    border-bottom-color: #58a6ff;
  }
  .textarea {
    width: 100%;
    padding: 1rem 1.25rem;
    background: #0d1117;
    color: #e1e4e8;
    border: none;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.875rem;
    line-height: 1.6;
    resize: vertical;
    outline: none;
  }
  .preview {
    padding: 1rem 1.25rem;
    font-size: 0.9375rem;
  }
  .editor-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid #21262d;
  }
  .btn {
    font-size: 0.8125rem;
    padding: 0.375rem 0.875rem;
    border-radius: 6px;
    border: 1px solid #30363d;
    cursor: pointer;
    font-family: inherit;
  }
  .btn-save {
    background: #238636;
    color: #fff;
    border-color: #238636;
  }
  .btn-save:hover {
    background: #2ea043;
  }
  .btn-save:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .btn-cancel {
    background: transparent;
    color: #8b949e;
  }
  .btn-cancel:hover {
    color: #e1e4e8;
  }
</style>
