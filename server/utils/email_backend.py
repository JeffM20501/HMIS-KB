import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings

class BrevoEmailBackend(BaseEmailBackend):
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.configuration = sib_api_v3_sdk.Configuration()
        self.configuration.api_key['api-key'] = os.getenv('BREVO_API_KEY')
        self.api_client = sib_api_v3_sdk.ApiClient(self.configuration)
        self.email_api = sib_api_v3_sdk.TransactionalEmailsApi(self.api_client)

    def send_messages(self, email_messages):
        sender_email = settings.DEFAULT_FROM_EMAIL
        sender_name = settings.EMAIL_SENDER_NAME

        for email_message in email_messages:
            try:
                # Extract HTML content (prioritise alternatives)
                html_content = None
                for alt, mime_type in email_message.alternatives:
                    if mime_type == 'text/html':
                        html_content = alt
                        break

                # If no HTML alternative, fallback to body (plain text)
                if html_content is None:
                    html_content = email_message.body

                send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                    sender={'email': sender_email, 'name': sender_name},  # <-- name added
                    to=[{'email': recipient} for recipient in email_message.recipients()],
                    subject=email_message.subject,
                    html_content=html_content,
                    # Optionally add plain text fallback:
                    # text_content=email_message.body,
                )
                self.email_api.send_transac_email(send_smtp_email)
            except ApiException as e:
                if not self.fail_silently:
                    raise
                else:
                    return False
        return True