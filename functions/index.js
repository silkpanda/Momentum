// functions/index.js (Corrected and Complete)

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize our app so the function can access database/auth
admin.initializeApp();

/**
 * --- inviteUserToHousehold (Cloud Function) ---
 * (This is your existing function, unchanged)
 */
exports.inviteUserToHousehold = functions.https.onCall(async (data, context) => {
  // --- 1. Authentication & Validation ---
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to invite users.",
    );
  }

  const {email, householdId} = data;
  const callerUid = context.auth.uid;

  if (!email || !householdId) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Please provide an email and household ID.",
    );
  }

  const db = admin.firestore();

  try {
    // --- 2. Permission Check ---
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
    let inviteeUser;
    try {
      inviteeUser = await admin.auth().getUserByEmail(email);
    } catch (error) {
      throw new functions.https.HttpsError(
          "not-found",
          `No user found with the email: ${email}. Please ask them to sign up first.`,
      );
    }

    const inviteeUid = inviteeUser.uid;
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
    const newMemberData = {
      userId: inviteeUid,
      householdId: householdId,
      role: "member",
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      points: 0,
    };
    await inviteeMemberDocRef.set(newMemberData);

    // --- 5. Success! ---
    return {
      status: "success",
      message: `Successfully invited ${email} to the household.`,
    };
  } catch (error) {
    console.error("Error inviting user:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
        "internal",
        "An unexpected error occurred. Please try again.",
    );
  }
});

/**
 * --- (NEW!) deleteManagedProfile (Cloud Function) ---
 *
 * This function securely deletes a "managed" profile (one with no auth user)
 * and its associated member document.
 */
exports.deleteManagedProfile = functions.https.onCall(async (data, context) => {
  // --- 1. Authentication & Validation ---
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to perform this action.",
    );
  }

  const {profileId, householdId} = data;
  const callerUid = context.auth.uid;

  if (!profileId || !householdId) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Please provide a profileId and householdId.",
    );
  }

  const db = admin.firestore();

  try {
    // --- 2. Permission Check ---
    // Check: Is the *caller* an admin of this household?
    const callerMemberDocRef = db
        .collection("members")
        .doc(`${callerUid}_${householdId}`);
    const callerMemberDoc = await callerMemberDocRef.get();

    if (!callerMemberDoc.exists || callerMemberDoc.data().role !== "admin") {
      throw new functions.https.HttpsError(
          "permission-denied",
          "You must be an admin of this household to delete profiles.",
      );
    }

    // --- 3. Target Validation ---
    const profileDocRef = db.collection("profiles").doc(profileId);
    const profileDoc = await profileDocRef.get();

    if (!profileDoc.exists) {
      throw new functions.https.HttpsError("not-found", "The profile to be deleted does not exist.");
    }

    if (profileDoc.data().authUserId !== null) {
      throw new functions.https.HttpsError(
          "permission-denied",
          "This profile is linked to an authenticated user and cannot be deleted. They must 'leave' the household.",
      );
    }

    // --- 4. Perform Deletion (in a Transaction) ---
    await db.runTransaction(async (transaction) => {
      // Find the member doc using a query.
      const membersQuery = db.collection("members")
        .where("profileId", "==", profileId)
        .where("householdId", "==", householdId)
        .limit(1);
        
      const memberSnapshot = await transaction.get(membersQuery);
      
      if (memberSnapshot.empty) {
        throw new functions.https.HttpsError("not-found", "Could not find the member document to delete.");
      }
      
      const memberDocRef = memberSnapshot.docs[0].ref;

      // Delete both the profile and the member doc
      transaction.delete(profileDocRef);
      transaction.delete(memberDocRef);
    });

    // --- 5. Success! ---
    return {
      status: "success",
      message: "Profile and member documents successfully deleted.",
    };
  } catch (error) {
    console.error("Error deleting managed profile:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw our custom errors
    }
    throw new functions.https.HttpsError(
        "internal",
        "An unexpected error occurred. Please try again.",
    );
  }
});