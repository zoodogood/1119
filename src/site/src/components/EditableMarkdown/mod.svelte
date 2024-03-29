<script>
  export let source;
  import SvelteMarkdown from "svelte-markdown";
</script>

<article class="editable-markdown-container">
  <SvelteMarkdown {source} />
</article>

<style>
  .editable-markdown-container {
    --element-margin-bottom: 1.25em;
    line-height: 1.35;
    font-family: serif;
    font-size: 0.85em;
    text-align: justify;
  }

  .editable-markdown-container :global(*[id]) {
    font-family: monospace;
  }

  .editable-markdown-container :global(*[id]):hover::before {
    content: "#";
    color: var(--main-color);
    opacity: 0.5;
    position: absolute;
    transform: translateX(-1em);
    filter: contrast(0.3);
  }

  .editable-markdown-container :global(hr) {
    width: 100%;
    margin-top: 0.5em;
    margin-bottom: calc(0.5em + var(--element-margin-bottom));
  }

  .editable-markdown-container :global(code) {
    font-family: "PTMono", monospace;
  }

  .editable-markdown-container :global(p),
  .editable-markdown-container :global(li) {
    opacity: 0.9;
    margin-bottom: var(--element-margin-bottom);
  }

  .editable-markdown-container :global(ol),
  .editable-markdown-container :global(ul) {
    margin-top: 0.5em;
    margin-bottom: calc(0.5em + var(--element-margin-bottom));
    margin-left: 1.5em;
  }

  .editable-markdown-container :global(img) {
    max-width: 100%;
    max-height: 50vh;
    margin-top: 0.5em;
    margin-bottom: calc(0.5em + var(--element-margin-bottom));
  }
</style>
