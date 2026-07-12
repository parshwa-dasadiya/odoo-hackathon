const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NODE_ENV } = require('../config/env');

let transporter;

// Create SMTP transporter if config is present, otherwise use dev logging transporter
const hasSmtpConfig = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS;

if (hasSmtpConfig) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

const sendEmail = async ({ to, subject, html }) => {
  if (hasSmtpConfig) {
    const mailOptions = {
      from: `"AssetFlow ERP" <no-reply@assetflow-erp.com>`,
      to,
      subject,
      html
    };
    return await transporter.sendMail(mailOptions);
  } else {
    // Dev Mode logging fallback
    console.log('\n=================== DEV MODE EMAIL LOG ===================');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('----------------------------------------------------------');
    console.log('HTML Body Preview:');
    console.log(html);
    console.log('==========================================================\n');
    return { messageId: 'dev-mode-log-success' };
  }
};

module.exports = sendEmail;
