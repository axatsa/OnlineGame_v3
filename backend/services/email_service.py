def send_reset_email(email: str, reset_link: str):
    """
    Sends a password reset email. Replace the print stub with a real provider
    (fastapi-mail, SendGrid, AWS SES, smtplib) when ready.
    """
    import os
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    from_email = os.getenv("SMTP_FROM", smtp_user or "noreply@classplay.uz")

    subject = "Восстановление пароля ClassPlay"
    body = (
        f"Здравствуйте!\n\n"
        f"Мы получили запрос на сброс пароля для вашего аккаунта ClassPlay.\n\n"
        f"Перейдите по ссылке, чтобы задать новый пароль:\n{reset_link}\n\n"
        f"Ссылка действительна 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо.\n\n"
        f"С уважением,\nКоманда ClassPlay"
    )

    if smtp_host and smtp_user and smtp_pass:
        import smtplib
        from email.mime.text import MIMEText
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = email
        try:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(from_email, [email], msg.as_string())
            return True
        except Exception as e:
            print(f"SMTP error: {e}")
            return False
    else:
        # Stub: log to console until SMTP is configured
        print(f"\n{'='*40}")
        print(f"📧 PASSWORD RESET EMAIL (stub — configure SMTP_HOST/SMTP_USER/SMTP_PASS)")
        print(f"To: {email}")
        print(f"Reset link: {reset_link}")
        print(f"{'='*40}\n")
        return True


def send_otp_email(email: str, code: str):
    """Send a 6-digit OTP code for Telegram bot authentication."""
    import os
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    from_email = os.getenv("SMTP_FROM", smtp_user or "noreply@classplay.uz")

    subject = "Код подтверждения ClassPlay"
    body = (
        f"Ваш код подтверждения для входа в ClassPlay через Telegram:\n\n"
        f"  {code}\n\n"
        f"Код действителен 10 минут. Не передавайте его никому.\n\n"
        f"Если вы не запрашивали этот код — просто проигнорируйте письмо.\n\n"
        f"С уважением,\nКоманда ClassPlay"
    )

    if smtp_host and smtp_user and smtp_pass and smtp_user != "your@gmail.com":
        import smtplib
        from email.mime.text import MIMEText
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = email
        try:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(from_email, [email], msg.as_string())
            return True
        except Exception as e:
            print(f"SMTP error sending OTP: {e}")
            return False
    else:
        print(f"\n{'='*40}")
        print(f"📧 OTP EMAIL (stub — configure real SMTP credentials)")
        print(f"To: {email}")
        print(f"OTP Code: {code}")
        print(f"{'='*40}\n")
        return True


def send_resource_email(email: str, topic: str, content: str):
    """
    Simulates sending an email with the generated material.
    In a production environment, this should be replaced with fastapi-mail, 
    SendGrid, AWS SES, or standard smtplib.
    """
    print(f"\n" + "="*40)
    print(f"📧 EMAIL SENT")
    print(f"To: {email}")
    print(f"Subject: Ваше задание от ClassPlay - {topic}")
    print(f"Content snippet: {content[:100]}...")
    print("="*40 + "\n")
    return True
