// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize our app so the function can access database/auth
admin.initializeApp();

/**
 * --- inviteUserToHousehold (Cloud Function) ---
 *
 * This is an "onCall" function. It means our React app can call it directly
 * and securely.
 *
 * @param {object} data - The data sent from our React app.
 * {
 * email: "invitee@example.com",
 * householdId: "h-12345"
 * }
 * @param {object} context - Auth info about the user *calling* the function.
 * {
 * auth: { uid: "caller-user-id" }
 * }
 *
 * @returns {object} - A JSON object indicating success or failure.
 */
exports.inviteUserToHousehold = functions.https.onCall(async (data, context) => {
  // --- 1. Authentication & Validation ---

  // Check 1: Is the user calling this function even logged in?
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to invite users.",
    );
  }

  const {email, householdId} = data;
  const callerUid = context.auth.uid;

  // Check 2: Did they send the email and householdId?
  if (!email || !householdId) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Please provide an email and household ID.",
    );
  }

  // Get our "god mode" access to the database
  const db = admin.firestore();

  try {
    // --- 2. Permission Check ---

    // Check 3: Is the *caller* an admin of this household?
    const callerMemberDocRef = db
        .collection("members")
        .doc(`${callerUid}_${householdId}`);

    const callerMemberDoc = await callerMemberDocRef.get();

    if (!callerMemberDoc.exists || callerMemberDoc.data().role !== "admin") {
      throw new functions.https.HttpsError(
          "permission-denied",
          "You must be an admin of this household to invite users.",
      );
    }

    // --- 3. Find the Invitee ---

    // Check 4: Does a user with this email even exist?
    let inviteeUser;
    try {
      // This is the secure part we can't do in the browser
      inviteeUser = await admin.auth().getUserByEmail(email);
    } catch (error) {
      // 'auth/user-not-found' is the error code
      throw new functions.https.HttpsError(
          "not-found",
          `No user found with the email: ${email}. Please ask them to sign up first.`,
      );
    }

    const inviteeUid = inviteeUser.uid;

    // Check 5: Is this user already in the household?
    const inviteeMemberDocRef = db
        .collection("members")
        .doc(`${inviteeUid}_${householdId}`);

    const inviteeMemberDoc = await inviteeMemberDocRef.get();

    if (inviteeMemberDoc.exists) {
      throw new functions.https.HttpsError(
          "already-exists",
          `This user is already a member of this household.`,
      );
    }

    // --- 4. Create the New Member ---
    
    // If we get here, all checks passed!
    const newMemberData = {
      userId: inviteeUid,
      householdId: householdId,
      role: "member", // New users are always "member" by default
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      points: 0,
    };

    // Create the new member document
    await inviteeMemberDocRef.set(newMemberData);

    // --- 5. Success! ---
    return {
      status: "success",
      message: `Successfully invited ${email} to the household.`,
    };
  } catch (error) {
    // This catches any errors we threw on purpose (like "not-found")
    // and any other unexpected errors
    
    // --- THIS IS THE FIX ---
    // We log the error's code and message, not the whole object,
    // to prevent the circular JSON crash.
    console.error("Error inviting user. Code:", error.code, "Message:", error.message);

    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw our custom errors
    }
    // Throw a generic error for everything else
    throw new functions.https.HttpsError(
        "internal",
        "An unexpected error occurred. Please try again.",
    );
  }
});