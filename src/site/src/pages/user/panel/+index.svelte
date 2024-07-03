<script>
  import ChangeLanguage from "#site-component/ChangeLanguage";
  import Layout from "#site-component/Layout";
  import {
    GuildProgress,
    GuildSettings,
    UserProgress,
    UserSettings,
  } from "#site/components/frames/entityData/mod.js";

  import Image from "#site-component/Image";

  import { fetchFromInnerApi } from "#lib/safe-utils.js";
  import svelteApp from "#site/core/svelte-app.js";
  import PagesRouter from "#site/lib/Router.js";
  import { onMount } from "svelte";

  import { init_pwa_worker } from "#site/lib/init_pwa.js";
  import UserGuildsNav from "#site/pages/user/panel/UserGuildsNav.svelte";
  import { getNotificationsContext } from "svelte-notifications";
  const { addNotification } = getNotificationsContext();
  const hashStore = svelteApp.Hash.store;

  const TargetType = {
    User: "User",
    Guild: "Guild",
  };
  const State = {
    guilds: [],
    selectedGuild: null,
    target: {},
    settingsData: null,
    changes: {},
  };

  $: if (svelteApp.user) {
    State.selectedGuild =
      State.guilds.find((guild) => guild.id === $hashStore.guildId) ?? null;
    const targetType = State.selectedGuild ? TargetType.Guild : TargetType.User;
    const targetEntity =
      targetType === TargetType.User ? svelteApp.user : State.selectedGuild;

    State.target = {
      icon: targetEntity.avatarURL ?? targetEntity.iconURL,
      name: targetEntity.username ?? targetEntity.name,
      id: targetEntity.id,
      type: targetType,
    };

    targetType === TargetType.Guild &&
      (State.target.isAdmin = BigInt(targetEntity.permissions) & 8n);
  }

  onMount(async () => {
    await realiazeGuildData();
    State.settingsData = await fetchSettingsData();
  });

  async function fetchSettingsData() {
    const token = svelteApp.storage.getToken();
    if (!token) {
      return null;
    }

    const guilds = JSON.stringify(State.guilds.map((guild) => guild.id));

    const headers = { Authorization: token, guilds };
    const data = await fetchFromInnerApi("user/settings-data", { headers });
    console.log({ data });
  }

  async function realiazeGuildData() {
    const guilds = await fetchGuildsData();
    if (guilds === null) {
      PagesRouter.redirect(
        `../oauth2/auth?redirect=${svelteApp.url.subpath.join("/")}`,
      );
      return;
    }

    if (guilds === undefined) {
      addNotification({
        text: "Неудалось получить данные гильдий",
        position: "bottom-center",
      });
      return;
    }
    State.guilds = guilds.filter((guild) => guilds.mutual.includes(guild.id));
  }

  async function fetchGuildsData() {
    const token = svelteApp.storage.getToken();
    if (!token) {
      return null;
    }

    const headers = { Authorization: token, guilds: true };
    const userRaw = await fetchFromInnerApi("oauth2/user", { headers }).catch(
      () => {},
    );

    if (!userRaw?.id) {
      return;
    }

    const { guilds, mutualBotGuilds } = userRaw;
    guilds.mutual = mutualBotGuilds;

    return guilds;
  }
</script>

<Layout>
  <UserGuildsNav {State} />

  <main class="page-main">
    <section>
      <span class="icon-container">
        {#if State.target.icon}
          <Image
            src={State.target.icon}
            alt="guild-icon"
            className="icon guild_icon"
          />
        {:else}
          <span class="icon">{State.target.name?.at(0) ?? "/"}</span>
        {/if}
      </span>

      <h1>{State.target.name}</h1>
    </section>

    {#if State.target.type === TargetType.User}
      <UserProgress {svelteApp} target={State.target} />
      <UserSettings {svelteApp} target={State.target} />
      <ChangeLanguage isAlwaysVisible={true} />
      <button
        on:click={() => (
          init_pwa_worker(),
          addNotification({
            text: "Возможно, в панели браузера появилась соответсвующая опция",
            removeAfter: 10_000,
          })
        )}>Инициализировать PWA (для тестеровщиков)</button
      >
      <button
        on:click={() => {
          svelteApp.storage.setToken(null);
          svelteApp.storage.setUserData(null);
          PagesRouter.redirect(PagesRouter.getPageBy("public").key);
          return;
        }}
        style:margin-top={"2em"}
        style:background-color={"#dd000099"}
      >
        Выйти из аккаунта
      </button>
    {:else if State.target.isAdmin}
      <GuildProgress {svelteApp} target={State.target} />
      <GuildSettings {svelteApp} target={State.target} />
    {:else}
      <small
        >Вы не являетесь Администратором и не можете редактировать параметры
        бота связанные с выбраной гильдией.</small
      >
    {/if}
  </main>
</Layout>

<style>
  @media (width < 980px) {
    .page-main {
      padding-top: 10vh;
    }
  }

  @media (width >= 980px) {
    .page-main {
      padding-left: 5vw;
    }
  }

  .icon-container {
    display: flex;
    width: calc(3vw + 30px);
    aspect-ratio: 1 / 1;
    border-radius: 15px;
  }

  .icon-container :global(.guild_icon) {
    border-radius: 15px;
  }
</style>
