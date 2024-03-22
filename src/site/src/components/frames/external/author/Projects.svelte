<script>
  import OverCard from "#site-component/Overcard";
  import Icon from "#site-component/iconic";
  import svelteApp from "#site/core/svelte-app.js";

  const i18n = svelteApp.i18n.frames.externalAuthorProjects;

  const Component = {
    projectesEnum: new Map(
      Object.entries({
        piramide: {
          label: i18n.projectesEnum.piramide.label,
          description: i18n.projectesEnum.piramide.description,
          imageURL: "https://i.ibb.co/gTttG8p/piramide-screenshot.png",
          home: "https://zoodogood.github.io/piramide/",
          github: "https://github.com/zoodogood/piramide",
        },
        letsbet: {
          label: i18n.projectesEnum.letsbet.label,
          description: i18n.projectesEnum.letsbet.description,
          imageURL: "https://i.ibb.co/Tb1RbG0/letsbet-screen.webp",
          home: "https://zoodogood.github.io/let-s-bet/index.html",
          github: "https://github.com/zoodogood/let-s-bet",
        },
        glitchBall: {
          label: i18n.projectesEnum.glitchBall.label,
          description: i18n.projectesEnum.glitchBall.description,
          imageURL: "https://i.ibb.co/db7VyKf/glitchball-screenshot.webp",
          home: "https://zoodogood.github.io/glitchBall/",
          github: "https://github.com/zoodogood/glitchBall",
        },
      }),
    ),

    authorLink: "https://github.com/stars/zoodogood/lists/release",

    async getProjectesDataFromGithub() {
      const transformLink = (projectGithubLink) => {
        const FROM = "github.com";
        const TO = "api.github.com/repos";
        return projectGithubLink.replace(FROM, TO);
      };

      const data = {};
      for (const [key, { github }] of Component.projectesEnum)
        data[key] = await (async () => {
          const response = await fetch(transformLink(github));
          const data = await response.json();
          return data;
        })();

      return data;
    },
  };
</script>

<element-container class="component">
  <element-layout>
    <a href={Component.authorLink} target="_blank" rel="noreferrer">
      <Icon code="" />
    </a>
  </element-layout>
  <ul class="projectes-cards-list">
    {#each [...Component.projectesEnum] as element}
      {@const [key, options] = element}
      <li>
        <OverCard
          imageURL={options.imageURL}
          url={options.url || options.home || options.github}
          label={options.label}
          content={options.description}
        />
      </li>
    {/each}
    {#await Component.getProjectesDataFromGithub()}
      {""}
    {:then data}
      <aside>
        {#each [...Component.projectesEnum] as element}
          {@const [key] = element}
          <li>
            <p>{key}</p>
            <span>{i18n.aside.stars} {data[key].stargazers_count}</span>
          </li>
        {/each}
      </aside>
    {/await}
  </ul>
</element-container>

<style>
  a {
    color: inherit;
  }

  .component {
    flex-direction: column;
    min-height: 110vh;
    margin-block: 2em;
    color: var(--white);
  }

  ul {
    background-color: var(--dark);
    position: absolute;
    left: 0;
    width: 100%;
    min-height: 110vh;
    display: flex;

    gap: calc(3em + 3vh);
    overflow: auto;
    padding-right: 3em;
    padding-block: 30vh;

    scroll-behavior: smooth;
  }

  .projectes-cards-list > li {
    --alpha: 5deg;
    display: flex;
    list-style: none;
    transform: rotateZ(var(--alpha)) translateY(0);
    transition: transform 1s;
    max-width: 30vh;
  }

  .projectes-cards-list > li:hover {
    transform: rotateZ(0) translateY(-1em);
  }

  aside {
    margin-left: auto;
    display: flex;
    flex-direction: column;
    gap: 1em;
    justify-content: center;

    font-size: 0.8em;
    font-weight: 100;
    text-transform: uppercase;

    list-style: none;

    opacity: 0.8;
    cursor: default;
  }

  aside p {
    font-size: 1.5em;
  }

  element-layout {
    position: absolute;
    right: 0;
    z-index: 1;
    padding: 0.5em;
    opacity: 0.1;
    cursor: pointer;
  }
</style>
