"""
Email service for OTP verification emails.
Logs to console when SMTP is not configured.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER or "noreply@livercare.internal")
APP_NAME = "LiverCare AI"


def build_otp_html(recipient_name: str, otp_code: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head><meta charset="UTF-8" />
    <style>
      body {{ font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #0d1520; color: #e2e8f0; margin: 0; padding: 20px; }}
      .container {{ max-width: 540px; margin: 0 auto; background: #131f2e; border: 1px solid rgba(13, 148, 136, 0.25); border-radius: 16px; overflow: hidden; }}
      .header {{ background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 28px 24px; text-align: center; color: white; }}
      .content {{ padding: 32px 28px; text-align: center; }}
      .otp-box {{ display: inline-block; background: #0a111a; border: 2px dashed #14b8a6; border-radius: 12px; padding: 16px 36px; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2dd4bf; margin: 24px 0; }}
      .footer {{ padding: 18px 24px; background: #0a1017; font-size: 12px; color: #64748b; text-align: center; }}
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h2>{APP_NAME}</h2><p>Account Verification</p></div>
        <div class="content">
          <p>Hello <strong>{recipient_name}</strong>,</p>
          <p>Your verification code:</p>
          <div class="otp-box">{otp_code}</div>
          <p style="font-size:13px;color:#94a3b8;">Valid for 10 minutes.</p>
        </div>
        <div class="footer">If you did not create this account, ignore this email.</div>
      </div>
    </body></html>"""


def send_otp_email(to_email: str, recipient_name: str, otp_code: str) -> bool:
    print(f"\n{'='*60}")
    print(f"EMAIL NOTIFICATION To: {to_email} ({recipient_name})")
    print(f"VERIFICATION OTP CODE: {otp_code}")
    print(f"Valid for: 10 minutes | Resend cooldown: 20s")
    print(f"{'='*60}\n")

    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Verification code: {otp_code}"
        msg["From"] = f"{APP_NAME} <{FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(build_otp_html(recipient_name, otp_code), "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"SMTP Warning: {e}. Fallback to console OK.")
        return False
