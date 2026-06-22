// Email-шаблоны. Письма читаются почтовыми клиентами (Gmail и т.д.),
// которые вырезают <style> и внешний CSS — поэтому ВСЕ стили строго инлайновые,
// вёрстка на таблицах. Палитра повторяет тему приложения (тёмный фон + мятный акцент).


const CARD = "#0c0d0f";
const ELEVATED = "#131517";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#f4f4f5";
const MUTED = "#a1a1aa";
const FAINT = "#52525b";
const ACCENT = "#1cdda4";

/**
 * HTML-письмо с кодом подтверждения (OTP).
 * @param code  6-значный код
 * @param minutes  срок действия в минутах (по умолчанию 5)
 */
export function otpCodeEmail(code: string, minutes = 5): string {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<title>Код подтверждения</title>
</head>
<body style="margin:0;padding:0;background;">
  <!-- прехедер (скрытый превью-текст) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color;font-size:1px;line-height:1px;">
    Ваш код входа: ${code}. Действует ${minutes} минут.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="460" cellpadding="0" cellspacing="0" border="0" style="width:460px;max-width:100%;background:${CARD};border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:40px 40px 32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

              <!-- бренд -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                      <td style="width:28px;height:28px;background:#ffffff;border-radius:7px;text-align:center;vertical-align:middle;">
                        <div style="width:12px;height:12px;background:#000000;border-radius:50%;margin:0 auto;"></div>
                      </td>
                      <td style="padding-left:10px;font-size:15px;font-weight:600;color:${TEXT};letter-spacing:-0.01em;">interview.ai</td>
                    </tr></table>
                  </td>
                </tr>
              </table>

              <!-- заголовок -->
              <div style="margin-top:30px;font-size:20px;font-weight:700;color:${TEXT};letter-spacing:-0.02em;">
                Код подтверждения
              </div>
              <div style="margin-top:10px;font-size:14px;line-height:1.6;color:${MUTED};">
                Введите этот код, чтобы завершить вход. Код действует ${minutes} минут.
              </div>

              <!-- код -->
              <div style="margin:28px 0;background:${ELEVATED};border:1px solid ${BORDER};border-radius:12px;padding:22px 16px;text-align:center;">
                <div style="font-family:'SF Mono',ui-monospace,Menlo,Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:${ACCENT};text-indent:10px;">
                  ${code}
                </div>
              </div>

              <div style="font-size:13px;line-height:1.6;color:${FAINT};">
                Если вы не запрашивали вход — просто проигнорируйте это письмо, код никто не сможет использовать.
              </div>

              <!-- разделитель -->
              <div style="height:1px;background:${BORDER};margin:30px 0 0 0;"></div>

              <div style="margin-top:20px;font-size:12px;line-height:1.6;color:${FAINT};">
                Это автоматическое письмо от interview.ai. Отвечать на него не нужно.
              </div>

            </td>
          </tr>
        </table>

        <div style="margin-top:20px;font-size:11px;color:${FAINT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          © interview.ai
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
