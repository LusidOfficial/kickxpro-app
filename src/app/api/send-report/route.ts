import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Only initialize if we have a key, so it doesn't crash on startup
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const { 
      playerEmail, 
      playerName, 
      coachName, 
      reportUrl, 
      summary, 
      scores 
    } = await req.json();

    if (!playerEmail) {
      return NextResponse.json({ error: "No email address provided" }, { status: 400 });
    }

    if (!resend) {
      // Fallback if no API key is provided
      console.log("=========================================");
      console.log(`[NO API KEY] ✉️ MOCK EMAIL DISPATCH: To ${playerEmail}`);
      console.log(`Subject: ⚽ New Evaluation Report for ${playerName}`);
      console.log(`Link: ${reportUrl}`);
      console.log("=========================================");
      
      return NextResponse.json({ 
        success: true, 
        message: `MOCK: Report card successfully sent to ${playerEmail} (Add RESEND_API_KEY for real emails)` 
      });
    }

    // Actual Resend Integration
    const { data, error } = await resend.emails.send({
      from: 'KickXPro <onboarding@resend.dev>', // Use verified domain in production
      to: [playerEmail],
      subject: `⚽ New Evaluation Report for ${playerName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #312e81;">Hello!</h2>
          <p><strong>${coachName}</strong> has just submitted a new evaluation report for <strong>${playerName}</strong>.</p>
          <p><strong>Coach's Summary:</strong><br/>${summary}</p>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
            <p style="margin: 0; font-weight: bold;">Quick Scores:</p>
            <ul style="margin-top: 10px;">
              ${Object.entries(scores).map(([k, v]) => `<li>${k}: ${v}/100</li>`).join('')}
            </ul>
          </div>

          <a href="${reportUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Full Interactive Report Card
          </a>
        </div>
      `
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Report card successfully sent to ${playerEmail}`,
      id: data?.id
    });

  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
