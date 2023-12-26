import client from "#bot/client.js";
import { ActionsMap } from "#constants/enums/actionsMap.js";
import Template from "#lib/modules/Template.js";

export default {
  id: "evaluateTemplate",
  callback: {
    async [ActionsMap.any](user, effect, { actionName, data }) {
      const { hear, executorId, template } = effect.values;
      if (actionName in hear === false) {
        return;
      }

      const executor = client.users.cache.get(executorId);

      const source = {
        type: Template.sourceTypes.evaluateEffect,
        executor,
      };

      const context = {
        client,
        effect,
        actionName,
        data,
        user,
      };

      try {
        await new Template(source, context).createVM().run(template);
      } catch (error) {
        executor.msg({
          content: `Ваши данные указаны в эффекте, как ответсвенного. Сообщаем, что шаблон внутри эффекта: Effect<${effect.uid}> (первая часть указывает на временную метку инициализации), — был выполнен с ошибкой\nПользователь: ${user} (${user.id})\nТекст шаблона:\n\`\`\`${template}\`\`\`\n\nТекст ошибки: \`\`\`${error.message}\`\`\``,
        });
      }
    },
  },
};
