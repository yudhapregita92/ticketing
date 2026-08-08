import nodemailer from "nodemailer";
import db from "../db.ts";

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
  
  const validEmails = (emails || []).map(e => String(e || '').trim()).filter(e => e && e.includes('@'));

  if (validEmails.length === 0) {
    console.log('Skipping email notification: No valid target emails provided');
    return;
  }

  const smtpFrom = db.prepare("SELECT value FROM settings WHERE key = 'smtp_from'").get() as { value: string } | undefined;
  const smtpUser = db.prepare("SELECT value FROM settings WHERE key = 'smtp_user'").get() as { value: string } | undefined;
  const fromName = smtpFrom?.value || "IT Support Portal";
  const fromEmail = smtpUser?.value || process.env.SMTP_USER || 'itk3dk2026@gmail.com';

  const transporter = await getTransporter();
  
  for (const email of validEmails) {
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
    let recipientEmail = ticket.email ? String(ticket.email).trim() : '';

    if (!recipientEmail) {
      let masterUser: { email: string } | undefined;
      if (ticket.employee_index) {
        masterUser = db.prepare("SELECT email FROM master_users WHERE employee_index = ? AND email IS NOT NULL AND TRIM(email) != ''").get(ticket.employee_index) as { email: string } | undefined;
      }
      if (!masterUser || !masterUser.email) {
        masterUser = db.prepare("SELECT email FROM master_users WHERE full_name = ? AND email IS NOT NULL AND TRIM(email) != ''").get(ticket.name) as { email: string } | undefined;
      }
      if (masterUser && masterUser.email) {
        recipientEmail = String(masterUser.email).trim();
      }
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.log(`Skipping user email notification: No valid recipient email found for user ${ticket.name} (NIK: ${ticket.employee_index || '-'})`);
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
      to: recipientEmail,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`User notification email sent successfully to: ${recipientEmail}`);
  } catch (error) {
    console.error(`Error sending user notification email for ticket ${ticket.ticket_no}:`, error);
  }
}

