const dotenv = require("dotenv");
dotenv.config();

const nodemailer = require("nodemailer");

const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
const smtpUser = process.env.EMAIL_USER?.trim();
const smtpPass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

if (!smtpUser || !smtpPass) {
  throw new Error("SMTP credentials are missing. Set EMAIL_USER and EMAIL_PASS in .env.");
}

const transporterOptions = smtpHost
  ? {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  }
  : {
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };

const transporter = nodemailer.createTransport(transporterOptions);

transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP connection error:", err.message || err);
    console.error("SMTP Config:", {
      host: smtpHost, 
      port: smtpPort,
      user: smtpUser ? smtpUser.substring(0, 5) + '***' : 'NOT SET',
      pass: smtpPass ? 'SET' : 'NOT SET'
    });
  } else {
    console.log("✅ SMTP connection verified successfully");
    console.log("Email Sender:", smtpUser);
  }
});

exports.sendVerificationEmail = async (email, token) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL?.trim() || "http://localhost:3000";
    const verificationLink = `${frontendUrl}/Home/pages/verify-email/${token}`;

    const mailOptions = {
      from: `"Hospital Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - Hospital Portal 🏥",
      replyTo: process.env.EMAIL_USER,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'Hospital Portal System',
      },
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email - Hospital Portal</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
              .wrapper { background: #f5f5f5; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #0a3f3e 0%, #16626d 100%); color: white; padding: 40px 20px; text-align: center; }
              .header h1 { font-size: 28px; margin-bottom: 8px; font-weight: 600; }
              .header p { font-size: 14px; opacity: 0.9; }
              .content { padding: 40px 30px; }
              .content h2 { color: #0a3f3e; font-size: 20px; margin-bottom: 20px; }
              .content p { margin-bottom: 15px; font-size: 15px; line-height: 1.7; color: #333; }
              .button-wrapper { text-align: center; margin: 30px 0; }
              .button { background: #007bff; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 600; font-size: 16px; transition: background 0.3s ease; }
              .button:hover { background: #0056b3; }
              .link-section { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 25px 0; }
              .link-section p { font-size: 13px; color: #666; margin-bottom: 10px; }
              .link-section a { color: #0056b3; text-decoration: none; word-break: break-all; font-size: 12px; }
              .link-section a:hover { text-decoration: underline; }
              .security-notice { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 3px; margin: 25px 0; }
              .security-notice p { font-size: 13px; color: #856404; margin: 8px 0; }
              .divider { border-top: 1px solid #ddd; margin: 25px 0; }
              .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #ddd; }
              .footer p { font-size: 12px; color: #999; margin: 8px 0; }
              .footer-links a { color: #0056b3; text-decoration: none; font-size: 12px; margin: 0 10px; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <h1>Welcome to Hospital Portal</h1>
                  <p>Email Verification Required</p>
                </div>

                <div class="content">
                  <h2>Verify Your Email Address</h2>
                  
                  <p>Thank you for registering with Hospital Portal. We're excited to have you on board!</p>
                  
                  <p>To complete your registration and activate your account, please verify your email address by clicking the button below:</p>

                  <div class="button-wrapper">
                    <a href="${verificationLink}" class="button">Verify Email Address</a>
                  </div>

                  <p style="text-align: center; font-size: 14px; color: #666;">or copy and paste this link in your browser:</p>

                  <div class="link-section">
                    <a href="${verificationLink}">${verificationLink}</a>
                  </div>

                  <div class="security-notice">
                    <p><strong>⚠️ Security Notice:</strong></p>
                    <p>If you did not create this account, please ignore this email or contact our support team immediately.</p>
                    <p>Your email address will not be activated unless you click the verification link.</p>
                  </div>

                  <p style="font-size: 13px; color: #999; margin-top: 25px;">
                    This verification link will expire in <strong>24 hours</strong> for security reasons.
                  </p>
                </div>

                <div class="footer">
                  <p><strong>Hospital Portal</strong></p>
                  <p>© 2024 All rights reserved</p>
                  <p style="margin-top: 15px; font-size: 11px;">This is an automated email, please do not reply directly</p>
                  <p style="margin-top: 10px;">
                    <a href="mailto:support@hospitalportal.com">Contact Support</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Welcome to Hospital Portal\n\nThank you for registering. Your account has been created successfully.\n\nTo activate your account, please verify your email by clicking this link:\n\n${verificationLink}\n\nIf you did not create this account, please ignore this email and contact our support team.\n\nThis link will expire in 24 hours.\n\nHospital Portal Team\nSupport: support@hospitalportal.com`,
    };


    const info = await transporter.sendMail(mailOptions);

    return info;

  } catch (error) {
    console.error(`\n [${new Date().toISOString()}] Error sending verification email to ${email}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Details:`, error);
    throw error;
  }
};

