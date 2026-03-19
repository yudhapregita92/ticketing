import nodemailer from "nodemailer";
import db from "../db.js";

// Email Transporter Helper
async function getTransporter() {
  const smtpHost = db.prepare("SELECT value FROM settings WHERE key = 'smtp_host'").get() as { value: string } | undefined;
  const smtpPort = db.prepare("SELECT value FROM settings WHERE key = 'smtp_port'").get() as { value: string } | undefined;
  const smtpUser = db.prepare("SELECT value FROM settings WHERE key = 'smtp_user'").get() as { value: string } | undefined;
  const smtpPass = db.prepare("SELECT value FROM settings WHERE key = 'smtp_pass'").get() as { value: string } | undefined;

  const host = smtpHost?.value || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(smtpPort?.value || process.env.SMTP_PORT || '465');
  const user = smtpUser?.value || process.env.SMTP_USER || 'itk3dk2026@gmail.com';
  const pass = smtpPass?.value || process.env.SMTP_PASS || 'wkizhrimtufuderw';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

export async function sendNotificationEmail(ticket: any, emails: string[]) {
  console.log('Attempting to send email notification to:', emails);
  
  if (!emails || emails.length === 0) {
    console.log('Skipping email notification: No target emails provided');
    return;
  }

  const smtpFrom = db.prepare("SELECT value FROM settings WHERE key = 'smtp_from'").get() as { value: string } | undefined;
  const smtpUser = db.prepare("SELECT value FROM settings WHERE key = 'smtp_user'").get() as { value: string } | undefined;
  const fromName = smtpFrom?.value || "IT Support Portal";
  const fromEmail = smtpUser?.value || process.env.SMTP_USER || 'itk3dk2026@gmail.com';

  const transporter = await getTransporter();
  
  for (const email of emails) {
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `[New Ticket] ${ticket.ticket_no} - ${ticket.category}`,
      text: `Ada tiket baru masuk!\n\nNo Tiket: ${ticket.ticket_no}\nNama: ${ticket.name}\nDepartemen: ${ticket.department}\nKategori: ${ticket.category}\nDeskripsi: ${ticket.description}\n\nSilakan cek portal admin untuk detail lebih lanjut.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
          <h2 style="color: #10b981; margin-top: 0;">Ada tiket baru masuk!</h2>
          <p>Halo Admin, ada laporan baru yang memerlukan perhatian Anda.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">No Tiket:</td><td>${ticket.ticket_no}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Nama:</td><td>${ticket.name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Departemen:</td><td>${ticket.department}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Kategori:</td><td>${ticket.category}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Deskripsi:</td><td>${ticket.description}</td></tr>
          </table>
          <div style="margin-top: 30px;">
            <a href="${process.env.APP_URL || '#'}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Buka Portal Admin</a>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Notification email sent successfully to: ${email}`);
    } catch (error) {
      console.error(`Error sending notification email to ${email}:`, error);
    }
  }
}

export async function sendTelegramNotification(ticket: any, botToken: string, chatIds: string[]) {
  const trimmedToken = botToken.trim();
  if (!trimmedToken || !chatIds || chatIds.length === 0) {
    console.log('Skipping Telegram notification: Missing token or chat IDs');
    return;
  }

  const message = `
<b>Ada Tiket Baru Masuk!</b>

<b>No Tiket:</b> ${ticket.ticket_no}
<b>Nama:</b> ${ticket.name}
<b>Departemen:</b> ${ticket.department}
<b>Kategori:</b> ${ticket.category}
<b>Deskripsi:</b> ${ticket.description || '-'}

<a href="https://www.itk3dk.my.id/">Buka Portal Admin</a>
  `.trim();

  for (const chatId of chatIds) {
    try {
      console.log(`Sending Telegram notification to ${chatId}...`);
      const response = await fetch(`https://api.telegram.org/bot${trimmedToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Telegram API error for ${chatId}:`, errorData);
      } else {
        console.log(`Telegram notification sent successfully to: ${chatId}`);
      }
    } catch (error) {
      console.error(`Error sending Telegram notification to ${chatId}:`, error);
    }
  }
}

export async function sendUserNotificationEmail(ticket: any, type: 'submit' | 'done') {
  try {
    const masterUser = db.prepare("SELECT email FROM master_users WHERE full_name = ?").get(ticket.name) as { email: string } | undefined;
    if (!masterUser || !masterUser.email) {
      console.log(`Skipping user email notification: No email found for user ${ticket.name}`);
      return;
    }

    const smtpFrom = db.prepare("SELECT value FROM settings WHERE key = 'smtp_from'").get() as { value: string } | undefined;
    const smtpUser = db.prepare("SELECT value FROM settings WHERE key = 'smtp_user'").get() as { value: string } | undefined;
    const fromName = smtpFrom?.value || "IT Support Portal";
    const fromEmail = smtpUser?.value || process.env.SMTP_USER || 'itk3dk2026@gmail.com';

    const transporter = await getTransporter();

    let subject = '';
    let html = '';

    if (type === 'submit') {
      subject = `[Tiket Diterima] ${ticket.ticket_no} - ${ticket.category}`;
      html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
          <h2 style="color: #10b981; margin-top: 0;">Tiket Anda Telah Diterima</h2>
          <p>Halo ${ticket.name}, laporan Anda telah masuk ke sistem kami dan akan segera ditinjau oleh tim IT.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">No Tiket:</td><td>${ticket.ticket_no}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Kategori:</td><td>${ticket.category}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Deskripsi:</td><td>${ticket.description || '-'}</td></tr>
          </table>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Terima kasih telah menggunakan layanan IT Support.</p>
        </div>
      `;
    } else if (type === 'done') {
      subject = `[Tiket Selesai] ${ticket.ticket_no} - ${ticket.category}`;
      html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
          <h2 style="color: #10b981; margin-top: 0;">Tiket Anda Telah Selesai</h2>
          <p>Halo ${ticket.name}, permintaan Anda pada tiket <b>${ticket.ticket_no}</b> telah selesai dikerjakan oleh tim IT.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">No Tiket:</td><td>${ticket.ticket_no}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Kategori:</td><td>${ticket.category}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Pesan dari IT:</td><td>${ticket.admin_reply || '-'}</td></tr>
          </table>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Terima kasih telah menggunakan layanan IT Support.</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: masterUser.email,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`User notification email sent successfully to: ${masterUser.email}`);
  } catch (error) {
    console.error(`Error sending user notification email for ticket ${ticket.ticket_no}:`, error);
  }
}
