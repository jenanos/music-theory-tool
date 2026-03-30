import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createMagicLink, setDevCallbackUrl } from "../../../lib/auth";

const isDevelopment = process.env.NODE_ENV === "development";

// POST /api/auth/magic-link - Request a magic link
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-post er påkrevd." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    let token: string;
    try {
      token = await createMagicLink(normalizedEmail);
    } catch {
      // Generic success message to not leak whether email exists
      return NextResponse.json({
        success: true,
        message:
          "Hvis e-postadressen er registrert, vil du motta en innloggingslenke.",
      });
    }

    // Build the verification URL
    const url = new URL(request.url);
    const verifyUrl = `${url.origin}/api/auth/verify?token=${token}`;

    if (isDevelopment) {
      // Store URL server-side for the verify page to pick up
      setDevCallbackUrl(verifyUrl);
      console.log("\n════════════════════════════════════════");
      console.log("  🔗 Magic link klar på /login/verify");
      console.log("════════════════════════════════════════\n");
    } else {
      // Send email via Resend in production
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from:
          process.env.EMAIL_FROM ??
          "Music Theory Tool <noreply@resend.dev>",
        to: normalizedEmail,
        subject: "Din innloggingslenke",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #1a1a1a;">Logg inn</h2>
            <p style="color: #555; line-height: 1.6;">
              Klikk på knappen under for å logge inn. Lenken er gyldig i 15 minutter.
            </p>
            <a href="${verifyUrl}"
               style="display: inline-block; background: #0f766e; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
              Logg inn
            </a>
            <p style="color: #999; font-size: 13px; margin-top: 24px;">
              Hvis du ikke ba om denne lenken, kan du trygt ignorere denne e-posten.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Hvis e-postadressen er registrert, vil du motta en innloggingslenke.",
    });
  } catch (error) {
    console.error("Magic link error:", error);
    // Generic success message to not leak user info
    return NextResponse.json({
      success: true,
      message:
        "Hvis e-postadressen er registrert, vil du motta en innloggingslenke.",
    });
  }
}