exports.sendOtpEmail = async (email, otp) => {
  try {

    const mailOptions = {
      from: `"Hospital Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Verify Your Email - Hospital Portal",

      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,

      html: `
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<title>Email Verification</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:12px;overflow:hidden;
box-shadow:0 4px 20px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
<td
style="background:linear-gradient(135deg,#0f766e,#0891b2);
padding:30px;text-align:center;color:#ffffff;">

<h1 style="margin:0;font-size:28px;">
🏥 Hospital Portal
</h1>

<p style="margin:8px 0 0;font-size:15px;">
Secure Email Verification
</p>

</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px;">

<h2 style="margin-top:0;color:#222;">
Hello,
</h2>

<p style="font-size:16px;color:#555;line-height:28px;">
Thank you for choosing
<b>Hospital Portal</b>.
Please use the following One-Time Password (OTP)
to verify your email address.
</p>

<div style="text-align:center;margin:35px 0;">

<div
style="
display:inline-block;
padding:18px 40px;
font-size:34px;
font-weight:bold;
letter-spacing:10px;
background:#f8fafc;
border:2px dashed #0f766e;
border-radius:10px;
color:#0f766e;
">
${otp}
</div>

</div>

<p
style="
text-align:center;
font-size:15px;
color:#ef4444;
font-weight:bold;
">
⏳ This OTP is valid for only 10 minutes.
</p>

<hr
style="
border:none;
border-top:1px solid #eeeeee;
margin:35px 0;
">

<h3 style="color:#222;">
🔒 Security Tips
</h3>

<ul
style="
padding-left:20px;
color:#555;
line-height:28px;
">
<li>Never share this OTP with anyone.</li>
<li>Hospital Portal will never ask for your OTP.</li>
<li>If you didn't request this verification, simply ignore this email.</li>
</ul>

</td>
</tr>

<!-- Footer -->
<tr>
<td
style="
background:#fafafa;
padding:25px;
text-align:center;
font-size:13px;
color:#777;
">

<p style="margin:0;">
This is an automated email. Please do not reply.
</p>

<p style="margin:8px 0 0;">
© ${new Date().getFullYear()} Hospital Portal.
All Rights Reserved.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ OTP email sent to ${email}: ${info.response}`);

    return true;

  } catch (error) {

    console.error(`❌ Error sending OTP email to ${email}:`, error.message);

    throw error;
  }
};

exports.sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Hospital System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log(` Email sent to: ${to}`);
  } catch (error) {
    console.error(" Error sending simple email:", error.message);
    throw new Error("Failed to send email");
  }
};

exports.sendAssistantCredentials = async (
  email,
  name,
  password
) => {

  try {

    const mailOptions = {

      from: `"Hospital Portal" <${process.env.EMAIL_USER}>`,

      to: email,

      subject: "Assistant Account Created - Login Details",

      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0a3f3e; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px;">

          <h2 style="color: #0a3f3e; margin-bottom: 20px;">Welcome ${name}! 👋</h2>

          <p style="margin-bottom: 15px;">Your assistant account has been created successfully.</p>

          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
            <p style="margin: 10px 0;"><strong>Login Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px; font-family: monospace;">${password}</code></p>
          </div>

          <p style="margin-bottom: 15px; color: #666;"><strong>Important:</strong> Please login and change your password immediately after first login for security reasons.</p>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
            Hospital Portal Team<br>
            This is an automated email, please do not reply
          </p>

        </div>
      `,
    };


    const info = await transporter.sendMail(mailOptions);

    console.log(
      `✅ Assistant credentials sent to ${email}: ${info.response}`
    );

    return true;


  } catch (error) {

    console.error(
      "❌ Assistant mail error:",
      error.message
    );

    throw error;
  }

};

