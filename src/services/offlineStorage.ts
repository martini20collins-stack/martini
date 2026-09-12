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
  CategorieVehicule,
  ModePaiement,
  TypeClient,
  BackupItem,
  BackupExportData,
} from '../types';

export interface LocalDatabaseSchema {
  clients: Client[];
  vehicules: Vehicule[];
  places: Place[];
  stationnements: Stationnement[];
  paiements: Paiement[];
  portefeuille: MouvementPortefeuille[];
  parametres: ParametresApp;
  lastUpdated?: string;
}

const STORAGE_KEY = 'PARKING_OFFLINE_DB_V1';
const QUEUE_KEY = 'PARKING_OFFLINE_SYNC_QUEUE_V1';
const CLIENT_BACKUPS_KEY = 'PARKING_OFFLINE_BACKUPS_V1';

export const DEFAULT_OFFLINE_PARAMS: ParametresApp = {
  nom_parking: 'Gestion de Parking Privé',
  capacite_totale: 999,
  nombre_total_places: 999,
  devise: 'Ariary',
  symbole_devise: 'Ar',
  telephone: '+261 34 00 000 00',
  telephone_parking: '+261 34 00 000 00',
  adresse: 'Antananarivo, Madagascar',
  adresse_parking: 'Antananarivo, Madagascar',
  email: 'contact@parking-prive.mg',
  message_bas_ticket: 'Merci de votre visite - Parking Privé Sécurisé',
  solde_initial: 0,
  date_solde_initial: new Date().toISOString().split('T')[0],
  tarifs: {
    stationnement_base: 3000,
    supplement_nuit: 5000,
    nuit_normale: 8000,
    nuit_securise: 10000,
    majoration_reparation_normal_leger: 0,
    majoration_reparation_normal_autre: 2000,
    majoration_reparation_kospam: 2000,
    normal_sans_reparation: 3000,
    normal_avec_reparation_leger: 3000,
    normal_avec_reparation_autre: 5000,
    kospam_sans_reparation: 3000,
    kospam_avec_reparation: 5000,
  },
};

function generateInitialOfflineSeed(): LocalDatabaseSchema {
  const clients: Client[] = [
    {
      id_client: 'CLI-001',
      nom: 'Jean Dupont',
      type_client: 'Normal',
      telephone: '034 11 222 33',
      adresse: 'Analakely, Antananarivo',
      email: 'jean.dupont@gmail.com',
      date_creation: '2026-08-01',
    },
    {
      id_client: 'CLI-002',
      nom: 'Garage Kospam',
      type_client: 'Kospam',
      telephone: '032 55 444 77',
      adresse: 'Zone Industrielle Akorondrano',
      email: 'contact@kospam-auto.mg',
      observation: 'Partenaire prioritaire atelier',
      date_creation: '2026-08-01',
    },
    {
      id_client: 'CLI-003',
      nom: 'Société SoaTrans',
      type_client: 'Normal',
      telephone: '033 99 888 11',
      adresse: 'Ankorondrano',
      email: 'logistique@soatrans.mg',
      date_creation: '2026-08-05',
    },
  ];

  const vehicules: Vehicule[] = [
    {
      id_vehicule: 'VEH-001',
      immatriculation: '1234 TAB',
      marque: 'Toyota',
      modele: 'Corolla',
      categorie: 'Véhicule léger',
      id_client: 'CLI-001',
      client_nom: 'Jean Dupont',
      client_type: 'Normal',
    },
    {
      id_vehicule: 'VEH-002',
      immatriculation: '5678 TAD',
      marque: 'Toyota',
      modele: 'Hilux',
      categorie: '4x4',
      id_client: 'CLI-001',
      client_nom: 'Jean Dupont',
      client_type: 'Normal',
    },
    {
      id_vehicule: 'VEH-003',
      immatriculation: '9012 TAF',
      marque: 'Renault',
      modele: 'Master',
      categorie: 'Camionnette',
      id_client: 'CLI-002',
      client_nom: 'Garage Kospam',
      client_type: 'Kospam',
    },
    {
      id_vehicule: 'VEH-004',
      immatriculation: '3456 TAG',
      marque: 'Mercedes',
      modele: 'Sprinter',
      categorie: 'Bus',
      id_client: 'CLI-003',
      client_nom: 'Société SoaTrans',
      client_type: 'Normal',
    },
  ];

  const places: Place[] = [];
  for (let i = 1; i <= 30; i++) {
    places.push({
      id_place: `PLC-${String(i).padStart(3, '0')}`,
      numero_place: `P-${String(i).padStart(2, '0')}`,
      statut: 'Libre',
      type_zone: 'Standard',
      id_stationnement_actuel: null,
      immatriculation_actuelle: null,
    });
  }

  const today = new Date().toISOString().split('T')[0];

  const stationnements: Stationnement[] = [
    {
      id_stationnement: 'ST-0001',
      id_vehicule: 'VEH-002',
      id_place: 'PLC-001',
      date_entree: today,
      heure_entree: '08:15',
      date_sortie: null,
      heure_sortie: null,
      reparation: true,
      montant_du: 5000,
      montant_paye: 2000,
      reste_a_payer: 3000,
      statut: 'Présent',
      statut_paiement: 'Partiellement payé',
      observation: 'Révision freins',
      immatriculation: '5678 TAD',
      marque: 'Toyota',
      modele: 'Hilux',
      categorie: '4x4',
      id_client: 'CLI-001',
      client_nom: 'Jean Dupont',
      client_type: 'Normal',
      numero_place: 'P-01',
    },
    {
      id_stationnement: 'ST-0002',
      id_vehicule: 'VEH-003',
      id_place: 'PLC-002',
      date_entree: today,
      heure_entree: '09:00',
      date_sortie: null,
      heure_sortie: null,
      reparation: true,
      montant_du: 5000,
      montant_paye: 5000,
      reste_a_payer: 0,
      statut: 'Présent',
      statut_paiement: 'Payé',
      observation: 'Alternateur Kospam',
      immatriculation: '9012 TAF',
      marque: 'Renault',
      modele: 'Master',
      categorie: 'Camionnette',
      id_client: 'CLI-002',
      client_nom: 'Garage Kospam',
      client_type: 'Kospam',
      numero_place: 'P-02',
    },
    {
      id_stationnement: 'ST-0003',
      id_vehicule: 'VEH-001',
      id_place: 'PLC-003',
      date_entree: today,
      heure_entree: '10:30',
      date_sortie: null,
      heure_sortie: null,
      reparation: false,
      montant_du: 3000,
      montant_paye: 0,
      reste_a_payer: 3000,
      statut: 'Présent',
      statut_paiement: 'Non payé',
      observation: 'Stationnement',
      immatriculation: '1234 TAB',
      marque: 'Toyota',
      modele: 'Corolla',
      categorie: 'Véhicule léger',
      id_client: 'CLI-001',
      client_nom: 'Jean Dupont',
      client_type: 'Normal',
      numero_place: 'P-03',
    },
  ];

  places[0].statut = 'Occupée';
  places[0].id_stationnement_actuel = 'ST-0001';
  places[0].immatriculation_actuelle = '5678 TAD';

  places[1].statut = 'Occupée';
  places[1].id_stationnement_actuel = 'ST-0002';
  places[1].immatriculation_actuelle = '9012 TAF';

  places[2].statut = 'Occupée';
  places[2].id_stationnement_actuel = 'ST-0003';
  places[2].immatriculation_actuelle = '1234 TAB';

  const paiements: Paiement[] = [
    {
      id_paiement: 'PAY-0001',
      id_stationnement: 'ST-0001',
      date_paiement: `${today} 08:20:00`,
      montant: 2000,
      mode_paiement: 'Espèces',
      reference: 'REC-001',
      observation: 'Acompte',
    },
    {
      id_paiement: 'PAY-0002',
      id_stationnement: 'ST-0002',
      date_paiement: `${today} 09:05:00`,
      montant: 5000,
      mode_paiement: 'Mobile Money',
      reference: 'MVOLA-001',
      observation: 'Paiement total',
    },
  ];

  const portefeuille: MouvementPortefeuille[] = [
    {
      id_mouvement: 'MVT-0001',
      date: `${today} 08:20:00`,
      type_mouvement: 'Encaissement parking',
      reference: 'PAY-0001',
      entree: 2000,
      sortie: 0,
      solde: 2000,
      motif: 'Paiement parking ST-0001',
      observation: 'Espèces',
      id_paiement: 'PAY-0001',
    },
    {
      id_mouvement: 'MVT-0002',
      date: `${today} 09:05:00`,
      type_mouvement: 'Encaissement parking',
      reference: 'PAY-0002',
      entree: 5000,
      sortie: 0,
      solde: 7000,
      motif: 'Paiement parking ST-0002',
      observation: 'Mobile Money',
      id_paiement: 'PAY-0002',
    },
  ];

  return {
    clients,
    vehicules,
    places,
    stationnements,
    paiements,
    portefeuille,
    parametres: DEFAULT_OFFLINE_PARAMS,
    lastUpdated: new Date().toISOString(),
  };
}

