import { pollFeeds } from "@/background/utils/feed-polling";
import { log } from "@/background/utils/logging";

const FEED_POLLING_ALARM = "feed-polling";

chrome.runtime.onInstalled.addListener(async () => {
  await getOrCreateFeedPollingAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
  await getOrCreateFeedPollingAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const scheduled = new Date(alarm.scheduledTime);
  const msg = `alarm=${alarm.name} scheduledAt=${scheduled.toISOString()}`;
  log(msg);
  if (alarm.name === FEED_POLLING_ALARM) {
    await pollFeeds();
  }
});

async function getOrCreateFeedPollingAlarm() {
  const alarm = await chrome.alarms.get(FEED_POLLING_ALARM);

  if (!alarm) {
    log("Creating feed polling alarm");
    await chrome.alarms.create(FEED_POLLING_ALARM, {
      when: Date.now() + 1000,
      periodInMinutes: 1,
    });
  }
}