exports.sendDoctorCredentials = async (
  email,
  name,
  password
) => {

  try {

    await transporter.sendMail({

      from: `"Hospital Portal" <${process.env.EMAIL_USER}>`,

      to: email,

      subject: "🎉 Welcome to Hospital Portal - Your Login Credentials",

      text: `Hello ${name},

Your doctor account has been created successfully.

Login Email: ${email}
Temporary Password: ${password}

Please login and change your password immediately.

Hospital Portal Team`,

      html: `
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<title>Doctor Account Created</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">

<tr>

<td align="center">

<table width="600" cellpadding="0" cellspacing="0"
style="
background:#ffffff;
border-radius:12px;
overflow:hidden;
box-shadow:0 4px 20px rgba(0,0,0,.08);
">

<!-- Header -->

<tr>

<td
style="
background:linear-gradient(135deg,#0f766e,#0891b2);
padding:30px;
text-align:center;
color:#ffffff;
">

<h1 style="margin:0;font-size:28px;">
🏥 Hospital Portal
</h1>

<p style="margin-top:8px;font-size:15px;">
Doctor Account Created Successfully
</p>

</td>

</tr>

<!-- Body -->

<tr>

<td style="padding:40px;">

<h2 style="margin-top:0;color:#222;">
Welcome Dr. ${name} 👋
</h2>

<p
style="
font-size:16px;
color:#555;
line-height:28px;
">

Your doctor account has been created successfully.
You can now log in using the credentials below.

</p>

<table
width="100%"
cellpadding="12"
cellspacing="0"
style="
margin-top:25px;
background:#f8fafc;
border:1px solid #e5e7eb;
border-radius:10px;
">

<tr>

<td width="35%">
<strong>📧 Login Email</strong>
</td>

<td>${email}</td>

</tr>

<tr>

<td>
<strong>🔑 Temporary Password</strong>
</td>

<td>

<div
style="
display:inline-block;
background:#0f766e;
color:#ffffff;
padding:10px 18px;
border-radius:8px;
font-size:18px;
font-family:monospace;
font-weight:bold;
letter-spacing:2px;
">
${password}
</div>

</td>

</tr>

</table>

<div
style="
margin-top:30px;
padding:18px;
background:#fff7ed;
border-left:5px solid #f59e0b;
border-radius:8px;
">

<strong style="color:#b45309;">
🔒 Security Instructions
</strong>

<ul
style="
margin-top:12px;
padding-left:20px;
line-height:28px;
color:#555;
">

<li>Login using the credentials provided above.</li>

<li>Change your password immediately after your first login.</li>

<li>Do not share your password with anyone.</li>

<li>Keep your account information secure.</li>

</ul>

</div>

<div style="text-align:center;margin-top:35px;">

<a
href="${process.env.FRONTEND_URL}/login"
style="
background:#0f766e;
color:#ffffff;
padding:14px 32px;
border-radius:8px;
text-decoration:none;
font-weight:bold;
display:inline-block;
">

Login to Hospital Portal

</a>

</div>

</td>

</tr>

<!-- Footer -->

<tr>

<td
style="
background:#fafafa;
padding:25px;
text-align:center;
font-size:13px;
color:#777;
">

<p style="margin:0;">
Thank you for choosing Hospital Portal.
</p>

<p style="margin-top:8px;">
© ${new Date().getFullYear()} Hospital Portal.
All Rights Reserved.
</p>

<p style="margin-top:8px;">
This is an automated email. Please do not reply.
</p>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
`
    });

    console.log(`✅ Doctor credentials sent to ${email}`);

    return true;

  } catch (error) {

    console.error("❌ Doctor credentials email error:", error.message);

    throw error;

  }

};