class OfflineStorageManager {
  private db: LocalDatabaseSchema;

  constructor() {
    this.db = this.init();
  }

  private init(): LocalDatabaseSchema {
    if (typeof window === 'undefined') {
      return generateInitialOfflineSeed();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LocalDatabaseSchema;
        if (
          parsed &&
          Array.isArray(parsed.clients) &&
          Array.isArray(parsed.vehicules) &&
          Array.isArray(parsed.places)
        ) {
          if (!parsed.parametres) parsed.parametres = DEFAULT_OFFLINE_PARAMS;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur lecture cache local offline:', e);
    }

    const seed = generateInitialOfflineSeed();
    this.saveDirect(seed);
    return seed;
  }

  private lastAutoBackupTime: number = 0;
  private mutationCount: number = 0;

  private saveDirect(data: LocalDatabaseSchema) {
    if (typeof window === 'undefined') return;
    try {
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Erreur écriture cache local offline:', e);
    }
  }

  public getDatabase(): LocalDatabaseSchema {
    return this.db;
  }

  public save(forceSnapshot = false) {
    this.saveDirect(this.db);
    this.mutationCount++;

    const now = Date.now();
    if (forceSnapshot || now - this.lastAutoBackupTime > 5 * 60 * 1000 || this.mutationCount >= 10) {
      try {
        this.createClientBackupSnapshot('Sauvegarde locale automatique', 'automatique');
        this.lastAutoBackupTime = now;
        this.mutationCount = 0;
      } catch (e) {
        console.warn('Erreur auto backup client:', e);
      }
    }
  }

  public createClientBackupSnapshot(
    label: string = 'Sauvegarde locale manuelle',
    type: 'automatique' | 'manuel' | 'pre_restauration' = 'manuel'
  ): BackupItem {
    const now = new Date();
    const id = `backup_local_${type}_${Date.now()}`;
    const filename = `${id}.json`;

    const counts = {
      clients: this.db.clients?.length || 0,
      vehicules: this.db.vehicules?.length || 0,
      places: this.db.places?.length || 0,
      stationnements: this.db.stationnements?.length || 0,
      paiements: this.db.paiements?.length || 0,
      mouvements: this.db.portefeuille?.length || 0,
      solde_disponible: this.getSoldePortefeuille(),
    };

    const item: BackupItem = {
      id,
      filename,
      timestamp: now.toISOString(),
      date_formatted: `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`,
      taille_octets: 0,
      label,
      type,
      counts,
    };

    if (typeof window !== 'undefined') {
      try {
        const fullBackup: BackupExportData = {
          version: '2.0',
          app: 'Garage Kospam - Parking Privé',
          exported_at: now.toISOString(),
          counts,
          data: this.db,
        };

        const jsonStr = JSON.stringify(fullBackup);
        item.taille_octets = jsonStr.length;

        const storedList = this.listClientBackups();
        // keep up to 15 client-side backups
        const updatedList = [item, ...storedList.filter((b) => b.id !== id)].slice(0, 15);
        localStorage.setItem(CLIENT_BACKUPS_KEY, JSON.stringify(updatedList));
        localStorage.setItem(`SNAPSHOT_${id}`, jsonStr);
      } catch (e) {
        console.warn('Erreur stockage snapshot local:', e);
      }
    }

    return item;
  }

  public listClientBackups(): BackupItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CLIENT_BACKUPS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  public restoreClientBackup(id: string): { success: boolean; counts: any } {
    if (typeof window === 'undefined') throw new Error('Environnement non supporté');
    const raw = localStorage.getItem(`SNAPSHOT_${id}`);
    if (!raw) throw new Error('Sauvegarde locale introuvable');
    const parsed = JSON.parse(raw);
    return this.restoreFullDatabase(parsed);
  }

  public exportFullDatabase(): BackupExportData {
    const counts = {
      clients: this.db.clients?.length || 0,
      vehicules: this.db.vehicules?.length || 0,
      places: this.db.places?.length || 0,
      stationnements: this.db.stationnements?.length || 0,
      paiements: this.db.paiements?.length || 0,
      mouvements: this.db.portefeuille?.length || 0,
      solde_disponible: this.getSoldePortefeuille(),
    };

    return {
      version: '2.0',
      app: 'Garage Kospam - Parking Privé',
      exported_at: new Date().toISOString(),
      counts,
      data: this.db,
    };
  }

  public restoreFullDatabase(payload: any): { success: boolean; counts: any } {
    if (!payload) throw new Error('Données de sauvegarde invalides');
    const targetData = payload.data ? payload.data : payload;

    if (
      !Array.isArray(targetData.clients) ||
      !Array.isArray(targetData.vehicules) ||
      !Array.isArray(targetData.stationnements)
    ) {
      throw new Error('Format de sauvegarde invalide');
    }

    this.createClientBackupSnapshot('Sécurité avant restauration locale', 'pre_restauration');

    this.db = {
      clients: targetData.clients || [],
      vehicules: targetData.vehicules || [],
      places: Array.isArray(targetData.places) && targetData.places.length > 0 ? targetData.places : generateInitialOfflineSeed().places,
      stationnements: targetData.stationnements || [],
      paiements: targetData.paiements || [],
      portefeuille: targetData.portefeuille || [],
      parametres: targetData.parametres || DEFAULT_OFFLINE_PARAMS,
      lastUpdated: new Date().toISOString(),
    };

    this.recalculerSoldesPortefeuille();
    this.saveDirect(this.db);

    const counts = {
      clients: this.db.clients.length,
      vehicules: this.db.vehicules.length,
      places: this.db.places.length,
      stationnements: this.db.stationnements.length,
      paiements: this.db.paiements.length,
      mouvements: this.db.portefeuille.length,
      solde_disponible: this.getSoldePortefeuille(),
    };

    return { success: true, counts };
  }

  public syncFromRemote(remoteData: Partial<LocalDatabaseSchema>) {
    this.db = {
      ...this.db,
      ...remoteData,
      lastUpdated: new Date().toISOString(),
    };
    this.save();
  }

  // --- BUSINESS LOGIC HELPERS ---

  public calculerMontant(
    typeClient: TypeClient,
    categorie: CategorieVehicule,
    reparation: boolean
  ): number {
    const tarifs = this.db.parametres.tarifs;
    if (typeClient === 'Kospam') {
      return reparation ? tarifs.kospam_avec_reparation : tarifs.kospam_sans_reparation;
    }
    if (!reparation) {
      return tarifs.normal_sans_reparation;
    }
    if (categorie === 'Véhicule léger') {
      return tarifs.normal_avec_reparation_leger;
    }
    return tarifs.normal_avec_reparation_autre;
  }

  // --- GETTERS & JOINS ---

  public getClients(): Client[] {
    return this.db.clients;
  }

  public getVehicules(): Vehicule[] {
    return this.db.vehicules.map((v) => {
      const c = this.db.clients.find((client) => client.id_client === v.id_client);
      return {
        ...v,
        client_nom: c?.nom || 'Inconnu',
        client_type: c?.type_client || 'Normal',
      };
    });
  }

  public getPlaces(): Place[] {
    return this.db.places;
  }

  public getStationnements(): Stationnement[] {
    return this.db.stationnements.map((s) => this.enrichStationnement(s));
  }

  private enrichStationnement(s: Stationnement): Stationnement {
    const vehicule = this.db.vehicules.find((v) => v.id_vehicule === s.id_vehicule);
    const client = vehicule
      ? this.db.clients.find((c) => c.id_client === vehicule.id_client)
      : undefined;
    const place = s.id_place
      ? this.db.places.find((p) => p.id_place === s.id_place)
      : undefined;

    const totalPaye = this.db.paiements
      .filter((p) => p.id_stationnement === s.id_stationnement)
      .reduce((sum, p) => sum + Number(p.montant || 0), 0);

    const reste_a_payer = Math.max(0, s.montant_du - totalPaye);
    let statut_paiement: Stationnement['statut_paiement'] = 'Non payé';
    if (totalPaye >= s.montant_du && s.montant_du > 0) {
      statut_paiement = 'Payé';
    } else if (totalPaye > 0) {
      statut_paiement = 'Partiellement payé';
    }

    return {
      ...s,
      montant_paye: totalPaye,
      reste_a_payer,
      statut_paiement,
      immatriculation: vehicule?.immatriculation || 'Non renseigné',
      marque: vehicule?.marque || '',
      modele: vehicule?.modele || '',
      categorie: vehicule?.categorie || 'Véhicule léger',
      id_client: client?.id_client,
      client_nom: client?.nom || 'Client inconnu',
      client_type: client?.type_client || 'Normal',
      numero_place: place?.numero_place,
    };
  }

  public getPaiements(): Paiement[] {
    return this.db.paiements;
  }

  public getPortefeuille() {
    let solde = 0;
    let total_encaisse = 0;
    let total_depense = 0;

    const mouvements = this.db.portefeuille.map((m) => {
      total_encaisse += m.entree;
      total_depense += m.sortie;
      solde += m.entree - m.sortie;
      return {
        ...m,
        solde,
      };
    });

    return {
      mouvements,
      solde,
      total_encaisse,
      total_depense,
    };
  }

  public getSoldePortefeuille(): number {
    return this.getPortefeuille().solde;
  }

  public getParametres(): ParametresApp {
    return this.db.parametres;
  }

  public getDashboardStats(): DashboardStats {
    const allSt = this.getStationnements();
    const allPayments = this.db.paiements;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);

    const presents = allSt.filter((s) => s.statut === 'Présent');
    const vehicules_nuit_presents = presents.filter((s) => s.reste_la_nuit).length;
    // Capacité illimitée : aucune contrainte de places
    const placesOccupees = presents.length;
    const placesLibres = 999;

    const entreesJour = allSt.filter((s) => s.date_entree === today).length;
    const sortiesJour = allSt.filter((s) => s.date_sortie === today).length;

    const recettesJour = allPayments
      .filter((p) => p.date_paiement.startsWith(today))
      .reduce((sum, p) => sum + Number(p.montant || 0), 0);

    const recettesMois = allPayments
      .filter((p) => p.date_paiement.startsWith(thisMonth))
      .reduce((sum, p) => sum + Number(p.montant || 0), 0);

    const nonPayes = allSt.filter((s) => s.statut_paiement === 'Non payé').length;
    const partPayes = allSt.filter((s) => s.statut_paiement === 'Partiellement payé').length;
    const totalAEncaisser = allSt.reduce((sum, s) => sum + (s.reste_a_payer || 0), 0);

    const portefeuilleInfo = this.getPortefeuille();

    // Recettes par jour (7 derniers jours)
    const recettes_par_jour: { date: string; montant: number; entrees: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayPayments = allPayments
        .filter((p) => p.date_paiement.startsWith(dayStr))
        .reduce((sum, p) => sum + Number(p.montant || 0), 0);
      const dayEntrees = allSt.filter((s) => s.date_entree === dayStr).length;
      recettes_par_jour.push({
        date: dayStr.slice(5),
        montant: dayPayments,
        entrees: dayEntrees,
      });
    }

    // Recettes par mois
    const moisNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();
    const recettes_par_mois = [
      {
        mois: `${moisNames[currentMonthIdx]} ${currentYear}`,
        montant: recettesMois,
      },
    ];

    // Véhicules par catégorie
    const catMap: Record<string, { count: number; total_montant: number }> = {
      'Véhicule léger': { count: 0, total_montant: 0 },
      '4x4': { count: 0, total_montant: 0 },
      Camionnette: { count: 0, total_montant: 0 },
      Bus: { count: 0, total_montant: 0 },
      Camion: { count: 0, total_montant: 0 },
    };
    allSt.forEach((s) => {
      const cat = s.categorie || 'Véhicule léger';
      if (!catMap[cat]) catMap[cat] = { count: 0, total_montant: 0 };
      catMap[cat].count += 1;
      catMap[cat].total_montant += s.montant_du;
    });
    const vehicules_par_categorie = Object.keys(catMap).map((k) => ({
      categorie: k,
      count: catMap[k].count,
      total_montant: catMap[k].total_montant,
    }));

    // Répartition modes paiement
    const modeMap: Record<string, { count: number; montant: number }> = {
      Espèces: { count: 0, montant: 0 },
      'Mobile Money': { count: 0, montant: 0 },
      Virement: { count: 0, montant: 0 },
      Autre: { count: 0, montant: 0 },
    };
    allPayments.forEach((p) => {
      const mode = p.mode_paiement || 'Espèces';
      if (!modeMap[mode]) modeMap[mode] = { count: 0, montant: 0 };
      modeMap[mode].count += 1;
      modeMap[mode].montant += Number(p.montant || 0);
    });
    const repartition_modes_paiement = Object.keys(modeMap).map((k) => ({
      mode: k,
      count: modeMap[k].count,
      montant: modeMap[k].montant,
    }));

    // Clients fréquents
    const clientUsage: Record<string, { nom: string; type: string; passages: number; montant: number }> = {};
    allSt.forEach((s) => {
      const cId = s.id_client || 'unknown';
      if (!clientUsage[cId]) {
        clientUsage[cId] = {
          nom: s.client_nom || 'Client inconnu',
          type: s.client_type || 'Normal',
          passages: 0,
          montant: 0,
        };
      }
      clientUsage[cId].passages += 1;
      clientUsage[cId].montant += s.montant_du;
    });
    const clients_frequents = Object.values(clientUsage)
      .sort((a, b) => b.passages - a.passages)
      .slice(0, 5);

    return {
      vehicules_presents: presents.length,
      vehicules_nuit_presents,
      places_occupees: placesOccupees,
      places_libres: placesLibres,
      entrees_jour: entreesJour,
      sorties_jour: sortiesJour,
      recettes_jour: recettesJour,
      recettes_totales: portefeuilleInfo.total_encaisse,
      recettes_mois: recettesMois,
      total_depenses: portefeuilleInfo.total_depense,
      solde_tresorerie: portefeuilleInfo.solde,
      nombre_stationnements: allSt.length,
      montant_restant_a_payer: totalAEncaisser,
      total_non_paye: nonPayes,
      total_partiellement_paye: partPayes,
      total_a_encaisser: totalAEncaisser,
      solde_portefeuille: portefeuilleInfo.solde,
      total_encaisse: portefeuilleInfo.total_encaisse,
      total_depense: portefeuilleInfo.total_depense,
      recettes_par_jour,
      recettes_par_mois,
      vehicules_par_categorie,
      repartition_modes_paiement,
      clients_frequents,
    };
  }

