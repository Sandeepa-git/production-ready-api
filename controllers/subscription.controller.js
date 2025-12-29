// controllers/subscription.controller.js
import Subscription from "../models/subscription.model.js";
import { workflowClient } from "../config/upstash.js";
import { SERVER_URL } from "../config/env.js";
import transporter, { accountEmail } from "../config/nodemailer.js";

export const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id });
    res.status(200).json({ success: true, data: subscriptions });
  } catch (e) {
    next(e);
  }
};

export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });

    const subscriptionId = subscription._id.toString();

    // Trigger Upstash workflow for reminders
    try {
      await workflowClient.trigger({
        url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
        body: { subscriptionId },
        headers: {
          "Content-Type": "application/json",
        },
        workflowRunId: `subscription-${subscriptionId}`,
        retries: 0,
      });
    } catch (workflowError) {
      console.error(`[Workflow Error] Failed to trigger reminder for ${subscriptionId}:`, workflowError.message);
      // We don't throw the error here so the user still gets their subscription created
    }

    // Send email notification
    try {
      await transporter.sendMail({
        from: accountEmail,
        to: req.user.email,
        subject: '🚀 New Subscription Added!',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">Subscription Added!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Hello <strong>${req.user.name}</strong>,</p>
              <p>You have successfully added a new subscription to your dashboard.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h2 style="margin-top: 0; font-size: 18px; color: #555;">Subscription Details:</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${subscription.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Price:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${subscription.currency} ${subscription.price}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Frequency:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${subscription.frequency}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Category:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${subscription.category}</td>
                  </tr>
                   <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Renewal Date:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${new Date(subscription.renewalDate).toLocaleDateString()}</td>
                  </tr>
                </table>
              </div>
              
              <p>If you have any questions, feel free to reply to this email.</p>
              <p>Best Regards,<br><strong>The Subscriptions Team</strong></p>
            </div>
            <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #888;">
              &copy; ${new Date().getFullYear()} Subscriptions Inc. All rights reserved.
            </div>
          </div>
        `
      });
      console.log(`Email sent to ${req.user.email} for subscription ${subscription.name}`);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    res.status(201).json({ success: true, data: subscription });
  } catch (e) {
    next(e);
  }
};

export const getUserSubscriptions = async (req, res, next) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      const error = new Error(
        `You are not authorized. Your User ID: ${req.user._id.toString()}, Requested ID: ${req.params.id}`
      );
      error.statusCode = 401;
      throw error;
    }

    const subscriptions = await Subscription.find({ user: req.params.id });
    res.status(200).json({ success: true, data: subscriptions });
  } catch (e) {
    next(e);
  }
};

export const getSubscriptionDetails = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ success: true, data: subscription });
  } catch (e) {
    next(e);
  }
};

export const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error("You are not authorized to delete this subscription");
      error.statusCode = 401;
      throw error;
    }

    await Subscription.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Subscription deleted successfully" });
  } catch (e) {
    next(e);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error("You are not authorized to update this subscription");
      error.statusCode = 401;
      throw error;
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedSubscription });
  } catch (e) {
    next(e);
  }
};
