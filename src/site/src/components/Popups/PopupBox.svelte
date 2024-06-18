<script>
  import { createEventDispatcher, onDestroy, onMount } from "svelte";

  export let dispatch = createEventDispatcher();

  export let popupNode = null;
  export let x = 0;
  export let y = 0;

  function onPointerOutside(event) {
    !popupNode.contains(event.target) && dispatch("request_close");
  }

  onMount(() => {
    updatePosion(x, y);
    document.addEventListener("pointerup", onPointerOutside);
  });
  onDestroy(() => {
    document.removeEventListener("pointerup", onPointerOutside);
  });

  $: popupNode && updatePosion(x, y);

  function updatePosion(x, y) {
    const rect = popupNode.getBoundingClientRect();
    const { width: innerWidth, height: innerHeight } =
      document.body.getBoundingClientRect();

    x = Math.min(innerWidth - (rect.width || 0), x);
    y = Math.min(innerHeight - (rect.height || 0), y);
    popupNode.style.setProperty("--popup_x", `${x}px`);
    popupNode.style.setProperty("--popup_y", `${y}px`);
  }
</script>

<popup-element bind:this={popupNode}>
  <slot />
</popup-element>

<style>
  popup-element {
    left: var(--popup_x, 0);
    right: 0;
    top: var(--popup_y, 0);
    bottom: 0;
    position: absolute;
    overflow: clip;

    max-width: fit-content;
    height: fit-content;
  }
</style>
