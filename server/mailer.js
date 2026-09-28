// Nodemailer transport helpers. Passwords are decrypted on demand.
const nodemailer = require("nodemailer");
const { decrypt } = require("./crypto");

function createTransport(profile) {
  const password = decrypt(profile.pass_encrypted);
  return nodemailer.createTransport({
    host: profile.host,
    port: Number(profile.port),
    secure: !!Number(profile.secure),
    auth: { user: profile.user, pass: password },
  });
}

// Verify SMTP connectivity/auth for a profile.
async function verify(profile) {
  const transport = createTransport(profile);
  try {
    await transport.verify();
    return { ok: true, message: "Connection successful" };
  } finally {
    transport.close();
  }
}

function send(profile, message) {
  const transport = createTransport(profile);
  return transport.sendMail({
    from: profile.from_name
      ? `"${profile.from_name}" <${profile.from_email || profile.user}>`
      : profile.from_email || profile.user,
    ...message,
  });
}

module.exports = { createTransport, verify, send };