  public getKospamStats(): KospamStats {
    const kospamClient = this.db.clients.find((c) => c.type_client === 'Kospam');
    const kospamClientId = kospamClient?.id_client;

    const allSt = this.getStationnements().filter(
      (s) => s.client_type === 'Kospam' || s.id_client === kospamClientId
    );

    const presents = allSt.filter((s) => s.statut === 'Présent');
    const sortis = allSt.filter((s) => s.statut === 'Sorti');
    const enReparation = presents.filter((s) => s.reparation);

    const totalDu = allSt.reduce((sum, s) => sum + s.montant_du, 0);
    const totalPaye = allSt.reduce((sum, s) => sum + (s.montant_paye || 0), 0);
    const resteAPayer = Math.max(0, totalDu - totalPaye);

    const periodsMap: Record<
      string,
      {
        vehicules: Set<string>;
        stationnements: number;
        reparations: number;
        total_du: number;
        total_paye: number;
      }
    > = {};

    allSt.forEach((s) => {
      const [year, month] = s.date_entree.split('-');
      const moisNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      const monthIdx = parseInt(month, 10) - 1;
      const periodeLabel = `${moisNames[monthIdx] || month} ${year}`;

      if (!periodsMap[periodeLabel]) {
        periodsMap[periodeLabel] = {
          vehicules: new Set(),
          stationnements: 0,
          reparations: 0,
          total_du: 0,
          total_paye: 0,
        };
      }

      periodsMap[periodeLabel].vehicules.add(s.id_vehicule);
      periodsMap[periodeLabel].stationnements += 1;
      if (s.reparation) periodsMap[periodeLabel].reparations += 1;
      periodsMap[periodeLabel].total_du += s.montant_du;
      periodsMap[periodeLabel].total_paye += s.montant_paye || 0;
    });

    const periodes_facturation = Object.keys(periodsMap).map((k) => ({
      periode: k,
      nombre_vehicules: periodsMap[k].vehicules.size,
      stationnements: periodsMap[k].stationnements,
      reparations: periodsMap[k].reparations,
      total_du: periodsMap[k].total_du,
      total_paye: periodsMap[k].total_paye,
      reste_a_payer: Math.max(0, periodsMap[k].total_du - periodsMap[k].total_paye),
    }));

    return {
      vehicules_presents: presents.length,
      vehicules_sortis: sortis.length,
      vehicules_en_reparation: enReparation.length,
      total_du: totalDu,
      total_paye: totalPaye,
      reste_a_payer: resteAPayer,
      periodes_facturation,
    };
  }

