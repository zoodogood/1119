import { ActionsMap } from "#constants/enums/actionsMap.js";
import { UserEffectManager } from "#lib/modules/EffectsManager.js";

function provideTunnel(target, sourceUser, actionsToHear = {}, values = {}) {
  return UserEffectManager.justEffect({
    effectId: "provideTunnel",
    user: target,
    values: { sourceUserId: sourceUser.id, heared: actionsToHear, ...values },
  });
}

export default {
  id: "provideTunnel",
  callback: {
    [ActionsMap.any](targetUser, effect, { actionName, data }) {
      const { client } = targetUser;

      const { sourceUserId, heared } = effect.values;
      if (actionName in heared === false) {
        return;
      }

      const sourceUser = client.users.cache.get(sourceUserId);
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
