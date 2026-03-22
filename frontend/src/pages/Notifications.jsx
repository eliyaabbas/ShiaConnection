import { useState, useEffect } from 'react';
import { Bell, UserPlus, Heart, MessageCircle, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import { subscribeNotifications, markNotificationRead, markAllNotificationsRead, getUserProfile } from '../services/db';
import { formatDistanceToNow } from '../utils/time';
import { Link, useNavigate } from 'react-router-dom';

const NOTIF_ICONS = {
  connection_request: <UserPlus className="w-4 h-4 text-primary-600" />,
  connection_accepted: <UserPlus className="w-4 h-4 text-emerald-600" />,
  post_like: <Heart className="w-4 h-4 text-rose-500" />,
  post_comment: <MessageCircle className="w-4 h-4 text-blue-500" />,
  role_approved: <CheckCheck className="w-4 h-4 text-emerald-600" />,
  role_rejected: <CheckCheck className="w-4 h-4 text-red-500" />,
};

export default function Notifications() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const unsub = subscribeNotifications(currentUser.uid, async (notifs) => {
      setNotifications(notifs);
      setLoading(false);
      // Fetch profiles for sender ids
      const profileMap = {};
      await Promise.all(
        notifs
          .filter(n => n.senderId && !profiles[n.senderId])
          .map(async n => {
            const { data } = await getUserProfile(n.senderId);
            if (data) profileMap[n.senderId] = data;
          })
      );
      setProfiles(prev => ({ ...prev, ...profileMap }));
    });
    return unsub;
  }, [currentUser.uid]);

  const handleRead = async (notif) => {
    if (!notif.read) await markNotificationRead(currentUser.uid, notif.id);
    // Navigate to relevant content
    if (notif.type === 'connection_request' || notif.type === 'connection_accepted') {
      navigate(`/profile/${notif.senderId}`);
    } else if (notif.type === 'post_like' || notif.type === 'post_comment') {
      // Navigate to feed (post scroll not implemented, but feed is the right page)
      navigate('/');
    } else if (notif.senderId) {
      navigate(`/profile/${notif.senderId}`);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    await markAllNotificationsRead(currentUser.uid);
    setMarkingAll(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-500 mt-0.5">{unreadCount} new notification{unreadCount !== 1 ? 's' : ''}</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAll} disabled={markingAll}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 disabled:opacity-50">
              {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              Mark all read
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="divide-y divide-slate-100">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="font-bold text-slate-700 text-lg">You're all caught up!</h3>
            <p className="text-slate-400 text-sm mt-1">New notifications will appear here.</p>
          </div>
        )}

        {/* Notification List */}
        <div className="divide-y divide-slate-100">
          {notifications.map(notif => {
            const senderProfile = profiles[notif.senderId];
            const senderName = senderProfile ? `${senderProfile.firstName} ${senderProfile.lastName}` : 'Someone';
            const time = notif.createdAt?.seconds ? formatDistanceToNow(notif.createdAt.seconds * 1000) : '';

            return (
              <div
                key={notif.id}
                onClick={() => handleRead(notif)}
                className={`flex items-start gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-primary-50/40' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar src={senderProfile?.avatarUrl} name={senderName} size="md" />
                  <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    {NOTIF_ICONS[notif.type] || <Bell className="w-3.5 h-3.5 text-slate-400" />}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">
                    <span className="font-bold text-slate-900">{senderName}</span>{' '}
                    {notif.message || 'sent you a notification.'}
                  </p>
                  {time && <p className="text-xs text-slate-400 mt-1">{time}</p>}
                </div>
                {!notif.read && (
                  <div className="w-2.5 h-2.5 bg-primary-500 rounded-full flex-shrink-0 mt-1.5"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
