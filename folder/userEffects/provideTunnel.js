import { ActionsMap } from "#constants/enums/actionsMap.js";
import { UserEffectManager } from "#lib/modules/EffectsManager.js";

function provideTunnel(target, sourceUser, effectsToHear = {}, values = {}) {
  return UserEffectManager.justEffect({
    user: target,
    values: { source: sourceUser.id, heared: effectsToHear, ...values },
  });
}

export default {
  id: "provideTunnel",
  callback: {
    [ActionsMap.any](targetUser, effect, { actionName, data }) {
      const { client } = targetUser;

      const { source, heared } = effect.values;
      if (actionName in heared === false) {
        return;
      }

      const sourceUser = client.users.cache.get(source);
      const context = {
        targetUser,
        actionName,
        data,
        effect,
        resumeAlive() {
          this.pong = true;
        },
        requestTunnelClose() {
          this.pong = false;
          UserEffectManager.removeEffect({ effect, user: targetUser });
        },
      };
      sourceUser.action(ActionsMap.tunnelMessageReceive, context);

      const hasResponse = context.pong === true;
      if (!hasResponse) {
        UserEffectManager.removeEffect({ effect, user: targetUser });
      }
    },
  },
};

export { provideTunnel };
