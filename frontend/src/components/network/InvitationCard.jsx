import { X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar';

export default function InvitationCard({ invite, senderProfile, isProcessing, onAccept, onReject }) {
  const senderName = senderProfile ? `${senderProfile.firstName} ${senderProfile.lastName}` : 'Loading...';

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link to={`/profile/${invite.senderId}`}>
          <Avatar src={senderProfile?.avatarUrl} name={senderName} size="lg" />
        </Link>
        <div>
          <Link to={`/profile/${invite.senderId}`} className="font-bold text-slate-900 text-sm hover:text-primary-600 transition-colors">
            {senderName}
          </Link>
          <p className="text-xs text-slate-500">{senderProfile?.role || 'Member'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onReject(invite)} disabled={isProcessing}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full disabled:opacity-50">
          <X className="w-4 h-4" />
        </button>
        <button onClick={() => onAccept(invite)} disabled={isProcessing}
          className="px-4 py-1.5 border-2 border-primary-600 text-primary-600 font-bold rounded-full hover:bg-primary-50 transition-colors disabled:opacity-50 text-sm flex items-center gap-1.5">
          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Accept'}
        </button>
      </div>
    </div>
  );
}
