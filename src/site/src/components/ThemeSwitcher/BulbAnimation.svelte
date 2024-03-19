<script>
  import { sleep } from "#lib/safe-utils.js";

  let node = null;
  (async () => {
    await sleep(1_000);
    node.parentNode.removeChild(node);
  })();
</script>

<article bind:this={node}></article>

<style>
  @keyframes apparance {
    0% {
      opacity: 0.35;
      width: 0;
      height: 0;
      border-radius: 50%;
    }

    100% {
      opacity: 0;
      width: 100vw;
      height: 100vh;
      border-radius: 0%;
    }
  }

  article {
    position: fixed;
    width: 100%;
    height: 100vh;

    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    left: 0;
    z-index: 100;
    pointer-events: none;
  }

  article::after {
    content: "";
    display: block;

    border-radius: 50%;
    background-color: var(--main-color);
    animation: apparance 1s;
  }
</style>