export async function sendActionRecommendationEmails(
  ticket: any,
  actionType: string,
  actionNotes: string,
  supervisors: { employee_index: string | null; name: string; email?: string | null }[]
) {
  try {
    const isLoan = actionType === 'Dipinjamkan';
    
    // Get SMTP Configuration
    const smtpFrom = db.prepare("SELECT value FROM settings WHERE key = 'smtp_from'").get() as { value: string } | undefined;
    const smtpUser = db.prepare("SELECT value FROM settings WHERE key = 'smtp_user'").get() as { value: string } | undefined;
    const fromName = smtpFrom?.value || "IT Support Portal";
    const fromEmail = smtpUser?.value || process.env.SMTP_USER || 'itk3dk2026@gmail.com';

    const transporter = await getTransporter();

    // 1. Email for Pemohon (Ticket Creator)
    let pemohonEmail = ticket.email ? String(ticket.email).trim() : '';
    if (!pemohonEmail) {
      let masterUser: { email: string } | undefined;
      if (ticket.employee_index) {
        masterUser = db.prepare("SELECT email FROM master_users WHERE employee_index = ? AND email IS NOT NULL AND TRIM(email) != ''").get(ticket.employee_index) as { email: string } | undefined;
      }
      if (!masterUser || !masterUser.email) {
        masterUser = db.prepare("SELECT email FROM master_users WHERE full_name = ? AND email IS NOT NULL AND TRIM(email) != ''").get(ticket.name) as { email: string } | undefined;
      }
      if (masterUser && masterUser.email) {
        pemohonEmail = String(masterUser.email).trim();
      }
    }

    if (pemohonEmail && pemohonEmail.includes('@')) {
      const subject = isLoan
        ? `[Rekomendasi IT] Peminjaman Perangkat/Part - Tiket #${ticket.ticket_no}`
        : `[Rekomendasi IT - URGENT] Rekomendasi Pembelian Baru - Tiket #${ticket.ticket_no}`;

      const html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${isLoan ? '#fef3c7' : '#ffe4e6'}; border-left: 4px solid ${isLoan ? '#d97706' : '#e11d48'}; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin: 0; color: ${isLoan ? '#b45309' : '#be123c'}; font-size: 16px;">
              ${isLoan ? '📦 Rekomendasi Peminjaman Perangkat / Part' : '🚨 Rekomendasi Pembelian / Pengadaan Urgent'}
            </h3>
          </div>
          <p>Halo <b>${ticket.name}</b>,</p>
          <p>Tim IT telah meninjau tiket Anda (<b>#${ticket.ticket_no}</b> - ${ticket.category}) dan memberikan rekomendasi tindakan berikut:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; width: 140px; color: #64748b;">Rekomendasi IT:</td><td style="font-weight: bold; color: ${isLoan ? '#d97706' : '#e11d48'};">${isLoan ? 'Dipinjamkan Unit / Part Sementara' : 'Harus Dibeli (Pengadaan Baru URGENT)'}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Catatan IT:</td><td>${actionNotes || '-'}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Deskripsi Kendala:</td><td>${ticket.description || '-'}</td></tr>
          </table>
          <p style="font-size: 13px; color: #475569;">Notifikasi ini juga telah diteruskan ke Atasan / Sub Dept Head Anda untuk ditindaklanjuti.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">IT Support Portal &copy; ${new Date().getFullYear()}</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: pemohonEmail,
        subject,
        html
      }).catch(err => console.error("Error sending email to creator:", err));
      console.log(`Action recommendation email sent to ticket creator: ${pemohonEmail}`);
    }

    // 2. Email for Supervisors / Atasan (e.g. Puji Sulastiana)
    for (const sup of supervisors) {
      let supEmail = sup.email ? String(sup.email).trim() : '';
      if (!supEmail && sup.employee_index) {
        const u = db.prepare("SELECT email FROM master_users WHERE employee_index = ? AND email IS NOT NULL AND TRIM(email) != ''").get(sup.employee_index) as { email: string } | undefined;
        if (u?.email) supEmail = String(u.email).trim();
      }
      if (!supEmail && sup.name) {
        const u = db.prepare("SELECT email FROM master_users WHERE full_name = ? AND email IS NOT NULL AND TRIM(email) != ''").get(sup.name) as { email: string } | undefined;
        if (u?.email) supEmail = String(u.email).trim();
      }

      if (supEmail && supEmail.includes('@') && supEmail !== pemohonEmail) {
        const subject = isLoan
          ? `[Persetujuan Atasan] Peminjaman Part Tiket #${ticket.ticket_no} - ${ticket.name}`
          : `[Persetujuan Atasan URGENT] Rekomendasi Pembelian Tiket #${ticket.ticket_no} - ${ticket.name}`;

        const html = `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${isLoan ? '#fef3c7' : '#ffe4e6'}; border-left: 4px solid ${isLoan ? '#d97706' : '#e11d48'}; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="margin: 0; color: ${isLoan ? '#b45309' : '#be123c'}; font-size: 16px;">
                ${isLoan ? '📦 Pemberitahuan Peminjaman Part untuk Anggota Tim' : '🚨 Permohonan Pengadaan / Pembelian Urgent Anggota Tim'}
              </h3>
            </div>
            <p>Yth. Bapak/Ibu <b>${sup.name}</b>,</p>
            <p>Tim IT menyampaikan rekomendasi tindakan terkait tiket perbaikan dari anggota tim Anda:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; width: 140px; color: #64748b;">Nama Pemohon:</td><td style="font-weight: bold;">${ticket.name} (NIK: ${ticket.employee_index || '-'})</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">No Tiket:</td><td>${ticket.ticket_no}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Kategori:</td><td>${ticket.category}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Rekomendasi IT:</td><td style="font-weight: bold; color: ${isLoan ? '#d97706' : '#e11d48'};">${isLoan ? 'Dipinjamkan Unit / Part Pengganti' : 'Harus Dibeli / Pengadaan Baru URGENT'}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Catatan Rekomendasi:</td><td>${actionNotes || '-'}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Deskripsi Permasalahan:</td><td>${ticket.description || '-'}</td></tr>
            </table>
            <p style="font-size: 13px; color: #475569;">Silakan gunakan informasi di atas untuk koordinasi internal atau proses persetujuan pengadaan di departemen Anda.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">IT Support Portal &copy; ${new Date().getFullYear()}</p>
          </div>
        `;

        await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: supEmail,
          subject,
          html
        }).catch(err => console.error(`Error sending email to supervisor ${sup.name}:`, err));
        console.log(`Action recommendation email sent to supervisor ${sup.name}: ${supEmail}`);
      }
    }
  } catch (error) {
    console.error("Error in sendActionRecommendationEmails:", error);
  }
}

export function createDbNotification(data: {
  ticket_id: number;
  ticket_no: string;
  employee_index?: string | null;
  recipient_name?: string | null;
  title: string;
  message: string;
  type?: string;
}, io?: any) {
  try {
    const info = db.prepare(`
      INSERT INTO notifications (ticket_id, ticket_no, employee_index, recipient_name, title, message, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.ticket_id,
      data.ticket_no,
      data.employee_index || null,
      data.recipient_name || null,
      data.title,
      data.message,
      data.type || 'status_change'
    );

    const notif = db.prepare("SELECT * FROM notifications WHERE id = ?").get(info.lastInsertRowid);
    if (io) {
      io.emit("new_notification", notif);
    }
    return notif;
  } catch (err) {
    console.error("Error creating database notification:", err);
  }
}