  // --- MUTATIONS ---

  public updateParametres(params: Partial<ParametresApp>): ParametresApp {
    const rawCapacite =
      params.capacite_totale !== undefined
        ? params.capacite_totale
        : params.nombre_total_places !== undefined
        ? params.nombre_total_places
        : this.db.parametres.capacite_totale || 30;

    const capacite = Math.max(1, Math.floor(Number(rawCapacite)) || 30);

    this.db.parametres = {
      ...this.db.parametres,
      ...params,
      capacite_totale: capacite,
      nombre_total_places: capacite,
      tarifs: {
        ...this.db.parametres.tarifs,
        ...(params.tarifs || {}),
      },
    };

    // Ajustement de la liste des places
    const currentCount = this.db.places.length;
    if (capacite > currentCount) {
      for (let i = currentCount + 1; i <= capacite; i++) {
        this.db.places.push({
          id_place: `PLC-${String(i).padStart(3, '0')}`,
          numero_place: `P-${String(i).padStart(2, '0')}`,
          statut: 'Libre',
          type_zone: 'Standard',
          id_stationnement_actuel: null,
          immatriculation_actuelle: null,
        });
      }
    } else if (capacite < currentCount) {
      for (let i = this.db.places.length - 1; i >= 0 && this.db.places.length > capacite; i--) {
        const p = this.db.places[i];
        if (p && p.statut !== 'Occupée') {
          this.db.places.splice(i, 1);
        }
      }
    }

    this.save();
    return this.db.parametres;
  }

  public createClient(clientData: Omit<Client, 'id_client'>): Client {
    const nextNum = this.db.clients.length + 1;
    const newClient: Client = {
      ...clientData,
      id_client: `CLI-${String(nextNum).padStart(3, '0')}`,
      date_creation: clientData.date_creation || new Date().toISOString().split('T')[0],
    };
    this.db.clients.push(newClient);
    this.save();
    return newClient;
  }

