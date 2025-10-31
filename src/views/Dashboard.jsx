// src/views/Dashboard.jsx (Complete & Updated)

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient'; 
import CreateHouseholdModal from '../components/CreateHouseholdModal';
import LoadingSpinner from '../components/LoadingSpinner'; 

function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Function to fetch the user's profile data
  const checkUserProfile = useCallback(async (authId) => {
    setLoading(true);
    
    let householdId = null;

    try {
      // CRITICAL FIX: Replace SELECT with RPC call to bypass RLS recursion.
      console.log("Calling Supabase RPC: get_user_household_id to bypass RLS");
      
      const { data: id, error: rpcError } = await supabase.rpc('get_user_household_id', { auth_id: authId });

      if (rpcError) {
        throw rpcError;
      }
      
      // The RPC returns the household UUID or NULL
      householdId = id; 

    } catch (err) {
      console.error('Error fetching profile:', err.message);
      // We still try to proceed even if the RPC fails, assuming no household found
    }

    if (householdId) {
      // SUCCESS: Profile exists and has a householdId. Navigate directly.
      console.log("Dashboard: Household found on profile. Redirecting to:", householdId);
      navigate(`/household/${householdId}`);
    } else {
      // FAIL: No profile found, or householdId is null. Prompt for creation.
      console.log("Dashboard: No household found. Showing Create Household Modal.");
      setShowModal(true);
    }

    setLoading(false);
  }, [navigate]);


  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    checkUserProfile(currentUser.id);
    
  }, [currentUser, navigate, checkUserProfile]);

  // --- RENDERING LOGIC ---
  if (loading) {
    return <LoadingSpinner text="Checking Profile Status..." />;
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-canvas">
      <CreateHouseholdModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        // Re-run the check to trigger the new, successful lookup and redirect
        onHouseholdCreated={() => {
          setShowModal(false);
          checkUserProfile(currentUser.id);
        }}
      />
      {!showModal && (
        <p className="text-text-primary">Ready to begin? Something went wrong with the initial check. Please try refreshing.</p>
      )}
    </div>
  );
}

export default Dashboard;