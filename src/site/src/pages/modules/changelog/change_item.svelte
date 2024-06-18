<script>
  import config from "#config";
  import { dayjs, fetchFromInnerApi } from "#lib/safe-utils.js";
  import ContextMenu from "#site-component/ContextMenu";
  import { createPopup } from "#site/components/Popups/handler.svelte";
  import svelteApp from "#site/core/svelte-app.js";
  import { isDeveloper } from "#site/lib/permissions.js";
  import { onMount } from "svelte";
  import { getNotificationsContext } from "svelte-notifications";
  const { addNotification } = getNotificationsContext();

  export let message;
  export let commit_id;
  export let id;
  export let group_symbol;
  export let short_change;
  export let createdAt;

  let node = null;

  const markupedList = {
    KEY: "changelog.markupedList",
    update(callback) {
      const value = callback(this.value());
      localStorage.setItem(this.KEY, JSON.stringify(value));
      return value;
    },
    value() {
      const plain = localStorage.getItem(this.KEY) || "[]";
      return JSON.parse(plain);
    },
  };
  onMount(() => {
    const list = markupedList.value();
    list.includes(id) && node.classList.add("markuped");

    document.location.hash.endsWith(id) &&
      (() => {
        node.classList.add("target");
        node.scrollIntoView({ behaviour: "smooth", block: "center" });
      })();
  });
  function onContextMenu(event) {
    createPopup(ContextMenu, {
      x: event.pageX,
      y: event.pageY,
      items: [
        isDeveloper(svelteApp.user) && {
          label: "Отредактировать",
          action: async () => {
            const previous = node.innerText;
            node.contentEditable = "true";
            node.focus();
            const { resolve, promise } = Promise.withResolvers();
            node.addEventListener("blur", resolve, { once: true });
            await promise;
            node.contentEditable = "false";
            if (!confirm("Подтвердите отправку изменений")) {
              node.innerText = previous;
              return;
            }
            addNotification({
              text: "Отправка на сервер",
              removeAfter: 10_000,
              position: "bottom-center",
            });
            const result = await fetchFromInnerApi(
              "modules/changelog_daemon/request_edit_change",
              {
                parseType: "text",
                method: "POST",
                headers: { Authorization: svelteApp.storage.getToken() },
                body: JSON.stringify({
                  target: createdAt,
                  message,
                  previous,
                  value: node.innerText,
                }),
              },
            );
            addNotification({
              text: `Статус отправки: ${JSON.stringify(result)}`,
              position: "bottom-center",
              removeAfter: 10_000,
            });
          },
        },
        commit_id && {
          label: "Открыть коммит",
          icon: "",
          action: () => open(`${config.enviroment.github}/commit/${commit_id}`),
        },
        !node.classList.contains("markuped") && {
          label: "Маркер",
          icon: "",
          action: () => {
            markupedList.update((previous) => {
              previous.push(id);
              return previous;
            });
            node.classList.add("markuped");
          },
        },
        node.classList.contains("markuped") && {
          label: "Отменить маркеровку",
          icon: "",
          action: () => {
            markupedList.update((previous) => {
              const index = previous.indexOf(id);
              index !== -1 && previous.splice(index, 1);
              return previous;
            });
            node.classList.remove("markuped");
          },
        },
        {
          label: "Скопировать ссылку на изменение",
          icon: "",
          action: async () => {
            const result = await navigator.clipboard.writeText(
              `${svelteApp.document.location.origin}${svelteApp.document.location.pathname}#${event.target.id}`,
            );

            addNotification({
              text: "Скопировано",
              removeAfter: 10_000,
              position: "bottom-center",
            });
            return result;
          },
        },
        {
          label: `Создано: ${dayjs(createdAt).format("DD.MM.YYYY HH:mm:ss")}`,
          icon: "",
          action: () => {
            addNotification({
              text: "Показывает время создания изменения",
              position: "bottom-center",
              removeAfter: 10_000,
            });
          },
        },
      ].filter(Boolean),
    });
    event.preventDefault();
  }
</script>

<li
  change_item
  change_item_symbol={group_symbol}
  title={message}
  data-commit={commit_id}
  {id}
  on:contextmenu={onContextMenu}
  bind:this={node}
>
  {short_change}.
</li>

<style>
  [change_item] {
    --font-size: 0.8rem;
    --line-height: 1.2;
    font-size: var(--font-size);
    line-height: var(--line-height);
    flex-wrap: wrap;
    list-style: none;
    position: relative;
    text-align: justify;
  }

  [change_item]::before {
    content: attr(change_item_symbol);
    font-family: "Icon", sans-serif;
    width: 1em;
    position: absolute;
    left: calc(var(--font-size) * -1.05);
    opacity: 0.8;
    color: var(--text-theme-accent);
    font-size: 0.65rem;
    height: calc(var(--font-size) * var(--line-height));

    display: flex;
    align-items: center;
    justify-content: center;
  }

  [change_item]:nth-child(2n) {
    color: color-mix(in srgb, currentColor, transparent 15%);
  }

  [change_item]:where(.markuped) {
    text-decoration: underline;
    font-weight: bold;
  }

  [change_item]:where(.target) {
    transition: background-color 2000ms;
    background-color: var(--main-color);

    @starting-style {
      background-color: transparent;
    }
  }
</style>
