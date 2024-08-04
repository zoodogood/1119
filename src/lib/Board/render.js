import client from "#bot/client.js";
import { BaseContext } from "#lib/BaseContext.js";
import { render_strategies } from "#lib/Board/render/strategies/mod.js";
import Template from "#lib/modules/Template.js";

function notify_exception(context, error) {
  const { user } = context.counter;
  user.msg({
    title: `Оповещение о приостановке обновления табла`,
    description: `Это табло было создано вами. Что вы можете сделать:\n1. Табло отключено, потому что во время его отображения произошёл сбой;\nДля избежания подобных сбоев исправьте причину сбоя в коде табла;\n3. Включите табло. Сейчас оно выключено.\nОба действия можно выполнить в команде счётчики. Информация о табле: . Сообщение при сбое:\n\`\`\`\n${error.message}\n\`\`\``,
  });
}
export class RenderContext extends BaseContext {
  constructor(counter) {
    super("@template_render/context", {});
    this.counter = counter;
    this.counterBase = render_strategies[counter.key];
    const user = client.users.cache.get(counter.uid);
    this.user = user;
  }

  exception(error) {
    this.conteer.freezed = true;
    notify_exception(this, error);
  }

  take_templater(call_enviroment) {
    const { counter } = this;
    const templater = new Template(
      { executor: counter.uid, type: Template.sourceTypes.counter },
      call_enviroment,
    );
    return templater;
  }
}

export async function render(counter) {
  if (!counter) {
    return;
  }

  if (counter.freezed) {
    return null;
  }

  const context = new RenderContext(counter);

  try {
    await context.counterBase.render(context);
  } catch (error) {
    context.exception(error);
    return error;
  }
}
