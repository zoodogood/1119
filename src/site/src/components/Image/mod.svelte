<script>
  export let src = "";
  export let alt = "";
  export let className = "";
  let broken = false;
</script>

<img
  {alt}
  {src}
  loading="lazy"
  decoding="async"
  class={className}
  class:broken
  on:error={() => (broken = true)}
/>

<style>
  img.broken {
    overflow: visible;
  }

  img[alt]::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: var(--background-theme-accent);
    filter: contrast(0.9);
    top: 0;
    left: 0;

    display: flex;
    align-items: end;
    justify-content: end;

    font-family: "Icon";
    font-size: 1.2em;
    color: color-mix(in srgb, currentColor, transparent 50%);
  }
</style>