exports.sendResetPasswordEmail = async (email, token) => {

  try {

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await transporter.sendMail({

      from: `"Hospital Portal" <${process.env.EMAIL_USER}>`,

      to: email,

      subject: "🔒 Reset Your Password - Hospital Portal",

      text: `You requested to reset your password.

Reset Link:
${resetLink}

This link will expire shortly.

If you did not request a password reset, please ignore this email.`,

      html: `
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<title>Reset Password</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">

<tr>

<td align="center">

<table
width="600"
cellpadding="0"
cellspacing="0"
style="
background:#ffffff;
border-radius:12px;
overflow:hidden;
box-shadow:0 4px 20px rgba(0,0,0,.08);
">

<!-- Header -->

<tr>

<td
style="
background:linear-gradient(135deg,#0f766e,#0891b2);
padding:30px;
text-align:center;
color:#ffffff;
">

<h1 style="margin:0;font-size:28px;">
🏥 Hospital Portal
</h1>

<p style="margin-top:8px;font-size:15px;">
Password Reset Request
</p>

</td>

</tr>

<!-- Body -->

<tr>

<td style="padding:40px;">

<h2 style="margin-top:0;color:#222;">
Reset Your Password
</h2>

<p
style="
font-size:16px;
color:#555;
line-height:28px;
">

We received a request to reset your Hospital Portal account password.

Click the button below to create a new password.

</p>

<div style="text-align:center;margin:35px 0;">

<a
href="${resetLink}"
style="
background:#0f766e;
color:#ffffff;
padding:15px 35px;
border-radius:8px;
text-decoration:none;
font-weight:bold;
display:inline-block;
">

Reset Password

</a>

</div>

<p
style="
font-size:15px;
color:#555;
">

If the button doesn't work, copy and paste the following link into your browser:

</p>

<p
style="
background:#f8fafc;
padding:12px;
border-radius:6px;
word-break:break-all;
font-size:13px;
color:#0f766e;
">

${resetLink}

</p>

<div
style="
margin-top:30px;
padding:18px;
background:#fff7ed;
border-left:5px solid #f59e0b;
border-radius:8px;
">

<strong style="color:#b45309;">
🔒 Security Notice
</strong>

<ul
style="
margin-top:10px;
padding-left:20px;
line-height:28px;
color:#555;
">

<li>This password reset link is valid for a limited time.</li>

<li>If you didn't request this password reset, simply ignore this email.</li>

<li>Your password will remain unchanged until you create a new one.</li>

<li>Never share your account credentials with anyone.</li>

</ul>

</div>

</td>

</tr>

<!-- Footer -->

<tr>

<td
style="
background:#fafafa;
padding:25px;
text-align:center;
font-size:13px;
color:#777;
">

<p style="margin:0;">
Thank you for using Hospital Portal.
</p>

<p style="margin-top:8px;">
© ${new Date().getFullYear()} Hospital Portal.
All Rights Reserved.
</p>

<p style="margin-top:8px;">
This is an automated email. Please do not reply.
</p>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
`
    });

    console.log(`✅ Reset password email sent to ${email}`);

    return true;

  } catch (error) {

    console.error("❌ Reset password email error:", error.message);

    throw error;

  }

};


exports.resetPasswordValidation = (data) => {


  const schema = Joi.object({

    token:
      Joi.string()
        .required(),


    password:
      Joi.string()
        .min(8)
        .pattern(
          new RegExp(
            "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])"
          )
        )
        .required()

  });


  const { error } =
    schema.validate(data);


  return error
    ?
    error.details[0].message
    :
    null;

};

exports.sendAppointmentEmail = async ({ to, token, date, time }) => {
  try {

    await transporter.sendMail({

      from: `"Hospital Portal" <${process.env.EMAIL_USER}>`,

      to,

      subject: "✅ Appointment Confirmed - Hospital Portal",

      text: `Your appointment has been confirmed.
Token: ${token}
Date: ${date}
Time: ${time}`,

      html: `
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<title>Appointment Confirmation</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:12px;overflow:hidden;
box-shadow:0 4px 20px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
<td
style="background:linear-gradient(135deg,#0f766e,#0891b2);
padding:30px;
text-align:center;
color:#ffffff;">

<h1 style="margin:0;font-size:28px;">
🏥 Hospital Portal
</h1>

<p style="margin-top:8px;font-size:15px;">
Appointment Confirmation
</p>

</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px;">

<h2 style="margin-top:0;color:#222;">
🎉 Appointment Confirmed
</h2>

<p style="font-size:16px;color:#555;line-height:28px;">
Your appointment has been successfully booked.
Please keep the following details safe.
</p>

<table
width="100%"
cellpadding="12"
cellspacing="0"
style="
margin-top:25px;
background:#f8fafc;
border:1px solid #e5e7eb;
border-radius:10px;
">

<tr>
<td width="35%">
<strong>Appointment Token</strong>
</td>

<td>
<span
style="
background:#0f766e;
color:#ffffff;
padding:8px 18px;
border-radius:8px;
font-size:18px;
font-weight:bold;
letter-spacing:2px;
">
${token}
</span>
</td>

</tr>

<tr>

<td><strong>📅 Date</strong></td>

<td>${date}</td>

</tr>

<tr>

<td><strong>🕒 Time</strong></td>

<td>${time}</td>

</tr>

</table>

<div
style="
margin-top:30px;
padding:18px;
background:#ecfeff;
border-left:4px solid #0891b2;
border-radius:8px;
">

<strong>Important Instructions</strong>

<ul
style="
margin-top:10px;
padding-left:20px;
line-height:28px;
color:#555;
">

<li>Please arrive at least <b>15 minutes</b> before your appointment.</li>

<li>Carry your Appointment Token during check-in.</li>

<li>Bring any previous prescriptions or medical reports.</li>

<li>If you are unable to attend, kindly cancel or reschedule in advance.</li>

</ul>

</div>

</td>
</tr>

<!-- Footer -->

<tr>

<td
style="
background:#fafafa;
padding:25px;
text-align:center;
font-size:13px;
color:#777;
">

<p style="margin:0;">
Thank you for choosing Hospital Portal.
We wish you good health.
</p>

<p style="margin-top:10px;">
© ${new Date().getFullYear()} Hospital Portal. All Rights Reserved.
</p>

</td>

</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`
    });

    console.log(`✅ Appointment email sent to: ${to}`);

  } catch (error) {

    console.error(`❌ Appointment email failed for ${to}:`, error.message);

    throw error;

  }
};

