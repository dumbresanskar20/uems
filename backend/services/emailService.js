const nodemailer = require('nodemailer');

// Send email via Brevo API (Recommended for Render)
const sendViaAPI = async (to, subject, html, fromName) => {
  const apiKey = process.env.PLATFORM_SMTP_PASS;
  const fromEmail = process.env.PLATFORM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error('Brevo API key or Platform Email missing in environment variables.');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName || 'UEMS Platform', email: fromEmail },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to send email via Brevo API');
  }
  return result;
};

// Create transporter for custom organization SMTP (Optional fallback)
const createTransporter = (smtpConfig) => {
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: parseInt(smtpConfig.port) || 587,
    secure: parseInt(smtpConfig.port) === 465,
    auth: { user: smtpConfig.user, pass: smtpConfig.pass },
    tls: { rejectUnauthorized: false },
  });
};

// Resolve sender and send email
const sendEmail = async ({ to, subject, html, organization, branch, fromName }) => {
  try {
    // If we have custom SMTP for branch/org, use it. Otherwise, use Platform API.
    if (branch?.smtpEmail && branch?.smtpPassword) {
      const transporter = createTransporter({
        host: branch.smtpHost,
        port: branch.smtpPort,
        user: branch.smtpEmail,
        pass: branch.smtpPassword
      });
      await transporter.sendMail({ from: branch.smtpEmail, to, subject, html });
    } else if (organization?.smtpEmail && organization?.smtpPassword) {
      const transporter = createTransporter({
        host: organization.smtpHost,
        port: organization.smtpPort,
        user: organization.smtpEmail,
        pass: organization.smtpPassword
      });
      await transporter.sendMail({ from: organization.smtpEmail, to, subject, html });
    } else {
      // DEFAULT: Use Brevo API for platform emails
      await sendViaAPI(to, subject, html, fromName);
    }
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
};

// HTML email base template
const baseTemplate = (content, orgName, orgLogo) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f0f4f8; color: #1a202c; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 32px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center; }
    .header img { height: 48px; margin-bottom: 8px; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; }
    .body { padding: 40px 36px; }
    .otp-box { background: linear-gradient(135deg, #667eea11, #764ba211); border: 2px solid #667eea; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #667eea; font-family: monospace; }
    .btn { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { background: #f7fafc; padding: 24px; text-align: center; color: #718096; font-size: 13px; border-top: 1px solid #e2e8f0; }
    p { line-height: 1.7; color: #4a5568; margin-bottom: 16px; }
    .highlight { color: #667eea; font-weight: 600; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
    .info-card { background: #f7fafc; border-radius: 8px; padding: 16px; }
    .info-card label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a0aec0; }
    .info-card span { display: block; font-weight: 600; color: #2d3748; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${orgLogo ? `<img src="${orgLogo}" alt="${orgName}" />` : ''}
      <h1>${orgName || 'UEMS'}</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent by ${orgName || 'Universal Enquiry Management System'}</p>
      <p>© ${new Date().getFullYear()} All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// Send OTP email
const sendOTPEmail = async (email, otp, orgName, orgLogo) => {
  const content = `
    <h2 style="color:#2d3748;margin-bottom:8px;">Email Verification</h2>
    <p>Hello! Please use the verification code below to complete your registration for <span class="highlight">${orgName || 'UEMS'}</span>.</p>
    <div class="otp-box">
      <p style="color:#667eea;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Your Verification Code</p>
      <div class="otp-code">${otp}</div>
      <p style="color:#a0aec0;font-size:13px;margin-top:12px;margin-bottom:0;">Valid for 10 minutes only</p>
    </div>
    <p>Do not share this code with anyone. If you did not request this, please ignore this email.</p>
  `;
  
  await sendEmail({
    to: email,
    subject: `${otp} - Email Verification Code | ${orgName || 'UEMS'}`,
    html: baseTemplate(content, orgName, orgLogo),
    fromName: orgName
  });
};

// Send enquiry confirmation email
const sendEnquiryConfirmation = async (enquiry, organization, branch) => {
  const content = `
    <h2 style="color:#2d3748;margin-bottom:8px;">Enquiry Received! 🎉</h2>
    <p>Dear <span class="highlight">${enquiry.name}</span>,</p>
    <p>Thank you for reaching out to <strong>${organization.name}</strong>. We have received your enquiry and our team will contact you shortly.</p>
    <div class="info-grid">
      <div class="info-card"><label>Enquiry #</label><span>${enquiry.enquiryNumber}</span></div>
      <div class="info-card"><label>Status</label><span>New</span></div>
      <div class="info-card"><label>Name</label><span>${enquiry.name}</span></div>
      <div class="info-card"><label>Date</label><span>${new Date(enquiry.createdAt).toLocaleDateString()}</span></div>
    </div>
    <div class="divider"></div>
    <p style="color:#a0aec0;font-size:13px;">We typically respond within 24 business hours. Feel free to reply to this email if you have any questions.</p>
  `;
  
  await sendEmail({
    to: enquiry.email,
    subject: `Enquiry Received - ${enquiry.enquiryNumber} | ${organization.name}`,
    html: baseTemplate(content, organization.name, organization.logo),
    organization,
    branch
  });
};

// Send enquiry completed email
const sendEnquiryCompleted = async (enquiry, organization, branch) => {
  if (!enquiry.email) return;
  const content = `
    <h2 style="color:#2d3748;margin-bottom:8px;">Enquiry Completed ✅</h2>
    <p>Dear <span class="highlight">${enquiry.name}</span>,</p>
    <p>We're happy to inform you that your enquiry <strong>${enquiry.enquiryNumber}</strong> has been successfully processed.</p>
    <p>Thank you for choosing <strong>${organization.name}</strong>. We hope we were able to assist you effectively.</p>
  `;
  
  await sendEmail({
    to: enquiry.email,
    subject: `Enquiry Completed - ${enquiry.enquiryNumber} | ${organization.name}`,
    html: baseTemplate(content, organization.name, organization.logo),
    organization,
    branch
  });
};

// Send trial expiry reminder
const sendTrialExpiryReminder = async (organization, daysLeft) => {
  const content = `
    <h2 style="color:#e53e3e;margin-bottom:8px;">⚠️ Trial Expiring Soon</h2>
    <p>Hello <span class="highlight">${organization.name}</span>,</p>
    <p>Your free trial will expire in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>. Upgrade now to continue using UEMS without interruption.</p>
    <p style="text-align:center;"><a href="${process.env.FRONTEND_URL}/subscription" class="btn">Upgrade Now</a></p>
    <div class="divider"></div>
    <p style="color:#a0aec0;font-size:13px;">If you have already upgraded, please disregard this email.</p>
  `;
  
  await sendEmail({
    to: organization.email,
    subject: `⚠️ Your UEMS trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    html: baseTemplate(content, organization.name, organization.logo)
  });
};

// Send payment confirmation with receipt
const sendPaymentConfirmation = async (organization, plan, transaction) => {
  const receiptId = `UEMS-${Date.now().toString().slice(-8)}`;
  const paymentDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const validUntil = organization.subscriptionExpiry
    ? new Date(organization.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';

  const content = `
    <h2 style="color:#38a169;margin-bottom:4px;">Payment Successful! 🎉</h2>
    <p style="color:#a0aec0;font-size:13px;margin-bottom:20px;">Your subscription has been activated.</p>
    <p>Hello <span class="highlight">${organization.name}</span>,</p>
    <p>Thank you for your payment. Your <strong>${plan.name}</strong> plan is now active. Below is your payment receipt for reference.</p>
    <div class="divider"></div>
    <p style="font-size:12px;color:#a0aec0;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Payment Receipt</p>
    <div class="info-grid">
      <div class="info-card"><label>Receipt No.</label><span>${receiptId}</span></div>
      <div class="info-card"><label>Payment Date</label><span>${paymentDate}</span></div>
      <div class="info-card"><label>Plan</label><span>${plan.name}</span></div>
      <div class="info-card"><label>Duration</label><span>${plan.durationDays} Days</span></div>
      <div class="info-card"><label>Amount Paid</label><span>₹${transaction.amount.toLocaleString('en-IN')}</span></div>
      <div class="info-card"><label>Valid Until</label><span>${validUntil}</span></div>
    </div>
    <div class="info-card" style="margin-top:12px;">
      <label>Transaction ID (Razorpay)</label>
      <span style="font-family:monospace;font-size:12px;">${transaction.providerPaymentId || transaction._id}</span>
    </div>
    <div class="divider"></div>
    <p style="color:#a0aec0;font-size:13px;">Please keep this email as a record of your payment. If you have any questions, contact our support team.</p>
  `;

  await sendEmail({
    to: organization.email,
    subject: `✅ Payment Receipt - ${plan.name} Plan Activated | UEMS`,
    html: baseTemplate(content, organization.name, organization.logo)
  });
};

module.exports = {
  sendOTPEmail,
  sendEnquiryConfirmation,
  sendEnquiryCompleted,
  sendTrialExpiryReminder,
  sendPaymentConfirmation,
  baseTemplate,
};
