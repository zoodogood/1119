<script context="module">
  const popups = [];
  function createPopup(component, options) {
    new component({ target: document.body, props: options });
  }
</script>
