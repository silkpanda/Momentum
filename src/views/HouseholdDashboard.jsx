// src/views/HouseholdDashboard.jsx (v4 - With Delete Button & Better Loading)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDb, getFunctionsInstance } from '../firebase'; // Import function getter
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions'; // Import httpsCallable

import InviteMemberForm from '../components/InviteMemberForm';
import CreateManagedProfileForm from '../components/CreateManagedProfileForm';

function HouseholdDashboard() {
  const { householdId } = useParams();
  const { currentUser } = useAuth();
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoadingHousehold, setIsLoadingHousehold] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [error, setError] = useState('');
  const [profilesFetched, setProfilesFetched] = useState(false);
  
  // --- NEW: Track the current user's admin status ---
  const [isAdmin, setIsAdmin] = useState(false);

  // --- TARGETED REAL-TIME LISTENER FOR MEMBERS ---
  useEffect(() => {
    if (!householdId || !currentUser?.uid) {
      setIsLoadingMembers(false);
      setMembers([]);
      return;
    }

    console.log(`HouseholdDashboard: Setting up TARGETED listener for members in household ${householdId}...`);
    setIsLoadingMembers(true);
    setProfilesFetched(false);
    setError(prev => prev?.includes("household") ? prev : '');

    const dbInstance = getDb();
    if (!dbInstance) {
      console.error("Database not initialized for member listener.");
      setError("Database service not ready.");
      setIsLoadingMembers(false);
      return;
    }
    
    // --- Admin Status Check ---
    // Check if the current user is an admin of *this* household
    const adminMemberRef = doc(dbInstance, 'members', `${currentUser.uid}_${householdId}`);
    getDoc(adminMemberRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().role === 'admin') {
            console.log("User IS an admin of this household.");
            setIsAdmin(true);
        } else {
            console.log("User is NOT an admin of this household.");
            setIsAdmin(false);
        }
    }).catch(err => {
        console.error("Error checking admin status:", err);
        setIsAdmin(false);
    });

    // --- Member List Listener ---
    const membersQuery = query(
      collection(dbInstance, 'members'),
      where('householdId', '==', householdId)
    );

    const unsubscribe = onSnapshot(membersQuery, async (membersSnapshot) => {
      console.log(`HouseholdDashboard (Targeted Listener): Member data updated for ${householdId}.`);
      setProfilesFetched(false);

      // Set initial member data with "Loading" state for profiles
      const householdMembersData = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        name: 'Loading name...', // Placeholder
        isManaged: undefined   // Placeholder
      }));

      const profileIds = householdMembersData.map(member => member.profileId).filter(id => id);
      console.log(`HouseholdDashboard (Targeted Listener): Found ${householdMembersData.length} members.`);
      
      // Set members immediately with placeholders
      setMembers(householdMembersData); 

      if (householdMembersData.length === 0) {
        setIsLoadingMembers(false);
        return;
      }
      setIsLoadingMembers(false); // We have the member list

      // --- Fetch Profiles in Background ---
      try {
        let profilesData = {};
        if (profileIds.length > 0) {
          const profilesRef = collection(dbInstance, 'profiles');
          const profilesQuery = query(profilesRef, where('__name__', 'in', profileIds));
          const profilesSnap = await getDocs(profilesQuery);
          profilesSnap.docs.forEach(doc => {
            profilesData[doc.id] = doc.data();
          });
          console.log(`Fetched profile data for ${Object.keys(profilesData).length} members.`);
        }

        // Update members state with real profile data
        setMembers(prevMembers => prevMembers.map(member => {
          const profile = profilesData[member.profileId];
          return {
            ...member,
            name: profile?.name ?? `Profile Not Found`, // Clearer fallback
            isManaged: profile?.isManaged
          };
        }));
        setProfilesFetched(true);

      } catch (profileError) {
        console.error("Error fetching profiles for members (LIVE):", profileError);
        setError("Failed to load full profile details for some members.");
        setMembers(prevMembers => prevMembers.map(member => ({
          ...member,
          name: 'Error loading name',
          isManaged: undefined
        })));
        setProfilesFetched(true);
      }
    }, (err) => {
      console.error(`Error listening to members for household ${householdId}:`, err);
      if (err.code === 'permission-denied') {
        setError("You don't have permission to view members.");
      } else {
        setError("Failed to connect to real-time member updates.");
      }
      setIsLoadingMembers(false);
      setMembers([]);
    });

    // Cleanup
    return () => {
      console.log(`HouseholdDashboard: Unsubscribing TARGETED member listener for ${householdId}.`);
      unsubscribe();
    };

  }, [householdId, currentUser]); // Rerun if user or household changes
  
  // Effect to fetch initial Household Details (Remains the same)
  useEffect(() => {
    // ... (This effect is unchanged) ...
    // (It fetches household data and sets setIsLoadingHousehold)
    const fetchHouseholdData = async () => {
        if (!currentUser || !householdId) {
            setIsLoadingHousehold(false);
            if (!householdId) setIsLoadingMembers(false);
            return;
        }
        setIsLoadingHousehold(true);
        setError(prev => prev?.includes("member") ? prev : '');
        setHousehold(null);

        try {
            const dbInstance = getDb();
            if (!dbInstance) throw new Error("Database service not initialized yet.");
            console.log("Fetching household details (LIVE) for:", householdId);
            const householdRef = doc(dbInstance, 'households', householdId);
            const householdSnap = await getDoc(householdRef);

            if (householdSnap.exists()) {
                setHousehold({ id: householdSnap.id, ...householdSnap.data() });
            } else {
                console.error('Household not found (LIVE):', householdId);
                setError('Household not found.');
                setIsLoadingMembers(false);
            }
        } catch (err) {
            console.error('Failed to fetch household details (LIVE):', err);
            if (err.code === 'permission-denied') {
                setError("You don't have permission to view this household.");
            } else {
                setError('Error: Could not load household data.');
            }
            setIsLoadingMembers(false);
        } finally {
            setIsLoadingHousehold(false);
        }
    };
    fetchHouseholdData();
  }, [householdId, currentUser]);

  
  // --- NEW: Delete Profile Function ---
  const handleDeleteProfile = async (profileId, profileName) => {
      if (!isAdmin) {
          setError("You don't have permission to delete members.");
          return;
      }
      
      // Confirmation dialog
      if (!window.confirm(`Are you sure you want to delete the profile "${profileName}"? This action cannot be undone.`)) {
          return;
      }
      
      console.log(`Attempting to delete profile ${profileId} from household ${householdId}...`);
      setError(''); // Clear old errors

      try {
          const functionsInstance = getFunctionsInstance();
          if (!functionsInstance) throw new Error("Functions service not ready.");

          const deleteProfileFunc = httpsCallable(functionsInstance, 'deleteManagedProfile');
          
          const result = await deleteProfileFunc({
              profileId: profileId,
              householdId: householdId
          });

          if (result.data.success) {
              console.log("Delete successful:", result.data.message);
              // No need to do anything else! The websocket listener
              // will see the 'members' doc disappear and update the UI.
          } else {
              throw new Error(result.data.message || "Failed to delete profile.");
          }

      } catch (err) {
          console.error("Error calling deleteManagedProfile function:", err);
          setError(`Error: ${err.message}`);
      }
  };
  // --- END: Delete Profile Function ---


  // --- RENDER LOGIC ---
  const isLoading = isLoadingHousehold || (isLoadingMembers && members.length === 0 && !error);

  if (isLoading) {
    return <div className="p-8">Loading household...</div>;
  }

  if (!isLoadingHousehold && !household) {
    return <div className="p-8 text-signal-error">{error || 'Household data could not be loaded or found.'}</div>;
  }
  
  if (!household) {
      return <div className="p-8 text-text-secondary">Waiting for household data...</div>;
  }

  return (
    <div className="w-full min-h-screen p-8 bg-bg-canvas text-text-primary">
      <header className="mb-12">
        <Link to="/" className="text-sm text-action-primary hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-semibold mt-2">
          {household.name}
        </h1>
      </header>

      <main>
        {/* Member List Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Members</h2>
          {error && <p className="text-sm text-signal-error mb-4">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {isLoadingMembers && members.length === 0 && <p className="text-text-secondary col-span-full">Loading members...</p>}

            {members.length > 0 && (
              members.map(member => (
                <div key={member.id} className="bg-bg-primary p-4 rounded-lg shadow relative"> {/* Added relative positioning */}
                  
                  {/* --- NEW: Delete Button --- */}
                  {/* Show delete button if user is admin AND this is a managed profile */}
                  {isAdmin && member.isManaged === true && (
                       <button
                           onClick={() => handleDeleteProfile(member.profileId, member.name)}
                           className="absolute top-2 right-2 text-text-secondary hover:text-signal-error p-1 rounded-full hover:bg-bg-secondary"
                           aria-label={`Delete ${member.name}`}
                           title={`Delete ${member.name}`}
                       >
                           {/* Simple 'X' icon for now */}
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                           </svg>
                       </button>
                  )}
                  {/* --- END: Delete Button --- */}

                  <span className={`text-lg font-medium ${member.name.includes('...') ? 'italic text-text-secondary' : ''}`}>
                    {member.name}
                  </span>
                  <span className="block text-sm text-text-secondary capitalize">Role: {member.role || 'N/A'}</span>
                  <span className="block text-sm text-text-secondary">Points: {member.points ?? 0}</span>
                  
                  <div className="mt-2">
                      {member.isManaged === true ? (
                        <span className="text-xs font-semibold bg-bg-secondary px-2 py-0.5 rounded-full">Managed Profile</span>
                      ) : member.isManaged === false ? (
                        <span className="text-xs font-semibold bg-action-primary-faded text-action-primary px-2 py-0.5 rounded-full">Auth User</span>
                      ) : profilesFetched ? (
                        <span className="text-xs italic text-text-secondary">Profile type unknown</span>
                      ) : (
                        <span className="text-xs italic text-text-secondary">Loading type...</span>
                      )}
                  </div>
                </div>
              ))
            )}

            {!isLoadingMembers && members.length === 0 && !error.includes('member') && (
                <p className="text-text-secondary col-span-full">No members have been added to this household yet.</p>
            )}
          </div>
        </section>

        {/* Forms Section - Show only if user is an admin */}
        {isAdmin ? (
            <section>
              <h2 className="text-2xl font-semibold mb-6">Manage Household</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <InviteMemberForm householdId={householdId} />
                <CreateManagedProfileForm householdId={householdId} />
              </div>
            </section>
        ) : (
            <p className="text-text-secondary">You must be an admin to manage this household.</p>
        )}
      </main>
    </div>
  );
}

export default HouseholdDashboard;