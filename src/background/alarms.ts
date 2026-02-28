import { runFeedPollingAlarmHandler } from "@/background/utils/feed-polling";
import { getLogger, glogger } from "@/utils/logging";
import { FEED_POLLING_LOCK } from "@/utils/settings";

const FEED_POLLING_ALARM = "feed-polling";

chrome.runtime.onInstalled.addListener(async () => {
  await getOrCreateFeedPollingAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
  await getOrCreateFeedPollingAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === FEED_POLLING_ALARM) {
    const scheduledAt = new Date(alarm.scheduledTime).toISOString();
    const logger = getLogger({ action: "feed-polling", scheduledAt });
    logger.debug("start");

    try {
      await navigator.locks.request(
        FEED_POLLING_LOCK,
        { signal: AbortSignal.timeout(2000) },
        async () => {
          await runFeedPollingAlarmHandler(logger);
        },
      );
    } catch (e) {
      if (e instanceof Error && e.name === "TimeoutError") {
        logger.debug("aborted (cannot acquire a lock)");
      } else {
        logger.error("failure", e);
      }
    }
  }
});

async function getOrCreateFeedPollingAlarm() {
  const alarm = await chrome.alarms.get(FEED_POLLING_ALARM);

  if (!alarm) {
    await chrome.alarms.create(FEED_POLLING_ALARM, {
      when: Date.now() + 1000,
      periodInMinutes: 1,
    });
    glogger.debug("feed polling alarm created");
  }
}
