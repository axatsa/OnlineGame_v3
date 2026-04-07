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
