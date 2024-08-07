import client from "#bot/client.js";
import { BaseContext } from "#lib/BaseContext.js";
import { render_strategies } from "#lib/Board/render/strategies/mod.js";
import Template from "#lib/modules/Template.js";

function notify_exception(context, error) {
  const { user } = context.board;
  user.msg({
    title: `Оповещение о приостановке обновления табла`,
    description: `Это табло было создано вами. Что вы можете сделать:\n1. Табло отключено, потому что во время его отображения произошёл сбой;\nДля избежания подобных сбоев исправьте причину сбоя в коде табла;\n3. Включите табло. Сейчас оно выключено.\nОба действия можно выполнить в команде !табло. Информация о табле: . Сообщение при сбое:\n\`\`\`\n${error.message}\n\`\`\``,
  });
}
export class RenderContext extends BaseContext {
  constructor(board) {
    super("@template_render/context", {});
    this.board = board;
    this.boardBase = render_strategies[board.key];
    const user = client.users.cache.get(board.uid);
    this.user = user;
  }

  exception(error) {
    this.conteer.freezed = true;
    notify_exception(this, error);
  }

  take_templater(call_enviroment) {
    const { board } = this;
    const templater = new Template(
      { executor: board.uid, type: Template.sourceTypes.board_render },
      call_enviroment,
    );
    return templater;
  }
}

export async function render(board) {
  if (!board) {
    return;
  }

  if (board.freezed) {
    return null;
  }

  const context = new RenderContext(board);

  try {
    await context.boardBase.render(context);
  } catch (error) {
    context.exception(error);
    return error;
  }
}
