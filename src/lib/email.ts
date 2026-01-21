import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_NAME = "Time Tracker"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Time Tracker <onboarding@resend.dev>"

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set, skipping email send")
    console.log("Would send email to:", to)
    console.log("Subject:", subject)
    return { success: false, error: "Email not configured" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html
    })

    if (error) {
      console.error("Failed to send email:", error)
      return { success: false, error: error.message }
    }

    console.log("Email sent successfully:", data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error("Email send error:", error)
    return { success: false, error: "Failed to send email" }
  }
}

export async function sendInvitationEmail({
  to,
  inviterName,
  projectName,
  inviteLink
}: {
  to: string
  inviterName: string
  projectName: string
  inviteLink: string
}) {
  const subject = `You've been invited to join ${projectName} on ${APP_NAME}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📧 Project Invitation</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>${inviterName}</strong> has invited you to join the project:
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center; margin-bottom: 25px;">
            <h2 style="color: #3B82F6; margin: 0; font-size: 22px;">${projectName}</h2>
          </div>

          <p style="margin-bottom: 25px;">
            Click the button below to accept the invitation and start tracking time on this project.
          </p>

          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${inviteLink}" style="display: inline-block; background: #3B82F6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
            ${inviteLink}
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({ to, subject, html })
}

export async function sendPasswordResetEmail({
  to,
  resetLink
}: {
  to: string
  resetLink: string
}) {
  const subject = `Reset your ${APP_NAME} password`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Password Reset</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            We received a request to reset your password for your ${APP_NAME} account.
          </p>

          <p style="margin-bottom: 25px;">
            Click the button below to create a new password:
          </p>

          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${resetLink}" style="display: inline-block; background: #3B82F6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
            ${resetLink}
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({ to, subject, html })
}

export async function sendWelcomeEmail({
  to,
  name
}: {
  to: string
  name: string
}) {
  const subject = `Welcome to ${APP_NAME}!`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Welcome to ${APP_NAME}!</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${name || "there"},
          </p>

          <p style="margin-bottom: 20px;">
            Thanks for signing up! You're all set to start tracking your time and managing your projects.
          </p>

          <h3 style="color: #3B82F6; margin-bottom: 15px;">Here's what you can do:</h3>

          <ul style="margin-bottom: 25px; padding-left: 20px;">
            <li style="margin-bottom: 10px;">⏱️ <strong>Track Time</strong> - Start/stop timer or add manual entries</li>
            <li style="margin-bottom: 10px;">📁 <strong>Create Projects</strong> - Organize your work with budgets and hourly rates</li>
            <li style="margin-bottom: 10px;">👥 <strong>Invite Team</strong> - Collaborate with colleagues</li>
            <li style="margin-bottom: 10px;">📊 <strong>View Reports</strong> - Analyze time spent and export data</li>
          </ul>

          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${process.env.NEXTAUTH_URL || "https://project-time-tracker-blue.vercel.app"}/dashboard" style="display: inline-block; background: #3B82F6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Go to Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            Happy tracking! 🚀
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({ to, subject, html })
}
