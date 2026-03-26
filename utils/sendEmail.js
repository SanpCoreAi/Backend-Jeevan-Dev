const dotenv = require("dotenv");
dotenv.config();

const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendVerificationEmail = async (email, token) => {
  try {
    const verificationLink = `${process.env.FRONTEND_URL}/Home/pages/verify-email/${token}`;

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
    throw new Error("Failed to send verification email");
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
      from: `"Hospital App" <${process.env.EMAIL_USER}>`, // FIXED
      to,
      subject: "Appointment Confirmed",
      html: `...same html...`
    });

    console.log("Appointment email sent to:", to);

  } catch (error) {
   console.error("Email failed:", error);
  }
};