import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
  getPendingConnectionRequests, rejectConnectionRequest,
  getSuggestedUsers, sendConnectionRequest, getUserConnections, getUserProfile,
  getSentConnectionRequests, getConnectionStatus
} from '../services/db';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

import NetworkSidebar from '../components/network/NetworkSidebar';
import InvitationCard from '../components/network/InvitationCard';
import SuggestionGrid from '../components/network/SuggestionGrid';
import Avatar from '../components/ui/Avatar';
import { Link } from 'react-router-dom';

const acceptConnectionFn = httpsCallable(functions, 'acceptConnection');

export default function Network() {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [invitations, setInvitations] = useState([]);
  const [invitationProfiles, setInvitationProfiles] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [connectionProfiles, setConnectionProfiles] = useState({});
  const [processingId, setProcessingId] = useState(null);
  // Map: userId -> 'sent' | 'received' | 'connected' | 'none'
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showConnectionsList, setShowConnectionsList] = useState(false);

  const loadData = useCallback(async () => {
    // Load active connections
    const { data: connIds } = await getUserConnections(currentUser.uid);
    setConnections(connIds || []);

    // Load profiles for connections display
    const connProfileMap = {};
    await Promise.all((connIds || []).map(async uid => {
      const { data } = await getUserProfile(uid);
      if (data) connProfileMap[uid] = data;
    }));
    setConnectionProfiles(connProfileMap);

    // Load sent requests
    const { data: sentIds } = await getSentConnectionRequests(currentUser.uid);

    // Load suggestions
    const { data: suggestedUsers } = await getSuggestedUsers(currentUser.uid, connIds, 9);
    setSuggestions(suggestedUsers || []);

    // Build the statusMap for each suggestion
    const map = {};
    const sentSet = new Set(sentIds || []);
    await Promise.all((suggestedUsers || []).map(async person => {
      if (sentSet.has(person.id)) {
        map[person.id] = 'sent';
      } else {
        // Check if they sent us a request (pending_received)
        const status = await getConnectionStatus(currentUser.uid, person.id);
        map[person.id] = status === 'pending_received' ? 'received'
                       : status === 'connected' ? 'connected'
                       : 'none';
      }
    }));
    setStatusMap(map);
    setLoading(false);
  }, [currentUser.uid]);

  useEffect(() => {
    // Real-time incoming connection requests
    const unsub = getPendingConnectionRequests(currentUser.uid, async (reqs) => {
      setInvitations(reqs);
      const profiles = {};
      await Promise.all(reqs.map(async r => {
        const { data } = await getUserProfile(r.senderId);
        if (data) profiles[r.senderId] = data;
      }));
      setInvitationProfiles(profiles);
    });

    loadData();
    return unsub;
  }, [currentUser.uid, loadData]);

  const handleAccept = async (req) => {
    setProcessingId(req.id);
    try {
      await acceptConnectionFn({ requestId: req.id });
      toast.success(`Connected with ${invitationProfiles[req.senderId]?.firstName || 'user'}!`);
      // Refresh connections list
      const { data: connIds } = await getUserConnections(currentUser.uid);
      setConnections(connIds || []);
      const connProfileMap = { ...connectionProfiles };
      const { data } = await getUserProfile(req.senderId);
      if (data) connProfileMap[req.senderId] = data;
      setConnectionProfiles(connProfileMap);
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
      setStatusMap(prev => ({ ...prev, [userId]: 'sent' }));
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
        onShowConnections={() => setShowConnectionsList(v => !v)}
        showConnections={showConnectionsList}
      />

      {/* Main Content */}
      <div className="col-span-1 md:col-span-3 space-y-5">
        
        {/* Connections List */}
        {showConnectionsList && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-800 text-lg mb-4">My Connections ({connections.length})</h2>
            {connections.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">You have no connections yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {connections.map(uid => {
                  const p = connectionProfiles[uid];
                  const name = p ? `${p.firstName} ${p.lastName}` : '...';
                  return (
                    <div key={uid} className="flex items-center gap-3 py-3">
                      <Link to={`/profile/${uid}`}>
                        <Avatar src={p?.avatarUrl} name={name} size="md" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${uid}`} className="font-semibold text-slate-900 text-sm hover:text-primary-600 transition-colors">{name}</Link>
                        <p className="text-xs text-slate-500 truncate">{p?.role || 'Member'}</p>
                      </div>
                      <Link to={`/messages?newChat=${uid}`} className="ml-auto text-xs text-primary-600 font-semibold border border-primary-200 px-3 py-1.5 rounded-full hover:bg-primary-50 transition-colors">
                        Message
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
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
            statusMap={statusMap}
            onConnect={handleConnect} 
          />
        </div>
      </div>
    </div>
  );
}
