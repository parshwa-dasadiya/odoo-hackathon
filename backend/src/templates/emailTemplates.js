const welcomeEmail = (name, verifyLink) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to AssetFlow</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; background-color: #ffffff; padding: 30px; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #1e3a8a; }
          .content { padding: 20px 0; line-height: 1.6; }
          .button-container { text-align: center; margin: 30px 0; }
          .btn { background-color: #2563eb; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
          .footer { text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AssetFlow</div>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Welcome to <strong>AssetFlow ERP</strong> — the Enterprise Asset & Resource Management System. We are excited to have you on board!</p>
            <p>To verify your email address and activate your account fully, please click the button below:</p>
            <div class="button-container">
              <a href="${verifyLink}" class="btn" target="_blank">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${verifyLink}">${verifyLink}</a></p>
            <p>Best regards,<br>The AssetFlow Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const otpEmail = (name, otp) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>AssetFlow Password Reset OTP</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; background-color: #ffffff; padding: 30px; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #1e3a8a; }
          .content { padding: 20px 0; line-height: 1.6; }
          .otp-container { text-align: center; margin: 30px 0; }
          .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a; background-color: #f0f4f8; padding: 15px 30px; border-radius: 8px; display: inline-block; border: 1px dashed #2563eb; }
          .footer { text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AssetFlow</div>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>We received a request to reset the password for your AssetFlow ERP account.</p>
            <p>Use the following 6-digit One-Time Password (OTP) to reset your password. This OTP is valid for <strong>10 minutes</strong>.</p>
            <div class="otp-container">
              <div class="otp-code">${otp}</div>
            </div>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Best regards,<br>The AssetFlow Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const baseEmailWrapper = (title, content) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; background-color: #ffffff; padding: 30px; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #1e3a8a; }
        .content { padding: 20px 0; line-height: 1.6; }
        .footer { text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AssetFlow</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply directly.</p>
        </div>
      </div>
    </body>
  </html>
`;

const maintenanceApprovalEmail = (name, assetTag, status) => {
  return baseEmailWrapper('Maintenance Update', `
    <p>Hello ${name},</p>
    <p>The maintenance request for Asset <strong>${assetTag}</strong> has been <strong>${status}</strong>.</p>
  `);
};

const transferApprovalEmail = (name, assetTag, status) => {
  return baseEmailWrapper('Transfer Update', `
    <p>Hello ${name},</p>
    <p>The transfer request for Asset <strong>${assetTag}</strong> has been <strong>${status}</strong>.</p>
  `);
};

const bookingConfirmationEmail = (name, assetName, startTime, endTime) => {
  return baseEmailWrapper('Booking Confirmed', `
    <p>Hello ${name},</p>
    <p>Your booking for <strong>${assetName}</strong> is confirmed.</p>
    <p><strong>Start:</strong> ${new Date(startTime).toLocaleString()}</p>
    <p><strong>End:</strong> ${new Date(endTime).toLocaleString()}</p>
  `);
};

const bookingReminderEmail = (name, assetName, startTime) => {
  return baseEmailWrapper('Booking Reminder', `
    <p>Hello ${name},</p>
    <p>This is a reminder that your booking for <strong>${assetName}</strong> starts at <strong>${new Date(startTime).toLocaleString()}</strong>.</p>
  `);
};

const auditAssignmentEmail = (name, cycleName) => {
  return baseEmailWrapper('Audit Assignment', `
    <p>Hello ${name},</p>
    <p>You have been assigned as an auditor for the audit cycle: <strong>${cycleName}</strong>.</p>
    <p>Please log in to the portal to review your checklist.</p>
  `);
};

const returnReminderEmail = (name, assetTag, expectedReturnDate) => {
  return baseEmailWrapper('Overdue Return Reminder', `
    <p>Hello ${name},</p>
    <p>This is a reminder that the asset <strong>${assetTag}</strong> was due for return on <strong>${new Date(expectedReturnDate).toLocaleString()}</strong>.</p>
    <p>Please return it as soon as possible.</p>
  `);
};

const notificationEmail = (name, message) => {
  return baseEmailWrapper('New Notification', `
    <p>Hello ${name},</p>
    <p>${message}</p>
  `);
};

module.exports = {
  welcomeEmail,
  otpEmail,
  maintenanceApprovalEmail,
  transferApprovalEmail,
  bookingConfirmationEmail,
  bookingReminderEmail,
  auditAssignmentEmail,
  returnReminderEmail,
  notificationEmail
};
