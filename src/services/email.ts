// Email service - placeholder until email integration is set up
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  // TODO: Implement actual email sending with GoHighLevel or SendGrid
  console.log('📧 Email would be sent:', {
    to,
    subject,
    preview: text || html.substring(0, 100) + '...',
  });
  
  // For now, just log to console
  return Promise.resolve();
}