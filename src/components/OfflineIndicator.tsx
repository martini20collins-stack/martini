import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { api } from '../services/api';

interface OfflineIndicatorProps {
  onSyncComplete?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSyncComplete }) => {
  const isOnline = useOnlineStatus();
  const [isApiOffline, setIsApiOffline] = useState(api.isOffline());
  const [queueCount, setQueueCount] = useState(api.getSyncQueueCount());
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  useEffect(() => {
    const unsub = api.subscribeOfflineStatus((offline) => {
      setIsApiOffline(offline);
      setQueueCount(api.getSyncQueueCount());
    });

    const interval = setInterval(() => {
      setQueueCount(api.getSyncQueueCount());
    }, 4000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.syncOfflineQueue();
      if (res.success) {
        setSyncSuccess(true);
        setQueueCount(api.getSyncQueueCount());
        onSyncComplete?.();
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Erreur synchronisation:', e);
    } finally {
      setSyncing(false);
    }
  };

  const effectivelyOffline = !isOnline || isApiOffline;

  if (!effectivelyOffline && queueCount === 0 && !syncSuccess) {
    return (
      <div
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-medium text-emerald-400"
        title="Application connectée et synchronisée"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Wifi className="w-3 h-3" />
        <span>En ligne</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {effectivelyOffline ? (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold shadow-xs"
          title="Mode Hors Ligne actif : l'application fonctionne à 100% sans connexion internet. Toutes les données sont enregistrées localement."
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Mode Hors Ligne</span>
          <span className="hidden sm:inline text-[10px] text-amber-300/80 font-normal">
            (Données enregistrées localement)
          </span>
        </div>
      ) : (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold"
          title="Connecté au serveur"
        >
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>Connecté</span>
        </div>
      )}

      {queueCount > 0 && (
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          title="Synchroniser les modifications en attente avec le serveur"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          <span>{queueCount} en attente</span>
        </button>
      )}

      {syncSuccess && (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> Synchronisé
        </span>
      )}
    </div>
  );
};

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [isApiOffline, setIsApiOffline] = useState(api.isOffline());

  useEffect(() => {
    return api.subscribeOfflineStatus((offline) => {
      setIsApiOffline(offline);
    });
  }, []);

  const effectivelyOffline = !isOnline || isApiOffline;

  if (!effectivelyOffline) return null;

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-xs print:hidden">
      <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
        <WifiOff className="w-4 h-4 text-slate-950 shrink-0 animate-pulse" />
        <span className="truncate">
          <strong>Mode Autonome Hors Ligne :</strong> Aucune connexion requise. Vous pouvez continuer d'enregistrer vos entrées, sorties, paiements et tarifs normalement.
        </span>
        <span className="hidden md:inline-flex items-center gap-1 text-[11px] bg-amber-600/30 px-2 py-0.5 rounded-md shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" /> Stockage local sécurisé
        </span>
      </div>
    </div>
  );
};