  public updateClient(id: string, updates: Partial<Client>): Client {
    const idx = this.db.clients.findIndex((c) => c.id_client === id);
    if (idx === -1) throw new Error('Client introuvable');
    this.db.clients[idx] = { ...this.db.clients[idx], ...updates };
    this.save();
    return this.db.clients[idx];
  }

  public deleteClient(id: string): boolean {
    const hasVehicles = this.db.vehicules.some((v) => v.id_client === id);
    if (hasVehicles) {
      throw new Error('Impossible de supprimer ce client car il possède des véhicules enregistrés.');
    }
    const initialLen = this.db.clients.length;
    this.db.clients = this.db.clients.filter((c) => c.id_client !== id);
    this.save();
    return this.db.clients.length < initialLen;
  }

  public createVehicule(vehiculeData: Omit<Vehicule, 'id_vehicule'>): Vehicule {
    const cleanImmat = vehiculeData.immatriculation.trim().toUpperCase();
    const existing = this.db.vehicules.find(
      (v) => v.immatriculation.trim().toUpperCase() === cleanImmat
    );
    if (existing) {
      throw new Error(`Un véhicule avec l'immatriculation "${cleanImmat}" existe déjà.`);
    }

    const nextNum = this.db.vehicules.length + 1;
    const newVeh: Vehicule = {
      ...vehiculeData,
      id_vehicule: `VEH-${String(nextNum).padStart(3, '0')}`,
      immatriculation: cleanImmat,
      date_creation: vehiculeData.date_creation || new Date().toISOString().split('T')[0],
    };
    this.db.vehicules.push(newVeh);
    this.save();

    const client = this.db.clients.find((c) => c.id_client === newVeh.id_client);
    return {
      ...newVeh,
      client_nom: client?.nom || 'Inconnu',
      client_type: client?.type_client || 'Normal',
    };
  }

  public updateVehicule(id: string, updates: Partial<Vehicule>): Vehicule {
    const idx = this.db.vehicules.findIndex((v) => v.id_vehicule === id);
    if (idx === -1) throw new Error('Véhicule introuvable');

    if (updates.immatriculation) {
      const cleanImmat = updates.immatriculation.trim().toUpperCase();
      const duplicate = this.db.vehicules.find(
        (v) => v.id_vehicule !== id && v.immatriculation.trim().toUpperCase() === cleanImmat
      );
      if (duplicate) {
        throw new Error(`L'immatriculation "${cleanImmat}" est déjà utilisée.`);
      }
      updates.immatriculation = cleanImmat;
    }

    this.db.vehicules[idx] = { ...this.db.vehicules[idx], ...updates };
    this.save();

    const client = this.db.clients.find((c) => c.id_client === this.db.vehicules[idx].id_client);
    return {
      ...this.db.vehicules[idx],
      client_nom: client?.nom || 'Inconnu',
      client_type: client?.type_client || 'Normal',
    };
  }

  public deleteVehicule(id: string): boolean {
    const isPresent = this.db.stationnements.some(
      (s) => s.id_vehicule === id && s.statut === 'Présent'
    );
    if (isPresent) {
      throw new Error('Impossible de supprimer un véhicule actuellement présent dans le parking.');
    }
    const initialLen = this.db.vehicules.length;
    this.db.vehicules = this.db.vehicules.filter((v) => v.id_vehicule !== id);
    this.save();
    return this.db.vehicules.length < initialLen;
  }

  public enregistrerEntree(payload: {
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
  }): Stationnement {
    let finalClientId = payload.id_client;
    if (!finalClientId && payload.client_data) {
      const createdClient = this.createClient({
        nom: payload.client_data.nom,
        type_client: payload.client_data.type_client,
        telephone: payload.client_data.telephone || '',
        adresse: payload.client_data.adresse || '',
        email: payload.client_data.email || '',
        observation: '',
      });
      finalClientId = createdClient.id_client;
    }

    if (!finalClientId) {
      throw new Error('Un client valide est obligatoire.');
    }

    const client = this.db.clients.find((c) => c.id_client === finalClientId);
    if (!client) throw new Error('Client introuvable.');

    let finalVehiculeId = payload.id_vehicule;
    if (!finalVehiculeId && payload.vehicule_data) {
      const cleanImmat = payload.vehicule_data.immatriculation.trim().toUpperCase();
      const existing = this.db.vehicules.find(
        (v) => v.immatriculation.trim().toUpperCase() === cleanImmat
      );
      if (existing) {
        finalVehiculeId = existing.id_vehicule;
        if (existing.id_client !== finalClientId) {
          this.updateVehicule(existing.id_vehicule, { id_client: finalClientId });
        }
      } else {
        const createdVeh = this.createVehicule({
          immatriculation: cleanImmat,
          marque: payload.vehicule_data.marque,
          modele: payload.vehicule_data.modele,
          categorie: payload.vehicule_data.categorie,
          id_client: finalClientId,
        });
        finalVehiculeId = createdVeh.id_vehicule;
      }
    }

    if (!finalVehiculeId) {
      throw new Error('Un véhicule valide est obligatoire.');
    }

    const vehicule = this.db.vehicules.find((v) => v.id_vehicule === finalVehiculeId);
    if (!vehicule) throw new Error('Véhicule introuvable.');

    const isStatutSorti = payload.statut === 'Sorti' || (payload.historique_ancien && Boolean(payload.date_sortie));

    if (!isStatutSorti) {
      const alreadyPresent = this.db.stationnements.find(
        (s) => s.id_vehicule === finalVehiculeId && s.statut === 'Présent'
      );
      if (alreadyPresent) {
        throw new Error(
          `Le véhicule ${vehicule.immatriculation} est déjà présent dans le parking (#${alreadyPresent.id_stationnement}).`
        );
      }
    }

    // Calcul tarifaire (aucun supplément pour reste_la_nuit)
    let montant_du =
      payload.montant_du !== undefined && payload.montant_du >= 0
        ? Number(payload.montant_du)
        : this.calculerMontant(
            client.type_client,
            vehicule.categorie,
            Boolean(payload.reparation)
          );

    const now = new Date();
    const dateEntree =
      payload.date_entree ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const heureEntree =
      payload.heure_entree ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const dateSortie = isStatutSorti
      ? payload.date_sortie || dateEntree
      : null;
    const heureSortie = isStatutSorti
      ? payload.heure_sortie || heureEntree
      : null;

    const nextStNum = this.db.stationnements.length + 1;
    const id_stationnement = `ST-${String(nextStNum).padStart(4, '0')}`;

    const newStationnement: Stationnement = {
      id_stationnement,
      id_vehicule: finalVehiculeId,
      id_place: null, // Gestion des places supprimée (capacité illimitée)
      date_entree: dateEntree,
      heure_entree: heureEntree,
      date_sortie: dateSortie,
      heure_sortie: heureSortie,
      reparation: Boolean(payload.reparation),
      reste_la_nuit: Boolean(payload.reste_la_nuit),
      historique_ancien: Boolean(payload.historique_ancien),
      montant_du,
      montant_paye: 0,
      reste_a_payer: montant_du,
      statut: isStatutSorti ? 'Sorti' : 'Présent',
      statut_paiement: 'Non payé',
      observation: payload.observation || (payload.historique_ancien ? 'Ancien stationnement saisi rétroactivement' : ''),
    };

    this.db.stationnements.push(newStationnement);
    this.save();

    // Règlement direct lors du stationnement si demandé
    const montantPaye =
      payload.paiement?.montant !== undefined
        ? Number(payload.paiement.montant)
        : payload.montant_paye !== undefined
        ? Number(payload.montant_paye)
        : payload.regler_maintenant
        ? montant_du
        : 0;

    if (montantPaye > 0) {
      const modeP = payload.paiement?.mode_paiement || payload.mode_paiement || 'Espèces';
      const ref = payload.paiement?.reference || `REC-${id_stationnement}`;
      const obs = payload.paiement?.observation || (payload.historique_ancien ? 'Paiement ancien véhicule' : 'Paiement direct à l\'entrée');

      if (payload.comptabiliser_tresorerie !== false) {
        this.enregistrerPaiement({
          id_stationnement,
          montant: montantPaye,
          mode_paiement: modeP,
          reference: ref,
          observation: obs,
        });
      } else {
        const nextPayNum = this.db.paiements.length + 1;
        const id_paiement = `PAY-${String(nextPayNum).padStart(4, '0')}`;
        this.db.paiements.push({
          id_paiement,
          id_stationnement,
          date_paiement: `${dateEntree} ${heureEntree}:00`,
          montant: montantPaye,
          mode_paiement: modeP,
          reference: ref,
          observation: `${obs} (Déjà inclus dans solde initial)`,
        });
        this.save();
      }
    }

    return this.enrichStationnement(newStationnement);
  }

