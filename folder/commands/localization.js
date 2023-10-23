import { MongoDBDriver } from "#lib/MongoDBDriver.js";
import EventsManager from "#lib/modules/EventsManager.js";
import { random, TimeAuditor, timestampToDate } from "#lib/util.js";
import { TextTableBuilder, CellAlignEnum } from "@zoodogood/utils/primitives";
import JSONC from "json5";

class Command {
  async onChatInput(msg, interaction) {
    return;
    const context = this.getContext(interaction);
    const db = await new MongoDBDriver().init();

    const result = db.writeFile("123.py", "111");
  }

  addLineToFile(context) {}

  getContext(interaction) {
    const START_AVERAGE = 3;
    return {
      interaction,
      average: START_AVERAGE,
      messageInterface: null,
      strokeContent: null,
      userScore: 0,
      lastAnswer: null,
      timeAuditor: new TimeAuditor(),
      auditor: [],
    };
  }

  options = {
    name: "localization",
    id: 64,
    media: {
      description: "Помощь с переводом",
    },
    allias: "локализация локалізація i18n",
    allowDM: true,
    cooldown: 4_000,
    type: "other",
  };
}

export default Command;
