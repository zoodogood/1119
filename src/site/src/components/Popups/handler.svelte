<script context="module">
  const popups = [];
  export function createPopup(component, props = {}) {
    const popup = new component({ target: document.body, props });
    popups.push(popup);
    popup.$on("request_close", () => removePopup(popup));
    return popup;
  }

  export function removePopup(popup) {
    popup.$destroy?.();
    const index = popups.indexOf(popup);
    index !== -1 && popups.splice(index, 1);
  }
</script>
