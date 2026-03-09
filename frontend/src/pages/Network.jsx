import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
  getPendingConnectionRequests, rejectConnectionRequest,
  getSuggestedUsers, sendConnectionRequest, getUserConnections, getUserProfile
} from '../services/db';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

import NetworkSidebar from '../components/network/NetworkSidebar';
import InvitationCard from '../components/network/InvitationCard';
import SuggestionGrid from '../components/network/SuggestionGrid';

const acceptConnectionFn = httpsCallable(functions, 'acceptConnection');

export default function Network() {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [invitations, setInvitations] = useState([]);
  const [invitationProfiles, setInvitationProfiles] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time connection requests
    const unsub = getPendingConnectionRequests(currentUser.uid, async (reqs) => {
      setInvitations(reqs);
      // Fetch sender profiles
      const profiles = {};
      await Promise.all(reqs.map(async r => {
        const { data } = await getUserProfile(r.senderId);
        if (data) profiles[r.senderId] = data;
      }));
      setInvitationProfiles(profiles);
    });

    const loadSuggestions = async () => {
      const { data: connIds } = await getUserConnections(currentUser.uid);
      setConnections(connIds || []);
      const { data } = await getSuggestedUsers(currentUser.uid, connIds, 9);
      setSuggestions(data || []);
      setLoading(false);
    };

    loadSuggestions();
    return unsub;
  }, [currentUser.uid]);

  const handleAccept = async (req) => {
    setProcessingId(req.id);
    try {
      await acceptConnectionFn({ requestId: req.id });
      toast.success(`Connected with ${invitationProfiles[req.senderId]?.firstName || 'user'}!`);
    } catch (err) {
      toast.error('Failed to accept: ' + err.message);
    }
    setProcessingId(null);
  };

  const handleReject = async (req) => {
    setProcessingId(req.id + '_reject');
    const { success } = await rejectConnectionRequest(req.id);
    if (!success) toast.error('Failed to reject request');
    setProcessingId(null);
  };

  const handleConnect = async (userId) => {
    const { success, error } = await sendConnectionRequest(currentUser.uid, userId);
    if (success) {
      setSentRequests(prev => new Set([...prev, userId]));
      toast.success('Connection request sent!');
    } else {
      toast.error(error || 'Failed to send request');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      {/* Left Sidebar */}
      <NetworkSidebar 
        connectionsCount={connections.length} 
        invitationsCount={invitations.length} 
      />

      {/* Main Content */}
      <div className="col-span-1 md:col-span-3 space-y-5">
        
        {/* Invitations */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
            <h2 className="font-semibold text-slate-800 text-lg">
              Invitations {invitations.length > 0 && <span className="text-sm bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full ml-2">{invitations.length}</span>}
            </h2>
          </div>
          
          <div className="space-y-4">
            {invitations.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No pending invitations.</p>
            )}
            {invitations.map(invite => (
              <InvitationCard 
                key={invite.id} 
                invite={invite} 
                senderProfile={invitationProfiles[invite.senderId]} 
                isProcessing={processingId === invite.id || processingId === invite.id + '_reject'} 
                onAccept={handleAccept} 
                onReject={handleReject} 
              />
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-800 text-lg mb-4">People you may know</h2>
          <SuggestionGrid 
            loading={loading} 
            suggestions={suggestions} 
            sentRequests={sentRequests} 
            onConnect={handleConnect} 
          />
        </div>
      </div>
    </div>
  );
}
