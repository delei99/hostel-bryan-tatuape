import { ENV } from "./env";

export type GuestNotificationPayload = {
  guestEmail: string;
  guestPhone?: string;
  guestName: string;
  bookingCode: string;
  checkInDate: string;
  checkOutDate: string;
  roomName: string;
  totalPrice: number;
  message: string;
};

/**
 * Envia notificação por email para o hóspede
 */
export async function sendGuestEmail(
  payload: GuestNotificationPayload
): Promise<boolean> {
  try {
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      console.warn("[GuestNotification] Email service not configured");
      return false;
    }

    const emailContent = `
Olá ${payload.guestName},

${payload.message}

**Detalhes da Reserva:**
- Código: ${payload.bookingCode}
- Quarto: ${payload.roomName}
- Check-in: ${payload.checkInDate}
- Check-out: ${payload.checkOutDate}
- Total: R$ ${(payload.totalPrice / 100).toFixed(2)}

Obrigado por escolher o Hostel Bryan Tatuapé!

Atenciosamente,
Equipe Hostel Bryan Tatuapé
    `.trim();

    const response = await fetch(
      `${ENV.forgeApiUrl}/webdevtoken.v1.WebDevService/SendEmail`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${ENV.forgeApiKey}`,
          "content-type": "application/json",
          "connect-protocol-version": "1",
        },
        body: JSON.stringify({
          to: payload.guestEmail,
          subject: `Confirmação de Reserva - ${payload.bookingCode}`,
          body: emailContent,
        }),
      }
    );

    if (!response.ok) {
      console.warn(
        `[GuestNotification] Failed to send email (${response.status})`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("[GuestNotification] Error sending email:", error);
    return false;
  }
}

/**
 * Envia notificação por WhatsApp para o hóspede
 */
export async function sendGuestWhatsApp(
  payload: GuestNotificationPayload
): Promise<boolean> {
  try {
    if (!payload.guestPhone) {
      console.warn("[GuestNotification] Guest phone not provided");
      return false;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      console.warn("[GuestNotification] WhatsApp service not configured");
      return false;
    }

    // Formatar número de telefone para WhatsApp (remover caracteres especiais)
    let phoneNumber = payload.guestPhone.replace(/\D/g, "");

    // Se o número não começar com 55 (código do Brasil), adicionar
    if (!phoneNumber.startsWith("55")) {
      phoneNumber = "55" + phoneNumber;
    }

    if (phoneNumber.length < 13) {
      console.warn("[GuestNotification] Invalid phone number format: " + phoneNumber);
      return false;
    }

    const whatsappMessage = `
*${payload.message}*

*Detalhes da Reserva:*
📋 Código: ${payload.bookingCode}
🛏️ Quarto: ${payload.roomName}
📅 Check-in: ${payload.checkInDate}
📅 Check-out: ${payload.checkOutDate}
💰 Total: R$ ${(payload.totalPrice / 100).toFixed(2)}

Obrigado por escolher o Hostel Bryan Tatuapé! 🙏
    `.trim();

    const response = await fetch(
      `${ENV.forgeApiUrl}/webdevtoken.v1.WebDevService/SendWhatsApp`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${ENV.forgeApiKey}`,
          "content-type": "application/json",
          "connect-protocol-version": "1",
        },
        body: JSON.stringify({
          phoneNumber: `+${phoneNumber}`,
          message: whatsappMessage,
        }),
      }
    );

    if (!response.ok) {
      console.warn(
        `[GuestNotification] Failed to send WhatsApp (${response.status})`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("[GuestNotification] Error sending WhatsApp:", error);
    return false;
  }
}

/**
 * Envia notificações por email e WhatsApp para o hóspede
 */
export async function notifyGuest(
  payload: GuestNotificationPayload
): Promise<{ email: boolean; whatsapp: boolean }> {
  const [emailResult, whatsappResult] = await Promise.all([
    sendGuestEmail(payload),
    sendGuestWhatsApp(payload),
  ]);

  return {
    email: emailResult,
    whatsapp: whatsappResult,
  };
}
