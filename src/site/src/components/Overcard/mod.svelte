<script>
  export let imageURL = null,
    label = "",
    content = "",
    url = null;

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  const Interaction = {
    onClick() {
      url && window.open(url, "_blank");

      dispatch("click");
    },
  };
</script>

<element-card
  style:--image={imageURL ? `url("${imageURL}")` : null}
  class="component element-card"
  on:click={Interaction.onClick}
  on:keydown={Interaction.onClick}
>
  <element-layer class="background" />
  <element-layer class="foreground">
    <element-container>
      <element-group class="button">
        <element-svg class="octagon" />
        <element-svg class="triange" />
      </element-group>

      <section class="content">
        <h3>{label}</h3>
        <span>{content}</span>
      </section>
    </element-container>
  </element-layer>
</element-card>

<style>
  element-card {
    width: 300px;
    max-width: 100%;
    aspect-ratio: 410 / 240;
    display: flex;

    container: card / inline-size;
    position: relative;
    isolation: isolate;

    cursor: pointer;
    transition: filter 1s;
  }

  .background {
    background-image: var(--image);
    background-size: cover;
    background-position: center;

    width: 100%;
    height: 100%;
    position: absolute;
    z-index: -1;
  }

  .foreground {
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 1;

    background-image: linear-gradient(to bottom, #00000000 0%, #000000aa 100%);
  }

  .foreground element-container {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .button {
    --size: 20cqw;

    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    width: var(--size);
    aspect-ratio: 1;

    filter: contrast(1.5);
  }

  .octagon {
    position: absolute;

    aspect-ratio: 1;
    width: 100%;
    clip-path: polygon(
      85% 85%,
      50% 100%,
      15% 85%,
      0% 50%,
      15% 15%,
      50% 0%,
      85% 15%,
      100% 50%
    );
    background-color: var(--main-color);

    padding: 0;
    min-width: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    transition:
      transform 0.5s,
      filter 0.5s;
    transition-timing-function: cubic-bezier(0.7, 0, 0.35, 1);
    filter: contrast(0.5);
    transition-delay: 1s;
  }

  .triange {
    --size: 50%;
    position: absolute;
    clip-path: polygon(80% 50%, 30% 20%, 30% 80%);
    background-color: var(--dark);

    display: block;
    width: var(--size);
    aspect-ratio: 1;
  }

  .content {
    --bottom: 3cqw;
    --max-width: 40cqw;
    --translate: 40%;

    color: var(--white);
    position: absolute;
    right: 0;
    bottom: var(--bottom);
    transform: translateX(var(--translate));

    font-size: calc(0.3em + 3cqw);
    max-width: var(--max-width);

    text-transform: uppercase;
    opacity: 0.8;
  }

  .content h3 {
    font-weight: bold;
    transition: color 500ms;
    overflow-wrap: normal;
  }

  .content span {
    display: inline-block;
    font-size: 0.5em;
  }

  element-card:hover .octagon {
    transform: scale(1.1) rotateZ(calc((360deg / 8) * 4));
    filter: contrast(0.5) brightness(1.1);
    transition-delay: 0s;
  }

  element-card:hover h3 {
    color: var(--main-color);
    filter: contrast(1.5);
  }

  element-card:hover .content {
    opacity: 1;
  }

  element-card:hover {
    filter: brightness(1.2);
  }
</style>
