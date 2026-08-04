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
    console.error("SMTP connection error:", err.message || err);
  } else {
    console.log("✅ SMTP connection verified successfully");
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


  } catch(error){

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

    const mailOptions = {

      from: `"Hospital Portal" <${process.env.EMAIL_USER}>`,

      to: email,

      subject: "doctor Account Created - Login Details",

      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0a3f3e; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px;">

          <h2 style="color: #0a3f3e; margin-bottom: 20px;">Welcome ${name}! 👋</h2>

          <p style="margin-bottom: 15px;">Your doctor account has been created successfully.</p>

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
      `✅ doctor credentials sent to ${email}: ${info.response}`
    );

    return true;


  } catch(error){

    console.error(
      "❌ Assistant mail error:",
      error.message
    );

    throw error;
  }

};

exports.sendResetPasswordEmail=
async(email,token)=>{


const link=
`${process.env.FRONTEND_URL}/reset-password/${token}`;


await transporter.sendMail({

from:process.env.EMAIL_USER,

to:email,

subject:"Reset Your Password - Hospital Portal",

html:
`
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #0a3f3e;">Password Reset Request</h2>
  <p>We received a request to reset your password. Click the button below to proceed:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${link}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
  </div>
  <p style="font-size: 13px; color: #666;">Or copy this link: <a href="${link}" style="color: #0056b3;">${link}</a></p>
  <p style="font-size: 13px; color: #999;">This link expires in 15 minutes for security reasons.</p>
  <p style="font-size: 13px; color: #999; margin-top: 30px;">If you did not request this reset, please ignore this email.</p>
</div>
`

});


};


exports.resetPasswordValidation=(data)=>{


const schema=Joi.object({

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


const {error}=
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
      from: `"Hospital App" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Appointment Confirmed ✅",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0a3f3e;">Appointment Booked Successfully 🎉</h2>
          
          <div style="background: #f0f8ff; border-left: 4px solid #007bff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Appointment Token:</strong> <code style="background: white; padding: 5px 10px; border-radius: 3px; font-family: monospace; color: #0056b3;">${token}</code></p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${time}</p>
          </div>

          <p style="margin-top: 20px; color: #666;">Please keep your appointment token safe. You'll need it when checking in.</p>
          
          <p style="font-size: 13px; color: #999; margin-top: 30px;">Hospital Portal Team</p>
        </div>
      `
    });

    console.log(`✅ Appointment email sent to: ${to}`);

  } catch (error) {
    console.error(`❌ Appointment email failed for ${to}:`, error.message);
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

      from: `"SampCore AI Hospital" <${process.env.EMAIL_USER}>`,

      to: email,

      subject: "❌ Appointment Cancelled",

      html: `
      <!DOCTYPE html>
      <html>

      <head>
        <meta charset="UTF-8">
      </head>

      <body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">

          <tr>

            <td align="center">

              <table width="650" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:12px;overflow:hidden;
                box-shadow:0 5px 20px rgba(0,0,0,.08);">

                <!-- Header -->

                <tr>

                  <td
                    style="background:linear-gradient(90deg,#dc3545,#ff6b6b);
                    color:#fff;padding:30px;text-align:center;">

                    <h1 style="margin:0;font-size:28px;">
                      Appointment Cancelled
                    </h1>

                    <p style="margin-top:10px;font-size:15px;">
                      SampCore AI Hospital
                    </p>

                  </td>

                </tr>

                <!-- Body -->

                <tr>

                  <td style="padding:35px;">

                    <p style="font-size:18px;">
                      Hello <strong>${patientName}</strong>,
                    </p>

                    <p style="color:#555;font-size:15px;line-height:26px;">

                      We regret to inform you that your scheduled appointment
                      has been <strong style="color:#dc3545;">cancelled</strong>
                      by the doctor.

                    </p>

                    <table
                      width="100%"
                      cellpadding="12"
                      cellspacing="0"
                      style="
                        margin-top:25px;
                        border:1px solid #eeeeee;
                        border-collapse:collapse;
                      ">

                      <tr style="background:#f8f9fa;">

                        <td width="35%"><strong>📅 Date</strong></td>

                        <td>${formattedDate}</td>

                      </tr>

                      <tr>

                        <td><strong>🕒 Time</strong></td>

                        <td>${startTime} - ${endTime}</td>

                      </tr>

                      <tr style="background:#f8f9fa;">

                        <td><strong>📝 Reason</strong></td>

                        <td>${reason}</td>

                      </tr>

                    </table>

                    <div
                      style="
                        margin-top:30px;
                        background:#fff4e5;
                        border-left:5px solid #ff9800;
                        padding:18px;
                        border-radius:6px;
                        color:#555;
                      ">

                      <strong>Important:</strong><br><br>

                      Please book a new appointment at your convenience.
                      We apologize for any inconvenience caused.

                    </div>

                    <div style="text-align:center;margin:35px 0;">

                      <a
                        href="https://sampcoreai.com"
                        style="
                          background:#0d6efd;
                          color:#fff;
                          text-decoration:none;
                          padding:14px 28px;
                          border-radius:8px;
                          display:inline-block;
                          font-size:15px;
                          font-weight:bold;
                        ">

                        Book New Appointment

                      </a>

                    </div>

                    <hr style="border:none;border-top:1px solid #eee;">

                    <p style="font-size:14px;color:#666;">

                      Regards,<br><br>

                      <strong>SampCore AI Hospital Team</strong>

                    </p>

                  </td>

                </tr>

                <!-- Footer -->

                <tr>

                  <td
                    style="
                      background:#f8f9fa;
                      text-align:center;
                      padding:20px;
                      color:#888;
                      font-size:12px;
                    ">

                    © ${new Date().getFullYear()} SampCore AI Hospital.<br>

                    This is an automated email. Please do not reply.

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

    console.log(`Appointment cancellation email sent to ${email}`);

  } catch (error) {

    console.error(
      "Appointment Cancel Mail Error:",
      error
    );

  }

};