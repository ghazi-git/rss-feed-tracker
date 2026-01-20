import { runFeedPollingAlarmHandler } from "@/background/utils/feed-polling";
import { glogger } from "@/utils/logging";

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
    await runFeedPollingAlarmHandler(scheduledAt);
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
