// functions/index.js (Updated with MORE non-crashing logs)

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.inviteUserToHousehold = functions.https.onCall(async (data, context) => {
  
  // --- (1) FIXED DEBUG LOGS (AGAIN) ---
  console.log("--- inviteUserToHousehold function triggered ---");

  // THIS IS THE FIX. We just log the properties we expect.
  console.log("Data received (brief):", {
    email: data.email,
    householdId: data.householdId,
  });
  
  // This one was already fixed.
  console.log("Auth context received (brief):", { 
    uid: context.auth ? context.auth.uid : null 
  });
  // --- (END FIX) ---

  // --- 1. Authentication & Validation ---
  if (!context.auth) {
    console.error("Auth context is missing! Throwing 'unauthenticated' error.");
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to invite users.",
    );
  }

  // ... (rest of the function is the same)
  console.log(`Auth check passed. Caller UID: ${context.auth.uid}`);
  
  const {email, householdId} = data;
  const callerUid = context.auth.uid;

  if (!email || !householdId) {
    console.error("Invalid arguments. Email or HouseholdID missing.");
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Please provide an email and household ID.",
    );
  }

  const db = admin.firestore();

  try {
    console.log(`Checking admin status for: ${callerUid} in household ${householdId}`);
    const callerMemberDocRef = db
        .collection("members")
        .doc(`${callerUid}_${householdId}`);
    const callerMemberDoc = await callerMemberDocRef.get();

    if (!callerMemberDoc.exists || callerMemberDoc.data().role !== "admin") {
      console.error("Permission check failed. User is not an admin.");
      throw new functions.https.HttpsError(
          "permission-denied",
          "You must be an admin of this household to invite users.",
      );
    }
    
    console.log("Permission check passed. User is an admin.");
    console.log(`Looking up user by email: ${email}`);
    
    let inviteeUser;
    try {
      inviteeUser = await admin.auth().getUserByEmail(email);
    } catch (error) {
      console.error(`User lookup failed. Email ${email} not found.`);
      throw new functions.https.HttpsError(
          "not-found",
          `No user found with the email: ${email}. Please ask them to sign up first.`,
      );
    }

    const inviteeUid = inviteeUser.uid;
    console.log(`Found user. Invitee UID: ${inviteeUid}`);

    const inviteeMemberDocRef = db
        .collection("members")
        .doc(`${inviteeUid}_${householdId}`);
    const inviteeMemberDoc = await inviteeMemberDocRef.get();

    if (inviteeMemberDoc.exists) {
      console.error("User is. already a member of this household.");
      throw new functions.https.HttpsError(
          "already-exists",
          `This user is already a member of this household.`,
      );
    }

    console.log("All checks passed. Creating new member document...");
    const newMemberData = {
      userId: inviteeUid,
      householdId: householdId,
      role: "member", 
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      points: 0,
    };

    await inviteeMemberDocRef.set(newMemberData);

    console.log("Successfully created new member. Sending success response.");
    return {
      status: "success",
      message: `Successfully invited ${email} to the household.`,
    };

  } catch (error) {
    console.error("--- Function failed ---", error.message);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
        "internal",
        "An unexpected error occurred. Please try again.",
    );
  }
});