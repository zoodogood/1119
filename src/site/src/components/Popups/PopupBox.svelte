<script>
  import { onMount } from "svelte";

  export let achorNode = null;

  onMount(() => {});
</script>

<popup-element>
  <slot />
</popup-element>

<style>
  popup-element {
    position: absolute;
  }
</style>
