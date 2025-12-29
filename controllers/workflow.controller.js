import { createRequire } from "module";
import dayjs from "dayjs";
import Subscription from "../models/subscription.model.js";

const require = createRequire(import.meta.url);
const { serve } = require("@upstash/workflow/express");

const REMINDERS = [7, 5, 2, 1];

export const sendReminders = serve(async (context) => {
  const { subscriptionId } = context.request.payload;

  console.log("Workflow Payload:", JSON.stringify(context.request.payload, null, 2));

  if (!subscriptionId) {
    console.error("Missing subscriptionId in workflow payload:", context.request);
    return { success: false, error: "Missing subscriptionId" };
  }

  const subscription = await fetchSubscription(subscriptionId);
  if (!subscription || subscription.status !== "active") return;

  const renewalDate = dayjs(subscription.renewalDate);

  if (renewalDate.isBefore(dayjs())) {
    console.log(
      `Renewal date has passed for subscription ${subscriptionId}. Stopping workflow`
    );
    return;
  }

  for (const dayBefore of REMINDERS) {
    const reminderDate = renewalDate.subtract(dayBefore, "day");

    if (reminderDate.isAfter(dayjs())) {
      await sleepUntilReminder(context, `${dayBefore}-day`, reminderDate);
      await triggerReminder(context, `${dayBefore}-day`);
    }
  }

  return { success: true };
});

const fetchSubscription = async (subscriptionId) => {
  return Subscription.findById(subscriptionId)
    .populate("user", "name email")
    .lean();
};

const sleepUntilReminder = async (context, label, date) => {
  console.log(`Sleeping until ${label} reminder at ${date.toISOString()}`);
  await context.sleepUntil(date.toDate());
};

const triggerReminder = async (context, label) => {
  await context.run(`trigger ${label} reminder`, async () => {
    console.log(`Triggering ${label} reminder`);
    return { label };
  });
};
