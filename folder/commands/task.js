import { BaseCommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { sortByResolve } from "#lib/mini.js";
import { CliParser } from "@zoodogood/utils/primitives";

class TaskData {
  constructor(data) {
    this.isDone = data.isDone;
    this.todos = data.todos;
    this.label = data.label;
  }

  static from(data) {
    return new TaskData(data);
  }
}

class TodosFetcher {
  constructor(todos, params, context) {
    this.todos = todos;
    this.params = params.toLowerCase();
    this.context = context;
  }
  processFlagAll() {
    if (this.params === "+") {
      return this.todos;
    }
  }

  processInclude() {
    const todos = this.todos.filter(
      (todo) =>
        todo.id === +this.params || todo.label.toLowerCase() === this.params,
    );

    return todos;
  }

  searchByParams() {
    return this.processFlagAll() || this.processInclude();
  }
}
class TaskManager {
  userTask;
  constructor(context) {
    this.context = context;
    this.setUserTaskField(context.user);
  }
  createTaskData(label) {
    return new TaskData({
      label,
      isDone: false,
      todos: [],
    });
  }

  getUserTaskField() {
    return this.userTask;
  }

  setUserTaskField(user) {
    const task = new TaskData(user.data.task || {});
    user.data.task ||= task;
    this.userTask = task;
    return this;
  }
}
class Display_CommandManager {
  constructor(context) {
    this.context = context;
  }

  onProcess() {
    const { channel, task } = this.context;
    const contents = {
      label: task.label,
      todos: this.todosToString(task.todos),
    };
    channel.msg({
      content: `${task.isDone ? "✅ " : ""}${contents.label}\n${contents.todos}`,
    });
  }

  todosToString(todos, includeId = false) {
    const idLength = todos.reduce(
      (acc, current) => Math.max(acc, String(current.id).length),
      0,
    );
    return sortByResolve(todos, ({ isDone }) => !isDone)
      .map((todo) =>
        this.todoToString(todo, {
          idFieldLength: includeId ? idLength : null,
        }),
      )
      .join("\n");
  }

  todoToString(todo, { idFieldLength } = {}) {
    const { isDone, label, id } = todo;
    const idContent = idFieldLength
      ? ` \`${String(id).padEnd(idFieldLength, "")}.\``
      : "";
    return `${isDone ? "●" : "○"}${idContent} ${label}`;
  }

  sendTodos(todos, includeId = true) {
    const { channel, task } = this.context;
    todos ||= task.todos;
    const contents = {
      todos: this.todosToString(todos, includeId),
    };
    channel.msg({
      content: `${contents.todos}`,
    });
  }
}
class HelpCommandManager {
  subcommand;
  constructor(context) {
    this.context = context;
  }

  sendHelpTodos(channel) {
    const content = `## Todo
Подзадачи помогают идти к цели неспешно
- \`task todo\` - псевдоним для "task help todo" или "task todo list"
- \`task todo add {label1}\\n{label2}...{labelN}\` - добавляет подзадачи
- \`task todo list\` - отображение подзадач
- \`task todo done {displayed id|label|+}\` - пометить подзадачу как выполненную
`;

    channel.msg({
      title: "Вызвана команда с параметром help todo",
      description: content,
      thumbnail: "https://www.emojiall.com/images/240/openmoji/1f7e9.png",
    });
  }

  sendHelp(channel) {
    const content = `# Таск
Людям легче сделать сложный выбор, когда их выбор ограничен, а не безграничен. 

### Философия применения  
- **Сосредоточьтесь на чем-то одном и никогда не отступайте от своей цели:**.
Программа не позволяет создавать более одной задачи за раз. Вы должны честно отметить задачу как выполненную, прежде чем создавать новую.

- **Ответственно подходите к выполнению:**.
Никаких напоминаний от этого инструмента. Только сам человек волен выбирать, когда ему работать над задачей. При необходимости вы можете установить будильник в другом приложении.

### Команды
- \`task\` - показывает название текущей задачи и прикрепленные к ней todo, если таковые имеются
- \`task new\` - создаёт новую задачу
- \`task help {команда}\` - предоставляет общую информацию
- \`task version\` - предоставляет информацию о версии и источнике
- \`task todo\` - псевдоним для "task help todo" или "task todo list"
- \`task todo add {label}\` - добавляет подзадачу
- \`task todo list\` - отображение подзадач
- \`task todo done {displayed id}\` - пометить подзадачу как выполненную
- \`task ididit\` - поздравляем. Полностью стирает выполненную задачу и все связанные с ней данные, — и начинает все заново.
`;

    channel.msg({
      title: "Вызвана команда с параметром help",
      description: content,
      thumbnail: "https://www.emojiall.com/images/240/openmoji/1f7e9.png",
    });
  }

  onProcess() {
    const parsed = this.context.cliParsed.at(0);
    parsed.parser
      .captureByMatch({ name: "subcommand", regex: /(^|\s+)\S+/ })
      .captureResidue({ name: "rest" });
    this.subcommand = parsed.captures.get("subcommand")?.toString().trim();

    if (this.processTodoSubcommand()) {
      return true;
    }

    this.processDefaultBehavior();
    return true;
  }

  processTodoSubcommand() {
    if (this.subcommand !== "todo") {
      return;
    }
    this.sendHelpTodos(this.context.channel);
    return true;
  }

  processDefaultBehavior() {
    const { channel } = this.context;
    this.sendHelp(channel);
    return true;
  }
}

class TodoCommandManager {
  subcommand;
  params;
  constructor(context) {
    this.context = context;
  }
  onProcess() {
    const parsed = this.context.cliParsed.at(0);
    parsed.parser
      .captureByMatch({ name: "subcommand", regex: /(^|\s+)\S+/ })
      .captureResidue({ name: "rest" });
    this.subcommand = parsed.captures.get("subcommand")?.toString().trim();
    this.params = parsed.captures.get("rest").toString();

    if (this.processAddSubcommand()) {
      return;
    }

    if (this.processDoneSubcommand()) {
      return;
    }

    if (this.processListSubcommand()) {
      return;
    }

    if (this.processDefaultBehavior()) {
      return;
    }
  }

  processAddSubcommand() {
    if (this.subcommand !== "add") {
      return;
    }
    if (!this.processTaskIsExists()) {
      return true;
    }

    if (!this.processValidateParams()) {
      return true;
    }
    const { task } = this.context;
    const labels = this.params.split("\n");
    for (const label of labels) {
      task.todos.push(this.createTodoData(label));
    }
    new Display_CommandManager(this.context).onProcess();
    return true;
  }

  processValidateParams() {
    if (this.params) {
      return true;
    }
    const { channel } = this.context;
    channel.msg({
      content: "Ожидалось значение подзадачи :yellow_square:",
    });
    return false;
  }

  processDoneSubcommand() {
    if (this.subcommand !== "done") {
      return;
    }
    if (!this.processTaskIsExists()) {
      return true;
    }

    const { task } = this.context;
    const targets = new TodosFetcher(task.todos, this.params, this.context)
      .searchByParams()
      .filter((todo) => !todo.isDone);

    if (!this.processTodosIsExists(targets)) {
      return;
    }

    this.doneTodos(targets);
    new Display_CommandManager(this.context).sendTodos(targets, false);

    return true;
  }

  doneTodos(todos) {
    const targets = todos.filter((todo) => !todo.isDone);
    for (const todo of targets) {
      todo.isDone = true;
    }

    return true;
  }

  processTaskIsExists() {
    const { task } = this.context;
    if (task?.isDone !== undefined) {
      return true;
    }

    const { channel } = this.context;
    channel.msg({
      description:
        "Прежде чем создавать подзадачи поставьте основную задачу: !task new {label} :yellow_square:",
    });
    return false;
  }

  processTodosIsExists(todos) {
    if (todos.length) {
      return true;
    }
    const { channel } = this.context;
    const { params } = this;
    channel.msg({
      content: `По поисковому \`${params}\` не удалось найти подзадачу. Требуется или точное совпадение по имени, или номер подзадачи :yellow_square:`,
    });
    new Display_CommandManager(this.context).sendTodos();
    return false;
  }

  processListSubcommand() {
    if (this.subcommand !== "list") {
      return;
    }
    if (!this.processTaskIsExists()) {
      return true;
    }

    if (this.processTodosIsEmpty()) {
      return true;
    }
    new Display_CommandManager(this.context).sendTodos();
    return true;
  }

  processTodosIsEmpty() {
    const { task } = this.context;
    if (task.todos?.length) {
      return;
    }
    const { channel } = this.context;
    channel.msg({
      content:
        "Список пуст :yellow_square:. Создать новую подзадачу: !task todo add Подготовить рабочее место и хорошее настроение",
    });
    return true;
  }

  processDefaultBehavior() {
    const { channel } = this.context;
    const { task } = this.context;
    if (task.todos?.length) {
      new Display_CommandManager(this.context).sendTodos();
      return true;
    }
    new HelpCommandManager(this.context).sendHelpTodos(channel);
    return true;
  }

  createTodoData(value) {
    const { task } = this.context;
    const id = task.todos.length + 1;
    return {
      id,
      label: value,
      isDone: false,
    };
  }
}

class New_CommandManager {
  params;
  constructor(context) {
    this.context = context;
  }
  onProcess() {
    if (this.processUserAlreadyHasTask()) {
      return;
    }
    const parsed = this.context.cliParsed.at(0);
    parsed.parser.captureResidue({ name: "rest" });
    this.params = parsed.captures.get("rest").toString().trim();
    if (!this.processValidateRest(this.params)) {
      return;
    }
    this.setNewTask(this.params);
    new Display_CommandManager(this.context).onProcess();
  }

  processValidateRest(rest) {
    if (rest) {
      return true;
    }

    const { channel } = this.context;
    channel.msg({
      content: "Ожидался заголовок задачи :yellow_square:",
    });
    return false;
  }

  processUserAlreadyHasTask() {
    const { task } = this.context;
    if (task?.isDone === false) {
      const { channel } = this.context;
      channel.msg({
        description:
          "Завершите предыдщую задачу, прежде чем создать новую: !task ididit",
      });
      return true;
    }

    return;
  }

  setNewTask(value) {
    const { taskManager } = this.context;
    const task = taskManager.getUserTaskField();
    Object.assign(task, taskManager.createTaskData(value));
    console.log(this.context.user.data.task);
  }
}

class IDidItCommandManager {
  constructor(context) {
    this.context = context;
  }

  onProcess() {
    const { channel } = this.context;
    const { task } = this.context;
    if (!this.processTaskIsExists()) {
      return true;
    }
    if (this.processTaskIsDone()) {
      return;
    }
    this.doneTask();
    channel.msg({ content: `:tada:` });
    channel.msg({
      content: `:white_check_mark: ${task.label}\nВам все ещё доступна команда !task todo list/add/done, чтобы вы могли поработать над результатом. Основная задача завершена`,
    });
  }

  processTaskIsExists() {
    const { task, channel } = this.context;
    if (task?.isDone !== undefined) {
      return true;
    }

    channel.msg({
      description:
        "Нет активной задачи. Создать новую: !task new {label} :yellow_square:",
    });
    return false;
  }

  processTaskIsDone() {
    const { task, channel } = this.context;
    if (task.isDone === true) {
      return true;
    }
    channel.msg({
      content:
        "Нет активной задачи. Текущая задача уже завершена :yellow_square:",
    });
    return;
  }

  doneTask() {
    const { task } = this.context;
    task.isDone = true;
  }
}

class CommandRunContext extends BaseCommandRunContext {
  memb = null;
  user;
  channel;
  guild;
  taskManager;

  parseCli() {
    const parser = new CliParser().setText(this.interaction.params);

    const parsed = parser
      .processBrackets()
      .captureByMatch({ name: "command", regex: /^\S+/ })
      .collect();

    const values = parsed.resolveValues((capture) => capture?.toString());
    this.setCliParsed(parsed, values);
  }

  static async new(interaction, command) {
    const context = new this(interaction, command);
    context.taskManager = new TaskManager(context);
    context.task = context.taskManager.getUserTaskField();
    return context;
  }

  constructor(interaction, command) {
    super(interaction, command);
    const { user, channel, guild } = interaction;
    Object.assign(this, { user, channel, guild });
  }
}
class Command extends BaseCommand {
  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  /**
   *
   * @param {CommandRunContext} context
   */
  async run(context) {
    context.parseCli();

    if (this.processHelpCommand(context)) {
      return;
    }

    if (this.processNewCommand(context)) {
      return;
    }

    if (this.processTodoCommand(context)) {
      return;
    }

    if (this.processIDidItCommand(context)) {
      return;
    }

    this.processDefaultBehavior(context);
  }
  processHelpCommand(context) {
    const values = context.cliParsed.at(1);
    const value = values.get("command");
    if (value !== "help") {
      return;
    }
    new HelpCommandManager(context).onProcess();
    return true;
  }

  processIDidItCommand(context) {
    const values = context.cliParsed.at(1);
    const value = values.get("command");
    if (value !== "ididit") {
      return;
    }

    new IDidItCommandManager(context).onProcess();
    return true;
  }

  processNewCommand(context) {
    const values = context.cliParsed.at(1);
    const value = values.get("command");
    if (value !== "new") {
      return;
    }

    new New_CommandManager(context).onProcess();
    return true;
  }

  processTodoCommand(context) {
    const values = context.cliParsed.at(1);
    const value = values.get("command");
    if (value !== "todo") {
      return;
    }

    new TodoCommandManager(context).onProcess();
    return true;
  }
  processDefaultBehavior(context) {
    const { channel, task } = context;
    if (task?.isDone !== undefined) {
      new Display_CommandManager(context).onProcess();
      return;
    }
    new HelpCommandManager(context).sendHelp(channel);
  }

  options = {
    name: "task",
    id: 66,
    media: {
      description:
        "Обозначьте единственную цель и возвращайтесь к ней до полного выполнения — таков концепт",
    },
    alias: "таск цель ціль t т",
    allowDM: true,
    cooldown: 2_000,
    cooldownTry: 3,
    type: "other",
    cliParser: {
      flags: [
        {
          name: "--json",
          capture: ["-j", "--json"],
          description: "Возвращает *.json задачи",
        },
        {
          name: "--todo-add",
          capture: ["-j", "--json"],
          description: "Возвращает *.json задачи",
        },
      ],
    },
  };
}

export default Command;
