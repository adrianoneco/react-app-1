import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  userName: string
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@nexusplatform.com",
    to: email,
    subject: "Recuperação de Senha - Nexus Platform",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden;">
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Nexus Platform</h1>
                    <p style="color: #8b8ba7; margin: 8px 0 0; font-size: 14px;">O futuro da gestão integrada</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px;">
                    <h2 style="color: #ffffff; margin: 0 0 16px; font-size: 22px;">Olá, ${userName}!</h2>
                    <p style="color: #c9c9d9; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
                      Recebemos uma solicitação para redefinir a senha da sua conta. Se você não fez essa solicitação, pode ignorar este email.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Redefinir Senha
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #8b8ba7; margin: 24px 0 0; font-size: 14px; line-height: 1.6;">
                      Este link expira em <strong style="color: #c9c9d9;">1 hora</strong>. Se você não conseguir clicar no botão, copie e cole o link abaixo no seu navegador:
                    </p>
                    <p style="color: #667eea; margin: 12px 0 0; font-size: 13px; word-break: break-all;">
                      ${resetUrl}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <p style="color: #6b6b80; margin: 0; font-size: 12px; text-align: center;">
                      &copy; ${new Date().getFullYear()} Nexus Platform. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Olá, ${userName}!

Recebemos uma solicitação para redefinir a senha da sua conta. Se você não fez essa solicitação, pode ignorar este email.

Para redefinir sua senha, acesse o link abaixo:
${resetUrl}

Este link expira em 1 hora.

Atenciosamente,
Equipe Nexus Platform
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}

export async function sendPasswordResetWhatsApp(
  phone: string,
  token: string,
  userName: string
): Promise<boolean> {
  const endpoint = process.env.ACCOUNT_RECOVERY_WA_ENDPOINT;
  
  if (!endpoint) {
    console.warn("WhatsApp endpoint not configured (ACCOUNT_RECOVERY_WA_ENDPOINT)");
    return false;
  }

  const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const message = `Olá, ${userName}!\n\nRecebemos uma solicitação para redefinir a senha da sua conta.\n\nPara redefinir sua senha, acesse o link abaixo:\n${resetUrl}\n\nEste link expira em 1 hora.\n\nSe você não fez essa solicitação, pode ignorar esta mensagem.`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        message,
        userName,
        resetUrl,
        token,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("WhatsApp API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send password reset via WhatsApp:", error);
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USERNAME &&
    process.env.SMTP_PASSWORD
  );
}

export function isWhatsAppConfigured(): boolean {
  return !!process.env.ACCOUNT_RECOVERY_WA_ENDPOINT;
}
