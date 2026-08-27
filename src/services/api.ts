import {
  Client,
  Vehicule,
  Place,
  Stationnement,
  Paiement,
  MouvementPortefeuille,
  ParametresApp,
  DashboardStats,
  KospamStats,
  TestResult,
  CategorieVehicule,
  ModePaiement,
} from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

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

  return res.json() as Promise<T>;
}

export const api = {
  // Stats
  getStats: () => request<DashboardStats>('/api/stats'),
  getStatsDashboard: () => request<DashboardStats>('/api/stats'),
  getKospamStats: () => request<KospamStats>('/api/kospam/stats'),
  getStatsKospam: () => request<KospamStats>('/api/kospam/stats'),
  getTests: () => request<TestResult[]>('/api/tests/run'),
  resetDb: () => request<{ success: boolean; message: string }>('/api/db/reset', { method: 'POST' }),

  // Parametres
  getParametres: () => request<ParametresApp>('/api/parametres'),
  updateParametres: (params: Partial<ParametresApp>) =>
    request<ParametresApp>('/api/parametres', {
      method: 'PUT',
      body: JSON.stringify(params),
    }),

  // Clients
  getClients: () => request<Client[]>('/api/clients'),
  createClient: (client: Omit<Client, 'id_client'>) =>
    request<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    }),
  updateClient: (id: string, updates: Partial<Client>) =>
    request<Client>(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteClient: (id: string) =>
    request<{ success: boolean }>(`/api/clients/${id}`, {
      method: 'DELETE',
    }),

  // Vehicules
  getVehicules: () => request<Vehicule[]>('/api/vehicules'),
  createVehicule: (vehicule: Omit<Vehicule, 'id_vehicule'>) =>
    request<Vehicule>('/api/vehicules', {
      method: 'POST',
      body: JSON.stringify(vehicule),
    }),
  updateVehicule: (id: string, updates: Partial<Vehicule>) =>
    request<Vehicule>(`/api/vehicules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteVehicule: (id: string) =>
    request<{ success: boolean }>(`/api/vehicules/${id}`, {
      method: 'DELETE',
    }),

  // Places
  getPlaces: () => request<Place[]>('/api/places'),
  createPlace: (place: Omit<Place, 'id_place'> | string) =>
    request<Place>('/api/places', {
      method: 'POST',
      body: JSON.stringify(typeof place === 'string' ? { numero_place: place } : place),
    }),
  updatePlace: (id: string, updates: Partial<Place>) =>
    request<Place>(`/api/places/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deletePlace: (id: string) =>
    request<{ success: boolean }>(`/api/places/${id}`, {
      method: 'DELETE',
    }),

  // Stationnements
  getStationnements: () => request<Stationnement[]>('/api/stationnements'),
  enregistrerEntree: (payload: {
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
    id_place?: string;
    observation?: string;
  }) =>
    request<Stationnement>('/api/stationnements/entree', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  enregistrerSortie: (payload: {
    id_stationnement: string;
    date_sortie?: string;
    heure_sortie?: string;
    paiement?: {
      montant: number;
      mode_paiement: ModePaiement;
      reference?: string;
      observation?: string;
    };
  }) =>
    request<Stationnement>('/api/stationnements/sortie', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Paiements
  getPaiements: () => request<Paiement[]>('/api/paiements'),
  enregistrerPaiement: (payload: {
    id_stationnement: string;
    montant: number;
    mode_paiement: ModePaiement;
    reference?: string;
    observation?: string;
  }) =>
    request<Paiement>('/api/paiements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deletePaiement: (id_paiement: string) =>
    request<{ success: boolean }>(`/api/paiements/${id_paiement}`, {
      method: 'DELETE',
    }),

  // Portefeuille
  getPortefeuille: () =>
    request<{
      mouvements: MouvementPortefeuille[];
      solde: number;
      total_encaisse: number;
      total_depense: number;
    }>('/api/portefeuille'),
  ajouterMouvementPortefeuille: (payload: {
    type_mouvement: 'Encaissement parking' | 'Dépense' | 'Autre entrée' | 'Autre sortie';
    reference?: string;
    entree: number;
    sortie: number;
    motif: string;
    observation?: string;
  }) =>
    request<MouvementPortefeuille>('/api/portefeuille/mouvement', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Reports
  getRapports: (filters?: { periode?: string; date_debut?: string; date_fin?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
    }
    return request<any>(`/api/rapports?${params.toString()}`);
  },
  getReports: (filters: {
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
    return request<{
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
  },
};
