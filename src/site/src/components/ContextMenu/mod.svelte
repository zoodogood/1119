<script>
  import Icon from "#site-component/iconic";
  import PopupBox from "#site/components/Popups/PopupBox.svelte";
  import { ButtonResponse } from "#site/lib/ButtonResponse.js";
  import { createEventDispatcher } from "svelte";
  export let x;
  export let y;
  export let items = [];

  const dispatch = createEventDispatcher();

  function onClick(event, source, callback) {
    ButtonResponse(source, event, callback);
    dispatch("request_close");
  }
</script>

<PopupBox {x} {y} on:request_close={() => dispatch("request_close")}>
  {#each items as { label, action, icon }}
    <button
      on:click={(event) => onClick(event, label, action)}
      context_menu_item
    >
      {#if icon}
        <span><Icon code={icon} />&nbsp;</span>
      {/if}
      {label}
    </button>
  {/each}
</PopupBox>

<style>
  [context_menu_item]:first-of-type {
    border-top-left-radius: 0;
  }
</style>
