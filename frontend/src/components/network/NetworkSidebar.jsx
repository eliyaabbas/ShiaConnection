export default function NetworkSidebar({ connectionsCount, invitationsCount, onShowConnections, showConnections }) {
  return (
    <div className="hidden md:block col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm p-4 h-fit">
      <h3 className="font-semibold text-slate-800 mb-4 px-1">Manage my network</h3>
      <ul className="space-y-0.5">
        <li
          onClick={onShowConnections}
          className={`flex justify-between items-center px-2 py-2 hover:bg-slate-50 cursor-pointer rounded-lg text-sm transition-colors ${showConnections ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-600'}`}
        >
          <span>Connections</span><span className="font-semibold">{connectionsCount}</span>
        </li>
        <li className="flex justify-between items-center px-2 py-2 text-slate-600 hover:bg-slate-50 cursor-pointer rounded-lg text-sm transition-colors">
          <span>Invitations</span><span className="font-semibold">{invitationsCount}</span>
        </li>
      </ul>
    </div>
  );
}
