import { ObjectId } from "npm:mongodb@^6.0.0";
import { getDb } from "../concept-server.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Function to send verification email using Resend API
async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  // If no API key is configured, skip sending email
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured, skipping email send");
    return;
  }

  const verificationUrl = Deno.env.get("VERIFICATION_URL") || `http://localhost:5173/verify?token=${token}`;
  const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@campuscloset.app";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "Verify your CampusCloset account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6B46C1;">Welcome to CampusCloset!</h1>
            <p>Thank you for signing up. Please verify your account using the token below:</p>
            <div style="background-color: #F3F4F6; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
              <h2 style="color: #6B46C1; margin: 0; font-family: monospace; letter-spacing: 2px;">${token}</h2>
            </div>
            <p>Or click the link below to verify:</p>
            <a href="${verificationUrl}" style="display: inline-block; background-color: #6B46C1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Verify Account</a>
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">If you didn't create this account, please ignore this email.</p>
          </div>
        `,
        text: `Welcome to CampusCloset!\n\nPlease verify your account using this token:\n\n${token}\n\nOr visit: ${verificationUrl}\n\nIf you didn't create this account, please ignore this email.`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${response.status} ${error}`);
    }
  } catch (error) {
    console.error("Error sending email via Resend:", error);
    throw error;
  }
}

// School configuration
const SCHOOLS = {
  "MIT": { domain: "mit.edu", name: "Massachusetts Institute of Technology" },
  "Wellesley": { domain: "wellesley.edu", name: "Wellesley College" },
  "Harvard": { domain: "harvard.edu", name: "Harvard University" },
  "Boston University": { domain: "bu.edu", name: "Boston University" },
  "Northeastern": { domain: "northeastern.edu", name: "Northeastern University" }
};

