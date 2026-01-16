import "dotenv/config";
import "reflect-metadata";
import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import { bullRedis } from "../config/redis";
import { EmailLog } from "../entities/EmailLog";
import { AppDataSource } from "../config/data-source";
import { pubsub } from "../config/pubsub";
import { EMAIL_STATUS_UPDATED, EmailStatusPayload } from "../resolvers/EmailStatusSubscription";

(async () => {
  await AppDataSource.initialize();

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  new Worker(
    "email-queue",
    async (job) => {
      const { emailLogId } = job.data;

      const emailLog = await EmailLog.findOne({
        where: { id: emailLogId },
        relations: [
          "order",
          "order.user",
          "order.details",
          "order.details.ticket",
          "order.details.ticket.event",
        ],
      });

      if (!emailLog) throw new Error("Email log not found");

      const pendingPayload: EmailStatusPayload = {
        emailLogId: emailLog.id,
        orderId: emailLog.order.id,
        status: "PENDING",
        updatedAt: new Date(),
      };
      await pubsub.publish(EMAIL_STATUS_UPDATED, pendingPayload);

      try {
        const itemsHtml = emailLog.order.details
          .map(
            (d) =>
              `<li>${d.ticket.event.title} - ${d.ticket.name} x ${d.qty}</li>`
          )
          .join("");

        await transporter.sendMail({
          from: `"Ticket App" <${process.env.EMAIL_USER}>`,
          to: emailLog.to,
          subject: emailLog.subject,
          html: `
            <h2>Terima kasih, ${emailLog.order.user.name}</h2>
            <p>Order kamu berhasil dibuat</p>
            <ul>${itemsHtml}</ul>
            <p>Total: <b>Rp ${emailLog.order.total_price}</b></p>
          `,
        });

        emailLog.status = "SENT";
        await emailLog.save();

        const sentPayload: EmailStatusPayload = {
          emailLogId: emailLog.id,
          orderId: emailLog.order.id,
          status: "SENT",
          updatedAt: new Date(),
        };
        await pubsub.publish(EMAIL_STATUS_UPDATED, sentPayload);
        
      } catch (err: any) {
        emailLog.status = "FAILED";
        emailLog.error = err.message;
        await emailLog.save();

        const failedPayload: EmailStatusPayload = {
          emailLogId: emailLog.id,
          orderId: emailLog.order.id,
          status: "FAILED",
          error: err.message,
          updatedAt: new Date(),
        };
        await pubsub.publish(EMAIL_STATUS_UPDATED, failedPayload);
        
        throw err;
      }
    },
    {
      connection: bullRedis,
      concurrency: 1,
    }
  );

  console.log("📨 Email worker running...");
})();
