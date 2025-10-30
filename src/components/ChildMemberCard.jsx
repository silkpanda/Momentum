// src/components/ChildMemberCard.jsx (REFACTORED for SUPABASE)

import React, { useState, useEffect } from 'react';
// FIX: Remove all Firestore imports
// import { db } from '../firebase';
// import { doc, onSnapshot } from 'firebase/firestore';
import { supabase } from '../supabaseClient'; 

// NOTE: This component is assumed to receive most data via props (member), 
// but is prepared for any necessary Supabase data lookups.

function ChildMemberCard({ member }) {
    // State is simplified to rely on prop data
    const [points, setPoints] = useState(member.points); 
    const [loading, setLoading] = useState(false);
    
    // NOTE: If this component needs real-time points, you would set up a 
    // Supabase Realtime listener here:
    // useEffect(() => {
    //   const channel = supabase.channel(`member_points:${member.profileId}`);
    //   channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'household_members', filter: `profile_id=eq.${member.profileId}` }, 
    //     (payload) => setPoints(payload.new.points)
    //   ).subscribe();
    //   return () => supabase.removeChannel(channel);
    // }, [member.profileId]);


    const handleAwardPoints = async () => {
        // This logic is complex and should use an RPC, so we stub it.
        setLoading(true);
        console.log(`[STUB] Awarding points to ${member.displayName}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        setPoints(points + 10);
        setLoading(false);
    };

    return (
        <div className="bg-bg-primary p-4 rounded-lg shadow mb-3 flex justify-between items-center">
            <div>
                <p className="font-medium text-text-primary">{member.displayName} (Child)</p>
                <p className="text-sm text-text-secondary">Current Points: {points}</p>
            </div>
            <button
                onClick={handleAwardPoints}
                disabled={loading}
                className="px-3 py-1 bg-action-success text-action-primary-inverted text-sm rounded-md hover:bg-action-success-hover disabled:opacity-50 transition duration-150"
            >
                {loading ? '...' : '+10 Points (STUB)'}
            </button>
        </div>
    );
}

export default ChildMemberCard;