  public enregistrerSortie(payload: {
    id_stationnement: string;
    date_sortie?: string;
    heure_sortie?: string;
    paiement?: {
      montant: number;
      mode_paiement: ModePaiement;
      reference?: string;
      observation?: string;
    };
  }): Stationnement {
    const idx = this.db.stationnements.findIndex(
      (s) => s.id_stationnement === payload.id_stationnement
    );
    if (idx === -1) throw new Error('Stationnement introuvable.');

    const st = this.db.stationnements[idx];
    if (st.statut === 'Sorti') {
      throw new Error('Ce véhicule est déjà marqué comme sorti.');
    }

    const now = new Date();
    const dateSortie =
      payload.date_sortie ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const heureSortie =
      payload.heure_sortie ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    st.date_sortie = dateSortie;
    st.heure_sortie = heureSortie;
    st.statut = 'Sorti';

    if (st.id_place) {
      const placeIdx = this.db.places.findIndex((p) => p.id_place === st.id_place);
      if (placeIdx !== -1) {
        this.db.places[placeIdx].statut = 'Libre';
        this.db.places[placeIdx].id_stationnement_actuel = null;
        this.db.places[placeIdx].immatriculation_actuelle = null;
      }
    }

    if (payload.paiement && payload.paiement.montant > 0) {
      this.enregistrerPaiement({
        id_stationnement: st.id_stationnement,
        montant: payload.paiement.montant,
        mode_paiement: payload.paiement.mode_paiement,
        reference: payload.paiement.reference,
        observation: payload.paiement.observation || 'Paiement à la sortie',
      });
    }

    this.save();
    return this.enrichStationnement(st);
  }

  public updateStationnement(id: string, data: any): Stationnement {
    const idx = this.db.stationnements.findIndex((s) => s.id_stationnement === id);
    if (idx === -1) throw new Error('Stationnement introuvable.');

    const currentSt = this.db.stationnements[idx];
    const vehicule = this.db.vehicules.find((v) => v.id_vehicule === currentSt.id_vehicule);
    if (vehicule) {
      if (data.nom_client || data.categorie_client) {
        const client = this.db.clients.find((c) => c.id_client === vehicule.id_client);
        if (client) {
          if (data.nom_client) client.nom = data.nom_client.trim();
          if (data.categorie_client) client.type_client = data.categorie_client;
        }
      }
      if (data.immatriculation) vehicule.immatriculation = data.immatriculation.trim().toUpperCase();
      if (data.categorie_vehicule) vehicule.categorie = data.categorie_vehicule;
    }

    if (data.date_entree || data.date) currentSt.date_entree = (data.date_entree || data.date)!;
    if (data.reparation !== undefined) currentSt.reparation = Boolean(data.reparation);
    if (data.type_stationnement) {
      currentSt.type_stationnement = data.type_stationnement;
      currentSt.reste_la_nuit =
        data.type_stationnement === 'Nuit' || data.type_stationnement === 'Nuit – Parking sécurisé';
    }
    if (data.observation !== undefined) currentSt.observation = data.observation;
    if (data.statut) currentSt.statut = data.statut;

    let nouveauMontantDu = currentSt.montant_du;
    if (data.montant_a_payer !== undefined) nouveauMontantDu = Math.max(0, Number(data.montant_a_payer) || 0);
    else if (data.montant_du !== undefined) nouveauMontantDu = Math.max(0, Number(data.montant_du) || 0);
    currentSt.montant_du = nouveauMontantDu;
    currentSt.montant_a_payer = nouveauMontantDu;

    if (data.mode_paiement) currentSt.mode_paiement = data.mode_paiement;

    if (data.montant_paye !== undefined) {
      const nouveauMontantPaye = Math.max(0, Number(data.montant_paye) || 0);
      const modeP = data.mode_paiement || currentSt.mode_paiement || 'Espèces';
      const existingPayIndex = this.db.paiements.findIndex((p) => p.id_stationnement === id);

      if (nouveauMontantPaye > 0) {
        if (existingPayIndex !== -1) {
          const p = this.db.paiements[existingPayIndex];
          p.montant = nouveauMontantPaye;
          p.mode_paiement = modeP;
          const mIndex = this.db.portefeuille.findIndex((m) => m.id_paiement === p.id_paiement);
          if (mIndex !== -1) {
            this.db.portefeuille[mIndex].entree = nouveauMontantPaye;
          }
        } else {
          this.enregistrerPaiement({
            id_stationnement: id,
            montant: nouveauMontantPaye,
            mode_paiement: modeP,
            reference: `REC-${id}`,
            observation: `Paiement stationnement #${id}`,
          });
        }
      } else if (existingPayIndex !== -1) {
        const p = this.db.paiements[existingPayIndex];
        this.db.portefeuille = this.db.portefeuille.filter((m) => m.id_paiement !== p.id_paiement);
        this.db.paiements.splice(existingPayIndex, 1);
      }
    }

    this.recalculerSoldesPortefeuille();
    this.save();
    return this.enrichStationnement(currentSt);
  }

