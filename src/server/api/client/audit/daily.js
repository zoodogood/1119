import { BaseRoute } from "#server/router.js";
import DataManager from "#lib/modules/DataManager.js";
import { timestampDay } from "#lib/safe-utils.js";
import { DailyAudit } from "#folder/events/TimeEvents/new-day.js";

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
