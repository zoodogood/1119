<script>
  import Image from "#site-component/Image";
  import svelteApp from "#site/core/svelte-app.js";
  import { getNotificationsContext } from "svelte-notifications";
  const { addNotification } = getNotificationsContext();

  export let State;
</script>

<ul
  pages_user_panel_userGuildNav__root
  style:--elements-size="{2.85 - State.guilds?.length * 0.15}em"
  class="guilds-list"
>
  {#each State.guilds as guild}
    {@const onClick = () =>
      State.target.id !== guild.id
        ? svelteApp.Hash.include({ key: "guildId", value: guild.id }).apply()
        : svelteApp.Hash.remove("guildId").apply()}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <li
      title="Сервер {guild.name}"
      class:selected={State.target.id === guild.id}
      class:user_guild_item={true}
      class:nav_item={true}
      data-id={guild.id}
      on:click={onClick}
      on:keydown={onClick}
      on:contextmenu|preventDefault={() =>
        navigator.clipboard
          .writeText(guild.id)
          .then(() =>
            addNotification({
              text: `ID скопирован`,
              position: "bottom-center",
              removeAfter: 5_000,
            }),
          )
          .catch(() =>
            addNotification({
              text: `Неудалось скопировать ID`,
              position: "bottom-center",
              removeAfter: 5_000,
            }),
          )}
    >
      {#if guild.iconURL}
        <Image
          src={guild.iconURL}
          alt="guild-icon"
          className="icon guild_icon"
        />
      {:else}
        <span class="icon">{guild.name.at(0)}</span>
      {/if}
    </li>
  {/each}
  <hr />
  <li class="invite nav_item" title="Пригласить">
    <a target="_blank" href={svelteApp.getBot().invite} rel="noreferrer">
      <span class="icon">
        {"+"}
      </span>
    </a>
  </li>
</ul>

<style>
  [pages_user_panel_userGuildNav__root] {
    --offset: 0;
    font-size: max(0.5em, var(--elements-size, 0em));
    display: flex;
    list-style: none;
    gap: 0.15em;

    background-color: #88888810;
    border-radius: 0.2em;
    padding: 0.075em;

    align-items: center;
    opacity: 0.8;
    transition: opacity 1s;

    scrollbar-width: none;
  }

  .guilds-list:hover {
    opacity: 1;
  }

  @media (max-width: 980px) {
    [pages_user_panel_userGuildNav__root] {
      left: 50%;
      transform: translateX(-50%);
      position: absolute;
      max-width: 90vw;
      top: var(--offset);
      flex-direction: row;

      overflow-x: auto;
      overscroll-behavior-x: contain;
      scroll-snap-type: x mandatory;

      padding-inline: 0.5em;
      padding-bottom: 0.2em;
      margin-top: 1vh;
    }

    .nav_item {
      margin-top: var(--margin, 0);
    }

    [pages_user_panel_userGuildNav__root] hr {
      width: 3px;
      height: 15px;
    }
  }

  @media (min-width: 980px) {
    [pages_user_panel_userGuildNav__root] {
      top: 50%;
      transform: translateY(-50%);
      position: fixed;
      max-height: 70vh;
      left: var(--offset);
      flex-direction: column;

      overflow-y: auto;
      overscroll-behavior-y: contain;
      scroll-snap-type: y mandatory;

      padding-block: 0.5em;
      padding-right: 0.2em;
    }

    .nav_item {
      margin-left: var(--margin, 0);
    }

    [pages_user_panel_userGuildNav__root] hr {
      width: 15px;
      height: 3px;
    }
  }

  .nav_item {
    --size: 0.5em + 0.5vw + 25px;
    width: calc(var(--size));
    font-size: calc(var(--size) / 2);
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;

    display: flex;
    flex-shrink: 0;

    scroll-snap-align: start;

    position: relative;

    filter: brightness(0.7);
    transition: filter 300ms;
  }

  .nav_item > * {
    flex-grow: 1;
  }

  [pages_user_panel_userGuildNav__root] > hr:first-child {
    display: none;
  }

  .nav_item :global(.icon) {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--dark);
    color: var(--white);
    width: 100%;
    height: 100%;

    font-size: 0.5em;
    font-weight: 600;
    font-family: monospace;
    user-select: none;
  }

  .nav_item :global(.icon) {
    filter: contrast(0.7);
  }

  .nav_item :global(.guild-icon) {
    border-radius: 15px;
  }
  .nav_item:hover {
    border-radius: 20%;
    background: #88888833;
    filter: brightness(1);
  }

  .nav_item.selected {
    filter: brightness(1);
    border-radius: 40%;
  }

  .nav_item.invite {
    filter: brightness(1);
  }

  .nav_item.invite .icon {
    font-weight: 100;
    color: var(--white);
    transition:
      transform 300ms,
      background-color 1s,
      color 1s;
  }

  .nav_item.invite:hover .icon {
    font-weight: 100;
    background-color: var(--main-color);
    transform: rotateZ(360deg);
  }
</style>
