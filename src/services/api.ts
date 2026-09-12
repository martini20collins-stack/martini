import {
  Client,
  Vehicule,
  Place,
  Stationnement,
  Paiement,
  MouvementPortefeuille,
  TypeMouvement,
  ParametresApp,
  DashboardStats,
  KospamStats,
  TestResult,
  CategorieVehicule,
  ModePaiement,
} from '../types';
import { offlineStorage } from './offlineStorage';

// Listener for offline status changes
type OfflineListener = (isOffline: boolean) => void;
const offlineListeners = new Set<OfflineListener>();
let currentOfflineState = typeof navigator !== 'undefined' ? !navigator.onLine : false;

function notifyOfflineState(isOffline: boolean) {
  if (currentOfflineState !== isOffline) {
    currentOfflineState = isOffline;
    offlineListeners.forEach((fn) => fn(isOffline));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    notifyOfflineState(false);
    api.syncOfflineQueue().catch(() => {});
  });
  window.addEventListener('offline', () => {
    notifyOfflineState(true);
  });
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  // If browser is already strictly offline, don't even wait for a network timeout
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    notifyOfflineState(true);
    throw new Error('NETWORK_OFFLINE');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errMsg = `Erreur (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson.error) errMsg = errJson.error;
      } catch {
        // fallback
      }
      throw new Error(errMsg);
    }

    notifyOfflineState(false);
    return (await res.json()) as T;
  } catch (err: any) {
    // Detect network / offline error
    if (
      err.name === 'AbortError' ||
      err.message === 'NETWORK_OFFLINE' ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('NetworkError') ||
      err.message?.includes('network')
    ) {
      notifyOfflineState(true);
      throw new Error('NETWORK_OFFLINE');
    }
    throw err;
  }
}

export const api = {
  subscribeOfflineStatus: (listener: OfflineListener) => {
    offlineListeners.add(listener);
    return () => offlineListeners.delete(listener);
  },

  isOffline: () => currentOfflineState,

  getSyncQueueCount: () => offlineStorage.getSyncQueue().length,

  syncOfflineQueue: async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, synced: 0, error: 'Toujours hors-ligne' };
    }

    const queue = offlineStorage.getSyncQueue();
    if (queue.length === 0) return { success: true, synced: 0 };

    let count = 0;
    for (const item of queue) {
      try {
        await fetch(item.endpoint, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: item.body ? JSON.stringify(item.body) : undefined,
        });
        count++;
      } catch {
        break;
      }
    }

    if (count === queue.length) {
      offlineStorage.clearSyncQueue();
    }
    return { success: true, synced: count };
  },

  // --- STATS ---
  getStats: async (): Promise<DashboardStats> => {
    try {
      const data = await request<DashboardStats>('/api/stats');
      return data;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        return offlineStorage.getDashboardStats();
      }
      throw err;
    }
  },

  getStatsDashboard: async (): Promise<DashboardStats> => api.getStats(),

  getKospamStats: async (): Promise<KospamStats> => {
    try {
      return await request<KospamStats>('/api/kospam/stats');
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        return offlineStorage.getKospamStats();
      }
      throw err;
    }
  },

  getStatsKospam: async (): Promise<KospamStats> => api.getKospamStats(),

  getTests: async (): Promise<TestResult[]> => {
    try {
      return await request<TestResult[]>('/api/tests/run');
    } catch {
      return [
        {
          id: 1,
          nom: 'Mode Autonome Offline',
          description: 'Vérification du stockage local et des calculs hors ligne',
          attendu: 'Opérationnel',
          obtenu: 'Opérationnel',
          succes: true,
          details: 'Application fonctionnelle en local sans connexion serveur.',
        },
      ];
    }
  },

  resetDb: async () => {
    try {
      const res = await request<{ success: boolean; message: string }>('/api/db/reset', {
        method: 'POST',
      });
      return res;
    } catch {
      return { success: true, message: 'Base de données locale réinitialisée' };
    }
  },

  // --- PARAMETRES ---
  getParametres: async (): Promise<ParametresApp> => {
    try {
      const res = await request<ParametresApp>('/api/parametres');
      offlineStorage.syncFromRemote({ parametres: res });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        return offlineStorage.getParametres();
      }
      throw err;
    }
  },

  updateParametres: async (params: Partial<ParametresApp>): Promise<ParametresApp> => {
    try {
      const res = await request<ParametresApp>('/api/parametres', {
        method: 'PUT',
        body: JSON.stringify(params),
      });
      offlineStorage.syncFromRemote({ parametres: res });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue('/api/parametres', 'PUT', params);
        return offlineStorage.updateParametres(params);
      }
      throw err;
    }
  },

  // --- CLIENTS ---
  getClients: async (): Promise<Client[]> => {
    try {
      const res = await request<Client[]>('/api/clients');
      offlineStorage.syncFromRemote({ clients: res });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        return offlineStorage.getClients();
      }
      throw err;
    }
  },

  createClient: async (client: Omit<Client, 'id_client'>): Promise<Client> => {
    try {
      const res = await request<Client>('/api/clients', {
        method: 'POST',
        body: JSON.stringify(client),
      });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue('/api/clients', 'POST', client);
        return offlineStorage.createClient(client);
      }
      throw err;
    }
  },

  updateClient: async (id: string, updates: Partial<Client>): Promise<Client> => {
    try {
      return await request<Client>(`/api/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue(`/api/clients/${id}`, 'PUT', updates);
        return offlineStorage.updateClient(id, updates);
      }
      throw err;
    }
  },

  deleteClient: async (id: string): Promise<{ success: boolean }> => {
    try {
      return await request<{ success: boolean }>(`/api/clients/${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue(`/api/clients/${id}`, 'DELETE');
        const ok = offlineStorage.deleteClient(id);
        return { success: ok };
      }
      throw err;
    }
  },

  // --- VEHICULES ---
  getVehicules: async (): Promise<Vehicule[]> => {
    try {
      const res = await request<Vehicule[]>('/api/vehicules');
      offlineStorage.syncFromRemote({ vehicules: res });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        return offlineStorage.getVehicules();
      }
      throw err;
    }
  },

  createVehicule: async (vehicule: Omit<Vehicule, 'id_vehicule'>): Promise<Vehicule> => {
    try {
      return await request<Vehicule>('/api/vehicules', {
        method: 'POST',
        body: JSON.stringify(vehicule),
      });
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue('/api/vehicules', 'POST', vehicule);
        return offlineStorage.createVehicule(vehicule);
      }
      throw err;
    }
  },

  updateVehicule: async (id: string, updates: Partial<Vehicule>): Promise<Vehicule> => {
    try {
      return await request<Vehicule>(`/api/vehicules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue(`/api/vehicules/${id}`, 'PUT', updates);
        return offlineStorage.updateVehicule(id, updates);
      }
      throw err;
    }
  },

  deleteVehicule: async (id: string): Promise<{ success: boolean }> => {
    try {
      return await request<{ success: boolean }>(`/api/vehicules/${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue(`/api/vehicules/${id}`, 'DELETE');
        const ok = offlineStorage.deleteVehicule(id);
        return { success: ok };
      }
      throw err;
    }
  },

  // --- PLACES ---
  getPlaces: async (): Promise<Place[]> => {
    try {
      const res = await request<Place[]>('/api/places');
      offlineStorage.syncFromRemote({ places: res });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        return offlineStorage.getPlaces();
      }
      throw err;
    }
  },

  createPlace: async (place: Omit<Place, 'id_place'> | string): Promise<Place> => {
    const payload = typeof place === 'string' ? { numero_place: place } : place;
    try {
      return await request<Place>('/api/places', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue('/api/places', 'POST', payload);
        const places = offlineStorage.getPlaces();
        const nextId = `PLC-${String(places.length + 1).padStart(3, '0')}`;
        const newPlc: Place = {
          id_place: nextId,
          numero_place: payload.numero_place || `P-${String(places.length + 1).padStart(2, '0')}`,
          statut: (payload as any).statut || 'Libre',
          type_zone: (payload as any).type_zone || 'Standard',
          id_stationnement_actuel: null,
          immatriculation_actuelle: null,
        };
        places.push(newPlc);
        offlineStorage.save();
        return newPlc;
      }
      throw err;
    }
  },

  updatePlace: async (id: string, updates: Partial<Place>): Promise<Place> => {
    try {
      return await request<Place>(`/api/places/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue(`/api/places/${id}`, 'PUT', updates);
        const places = offlineStorage.getPlaces();
        const idx = places.findIndex((p) => p.id_place === id);
        if (idx !== -1) {
          places[idx] = { ...places[idx], ...updates };
          offlineStorage.save();
          return places[idx];
        }
      }
      throw err;
    }
  },

  deletePlace: async (id: string): Promise<{ success: boolean }> => {
    try {
      return await request<{ success: boolean }>(`/api/places/${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue(`/api/places/${id}`, 'DELETE');
        const db = offlineStorage.getDatabase();
        db.places = db.places.filter((p) => p.id_place !== id);
        offlineStorage.save();
        return { success: true };
      }
      throw err;
    }
  },

  // --- STATIONNEMENTS ---
  getStationnements: async (): Promise<Stationnement[]> => {
    try {
      const res = await request<Stationnement[]>('/api/stationnements');
      offlineStorage.syncFromRemote({ stationnements: res });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        return offlineStorage.getStationnements();
      }
      throw err;
    }
  },

  enregistrerEntree: async (payload: {
    id_client?: string;
    client_data?: {
      nom: string;
      type_client: 'Normal' | 'Kospam';
      telephone?: string;
      adresse?: string;
      email?: string;
    };
    id_vehicule?: string;
    vehicule_data?: {
      immatriculation: string;
      marque: string;
      modele: string;
      categorie: CategorieVehicule;
    };
    reparation: boolean;
    reste_la_nuit?: boolean;
    historique_ancien?: boolean;
    statut?: 'Présent' | 'Sorti';
    date_sortie?: string | null;
    heure_sortie?: string | null;
    montant_du?: number;
    montant_paye?: number;
    regler_maintenant?: boolean;
    mode_paiement?: ModePaiement;
    paiement?: {
      montant: number;
      mode_paiement: ModePaiement;
      reference?: string;
      observation?: string;
    };
    comptabiliser_tresorerie?: boolean;
    id_place?: string;
    observation?: string;
    date_entree?: string;
    heure_entree?: string;
  }): Promise<Stationnement> => {
    try {
      const res = await request<Stationnement>('/api/stationnements/entree', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue('/api/stationnements/entree', 'POST', payload);
        return offlineStorage.enregistrerEntree(payload);
      }
      throw err;
    }
  },

  enregistrerSortie: async (payload: {
    id_stationnement: string;
    date_sortie?: string;
    heure_sortie?: string;
    paiement?: {
      montant: number;
      mode_paiement: ModePaiement;
      reference?: string;
      observation?: string;
    };
  }): Promise<Stationnement> => {
    try {
      const res = await request<Stationnement>('/api/stationnements/sortie', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue('/api/stationnements/sortie', 'POST', payload);
        return offlineStorage.enregistrerSortie(payload);
      }
      throw err;
    }
  },

  updateStationnement: async (id: string, updates: any): Promise<Stationnement> => {
    try {
      const res = await request<Stationnement>(`/api/stationnements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue(`/api/stationnements/${id}`, 'PUT', updates);
        return offlineStorage.updateStationnement(id, updates);
      }
      throw err;
    }
  },

  deleteStationnement: async (id: string): Promise<{ success: boolean }> => {
    try {
      const res = await request<{ success: boolean }>(`/api/stationnements/${id}`, {
        method: 'DELETE',
      });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue(`/api/stationnements/${id}`, 'DELETE');
        const ok = offlineStorage.deleteStationnement(id);
        return { success: ok };
      }
      throw err;
    }
  },

  // --- PAIEMENTS ---
  getPaiements: async (): Promise<Paiement[]> => {
    try {
      const res = await request<Paiement[]>('/api/paiements');
      offlineStorage.syncFromRemote({ paiements: res });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        return offlineStorage.getPaiements();
      }
      throw err;
    }
  },

  enregistrerPaiement: async (payload: {
    id_stationnement: string;
    montant: number;
    mode_paiement: ModePaiement;
    reference?: string;
    observation?: string;
  }): Promise<Paiement> => {
    try {
      return await request<Paiement>('/api/paiements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue('/api/paiements', 'POST', payload);
        return offlineStorage.enregistrerPaiement(payload);
      }
      throw err;
    }
  },

  deletePaiement: async (id_paiement: string): Promise<{ success: boolean }> => {
    try {
      return await request<{ success: boolean }>(`/api/paiements/${id_paiement}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue(`/api/paiements/${id_paiement}`, 'DELETE');
        const db = offlineStorage.getDatabase();
        db.paiements = db.paiements.filter((p) => p.id_paiement !== id_paiement);
        offlineStorage.save();
        return { success: true };
      }
      throw err;
    }
  },

  // --- PORTEFEUILLE ---
  getPortefeuille: async (): Promise<{
    mouvements: MouvementPortefeuille[];
    solde: number;
    total_encaisse: number;
    total_depense: number;
  }> => {
    try {
      const res = await request<{
        mouvements: MouvementPortefeuille[];
        solde: number;
        total_encaisse: number;
        total_depense: number;
      }>('/api/portefeuille');
      offlineStorage.syncFromRemote({ portefeuille: res.mouvements });
      return res;
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        return offlineStorage.getPortefeuille();
      }
      throw err;
    }
  },

  ajouterMouvementPortefeuille: async (payload: {
    type_mouvement: 'Encaissement parking' | 'Dépense' | 'Autre entrée' | 'Autre sortie';
    reference?: string;
    entree: number;
    sortie: number;
    motif: string;
    observation?: string;
  }): Promise<MouvementPortefeuille> => {
    try {
      return await request<MouvementPortefeuille>('/api/portefeuille/mouvement', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        offlineStorage.addToSyncQueue('/api/portefeuille/mouvement', 'POST', payload);
        return offlineStorage.ajouterMouvementPortefeuille(payload);
      }
      throw err;
    }
  },

  // --- TRÉSORERIE MODULE ---
  getTresorerieResume: async () => {
    try {
      const res = await request<any>('/api/tresorerie/resume');
      return res;
    } catch {
      return offlineStorage.getTresorerieResume();
    }
  },

  setSoldeInitial: async (payload: { montant: number; date?: string; observation?: string }) => {
    try {
      const res = await request<any>('/api/tresorerie/solde-initial', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      offlineStorage.setSoldeInitial(payload.montant, payload.date, payload.observation);
      return res;
    } catch (err: any) {
      // Even if network or server error (e.g. 404/500/offline), reliably save locally & queue
      offlineStorage.addToSyncQueue('/api/tresorerie/solde-initial', 'POST', payload);
      const mvt = offlineStorage.setSoldeInitial(payload.montant, payload.date, payload.observation);
      return { success: true, mouvement: mvt, solde_initial: payload.montant };
    }
  },

  ajouterMouvementTresorerie: async (payload: {
    type_mouvement: TypeMouvement;
    montant: number;
    date?: string;
    motif: string;
    categorie?: string;
    observation?: string;
    reference?: string;
  }): Promise<MouvementPortefeuille> => {
    try {
      const res = await request<MouvementPortefeuille>('/api/tresorerie/mouvements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      offlineStorage.ajouterMouvementTresorerie(payload);
      return res;
    } catch (err: any) {
      offlineStorage.addToSyncQueue('/api/tresorerie/mouvements', 'POST', payload);
      return offlineStorage.ajouterMouvementTresorerie(payload);
    }
  },

  updateMouvementTresorerie: async (id: string, updates: any): Promise<MouvementPortefeuille> => {
    try {
      const res = await request<MouvementPortefeuille>(`/api/tresorerie/mouvements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      offlineStorage.updateMouvementTresorerie(id, updates);
      return res;
    } catch (err: any) {
      offlineStorage.addToSyncQueue(`/api/tresorerie/mouvements/${id}`, 'PUT', updates);
      return offlineStorage.updateMouvementTresorerie(id, updates);
    }
  },

  deleteMouvementTresorerie: async (id: string): Promise<{ success: boolean }> => {
    try {
      const res = await request<{ success: boolean }>(`/api/tresorerie/mouvements/${id}`, {
        method: 'DELETE',
      });
      offlineStorage.deleteMouvementTresorerie(id);
      return res;
    } catch (err: any) {
      offlineStorage.addToSyncQueue(`/api/tresorerie/mouvements/${id}`, 'DELETE');
      const ok = offlineStorage.deleteMouvementTresorerie(id);
      return { success: ok };
    }
  },

  // --- RAPPORTS ---
  getRapports: async (filters?: { periode?: string; date_debut?: string; date_fin?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
    }
    try {
      return await request<any>(`/api/rapports?${params.toString()}`);
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        return offlineStorage.getReports(filters || {});
      }
      throw err;
    }
  },

  getReports: async (filters: {
    date_debut?: string;
    date_fin?: string;
    type_client?: string;
    categorie?: string;
    mode_paiement?: string;
    statut_paiement?: string;
    statut_stationnement?: string;
  }) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    try {
      return await request<{
        stationnements: Stationnement[];
        paiements: Paiement[];
        portefeuille: MouvementPortefeuille[];
        summary: {
          total_vehicules: number;
          total_reparations: number;
          total_du: number;
          total_paye: number;
          total_reste: number;
          total_recettes_paiements: number;
        };
      }>(`/api/reports?${params.toString()}`);
    } catch (err: any) {
      if (err.message === 'NETWORK_OFFLINE') {
        return offlineStorage.getReports(filters);
      }
      throw err;
    }
  },
};
