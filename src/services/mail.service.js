import transporter from "../config/mail.js";

const sendOtp = async (to, otp) => {
  const from = process.env.SMTP_USER;
  await transporter.sendMail({
    from,
    to,
    subject: "OTP reset mật khẩu",
    text: `Mã OTP của bạn là: ${otp}`,
  });
};

export { sendOtp };