  public deleteStationnement(id: string): boolean {
    const idx = this.db.stationnements.findIndex((s) => s.id_stationnement === id);
    if (idx === -1) throw new Error('Stationnement introuvable.');

    const paymentsToDelete = this.db.paiements.filter((p) => p.id_stationnement === id);
    const paymentIds = new Set(paymentsToDelete.map((p) => p.id_paiement));

    this.db.portefeuille = this.db.portefeuille.filter(
      (m) => !(m.id_paiement && paymentIds.has(m.id_paiement)) && !m.reference?.includes(id)
    );
    this.db.paiements = this.db.paiements.filter((p) => p.id_stationnement !== id);
    this.db.stationnements.splice(idx, 1);

    this.recalculerSoldesPortefeuille();
    this.save();
    return true;
  }

  public enregistrerPaiement(payload: {
    id_stationnement: string;
    montant: number;
    mode_paiement: ModePaiement;
    reference?: string;
    observation?: string;
  }): Paiement {
    const st = this.db.stationnements.find((s) => s.id_stationnement === payload.id_stationnement);
    if (!st) throw new Error('Stationnement introuvable.');

    const montant = Number(payload.montant);
    if (isNaN(montant) || montant <= 0) {
      throw new Error('Le montant du paiement doit être supérieur à 0.');
    }

    const nextPayNum = this.db.paiements.length + 1;
    const id_paiement = `PAY-${String(nextPayNum).padStart(4, '0')}`;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const ref = payload.reference || `REC-${String(nextPayNum).padStart(3, '0')}`;

    const newPaiement: Paiement = {
      id_paiement,
      id_stationnement: payload.id_stationnement,
      date_paiement: dateStr,
      montant,
      mode_paiement: payload.mode_paiement,
      reference: ref,
      observation: payload.observation || '',
    };

    this.db.paiements.push(newPaiement);

    // Mouvement portefeuille automatique
    const vehicule = this.db.vehicules.find((v) => v.id_vehicule === st.id_vehicule);
    const lastSolde =
      this.db.portefeuille.length > 0
        ? this.db.portefeuille[this.db.portefeuille.length - 1].solde
        : 0;

    const nextMvtNum = this.db.portefeuille.length + 1;
    const id_mouvement = `MVT-${String(nextMvtNum).padStart(4, '0')}`;

    const newMouvement: MouvementPortefeuille = {
      id_mouvement,
      date: dateStr,
      type_mouvement: 'Encaissement parking',
      reference: ref,
      entree: montant,
      sortie: 0,
      solde: lastSolde + montant,
      motif: `Encaissement #${id_paiement} (Stationnement #${st.id_stationnement} - ${vehicule?.immatriculation || ''})`,
      observation: `${payload.mode_paiement}${payload.observation ? ` - ${payload.observation}` : ''}`,
      id_paiement,
    };

    this.db.portefeuille.push(newMouvement);
    this.save();
    return newPaiement;
  }

  public ajouterMouvementPortefeuille(payload: {
    type_mouvement: 'Encaissement parking' | 'Dépense' | 'Autre entrée' | 'Autre sortie';
    reference?: string;
    entree: number;
    sortie: number;
    motif: string;
    observation?: string;
  }): MouvementPortefeuille {
    const entree = Number(payload.entree || 0);
    const sortie = Number(payload.sortie || 0);

    if (entree === 0 && sortie === 0) {
      throw new Error('Le montant du mouvement doit être supérieur à 0.');
    }
    if (!payload.motif || !payload.motif.trim()) {
      throw new Error('Le motif du mouvement est obligatoire.');
    }

    const lastSolde =
      this.db.portefeuille.length > 0
        ? this.db.portefeuille[this.db.portefeuille.length - 1].solde
        : 0;

    const nextMvtNum = this.db.portefeuille.length + 1;
    const id_mouvement = `MVT-${String(nextMvtNum).padStart(4, '0')}`;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newMouvement: MouvementPortefeuille = {
      id_mouvement,
      date: dateStr,
      type_mouvement: payload.type_mouvement,
      reference: payload.reference || '',
      entree,
      sortie,
      solde: lastSolde + entree - sortie,
      motif: payload.motif.trim(),
      observation: payload.observation || '',
    };

    this.db.portefeuille.push(newMouvement);
    this.save();
    return newMouvement;
  }

  public recalculerSoldesPortefeuille() {
    let solde = 0;
    this.db.portefeuille = this.db.portefeuille.map((m) => {
      solde += Number(m.entree || 0) - Number(m.sortie || 0);
      return {
        ...m,
        solde,
      };
    });
    this.save();
  }

  public setSoldeInitial(montant: number, date?: string, observation?: string): MouvementPortefeuille {
    const val = Math.max(0, Number(montant) || 0);
    this.db.parametres.solde_initial = val;
    this.db.parametres.date_solde_initial = date || new Date().toISOString().split('T')[0];

    const idx = this.db.portefeuille.findIndex((m) => m.type_mouvement === 'Solde initial');
    const dateStr = date
      ? (date.length === 10 ? `${date} 00:00:00` : date)
      : `${new Date().toISOString().split('T')[0]} 00:00:00`;

    if (idx !== -1) {
      this.db.portefeuille[idx].entree = val;
      this.db.portefeuille[idx].date = dateStr;
      this.db.portefeuille[idx].observation = observation || 'Solde initial disponible avant utilisation de l\'application';
    } else {
      const initMvt: MouvementPortefeuille = {
        id_mouvement: 'MVT-INIT',
        date: dateStr,
        type_mouvement: 'Solde initial',
        reference: 'SOLDE-INITIAL',
        entree: val,
        sortie: 0,
        solde: val,
        motif: 'Solde initial de trésorerie disponible au démarrage',
        observation: observation || 'Argent disponible avant utilisation de l\'application',
        categorie: 'Solde de départ',
      };
      this.db.portefeuille.unshift(initMvt);
    }

    this.recalculerSoldesPortefeuille();
    return this.db.portefeuille.find((m) => m.type_mouvement === 'Solde initial')!;
  }

