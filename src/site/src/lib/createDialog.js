import Dialog from "#site-component/Dialog";

function createDialog(svelteApp, props) {
  new Dialog({
    target: svelteApp.document.body,
    props: { useClassic: true, ...props },
  });
}

export { createDialog };