exports.sendAppointmentCancelledEmail = async ({
  email,
  patientName,
  reason,
  date,
  startTime,
  endTime
}) => {

  try {

    const formattedDate = new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    await transporter.sendMail({

      from: `"Hospital Portal" <${process.env.EMAIL_USER}>`,

      to: email,

      subject: "❌ Appointment Cancelled - Hospital Portal",

      text: `Dear ${patientName},

Your appointment has been cancelled.

Date : ${formattedDate}
Time : ${startTime} - ${endTime}

Reason:
${reason}

Please book another appointment if required.

Hospital Portal Team`,

      html: `
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<title>Appointment Cancelled</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0"
style="
background:#ffffff;
border-radius:12px;
overflow:hidden;
box-shadow:0 4px 20px rgba(0,0,0,.08);
">

<!-- Header -->

<tr>

<td
style="
background:linear-gradient(135deg,#dc2626,#ef4444);
padding:30px;
text-align:center;
color:#ffffff;
">

<h1 style="margin:0;font-size:28px;">
🏥 Hospital Portal
</h1>

<p style="margin-top:8px;font-size:15px;">
Appointment Cancellation
</p>

</td>

</tr>

<!-- Body -->

<tr>

<td style="padding:40px;">

<h2 style="margin-top:0;color:#222;">
Hello ${patientName},
</h2>

<p
style="
font-size:16px;
color:#555;
line-height:28px;
">

We regret to inform you that your appointment has been
<strong style="color:#dc2626;">cancelled</strong>.

</p>

<table
width="100%"
cellpadding="12"
cellspacing="0"
style="
margin-top:25px;
background:#f8fafc;
border:1px solid #e5e7eb;
border-radius:10px;
">

<tr>

<td width="35%">
<strong>📅 Date</strong>
</td>

<td>${formattedDate}</td>

</tr>

<tr>

<td>
<strong>🕒 Time</strong>
</td>

<td>${startTime} - ${endTime}</td>

</tr>

<tr>

<td>
<strong>📝 Reason</strong>
</td>

<td>${reason}</td>

</tr>

</table>

<div
style="
margin-top:30px;
padding:18px;
background:#fef2f2;
border-left:5px solid #dc2626;
border-radius:8px;
">

<strong style="color:#dc2626;">
Important Notice
</strong>

<p
style="
margin-top:10px;
color:#555;
line-height:28px;
">

We sincerely apologize for the inconvenience.
Please book another appointment at your convenience.

</p>

</div>

<div style="text-align:center;margin-top:35px;">

<a
href="https://sampcoreai.com"
style="
background:#0f766e;
color:#ffffff;
padding:14px 30px;
border-radius:8px;
text-decoration:none;
font-weight:bold;
display:inline-block;
">

Book New Appointment

</a>

</div>

</td>

</tr>

<!-- Footer -->

<tr>

<td
style="
background:#fafafa;
padding:25px;
text-align:center;
font-size:13px;
color:#777;
">

<p style="margin:0;">
Thank you for choosing Hospital Portal.
</p>

<p style="margin-top:8px;">
© ${new Date().getFullYear()} Hospital Portal.
All Rights Reserved.
</p>

<p style="margin-top:8px;">
This is an automated email. Please do not reply.
</p>

</td>

</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`
    });

    console.log(`✅ Appointment cancellation email sent to ${email}`);

  } catch (error) {

    console.error("❌ Appointment Cancel Mail Error:", error);

    throw error;

  }

};