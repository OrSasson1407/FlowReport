import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Bell, 
  CheckCheck, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Inbox,
  Lock,
  Unlock,
  LogOut
} from 'lucide-react';
import { User, ReportCycle, AppNotification } from '../types';

interface HeaderProps {
  currentView: 'employee' | 'manager' | 'executive';
  activePersona: User;
  currentCycle: ReportCycle;
  saveStatus?: string;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onClearNotifications: () => void;
  onLogout: () => void;
}

export default function Header({
  currentView,
  activePersona,
  currentCycle,
  saveStatus = "All changes synced",
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onClearNotifications,
  onLogout,
}: HeaderProps) {
  const [timeLeft, setTimeLeft] = useState('06h 22m 14s');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-close dropdown on outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simple countdown simulator
  useEffect(() => {
    const interval = setInterval(() => {
      const hours = Math.floor(Math.random() * 2) + 4;
      const mins = Math.floor(Math.random() * 59);
      const secs = Math.floor(Math.random() * 59);
      setTimeLeft(`${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getViewTitle = () => {
    switch (currentView) {
      case 'employee':
        return {
          title: 'Weekly Performance Report',
          subtitle: 'Distraction-free atomic status workspace',
          badge: 'Drafting Mode',
        };
      case 'manager':
        return {
          title: 'Direct Reports Review Queue',
          subtitle: 'Synthesize direct reports and write your team summary',
          badge: '4/5 Compiled',
        };
      case 'executive':
        return {
          title: 'Executive Control Center',
          subtitle: 'Cross-organizational compliance rates and escalated blockers',
          badge: 'CEO Overview',
        };
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'ALERT':
        return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  const info = getViewTitle();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header
      id="flowreport-header"
      className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 relative"
    >
      {/* Left section: Breadcrumb and title */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {currentView}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-[#1e3a8a] bg-blue-50/75 px-2 py-0.5 rounded border border-blue-100">
            {info.badge}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5 max-w-sm md:max-w-md">
          {info.subtitle}
        </p>
      </div>

      {/* Right section: Actions, Cycle tracker, Countdown, and Notifications dropdown */}
      <div className="flex items-center gap-4">
        {/* Save Status */}
        {currentView === 'employee' && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Current Cycle Period */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-semibold leading-none">
              CYCLE WEEK {currentCycle.weekNumber}
            </span>
            <span className="text-xs font-medium text-slate-700 leading-none mt-1">
              June 22 - June 26, 2026
            </span>
          </div>
        </div>

        {/* Cycle Heartbeat / Deadline Indicator */}
        <div className="flex items-center gap-2 bg-amber-50/70 border border-amber-200/60 rounded-lg px-2.5 py-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-700 font-semibold leading-none">
              CYCLE LOCKS IN
            </span>
            <span className="text-xs font-mono font-bold text-amber-800 leading-none mt-1">
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-all duration-200 focus:outline-none"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef} id="notification-center-trigger">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg border border-slate-200 transition-all duration-200 relative focus:outline-none"
            aria-label="Notification center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center leading-none">
                  {unreadCount}
                </span>
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div 
              id="notification-dropdown-menu"
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-50 flex flex-col max-h-[480px] overflow-hidden transition-all duration-200"
            >
              {/* Dropdown Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] text-slate-500 mt-0.5 inline-block">
                      {unreadCount} unread update{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all text-xs flex items-center gap-1 font-medium"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px]">Read All</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={onClearNotifications}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all text-xs flex items-center gap-1 font-medium"
                      title="Clear notifications"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px]">Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List Content */}
              <div className="overflow-y-auto divide-y divide-slate-100 max-h-[380px] min-h-[120px]">
                {notifications.length === 0 ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2.5">
                      <Inbox className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600">
                      All caught up!
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No recent report status updates.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 flex gap-3 transition-colors duration-150 relative ${
                        notif.isRead ? 'bg-white hover:bg-slate-50/50' : 'bg-blue-50/30 hover:bg-blue-50/50'
                      }`}
                    >
                      {/* Left side type icon */}
                      <div className="mt-0.5 shrink-0">
                        {getNotifIcon(notif.type)}
                      </div>

                      {/* Content middle */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {notif.title}
                          </p>
                          <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap">
                            {formatTimestamp(notif.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-normal mt-1 leading-relaxed break-words">
                          {notif.message}
                        </p>
                      </div>

                      {/* Actions right (Mark single read) */}
                      {!notif.isRead && (
                        <button
                          onClick={() => onMarkNotificationRead(notif.id)}
                          className="absolute right-3 top-3.5 p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                          title="Mark as read"
                        >
                          <span className="block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Quick Persona Swap Context banner */}
              <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
                Tip: Actions trigger updates in real-time. Try submitting or approving!
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}