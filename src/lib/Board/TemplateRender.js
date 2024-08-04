import {
  mol_tree2_json_from_string,
  mol_tree2_string_from_json,
} from "#lib/$mol.js";
import { Loop } from "#lib/Board/Loop.js";
import StorageManager from "#lib/modules/StorageManager.js";
import EventEmitter from "events";

export class TemplateRender {
  emitter = new EventEmitter();
  file = {
    path: `template_render_cron.tree`,
    load: async () => {
      const { path } = this.file;
      const plain = await StorageManager.read(path);
      const data = plain && mol_tree2_json_from_string(plain);
      this.loop.items = data || this.file.defaultData;
    },
    write: async () => {
      const { path } = this.file;
      console.log(this);

      const plain = mol_tree2_string_from_json(this.loop.items);
      await StorageManager.write(path, plain);
    },
    defaultData: [],
  };
  loop = new Loop({ items: [] });
  constructor({ interval }) {
    this.loop.interval = interval;
  }
}
