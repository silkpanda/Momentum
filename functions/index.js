// functions/index.js (Complete Code with all 3 Functions)

// Using v2 onCall for modern Cloud Functions
const { onCall, HttpsError } = require("firebase-functions/v2/https");
// v1 logger might still be useful for structured logs if needed
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
try {
  admin.initializeApp();
  console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  // Depending on severity, you might want to prevent functions from running
}
// Define db globally after initialization
const db = admin.firestore();

/**
 * Invites an existing Firebase Auth user (by email) to a household.
 * Creates a profile doc if one doesn't exist for the auth user.
 * Creates a member doc linking the profile to the household.
 * V3 Data Model: Assumes profileId == authUserId for invited users.
 *
 * @param {object} request - The request object.
 * @param {string} request.data.email - Email of the user to invite.
 * @param {string} request.data.householdId - ID of the household to invite to.
 * @param {object} request.auth - Auth context of the caller.
 */
exports.inviteUserToHousehold = onCall(async (request) => {
  console.log("inviteUserToHousehold (v2) triggered.");
  const { auth, data } = request;
  const { email, householdId } = data;

  // 1. Validation & Auth Check
  if (!auth) {
    console.error("Auth check failed: request.auth missing.");
    throw new HttpsError("unauthenticated", "You must be logged in to invite users.");
  }
  if (!email || !householdId) {
    console.error("Validation failed: Missing email or householdId.");
    throw new HttpsError("invalid-argument", "Please provide both an email and household ID.");
  }

  const callerUid = auth.uid;

  try {
    // 2. Permission Check: Is caller an admin of the target household?
    const callerMemberId = `${callerUid}_${householdId}`;
    const callerMemberRef = db.collection("members").doc(callerMemberId);
    const callerMemberSnap = await callerMemberRef.get();

    if (!callerMemberSnap.exists || callerMemberSnap.data().role !== 'admin') {
      console.error(`Permission denied: User ${callerUid} not admin of ${householdId}.`);
      throw new HttpsError("permission-denied", "You must be an admin of this household to invite members.");
    }

    // 3. Find Invited User by Email
    let invitedUserRecord;
    try {
      invitedUserRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`User with email ${email} not found.`);
        throw new HttpsError("not-found", `No user found with the email ${email}. Please ask them to sign up first.`);
      }
      console.error("Error fetching user by email:", error);
      throw new HttpsError("internal", "An error occurred while looking up the user.");
    }
    const invitedUid = invitedUserRecord.uid;
    const invitedProfileId = invitedUid; // v4 model: profileId == auth.uid for auth users

    // 4. Check if Invited User is Already in the Household
    const invitedMemberId = `${invitedProfileId}_${householdId}`;
    const invitedMemberRef = db.collection("members").doc(invitedMemberId);
    const invitedMemberSnap = await invitedMemberRef.get();

    if (invitedMemberSnap.exists) {
      console.log(`User ${invitedUid} (${email}) is already a member of household ${householdId}.`);
      throw new HttpsError("already-exists", `${email} is already a member of this household.`);
    }

    // 5. Check v4 Rule: Invited user must not already be in ANOTHER household
    const invitedProfileRef = db.collection("profiles").doc(invitedProfileId);
    const invitedProfileSnap = await invitedProfileRef.get();
    if (invitedProfileSnap.exists && invitedProfileSnap.data().householdId) {
         console.warn(`User ${invitedUid} (${email}) already belongs to household ${invitedProfileSnap.data().householdId}. Cannot add to another.`);
         throw new HttpsError("failed-precondition", `${email} already belongs to another household. Parents can only join one household.`);
    }


    // 6. Action: Create Profile (if needed) and Member doc in a batch
    const batch = db.batch();

    // Set/Merge Profile Doc (ensure it exists and link householdId)
     batch.set(invitedProfileRef, {
        authUserId: invitedUid,
        name: invitedUserRecord.displayName || invitedUserRecord.email, // Use display name or email
        isManaged: false,
        householdId: householdId // Add the single household ID
    }, { merge: true }); // Merge to avoid overwriting existing profile details unintentionally

    // Create Member Doc
    batch.set(invitedMemberRef, {
        profileId: invitedProfileId,
        householdId: householdId,
        role: 'admin', // Default role for invited users? Or 'member'? Let's use 'admin' for now.
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        points: 0
    });

    await batch.commit();

    // 7. Success
    console.log(`Successfully invited ${email} (UID: ${invitedUid}) to household ${householdId}. Profile and Member docs created/updated.`);
    return {
      success: true,
      message: `Successfully invited ${email}.`,
    };

  } catch (error) {
    console.error("Error in inviteUserToHousehold:", error);
    // Rethrow HttpsErrors, wrap others
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "An unexpected error occurred while processing the invite.");
  }
});


/**
 * Creates a "Managed Profile" (e.g., for a child) within a specific household.
 * Creates a profile doc (with authUserId=null) and a member doc.
 * V3 Data Model.
 *
 * @param {object} request - The request object.
 * @param {string} request.data.displayName - Name for the new profile.
 * @param {string} request.data.householdId - ID of the household to add to.
 * @param {object} request.auth - Auth context of the caller.
 */
