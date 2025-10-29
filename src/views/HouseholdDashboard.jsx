// src/views/HouseholdDashboard.jsx (Updated)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, functions } from '../firebase'; // --- (1) IMPORT functions ---
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore'; // --- (2) IMPORT MORE FIRESTORE STUFF ---
import { httpsCallable } from 'firebase/functions'; // --- (3) IMPORT CALLABLE ---
import InviteMemberForm from '../components/InviteMemberForm';

// --- (4) PREPARE THE CLOUD FUNCTION ---
// This creates a reusable reference to our new backend function
const deleteManagedProfile = httpsCallable(functions, 'deleteManagedProfile');

function HouseholdDashboard() {
  const { householdId } = useParams();
  const { currentUser } = useAuth();
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]); // --- (5) NEW STATE for members ---
  const [isAdmin, setIsAdmin] = useState(false); // --- (6) NEW STATE for permissions ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState(''); // State for delete errors

  useEffect(() => {
    if (!currentUser) return;

    const householdRef = doc(db, 'households', householdId);
    let unsubscribeMembers = null; // To clean up our listener

    const fetchHouseholdData = async () => {
      setIsLoading(true);
      try {
        // --- (7) CHECK PERMISSIONS & GET HOUSEHOLD DATA ---
        // First, let's check if the user is a member and if they are an admin
        // We use the composite key (uid_hhid) for the 'members' doc
        const memberRef = doc(db, 'members', `${currentUser.uid}_${householdId}`);
        const memberSnap = await getDoc(memberRef);

        if (!memberSnap.exists()) {
          throw new Error('Access Denied: You are not a member of this household.');
        }
        
        // Set admin status
        if (memberSnap.data().role === 'admin') {
          setIsAdmin(true);
        }

        // Now, fetch the household data
        const householdSnap = await getDoc(householdRef);
        if (householdSnap.exists()) {
          setHousehold({ id: householdSnap.id, ...householdSnap.data() });
        } else {
          throw new Error('Household not found.');
        }

        // --- (8) LISTEN FOR REAL-TIME MEMBER UPDATES ---
        // Now that we know we're a member, fetch all *other* members
        const membersQuery = query(collection(db, 'members'), where('householdId', '==', householdId));

        // onSnapshot creates a LIVE listener.
        // Any change in the 'members' collection for this household
        // will re-run this code.
        unsubscribeMembers = onSnapshot(membersQuery, async (snapshot) => {
          const membersData = [];
          
          // Use Promise.all to fetch all profile data in parallel
          const profilePromises = snapshot.docs.map(async (memberDoc) => {
            const member = memberDoc.data();
            
            // Get the associated profile document for this member
            const profileRef = doc(db, 'profiles', member.profileId);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
              // Combine member data + profile data
              return {
                ...member,
                profile: profileSnap.data(), // e.g., { displayName, authUserId }
                profileId: profileSnap.id, // Make sure we have the ID
                memberDocId: memberDoc.id, // e.g., "uid_hhid" or "generated_id"
              };
            }
            return null; // Profile was deleted or not found
          });

          const resolvedMembers = await Promise.all(profilePromises);
          // Filter out any nulls (if a profile was missing)
          setMembers(resolvedMembers.filter(m => m !== null));
        });

      } catch (err) {
        console.error('Failed to fetch household:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHouseholdData();

    // Cleanup function:
    // This runs when the component unmounts (user navigates away)
    return () => {
      if (unsubscribeMembers) {
        unsubscribeMembers(); // Detach the live listener
      }
    };
  }, [householdId, currentUser]);

  // --- (9) NEW: HANDLE DELETE FUNCTION ---
  const handleDeleteProfile = async (profile) => {
    setDeleteError(''); // Clear old errors
    
    // Safety check!
    if (!window.confirm(`Are you sure you want to delete the profile for "${profile.displayName}"? This cannot be undone.`)) {
      return;
    }

    try {
      // Call our cloud function
      const result = await deleteManagedProfile({
        profileId: profile.profileId,
        householdId: householdId,
      });
      
      console.log(result.data.message);
      // No need to update state, onSnapshot will handle it automatically!
      
    } catch (err) {
      console.error("Error deleting profile:", err);
      // 'err.message' from httpsCallable is a JSON string, so we parse it.
      // This is a bit of a quirk, but it gives us the error message
      // we wrote in the backend.
      try {
        const errorData = JSON.parse(err.message);
        setDeleteError(errorData.message || 'An unknown error occurred.');
      } catch (e) {
        setDeleteError(err.message || 'An unknown error occurred.');
      }
    }
  };


  if (isLoading) {
    return <div className="p-8">Loading household...</div>;
  }

  if (error) {
    return <div className="p-8 text-signal-error">{error}</div>;
  }

  return (
    <div className="w-full min-h-screen p-8 bg-bg-canvas text-text-primary">
      <header className="mb-12">
        <Link to="/dashboard" className="text-sm text-action-primary hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-semibold mt-2">
          {household ? household.name : 'Household'}
        </h1>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* --- (10) NEW: MEMBER LIST --- */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Members</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.length > 0 ? (
              members.map(member => (
                <MemberCard
                  key={member.profileId}
                  profile={member.profile}
                  role={member.role}
                  points={member.points}
                  showDelete={isAdmin && !member.profile.authUserId} // The magic!
                  onDelete={() => handleDeleteProfile(member.profile)}
                />
              ))
            ) : (
              <p>No members found for this household.</p>
            )}
          </div>
          {deleteError && (
            <p className="text-sm text-signal-error mt-4">{deleteError}</p>
          )}
        </div>

        {/* --- (11) ADMIN-ONLY SECTION --- */}
        <aside>
          {isAdmin ? (
            <InviteMemberForm householdId={householdId} />
          ) : (
            <p className="text-text-secondary">You do not have admin permissions.</p>
          )}
        </aside>

      </main>
    </div>
  );
}

// --- (12) NEW: Simple MemberCard Component ---
// We can move this to its own file later if we want.
function MemberCard({ profile, role, points, showDelete, onDelete }) {
  return (
    <div className="bg-bg-surface p-4 rounded-lg shadow-md relative">
      <h3 className="text-lg font-semibold">{profile.displayName}</h3>
      <p className="text-sm text-text-secondary capitalize">{role}</p>
      <p className="text-xl font-bold mt-2 text-action-primary">{points} pts</p>
      
      {showDelete && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 text-xs text-signal-error hover:text-signal-error-hover"
          title={`Delete ${profile.displayName}`}
        >
          &times; Delete
        </button>
      )}
    </div>
  );
}

export default HouseholdDashboard;