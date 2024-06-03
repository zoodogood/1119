<script>
  import Notifications from "svelte-notifications";
</script>

<Notifications>
  <slot></slot>
</Notifications>

<style>
  :global(.notification) {
    filter: brightness(0.9) contrast(0.8) opacity(0.9);
    color: var(--text-theme-accent) !important;
    background-color: var(--background-theme-accent) !important;
    border-radius: 20px !important;
    padding-left: 1em !important;
    min-width: min(95vw, 400px) !important;
    max-width: 95vw;

    transition: filter 200ms;
  }

  :global(.notification:hover) {
    filter: none;
  }

  :global(.notification-content) {
    width: 350px !important;
    font-size: 0.9em !important;
  }

  :global(.notification-button) {
    color: var(--text-theme-accent) !important;
    border: none !important;
  }
</style>