exports.createManagedProfile = onCall(async (request) => {
    console.log("createManagedProfile (v2) triggered.");
    const { auth, data } = request;
    const { displayName, householdId } = data; // Changed from profileName for clarity

    // 1. Validation & Auth Check
    if (!auth) {
        console.error("Auth check failed: request.auth missing.");
        throw new HttpsError("unauthenticated", "You must be logged in.");
    }
    if (!displayName || !householdId) {
        console.error("Validation failed: Missing displayName or householdId.");
        throw new HttpsError("invalid-argument", "Please provide a name and household ID.");
    }
    if (displayName.length > 50) { // Example validation
        throw new HttpsError("invalid-argument", "Profile name is too long (max 50 chars).");
    }

    const callerUid = auth.uid;

    try {
        // 2. Permission Check: Is caller an admin of the target household?
        const callerMemberId = `${callerUid}_${householdId}`;
        const callerMemberRef = db.collection("members").doc(callerMemberId);
        const callerMemberSnap = await callerMemberRef.get();

        if (!callerMemberSnap.exists || callerMemberSnap.data().role !== 'admin') {
            console.error(`Permission denied: User ${callerUid} not admin of ${householdId}.`);
            throw new HttpsError("permission-denied", "You must be an admin of this household to add profiles.");
        }

        // 3. Action: Create Profile and Member doc in a batch
        const batch = db.batch();

        // Create Profile Doc (generate new ID)
        const newProfileRef = db.collection("profiles").doc(); // Auto-generate ID
        batch.set(newProfileRef, {
            authUserId: null, // Explicitly null for managed profiles
            name: displayName,
            isManaged: true,
            // Managed profiles do NOT get a top-level householdId, they link via members
        });

        // Create Member Doc (using the new profile ID)
        const newMemberRef = db.collection("members").doc(`${newProfileRef.id}_${householdId}`);
        batch.set(newMemberRef, {
            profileId: newProfileRef.id, // Link to the new profile
            householdId: householdId,
            role: 'child', // Default role for managed profiles
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            points: 0
        });

        await batch.commit();

        // 4. Success
        console.log(`Admin ${callerUid} created managed profile '${displayName}' (ID: ${newProfileRef.id}) in household ${householdId}.`);
        return {
            success: true,
            message: `Profile '${displayName}' created successfully!`,
            profileId: newProfileRef.id // Optionally return the new ID
        };

    } catch (error) {
        console.error("Error in createManagedProfile:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "An unexpected error occurred while creating the profile.");
    }
});


/**
 * Deletes a managed profile (child) and their associated membership.
 * Ensures the caller is an admin and the target is a managed profile.
 *
 * @param {object} request - The request object from the client.
 * @param {string} request.data.profileId - The ID of the profile to delete.
 * @param {string} request.data.householdId - The household to delete from.
 * @param {object} request.auth - The authentication context of the caller.
 */
exports.deleteManagedProfile = onCall(async (request) => {
  console.log("deleteManagedProfile (v2) triggered.");

  const { auth, data } = request;
  const { profileId, householdId } = data;

  // 1. Authentication & Validation
  if (!auth) {
    console.error("Auth check failed: request.auth is missing.");
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }
  if (!profileId || !householdId) {
    console.error("Validation failed: Missing profileId or householdId.");
    throw new HttpsError("invalid-argument", "Missing profile or household ID.");
  }

  const callerUid = auth.uid;

  try {
    // 2. Permission Check: Is the caller an admin of this household?
    const callerMemberId = `${callerUid}_${householdId}`;
    const callerMemberRef = db.collection("members").doc(callerMemberId);
    const callerMemberSnap = await callerMemberRef.get();

    if (!callerMemberSnap.exists || callerMemberSnap.data().role !== 'admin') {
      console.error(`Permission check failed: User ${callerUid} is not an admin for household ${householdId}.`);
      throw new HttpsError("permission-denied", "You must be an admin of this household.");
    }

    // 3. Get Target Docs & Verify Target is Managed
    const profileRef = db.collection("profiles").doc(profileId);
    const memberRef = db.collection("members").doc(`${profileId}_${householdId}`); // The specific membership link

    const profileSnap = await profileRef.get();
    if (!profileSnap.exists) {
        // Maybe the profile was already deleted? Or wrong ID sent?
      console.warn(`Attempted to delete non-existent profile ${profileId}.`);
      // Consider if this should be an error or just ignored. Let's return success-like but log warning.
       return {
        success: true, // Or false? Let's say true since the end state (no profile) is achieved.
        message: `Profile ${profileId} not found, deletion skipped or already done.`,
      };
    }
    // Security check: Only allow admins to delete MANAGED profiles
    const profileData = profileSnap.data();
    if (profileData.authUserId != null || !profileData.isManaged) { // Check both conditions
        console.error(`Security check failed: Attempted to delete non-managed profile ${profileId} by ${callerUid}.`);
        throw new HttpsError("permission-denied", "You can only delete managed child profiles, not other users.");
    }

    // Check if the corresponding member doc exists (it should)
     const memberSnap = await memberRef.get();
     if (!memberSnap.exists) {
         console.warn(`Member doc ${memberRef.id} not found for profile ${profileId}. Deleting profile only.`);
         // Proceed to delete only the profile if the member link is already gone
         await profileRef.delete();
     } else {
        // 4. Action (Batched Write) - Delete both profile and specific member doc
        const batch = db.batch();
        batch.delete(profileRef); // Delete the profile
        batch.delete(memberRef); // Delete the membership link for this household
        await batch.commit();
     }


    // 5. Success!
    console.log(`Success: Admin ${callerUid} deleted managed profile ${profileId} and its membership in household ${householdId}.`);
    return {
      success: true, // Use boolean success flag for easier client checking
      message: `Profile successfully deleted.`,
    };

  } catch (error) {
    console.error("Error deleting managed profile:", error);
    if (error instanceof HttpsError) {
      throw error; // Rethrow HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while deleting the profile.");
  }
});