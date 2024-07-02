<script>
  export let svelteApp = null,
    target = {};

  import Progressbar from "#site-component/Progressbar";
  import Icon from "#site-component/iconic";
  import Wrapper from "./wrapper.svelte";

  import { LEVELINCREASE_EXPERIENCE_PER_LEVEL } from "#constants/users/events.js";
  import { NumberFormatLetterize, fetchFromInnerApi } from "#lib/safe-utils.js";
  import { onMount } from "svelte";

  const Component = {
    async getData() {
      const headers = { Authorization: svelteApp.storage.getToken() };
      const data = await fetchFromInnerApi("user/data", { headers });

      return data;
    },
  };

  const State = {
    user: {
      level: 0,
      experience: 0,
      coins: null,
    },
  };
  onMount(async () => {
    const userData = await Component.getData();
    if (!userData.id) {
      return;
    }

    console.log(target);

    State.user.level = userData.level;
    State.user.experience = userData.exp;
    State.user.coins = userData.coins;
  });
</script>

<Wrapper>
  <element-group style:width="30%" style:min-width="200px">
    <Progressbar
      value={State.user.experience}
      max={(State.user.level || 1) * LEVELINCREASE_EXPERIENCE_PER_LEVEL}
      targetLabel="{State.user.level} ур."
    />
  </element-group>

  <element-group>
    <element-container title="Богатств">
      <span style:color="#88888888"><Icon code="" /></span>
      {NumberFormatLetterize(State.user.coins)}
    </element-container>
  </element-group>
</Wrapper>

<style>
</style>
