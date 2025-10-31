// src/views/Dashboard.jsx (FINAL PRODUCTION VERSION: Invite Code Flow)

import React, { useEffect, useState, useCallback } from 'react';
// CRITICAL FIX: Corrected import path for useNavigate
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient'; 

import CreateHouseholdModal from '../components/CreateHouseholdModal';
import CreateOrJoinModal from '../components/CreateOrJoinModal'; // Handles the Join vs Create choice
import LoadingSpinner from '../components/LoadingSpinner'; 

function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  // State to track which modal should be visible: 'none', 'choice', 'create'
  const [modalState, setModalState] = useState('none'); 

  // Function to fetch the user's household ID using the privileged RPC.
  const checkUserProfile = useCallback(async (authId) => {
    setLoading(true);
    
    let householdId = null;

    try {
      // Step 1: Securely get the user's household ID using the privileged RPC.
      // This is the fastest, RLS-bypassing way to check if the user is attached.
      const { data: id, error: rpcError } = await supabase.rpc('get_user_household_id', { auth_id: authId });

      if (rpcError) {
        throw rpcError;
      }
      
      householdId = id; 

    } catch (err) {
      console.error('Error in initial household lookup:', err.message);
    }
    
    // 1. SUCCESS: Household found, redirect.
    if (householdId) {
      console.log("Dashboard: Household found on profile. Redirecting to:", householdId);
      navigate(`/household/${householdId}`);
      setLoading(false);
      return;
    }
    
    // 2. FAIL: No household found, show the choice screen.
    console.log("Dashboard: No household found. Showing Create/Join Choice Modal.");
    setModalState('choice');
    setLoading(false);

  }, [navigate]);


  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    checkUserProfile(currentUser.id);
    
  }, [currentUser, navigate, checkUserProfile]);


  // Handler for successful join/create action
  const handleHouseholdActionSuccess = (householdId) => {
      setModalState('none'); // Hide all modals

      // CRITICAL FIX: Add a safe delay (300ms) to guarantee the database 
      // commit finishes before the front-end runs the profile check.
      setTimeout(() => {
          console.log("Timeout complete. Re-checking profile for redirection...");
          checkUserProfile(currentUser.id); // Re-run check to trigger redirect
      }, 300); 
  };
  
  // --- RENDERING LOGIC ---

  if (loading) {
    return <LoadingSpinner text="Checking Profile Status..." />;
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-canvas">
      
      {/* 1. Create OR Join Choice Modal */}
      <CreateOrJoinModal 
        isOpen={modalState === 'choice'} 
        onClose={() => setModalState('none')} 
        onShowCreate={() => setModalState('create')} // Switches to the create modal
        onJoinSuccess={handleHouseholdActionSuccess} // Success handler for joining
      />
      
      {/* 2. Create Household Form Modal (Only shown if user chose to create one) */}
      <CreateHouseholdModal 
        isOpen={modalState === 'create'} 
        onClose={() => setModalState('choice')} // Back button goes to the choice screen
        onHouseholdCreated={handleHouseholdActionSuccess} // Success handler for creating
      />
      
      {modalState === 'none' && !loading && (
        <p className="text-text-primary">Ready to begin? Something went wrong with the initial check. Please try refreshing.</p>
      )}
    </div>
  );
}

export default Dashboard;