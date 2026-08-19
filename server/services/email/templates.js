const shell = (heading, body, cta) => `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;color:#1b2534">
  <table role="presentation" style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:40px 32px">
    <tr><td>
      <div style="font-size:18px;font-weight:700;color:#0b1220;letter-spacing:-0.02em">Orbitwise</div>
      <h1 style="margin:24px 0 12px;font-size:22px;font-weight:600;color:#0b1220">${heading}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#556880">${body}</p>
      ${
        cta
          ? `<a href="${cta.url}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:13px 24px;border-radius:12px;font-size:14px;font-weight:600">${cta.label}</a>
             <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#7688a3">If the button doesn't work, paste this link into your browser:<br><span style="color:#4f46e5;word-break:break-all">${cta.url}</span></p>`
          : ''
      }
      <hr style="margin:32px 0 16px;border:none;border-top:1px solid #e9edf3" />
      <p style="margin:0;font-size:12px;color:#a6b3c7">You received this email because an Orbitwise account was created with this address.</p>
    </td></tr>
  </table>
</body></html>`;

export const verifyEmailTemplate = ({ name, url }) => ({
  subject: 'Verify your Orbitwise email',
  text: `Hi ${name},\n\nConfirm your email to activate your Orbitwise account:\n${url}\n\nThis link expires in 24 hours.`,
  html: shell(
    `Welcome, ${name}`,
    'Confirm your email address to activate your account and start building your study-abroad plan. This link expires in 24 hours.',
    { label: 'Verify my email', url }
  ),
});

export const resetPasswordTemplate = ({ name, url }) => ({
  subject: 'Reset your Orbitwise password',
  text: `Hi ${name},\n\nReset your Orbitwise password:\n${url}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  html: shell(
    'Reset your password',
    `Hi ${name}, we received a request to reset your password. This link expires in 1 hour. If you didn't request it, you can safely ignore this email — your password won't change.`,
    { label: 'Choose a new password', url }
  ),
});

export const passwordChangedTemplate = ({ name }) => ({
  subject: 'Your Orbitwise password was changed',
  text: `Hi ${name},\n\nYour Orbitwise password was just changed and all other devices were signed out. If this wasn't you, reset your password immediately.`,
  html: shell(
    'Your password was changed',
    `Hi ${name}, your password was just changed and every other signed-in device was logged out. If this wasn't you, reset your password immediately.`,
    null
  ),
});
