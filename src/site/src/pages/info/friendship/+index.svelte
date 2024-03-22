<script>
  import Header from "#site-component-lib/Layout/Header.svelte";
  import Main from "#site-component-lib/Layout/Main.svelte";

  import { onMount } from "svelte";

  const Component = {
    node: null,
  };

  const State = {
    intersectionSectionIndex: 0,
  };

  onMount(async () => {
    const observer = new IntersectionObserver((entries) => {
      const index = sections.findIndex((node) =>
        entries.find(({ target }) => target === node),
      );
      State.intersectionSectionIndex = index;
    });

    const sections = [
      ...Component.node.querySelectorAll(".page-main > section"),
    ];
    for (const section of sections) {
      observer.observe(section);
    }
  });

  $: console.log(State.intersectionSectionIndex);
</script>

<main class="page-main" bind:this={Component.node}>
  <section>
    <main>
      <h3>Добро пожаловать</h3>
      <p>Вернуться</p>
      <a href="#">Домой</a>
      <p>
        Привет! На досуге хотелось много сказать. Спасибо за то, что дождались
      </p>
    </main>
  </section>

  <section></section>

  <section></section>
</main>

<style>
  .page-main {
    display: flex;
    flex-direction: column;

    scroll-snap-type: y mandatory;
    scroll-behavior: auto;
    overscroll-behavior-y: contain;

    max-height: 100lvh;
    overflow-y: auto;

    counter-reset: section;
    padding-bottom: 10vh;

    scrollbar-width: none;
  }

  .page-main::-webkit-scrollbar {
    width: 0;
  }

  section {
    flex-shrink: 0;
    scroll-snap-align: start;
    scroll-snap-stop: always;

    height: 100lvh;
    width: 100%;

    background-color: var(--background-theme-accent);
    color: var(--text-theme-accent);
  }

  section:nth-child(2n) {
    filter: contrast(0.9);
  }

  section::before {
    counter-increment: section;
    content: "[" counter(section) "]";
    display: inline-block;

    opacity: 0.2;
    font-weight: 100;
    font-size: 1.5em;
    padding: 0.2em;
  }

  section > main {
    width: 100%;
    height: 100%;
    display: block;
    padding: calc(2vw + 1em);
    padding-bottom: calc(5vw + 2.5em);
  }

  button {
    text-transform: uppercase;
    box-shadow:
      0 3px 1px -2px rgba(0, 0, 0, 0.2),
      0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 1px 5px 0 rgba(0, 0, 0, 0.12);
  }
</style>
