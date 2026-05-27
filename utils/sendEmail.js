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
  }
});

exports.sendVerificationEmail = async (email, token) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL?.trim() || "http://localhost:3000";
    const verificationLink = `${frontendUrl}/Home/pages/verify-email/${token}`;

    const mailOptions = {
      from: `"Hospital Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - Hospital Portal",
      html: `
        <div style="font-family: Arial, sans-serif; color: #0a3f3e;">
          <h2>Welcome to Hospital Portal</h2>
          <p>Thank you for registering. Please verify your email by clicking the link below:</p>
          
          <a href="${verificationLink}" 
             style="display:inline-block;padding:10px 20px;background-color:#007bff;color:white;
                    text-decoration:none;border-radius:5px;margin-top:10px;"
             target="_blank">
             Verify Email
          </a>

          <p>If you didn’t create an account, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(` Verification email sent to ${email}: ${info.response}`);
    return true;

  } catch (error) {
    console.error(" Error sending verification email:", error.message);
    throw new Error("Failed to send verification email: " + error.message);
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


exports.sendAppointmentEmail = async ({ to, token, date, time }) => {
  try {
    await transporter.sendMail({
      from: `"Hospital App" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Appointment Confirmed ✅",
      html: `
        <h2>Appointment Booked Successfully 🎉</h2>
        
        <p><strong>Appointment Token:</strong> ${token}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>

        <br/>

        <p>Please keep your token safe for future reference.</p>
      `
    });

    console.log("Appointment email sent to:", to);

  } catch (error) {
    console.error("Email failed:", error);
  }
};