  public ajouterMouvementTresorerie(payload: {
    type_mouvement: TypeMouvement;
    montant: number;
    date?: string;
    motif: string;
    categorie?: string;
    observation?: string;
    reference?: string;
  }): MouvementPortefeuille {
    const montant = Math.max(0, Number(payload.montant) || 0);
    if (montant <= 0) {
      throw new Error('Le montant du mouvement doit être strictement supérieur à 0.');
    }
    if (!payload.motif?.trim()) {
      throw new Error('Le motif du mouvement est obligatoire.');
    }

    const isEntree =
      payload.type_mouvement === 'Solde initial' ||
      payload.type_mouvement === 'Encaissement parking' ||
      payload.type_mouvement === 'Ancienne recette' ||
      payload.type_mouvement === 'Autre entrée';

    const entree = isEntree ? montant : 0;
    const sortie = isEntree ? 0 : montant;

    const now = new Date();
    const dateStr = payload.date
      ? (payload.date.length === 10
          ? `${payload.date} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
          : payload.date)
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const nextMvtNum = this.db.portefeuille.length + 1;
    const id_mouvement = `MVT-${String(nextMvtNum).padStart(4, '0')}`;

    const newMvt: MouvementPortefeuille = {
      id_mouvement,
      date: dateStr,
      type_mouvement: payload.type_mouvement,
      reference: payload.reference || `REF-${id_mouvement}`,
      entree,
      sortie,
      solde: 0,
      motif: payload.motif.trim(),
      observation: payload.observation || '',
      categorie: payload.categorie || (isEntree ? 'Recette' : 'Dépense'),
    };

    this.db.portefeuille.push(newMvt);
    this.recalculerSoldesPortefeuille();
    return this.db.portefeuille.find((m) => m.id_mouvement === id_mouvement) || newMvt;
  }

  public updateMouvementTresorerie(id: string, data: any): MouvementPortefeuille {
    const idx = this.db.portefeuille.findIndex((m) => m.id_mouvement === id);
    if (idx === -1) throw new Error('Mouvement introuvable.');
    const m = this.db.portefeuille[idx];
    if (data.motif) m.motif = data.motif.trim();
    if (data.observation !== undefined) m.observation = data.observation;
    if (data.categorie) m.categorie = data.categorie;
    if (data.date) m.date = data.date.length === 10 ? `${data.date} 12:00:00` : data.date;
    if (data.type_mouvement) m.type_mouvement = data.type_mouvement;

    if (data.montant !== undefined) {
      const val = Math.max(0, Number(data.montant) || 0);
      const isEntree =
        m.type_mouvement === 'Solde initial' ||
        m.type_mouvement === 'Encaissement parking' ||
        m.type_mouvement === 'Ancienne recette' ||
        m.type_mouvement === 'Autre entrée';
      if (isEntree) {
        m.entree = val;
        m.sortie = 0;
      } else {
        m.sortie = val;
        m.entree = 0;
      }
    }
    this.recalculerSoldesPortefeuille();
    this.save();
    return m;
  }

  public deleteMouvementTresorerie(id: string): boolean {
    const idx = this.db.portefeuille.findIndex((m) => m.id_mouvement === id);
    if (idx === -1) throw new Error('Mouvement introuvable.');
    const m = this.db.portefeuille[idx];
    if (m.type_mouvement === 'Solde initial') {
      m.entree = 0;
      this.db.parametres.solde_initial = 0;
    } else {
      this.db.portefeuille.splice(idx, 1);
    }
    this.recalculerSoldesPortefeuille();
    this.save();
    return true;
  }

  public getTresorerieResume() {
    const mouvements = this.getPortefeuille().mouvements;
    const soldeInitialParam = this.db.parametres.solde_initial || 0;
    const initMvt = mouvements.find((m) => m.type_mouvement === 'Solde initial');
    const soldeInitial = initMvt ? initMvt.entree : soldeInitialParam;

    let recettesParking = 0;
    let anciennesRecettes = 0;
    let autresEntrees = 0;
    let anciennesDepenses = 0;
    let depensesCourantes = 0;
    let autresSorties = 0;

    mouvements.forEach((m) => {
      if (m.type_mouvement === 'Encaissement parking') recettesParking += Number(m.entree || 0);
      else if (m.type_mouvement === 'Ancienne recette') anciennesRecettes += Number(m.entree || 0);
      else if (m.type_mouvement === 'Autre entrée') autresEntrees += Number(m.entree || 0);
      else if (m.type_mouvement === 'Ancienne dépense') anciennesDepenses += Number(m.sortie || 0);
      else if (m.type_mouvement === 'Dépense') depensesCourantes += Number(m.sortie || 0);
      else if (m.type_mouvement === 'Autre sortie') autresSorties += Number(m.sortie || 0);
    });

    const totalEntrees = soldeInitial + recettesParking + anciennesRecettes + autresEntrees;
    const totalSorties = anciennesDepenses + depensesCourantes + autresSorties;
    const soldeDisponible = totalEntrees - totalSorties;

    return {
      solde_initial: soldeInitial,
      recettes_parking: recettesParking,
      anciennes_recettes: anciennesRecettes,
      autres_entrees: autresEntrees,
      total_recettes_globales: recettesParking + anciennesRecettes + autresEntrees,
      anciennes_depenses: anciennesDepenses,
      depenses_courantes: depensesCourantes,
      autres_sorties: autresSorties,
      total_depenses_globales: totalSorties,
      solde_disponible: soldeDisponible,
      mouvements,
    };
  }

  public getReports(filters: {
    date_debut?: string;
    date_fin?: string;
    type_client?: string;
    categorie?: string;
    mode_paiement?: string;
    statut_paiement?: string;
    statut_stationnement?: string;
  }) {
    let stationnements = this.getStationnements();
    let paiements = this.getPaiements();
    let portefeuille = this.getPortefeuille().mouvements;

    if (filters.date_debut) {
      stationnements = stationnements.filter((s) => s.date_entree >= filters.date_debut!);
      paiements = paiements.filter((p) => p.date_paiement >= filters.date_debut!);
      portefeuille = portefeuille.filter((m) => m.date >= filters.date_debut!);
    }
    if (filters.date_fin) {
      stationnements = stationnements.filter((s) => s.date_entree <= filters.date_fin!);
      paiements = paiements.filter((p) => p.date_paiement <= filters.date_fin! + ' 23:59:59');
      portefeuille = portefeuille.filter((m) => m.date <= filters.date_fin! + ' 23:59:59');
    }
    if (filters.type_client) {
      stationnements = stationnements.filter((s) => s.client_type === filters.type_client);
    }
    if (filters.categorie) {
      stationnements = stationnements.filter((s) => s.categorie === filters.categorie);
    }
    if (filters.statut_stationnement) {
      stationnements = stationnements.filter((s) => s.statut === filters.statut_stationnement);
    }
    if (filters.statut_paiement) {
      stationnements = stationnements.filter((s) => s.statut_paiement === filters.statut_paiement);
    }

    const total_vehicules = stationnements.length;
    const total_reparations = stationnements.filter((s) => s.reparation).length;
    const total_du = stationnements.reduce((sum, s) => sum + s.montant_du, 0);
    const total_paye = stationnements.reduce((sum, s) => sum + (s.montant_paye || 0), 0);
    const total_reste = stationnements.reduce((sum, s) => sum + (s.reste_a_payer || 0), 0);
    const total_recettes_paiements = paiements.reduce((sum, p) => sum + Number(p.montant || 0), 0);

    return {
      stationnements,
      paiements,
      portefeuille,
      summary: {
        total_vehicules,
        total_reparations,
        total_du,
        total_paye,
        total_reste,
        total_recettes_paiements,
      },
    };
  }

  // --- SYNC QUEUE ---

  public addToSyncQueue(endpoint: string, method: string, body?: any) {
    if (typeof window === 'undefined') return;
    try {
      const queue = this.getSyncQueue();
      queue.push({
        id: `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        endpoint,
        method,
        body,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Erreur mise en file sync:', e);
    }
  }

  public getSyncQueue(): Array<{
    id: string;
    endpoint: string;
    method: string;
    body?: any;
    timestamp: string;
  }> {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public clearSyncQueue() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(QUEUE_KEY);
  }
}

export const offlineStorage = new OfflineStorageManager();