export class UserAccount {
  async requestVerification(params: { email: string }) {
    const { email } = params;
    if (!email || typeof email !== "string") {
      throw new Error("Email is required");
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    const db = await getDb();

    // Check if email already verified - return user info for login
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser && existingUser.verifiedAt) {
      return {
        token: "existing_user",
        userId: existingUser.userId.toString(),
        username: existingUser.username,
        alreadyVerified: true
      };
    }

    const token = crypto.randomUUID();

    // Create or update pending verification
    await db.collection("pending_verifications").updateOne(
      { email },
      {
        $set: {
          email,
          token,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Send verification email (if RESEND_API_KEY is configured)
    try {
      await sendVerificationEmail(email, token);
    } catch (emailError) {
      // Log error but don't fail the request if email fails
      console.error("Failed to send verification email:", emailError);
      // Still return the token so user can manually enter it
    }

    return { token, alreadyVerified: false };
  }

  async confirmVerification(params: { token: string; username: string; password: string }) {
    const { token, username, password } = params;
    if (!token || !username || !password) {
      throw new Error("Token, username, and password are required");
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    const db = await getDb();

    // Find pending verification
    const pending = await db.collection("pending_verifications").findOne({ token });
    if (!pending) {
      throw new Error("Invalid verification token");
    }

    // Check token expiration (24 hours)
    const createdAt = new Date(pending.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      await db.collection("pending_verifications").deleteOne({ token });
      throw new Error("Verification token expired");
    }

    // Check if username already taken
    const existingUsername = await db.collection("users").findOne({ username });
    if (existingUsername) {
      throw new Error("Username already taken");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password);

    // Create user
    const userId = new ObjectId();

    // Determine school from email domain if not specified
    let school = null;
    const emailDomain = pending.email.split('@')[1];
    for (const [schoolName, config] of Object.entries(SCHOOLS)) {
      if (emailDomain === config.domain) {
        school = schoolName;
        break;
      }
    }

    await db.collection("users").insertOne({
      userId,
      email: pending.email,
      username,
      displayName: username,
      passwordHash,
      school: school,
      avatarUrl: null,
      createdAt: new Date(),
      verifiedAt: new Date(),
    });

    // Delete pending verification
    await db.collection("pending_verifications").deleteOne({ token });

    return { userId: userId.toString() };
  }

  async lookupUser(params: { userId: string }) {
    const { userId } = params;
    if (!userId) {
      throw new Error("userId is required");
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({
      userId: new ObjectId(userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Fetch user's listings (from ItemListing concept)
    const listings = await db.collection("listings")
      .find({ sellerId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      userId: user.userId.toString(),
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      verifiedAt: user.verifiedAt,
      createdAt: user.createdAt || user.verifiedAt,
      listings: listings.map((l) => ({
        listingId: l.listingId.toString(),
        title: l.title,
        status: l.status,
        createdAt: l.createdAt,
        photos: l.photos || [], // Include photos for profile display
        minAsk: l.minAsk,
        currentHighestBid: l.currentHighestBid,
      })),
    };
  }

  async viewProfile(params: { userId: string }) {
    return this.lookupUser(params);
  }

  async loginByEmail(params: { email: string; password: string }) {
    const { email, password } = params;
    if (!email || typeof email !== "string" || !password) {
      throw new Error("Email and password are required");
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    const db = await getDb();

    // Find user by email
    const user = await db.collection("users").findOne({ email });
    if (!user || !user.verifiedAt) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    if (!user.passwordHash) {
      throw new Error("No password set for this account");
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new Error("Invalid email or password");
    }

    return {
      userId: user.userId.toString(),
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      school: user.school,
    };
  }

  // SSO Authentication Methods
  async requestSSOLogin(params: { school: string; email: string }) {
    const { school, email } = params;

    if (!school || !email) {
      throw new Error("School and email are required");
    }

    // Validate school
    if (!SCHOOLS[school as keyof typeof SCHOOLS]) {
      throw new Error("Invalid school selected");
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Validate email domain matches school
    const schoolConfig = SCHOOLS[school as keyof typeof SCHOOLS];
    const emailDomain = email.split('@')[1];
    if (emailDomain !== schoolConfig.domain) {
      throw new Error(`Email must be from ${school} domain (@${schoolConfig.domain})`);
    }

    const db = await getDb();

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser && existingUser.verifiedAt) {
      return {
        ssoToken: "existing_user",
        userId: existingUser.userId.toString(),
        username: existingUser.username,
        school: existingUser.school,
        alreadyVerified: true
      };
    }

    // Generate SSO token (simulating SSO redirect)
    const ssoToken = crypto.randomUUID();

    // Store pending SSO verification
    await db.collection("pending_verifications").updateOne(
      { email },
      {
        $set: {
          email,
          token: ssoToken,
          school,
          authMethod: "sso",
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return { ssoToken, school, alreadyVerified: false };
  }

  async confirmSSOLogin(params: { ssoToken: string; username: string; password: string }) {
    const { ssoToken, username, password } = params;
    if (!ssoToken || !username || !password) {
      throw new Error("SSO token, username, and password are required");
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    const db = await getDb();

    // Find pending SSO verification
    const pending = await db.collection("pending_verifications").findOne({
      token: ssoToken,
      authMethod: "sso"
    });

    if (!pending) {
      throw new Error("Invalid SSO token");
    }

    // Check token expiration (24 hours)
    const createdAt = new Date(pending.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      await db.collection("pending_verifications").deleteOne({ token: ssoToken });
      throw new Error("SSO token expired");
    }

    // Check if username already taken
    const existingUsername = await db.collection("users").findOne({ username });
    if (existingUsername) {
      throw new Error("Username already taken");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password);

    // Create user with school affiliation
    const userId = new ObjectId();
    await db.collection("users").insertOne({
      userId,
      email: pending.email,
      username,
      displayName: username,
      passwordHash,
      school: pending.school,
      avatarUrl: null,
      createdAt: new Date(),
      verifiedAt: new Date(),
    });

    // Delete pending verification
    await db.collection("pending_verifications").deleteOne({ token: ssoToken });

    return {
      userId: userId.toString(),
      school: pending.school
    };
  }

  async updateAvatar(params: { userId: string; avatarUrl: string | null }) {
    const { userId, avatarUrl } = params;
    if (!userId) {
      throw new Error("userId is required");
    }

    const db = await getDb();
    
    const updateResult = await db.collection("users").updateOne(
      { userId: new ObjectId(userId) },
      { $set: { avatarUrl: avatarUrl } }
    );

    if (updateResult.matchedCount === 0) {
      throw new Error("User not found");
    }

    return { success: true };
  }

  async getSchools() {
    return Object.entries(SCHOOLS).map(([name, config]) => ({
      name,
      domain: config.domain,
      fullName: config.name
    }));
  }
}

