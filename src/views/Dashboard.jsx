// src/views/Dashboard.jsx (MODIFIED - FINAL REDIRECT LOOP FIX)

import React, { useEffect, useState, useRef } from 'react'; // IMPORT useRef
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateOrJoinModal from '../components/CreateOrJoinModal';

function Dashboard() {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate(); 
  
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  
  // CRITICAL FIX: Use a ref to prevent re-navigation on re-mount
  const navigatedRef = useRef(false); 
  
  // --- Data Fetcher for the user's profile ---
  const fetchProfile = async (userId) => {
    try {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`household_id`) // Only need the household ID
        .eq('auth_user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw error;
      }

      setProfile(data || null);
      
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Could not load profile data.');
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };


  // --- PRIMARY EFFECT: Initial Fetch ---
  useEffect(() => {
    // 1. Guardrail: Do not proceed if Auth is still loading or if we already navigated.
    if (authLoading || navigatedRef.current) return;
    
    // 2. Not logged in: Route protection handles this, but here for clarity.
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // 3. User is logged in. Fetch their profile to get the householdId.
    fetchProfile(currentUser.id);
    
  }, [authLoading, currentUser, navigate]); 
  
  // --- SECONDARY EFFECT: Handle Redirect AFTER Profile Load ---
  useEffect(() => {
    // Only run if profile loading is complete AND we have profile data
    if (!profileLoading && profile) {
      
      // 1. Redirect if householdId exists AND we haven't already navigated
      if (profile.household_id && !navigatedRef.current) {
        console.log(`Dashboard: Household found on profile. Redirecting to: ${profile.household_id}`);
        // Set the ref to true BEFORE navigating
        navigatedRef.current = true; 
        navigate(`/household/${profile.household_id}`, { replace: true });
        return;
      }
      
      // 2. No household ID found: Prompt the user to create/join
      // We only show the modal if we haven't already navigated (i.e., this isn't a post-login state)
      if (!profile.household_id) {
          setShowModal(true);
      }
    }
  }, [profileLoading, profile, navigate]);


  // --- Render Logic ---
  // If the ref is true, we are in the middle of a redirect, just show the spinner to prevent flicker.
  if (navigatedRef.current || authLoading || profileLoading) {
    return <LoadingSpinner text="Checking user status and household..." />;
  }

  if (error) {
    return <div className="text-signal-error p-8">{error}</div>;
  }
  
  // The rest of the component only renders if profileLoading is false and redirect didn't happen
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Welcome, {currentUser?.email}</h1>
      <p className="text-text-secondary">You must create or join a household to continue.</p>
      
      <button 
        onClick={() => setShowModal(true)}
        className="mt-4 py-2 px-4 bg-action-primary text-on-action font-semibold rounded-md hover:bg-action-primary-hover transition duration-150"
      >
        Create or Join Household
      </button>

      {/* Modal is shown if profile.household_id is null */}
      <CreateOrJoinModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        // Force a data refresh after modal completes to check for new household ID
        onHouseholdActionComplete={() => fetchProfile(currentUser.id)}
      />
    </div>
  );
}

export default Dashboard;