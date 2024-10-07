import { DailyAudit } from "#folder/events/TimeEvents/new-day.js";
import { DataManager } from "#lib/DataManager/singletone.js";
import { timestampDay } from "#lib/safe-utils.js";
import { BaseRoute } from "#server/router.js";

const PREFIX = "/client/audit/daily";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async get(request, response) {
    const currentDay = timestampDay(Date.now());
    const currentData = DailyAudit.createData();

    response.json({
      ...DataManager.data.audit.daily,
      [currentDay]: currentData,
    });
    return;
  }
}

export default Route;
