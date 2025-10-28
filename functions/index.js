// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize our app so the function can access database/auth
admin.initializeApp();

/**
 * --- inviteUserToHousehold (Cloud Function) ---
 * A callable function to invite a new user (by email) to an existing
 * household.
 *
 * This function performs the following steps:
 * 1.  Authenticates the calling user.
 * 2.  Checks that the caller has 'admin' permissions for the household.
 * 3.  Looks up the invitee's user record by their email.
 * 4.  If the user exists, it creates a new 'members' document, linking
 * the invitee's UID to the householdId with a 'pending' status and
 * a 'child' role.
 * 5.  If the user does not exist, it throws an error (for now).
 *
 * @param {object} data - The data sent to the function.
 * @param {string} data.email - The email of the user to invite.
 * @param {string} data.householdId - The ID of the household to invite to.
 *
 * @returns {object} - An object with a status or error.
 * @throws {HttpsError}
 * - 'unauthenticated': If the user is not logged in.
 * - 'invalid-argument': If 'email' or 'householdId' are missing.
 * - 'not-found': If the household doesn't exist, the caller isn't
 * a member, or the invitee email isn't found.
 * - 'permission-denied': If the caller is not an 'admin' of the household.
 * - 'internal': For any other unexpected errors.
 */
exports.inviteUserToHousehold = functions.https.onCall(async (data, context) => {
  // --- DETAILED LOGGING (v3 - Cleaned) ---
  console.log("inviteUserToHousehold function triggered.");
  console.log("Received data:", JSON.stringify(data, null, 2));

  // Specifically log the auth object. This is the key.
  if (context.auth) {
    console.log("context.auth object:", JSON.stringify(context.auth, null, 2));
    console.log("Caller UID:", context.auth.uid);
  } else {
    console.log("context.auth is null or undefined.");
  }
  // --- END LOGGING ---

  // --- 1. Authentication & Validation ---

  // Check 1: Is the user calling this function even logged in?
  if (!context.auth) {
    // Log before throwing the error
    console.error("Authentication check failed: context.auth is missing.");
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to invite users.", // This is the error message you're seeing
    );
  }

  // Now we know the user is authenticated, we can safely get their UID.
  const callerUid = context.auth.uid;
  const {email, householdId} = data;

  // Check 2: Did they send the email and householdId?
  if (!email || !householdId) {
    console.error("Validation failed: Missing email or householdId.");
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing 'email' or 'householdId'.",
    );
  }

  const db = admin.firestore();

  try {
    // --- 2. Permission Check ---
    // We need to check if the *caller* is an admin of the household
    // they're trying to invite someone to.

    // First, get the caller's 'members' document for this household.
    const callerMemberRef = db.collection("members")
        .where("userId", "==", callerUid)
        .where("householdId", "==", householdId);

    const callerMemberSnap = await callerMemberRef.get();

    if (callerMemberSnap.empty) {
      // This means the caller isn't even a member of this household.
      console.error(
          `Permission check failed: User ${callerUid} is not a member of household ${householdId}.`,
      );
      throw new functions.https.HttpsError(
          "not-found",
          "You are not a member of this household.",
      );
    }

    // We found a membership doc, let's check its role.
    // .docs[0] is safe because our query is specific.
    const callerMemberData = callerMemberSnap.docs[0].data();

    if (callerMemberData.role !== "admin") {
      // Not an admin!
      console.error(
          `Permission check failed: User ${callerUid} is not an admin for household ${householdId}. Role is: ${callerMemberData.role}`,
      );
      throw new functions.https.HttpsError(
          "permission-denied",
          "You must be an admin to invite new members.",
      );
    }

    // --- 3. Find the Invitee ---
    // If we're here, the caller is an admin. Now, find the user
    // they want to invite.
    let inviteeUserRecord;
    try {
      inviteeUserRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      // 'auth/user-not-found' is the common error code.
      if (error.code === "auth/user-not-found") {
        console.warn(`Invite failed: User with email ${email} not found.`);
        throw new functions.https.HttpsError(
            "not-found",
            `No user found with the email: ${email}.`,
        );
      }
      // Some other auth error happened.
      console.error("Error fetching user by email:", error);
      throw new functions.https.HttpsError(
          "internal",
          "An error occurred while looking up the user.",
      );
    }

    const inviteeUid = inviteeUserRecord.uid;

    // --- 4. Create the New Member ---
    // We have the caller (admin) and the invitee (user).
    // Let's create the new 'members' doc for the invitee.

    // Just to be safe, check if they're *already* a member
    const existingInviteRef = db.collection("members")
        .where("userId", "==", inviteeUid)
        .where("householdId", "==", householdId);

    const existingInviteSnap = await existingInviteRef.get();

    if (!existingInviteSnap.empty) {
      // They're already in!
      console.warn(
          `Invite failed: User ${inviteeUid} is already a member of household ${householdId}.`,
      );
      throw new functions.https.HttpsError(
          "already-exists",
          `${email} is already a member of this household.`,
      );
    }

    // All checks passed! Create the new member doc.
    const newMemberDoc = {
      userId: inviteeUid,
      householdId: householdId,
      email: email, // Denormalize email for easy display
      role: "child", // Default new members to 'child'
      status: "pending", // 'pending', 'active'
      points: 0,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("members").add(newMemberDoc);

    // --- 5. Success! ---
    console.log(
        `Invite successful: Admin ${callerUid} invited ${email} (User ${inviteeUid}) to household ${householdId}.`,
    );
    return {
      status: "success",
      message: `Successfully invited ${email} to the household.`,
    };
  } catch (error) {
    // Log the caught error before re-throwing
    console.error("Error during invite process:", error.message, error);
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