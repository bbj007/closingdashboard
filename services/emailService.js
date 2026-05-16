const nodemailer = require('nodemailer');
function createEmailService() {
  return {
    async sendDashboardEmail({ to, subject, html, attachments = [], requireApproval = true }) {
      if (requireApproval !== true) return { ok: false, reason: '승인 플래그 필요' };
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      const info = await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html, attachments });
      return { ok: true, messageId: info.messageId };
    }
  };
}
module.exports = { createEmailService };
