// functions/index.js (Now includes createManagedProfile)

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore(); // Define db globally for reuse

// ------------------------------------------------------------------
// --- inviteUserToHousehold (Cloud Function - Gen 2) ---
// ------------------------------------------------------------------
/**
 * A 2nd Generation callable function to invite a new user (by email) 
 * to an existing household.
 */
exports.inviteUserToHousehold = onCall(async (request) => {
  // This function is from our previous work (PROF-03)
  // ... (code for inviteUserToHousehold remains the same) ...
  
  console.log("inviteUserToHousehold (2nd Gen) function triggered.");
  const auth = request.auth;
  const data = request.data;
  if (!auth) {
    console.error("Authentication check failed: request.auth is missing.");
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }
  const { email, householdId } = data;
  if (!email || !householdId) {
    throw new HttpsError("invalid-argument", "Missing 'email' or 'householdId'.");
  }
  const callerUid = auth.uid;

  try {
    const callerMemberRef = db.collection("members").doc(`${callerUid}_${householdId}`);
    const callerMemberSnap = await callerMemberRef.get();
    if (!callerMemberSnap.exists || callerMemberSnap.data().role !== 'admin') {
      throw new HttpsError("permission-denied", "You must be an admin.");
    }

    let inviteeProfileRef;
    let newProfileId;
    let inviteeAuthUser;

    try {
      inviteeAuthUser = await admin.auth().getUserByEmail(email);
      // User exists in Auth, find their profile doc
      const profileQuery = await db.collection('profiles').where('authUserId', '==', inviteeAuthUser.uid).limit(1).get();
      if (profileQuery.empty) {
        // No profile, create one
        inviteeProfileRef = db.collection('profiles').doc(inviteeAuthUser.uid);
        await inviteeProfileRef.set({
          authUserId: inviteeAuthUser.uid,
          email: inviteeAuthUser.email,
          displayName: inviteeAuthUser.displayName || email.split('@')[0],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        newProfileId = inviteeAuthUser.uid;
      } else {
        // Profile exists
        inviteeProfileRef = profileQuery.docs[0].ref;
        newProfileId = inviteeProfileRef.id;
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new HttpsError("not-found", `No user found with the email: ${email}.`);
      }
      throw new HttpsError("internal", "Error looking up user.");
    }
    
    const newMemberRef = db.collection('members').doc(`${newProfileId}_${householdId}`);
    if ((await newMemberRef.get()).exists) {
      throw new HttpsError("already-exists", `${email} is already a member.`);
    }

    await newMemberRef.set({
      profileId: newProfileId,
      householdId: householdId,
      role: 'child', // Default new members to 'child'
      status: 'pending',
      points: 0,
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { status: "success", message: `Successfully invited ${email}.` };

  } catch (error) {
    console.error("Error in inviteUserToHousehold:", error.message, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "An unexpected error occurred.");
  }
});


// ------------------------------------------------------------------
// --- NEW: createManagedProfile (Cloud Function - Gen 2) ---
// ------------------------------------------------------------------
/**
 * A 2nd Gen callable function for an admin to create a new
 * "Managed Profile" (e.g., a child without an email) and add
 * them to the household in one transaction.
 *
 * Implements Feature PROF-02.
 *
 * @param {object} request - The request object from the client.
 * @param {string} request.data.displayName - The name for the new profile (e.g., "Sammy").
 * @param {string} request.data.householdId - The household to add this profile to.
 * @param {object} request.auth - The authentication context of the caller.
 *
 * @returns {object} - A success message.
 * @throws {HttpsError}
 * - 'unauthenticated': If the caller is not logged in.
 * - 'invalid-argument': If 'displayName' or 'householdId' are missing.
 * - 'permission-denied': If the caller is not an 'admin' of the target household.
 */
exports.createManagedProfile = onCall(async (request) => {
  console.log("createManagedProfile (2nd Gen) function triggered.");

  const { auth, data } = request;
  const { displayName, householdId } = data;

  // --- 1. Authentication & Validation ---
  if (!auth) {
    console.error("Authentication check failed: request.auth is missing.");
    throw new HttpsError(
        "unauthenticated",
        "You must be logged in to perform this action.",
    );
  }

  if (!displayName || !householdId) {
    console.error("Validation failed: Missing displayName or householdId.");
    throw new HttpsError(
        "invalid-argument",
        "Missing 'displayName' or 'householdId'.",
    );
  }

  const callerUid = auth.uid;

  try {
    // --- 2. Permission Check ---
    // Check if the *caller* is an admin of the household.
    // We use our composite key to do a direct doc.get()
    const callerMemberId = `${callerUid}_${householdId}`;
    const callerMemberRef = db.collection("members").doc(callerMemberId);
    const callerMemberSnap = await callerMemberRef.get();

    if (!callerMemberSnap.exists || callerMemberSnap.data().role !== 'admin') {
      console.error(
          `Permission check failed: User ${callerUid} is not an admin for household ${householdId}.`,
      );
      throw new HttpsError(
          "permission-denied",
          "You must be an admin of this household to add members.",
      );
    }

    // --- 3. Action (Batched Write) ---
    // All checks passed. Create the new profile and member docs.
    const batch = db.batch();

    // 3a. Create the new 'profiles' doc (with a random ID)
    const newProfileRef = db.collection("profiles").doc(); // Random ID
    const newProfileId = newProfileRef.id;
    
    batch.set(newProfileRef, {
      authUserId: null, // This is what makes it a "Managed Profile"
      displayName: displayName,
      email: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      activeHouseholdId: householdId // Set their active house to this one
    });

    // 3b. Create the new 'members' doc (with composite ID)
    const newMemberId = `${newProfileId}_${householdId}`;
    const newMemberRef = db.collection("members").doc(newMemberId);
    
    batch.set(newMemberRef, {
      profileId: newProfileId,
      householdId: householdId,
      role: 'child', // Default managed profiles to 'child'
      status: 'active', // Instantly active, no invite needed
      points: 0,
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3c. Commit the batch
    await batch.commit();

    // --- 4. Success! ---
    console.log(
        `Success: Admin ${callerUid} created managed profile ${newProfileId} (${displayName}) in household ${householdId}.`,
    );
    return {
      status: "success",
      message: `Successfully created and added ${displayName} to the household.`,
    };

  } catch (error) {
    console.error("Error creating managed profile:", error.message, error);
    if (error instanceof HttpsError) {
      throw error; // Re-throw our custom errors
    }
    throw new HttpsError(
        "internal",
        "An unexpected error occurred. Please try again.",
    );
  }
});