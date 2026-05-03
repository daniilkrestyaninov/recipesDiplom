const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const emailService = {
  sendVerificationEmail: async (to, code) => {
    const mailOptions = {
      from: `"УМАМИ" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Подтверждение регистрации',
      text: `Ваш код подтверждения: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Добро пожаловать в УМАМИ!</h2>
          <p>Спасибо за регистрацию. Для завершения процесса подтвердите свой email.</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
        </div>
      `,
    };

    return transporter.sendMail(mailOptions);
  },

  sendPasswordResetEmail: async (to, code) => {
    const mailOptions = {
      from: `"УМАМИ" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Восстановление пароля',
      text: `Ваш код для сброса пароля: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Восстановление пароля</h2>
          <p>Вы запросили сброс пароля. Используйте код ниже для установки нового пароля.</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>Код действителен в течение 15 минут.</p>
          <p>Если вы не запрашивали сброс пароля, измените пароль в личном кабинете или обратитесь в поддержку.</p>
        </div>
      `,
    };

    return transporter.sendMail(mailOptions);
  }
};

module.exports = emailService;
