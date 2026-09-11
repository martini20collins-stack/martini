import fs from 'fs';
import path from 'path';
import {
  Client,
  Vehicule,
  Place,
  StatutPlace,
  Stationnement,
  Paiement,
  MouvementPortefeuille,
  ParametresApp,
  DashboardStats,
  KospamStats,
  TestResult,
  CategorieVehicule,
} from '../src/types';
import {
  calculerMontant,
  calculerStatutPaiement,
  TARIFS_PAR_DEFAUT,
} from '../src/services/pricingEngine';

export interface DatabaseSchema {
  clients: Client[];
  vehicules: Vehicule[];
  places: Place[];
  stationnements: Stationnement[];
  paiements: Paiement[];
  portefeuille: MouvementPortefeuille[];
  parametres: ParametresApp;
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'database.json');

const DEFAULT_PARAMS: ParametresApp = {
  nom_parking: 'Parking Privé Central',
  telephone_parking: '+261 34 00 123 45',
  adresse_parking: 'Analakely, Antananarivo 101, Madagascar',
  devise: 'Ar',
  tarifs: { ...TARIFS_PAR_DEFAUT },
  nombre_total_places: 20,
};

function generateInitialSeed(): DatabaseSchema {
  // Clients as specified in requirements
  const clients: Client[] = [
    {
      id_client: 'CLI-001',
      nom: 'Client Normal 1 (M. Rakoto)',
      type_client: 'Normal',
      telephone: '+261 32 11 234 56',
      adresse: 'Isoraka, Antananarivo',
      email: 'rakoto.normal1@mail.mg',
      observation: 'Client régulier semaine',
      date_creation: '2026-08-01',
    },
    {
      id_client: 'CLI-002',
      nom: 'Client Normal 2 (Mme Rasoa)',
      type_client: 'Normal',
      telephone: '+261 33 44 567 89',
      adresse: 'Ampefiloha, Antananarivo',
      email: 'rasoa.normal2@mail.mg',
      observation: 'Société partenaire',
      date_creation: '2026-08-05',
    },
    {
      id_client: 'CLI-KOSPAM',
      nom: 'Garage Kospam',
      type_client: 'Kospam',
      telephone: '+261 34 55 678 90',
      adresse: 'Zone Industrielle Ankorondrano, Antananarivo',
      email: 'contact@garagekospam.mg',
      observation: 'Partenaire atelier mécanique & carrosserie Kospam',
      date_creation: '2026-07-15',
    },
  ];

  // Demo Vehicles specified in page 17
  const vehicules: Vehicule[] = [
    {
      id_vehicule: 'VEH-001',
      immatriculation: '1234 TAB',
      marque: 'Toyota',
      modele: 'Corolla',
      categorie: 'Véhicule léger',
      id_client: 'CLI-001',
      observation: 'Voiture de ville berline',
      date_creation: '2026-08-01',
    },
    {
      id_vehicule: 'VEH-002',
      immatriculation: '5678 TAC',
      marque: 'Toyota',
      modele: 'Hilux',
      categorie: '4x4',
      id_client: 'CLI-002',
      observation: 'Pick-up tout terrain',
      date_creation: '2026-08-05',
    },
    {
      id_vehicule: 'VEH-003',
      immatriculation: '9012 TAD',
      marque: 'Renault',
      modele: 'Master',
      categorie: 'Camionnette',
      id_client: 'CLI-KOSPAM',
      observation: 'Fourgon utilitaire Kospam',
      date_creation: '2026-08-10',
    },
    {
      id_vehicule: 'VEH-004',
      immatriculation: '3456 TAE',
      marque: 'Mercedes',
      modele: 'Bus',
      categorie: 'Bus',
      id_client: 'CLI-002',
      observation: 'Minibus transport',
      date_creation: '2026-08-12',
    },
    {
      id_vehicule: 'VEH-005',
      immatriculation: '7890 TAF',
      marque: 'Renault',
      modele: 'Truck',
      categorie: 'Camion',
      id_client: 'CLI-KOSPAM',
      observation: 'Poids lourd dépannage Kospam',
      date_creation: '2026-08-15',
    },
    {
      id_vehicule: 'VEH-006',
      immatriculation: '2468 TAG',
      marque: 'Peugeot',
      modele: '208',
      categorie: 'Véhicule léger',
      id_client: 'CLI-KOSPAM',
      observation: 'Véhicule en réparation Kospam',
      date_creation: '2026-08-18',
    },
  ];

  // Places (P-01 to P-20)
  const places: Place[] = [];
  for (let i = 1; i <= 20; i++) {
    const num = `P-${String(i).padStart(2, '0')}`;
    places.push({
      id_place: `PLC-${String(i).padStart(3, '0')}`,
      numero_place: num,
      statut: 'Libre',
      id_stationnement_actuel: null,
      immatriculation_actuelle: null,
    });
  }

  // Pre-seed stationnements to demonstrate active present vehicles, unpaid, partial paid, exited, repairs
  const today = '2026-08-26';
  const yesterday = '2026-08-25';

  const stationnements: Stationnement[] = [
    // 1. Present vehicle: Normal + 4x4 + Réparation -> 5 000 Ar, Paid 2 000 Ar -> Partial
    {
      id_stationnement: 'ST-001',
      id_vehicule: 'VEH-002', // Toyota Hilux
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
      observation: 'Révision freins et stationnement journée',
    },
    // 2. Present vehicle: Kospam + Camionnette + Réparation -> 5 000 Ar, Paid 5 000 Ar -> Payé
    {
      id_stationnement: 'ST-002',
      id_vehicule: 'VEH-003', // Renault Master Kospam
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
      observation: 'Remplacement alternateur Kospam',
    },
    // 3. Present vehicle: Normal + Véhicule léger + Sans réparation -> 3 000 Ar, Unpaid -> Non payé
    {
      id_stationnement: 'ST-003',
      id_vehicule: 'VEH-001', // Toyota Corolla
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
      observation: 'Stationnement après-midi',
    },
    // 4. Past Exited: Kospam + Camion + Réparation -> 5 000 Ar, Paid 5 000 Ar -> Sorti & Payé
    {
      id_stationnement: 'ST-004',
      id_vehicule: 'VEH-005', // Renault Truck Kospam
      id_place: null,
      date_entree: yesterday,
      heure_entree: '07:45',
      date_sortie: yesterday,
      heure_sortie: '18:30',
      reparation: true,
      montant_du: 5000,
      montant_paye: 5000,
      reste_a_payer: 0,
      statut: 'Sorti',
      statut_paiement: 'Payé',
      observation: 'Maintenance terminée et véhicule récupéré',
    },
    // 5. Past Exited: Normal + Bus + Réparation -> 5 000 Ar, Paid 5 000 Ar -> Sorti & Payé
    {
      id_stationnement: 'ST-005',
      id_vehicule: 'VEH-004', // Mercedes Bus
      id_place: null,
      date_entree: yesterday,
      heure_entree: '08:00',
      date_sortie: yesterday,
      heure_sortie: '17:00',
      reparation: true,
      montant_du: 5000,
      montant_paye: 5000,
      reste_a_payer: 0,
      statut: 'Sorti',
      statut_paiement: 'Payé',
      observation: 'Diagnostic injection',
    },
  ];

  // Update places status for occupied spots
  places[0].statut = 'Occupée';
  places[0].id_stationnement_actuel = 'ST-001';
  places[0].immatriculation_actuelle = '5678 TAC';

  places[1].statut = 'Occupée';
  places[1].id_stationnement_actuel = 'ST-002';
  places[1].immatriculation_actuelle = '9012 TAD';

  places[2].statut = 'Occupée';
  places[2].id_stationnement_actuel = 'ST-003';
  places[2].immatriculation_actuelle = '1234 TAB';

  // Seed Payments
  const paiements: Paiement[] = [
    {
      id_paiement: 'PAY-001',
      id_stationnement: 'ST-001',
      date_paiement: `${today} 08:20:00`,
      montant: 2000,
      mode_paiement: 'Espèces',
      reference: 'ESP-8812',
      observation: 'Acompte versé à l’entrée',
    },
    {
      id_paiement: 'PAY-002',
      id_stationnement: 'ST-002',
      date_paiement: `${today} 09:05:00`,
      montant: 5000,
      mode_paiement: 'Mobile Money',
      reference: 'MM-KOSPAM-991',
      observation: 'Paiement intégral Mvola Kospam',
    },
    {
      id_paiement: 'PAY-003',
      id_stationnement: 'ST-004',
      date_paiement: `${yesterday} 18:25:00`,
      montant: 5000,
      mode_paiement: 'Virement',
      reference: 'VIR-BNI-4421',
      observation: 'Règlement virement bancaire',
    },
    {
      id_paiement: 'PAY-004',
      id_stationnement: 'ST-005',
      date_paiement: `${yesterday} 16:50:00`,
      montant: 5000,
      mode_paiement: 'Espèces',
      reference: 'ESP-8790',
      observation: 'Règlement sortie bus',
    },
  ];

  // Seed Portefeuille (Movements with running balance calculation)
  const initialMovements: Omit<MouvementPortefeuille, 'solde'>[] = [
    {
      id_mouvement: 'MVT-001',
      date: `${yesterday} 07:00:00`,
      type_mouvement: 'Autre entrée',
      reference: 'FOND-CAISSE',
      entree: 50000,
      sortie: 0,
      motif: 'Fond de caisse initial',
      observation: 'Ouverture de caisse gérant',
    },
    {
      id_mouvement: 'MVT-002',
      date: `${yesterday} 16:50:00`,
      type_mouvement: 'Encaissement parking',
      reference: 'PAY-004',
      entree: 5000,
      sortie: 0,
      motif: 'Paiement stationnement ST-005 (Mercedes Bus)',
      observation: 'Espèces',
      id_paiement: 'PAY-004',
    },
    {
      id_mouvement: 'MVT-003',
      date: `${yesterday} 17:30:00`,
      type_mouvement: 'Dépense',
      reference: 'DEP-TICKET-01',
      entree: 0,
      sortie: 10000,
      motif: 'Achat rouleaux papier thermique pour tickets',
      observation: 'Fournitures de caisse',
    },
    {
      id_mouvement: 'MVT-004',
      date: `${yesterday} 18:25:00`,
      type_mouvement: 'Encaissement parking',
      reference: 'PAY-003',
      entree: 5000,
      sortie: 0,
      motif: 'Paiement stationnement ST-004 (Truck Kospam)',
      observation: 'Virement',
      id_paiement: 'PAY-003',
    },
    {
      id_mouvement: 'MVT-005',
      date: `${today} 08:20:00`,
      type_mouvement: 'Encaissement parking',
      reference: 'PAY-001',
      entree: 2000,
      sortie: 0,
      motif: 'Acompte stationnement ST-001 (Toyota Hilux)',
      observation: 'Espèces',
      id_paiement: 'PAY-001',
    },
    {
      id_mouvement: 'MVT-006',
      date: `${today} 09:05:00`,
      type_mouvement: 'Encaissement parking',
      reference: 'PAY-002',
      entree: 5000,
      sortie: 0,
      motif: 'Paiement stationnement ST-002 (Renault Master Kospam)',
      observation: 'Mobile Money',
      id_paiement: 'PAY-002',
    },
  ];

  let currentSolde = 0;
  const portefeuille: MouvementPortefeuille[] = initialMovements.map((m) => {
    currentSolde += m.entree - m.sortie;
    return {
      ...m,
      solde: currentSolde,
    };
  });

  return {
    clients,
    vehicules,
    places,
    stationnements,
    paiements,
    portefeuille,
    parametres: DEFAULT_PARAMS,
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        if (
          parsed &&
          Array.isArray(parsed.clients) &&
          Array.isArray(parsed.vehicules) &&
          Array.isArray(parsed.stationnements)
        ) {
          // ensure places and params
          if (!parsed.parametres) parsed.parametres = DEFAULT_PARAMS;
          if (!parsed.places || parsed.places.length === 0) {
            const seed = generateInitialSeed();
            parsed.places = seed.places;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading database.json, initializing fresh seed:', e);
    }

    const initial = generateInitialSeed();
    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(dbData: DatabaseSchema) {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dbData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  public persist() {
    this.saveDirect(this.data);
  }

  public resetToDefault(): DatabaseSchema {
    this.data = generateInitialSeed();
    this.persist();
    return this.data;
  }

  // --- GETTERS WITH AUTOMATIC JOINS ---

  public getParametres(): ParametresApp {
    return this.data.parametres || DEFAULT_PARAMS;
  }

  public updateParametres(params: Partial<ParametresApp>): ParametresApp {
    const rawCapacite =
      params.capacite_totale !== undefined
        ? params.capacite_totale
        : params.nombre_total_places !== undefined
        ? params.nombre_total_places
        : this.data.parametres.capacite_totale || 30;

    const capacite = Math.max(1, Math.floor(Number(rawCapacite)) || 30);

    this.data.parametres = {
      ...this.data.parametres,
      ...params,
      capacite_totale: capacite,
      nombre_total_places: capacite,
      tarifs: {
        ...this.data.parametres.tarifs,
        ...(params.tarifs || {}),
      },
    };

    // Synchronisation automatique et dynamique de la liste des places réelles
    const currentPlacesCount = this.data.places.length;
    if (capacite > currentPlacesCount) {
      // Création des nouvelles places libres pour atteindre la capacité demandée
      for (let i = currentPlacesCount + 1; i <= capacite; i++) {
        this.data.places.push({
          id_place: `PLC-${String(i).padStart(3, '0')}`,
          numero_place: `P-${String(i).padStart(2, '0')}`,
          statut: 'Libre',
          type_zone: 'Standard',
          id_stationnement_actuel: null,
          immatriculation_actuelle: null,
        });
      }
    } else if (capacite < currentPlacesCount) {
      // Réduction : suppression des places libres non occupées depuis la fin
      for (let i = this.data.places.length - 1; i >= 0 && this.data.places.length > capacite; i--) {
        const place = this.data.places[i];
        if (place && place.statut !== 'Occupée') {
          this.data.places.splice(i, 1);
        }
      }
    }

    this.persist();
    return this.data.parametres;
  }

  public getClients(): Client[] {
    return this.data.clients;
  }

  public getClientById(id: string): Client | undefined {
    return this.data.clients.find((c) => c.id_client === id);
  }

  public createClient(clientData: Omit<Client, 'id_client'>): Client {
    const nextNum = this.data.clients.length + 1;
    const isKospam = clientData.type_client === 'Kospam';
    const id_client = isKospam ? 'CLI-KOSPAM' : `CLI-${String(nextNum).padStart(3, '0')}`;

    // check if id already exists
    let finalId = id_client;
    let count = 1;
    while (this.data.clients.some((c) => c.id_client === finalId)) {
      finalId = `${id_client}-${count}`;
      count++;
    }

    const newClient: Client = {
      ...clientData,
      id_client: finalId,
      date_creation: clientData.date_creation || new Date().toISOString().split('T')[0],
    };

    this.data.clients.push(newClient);
    this.persist();
    return newClient;
  }

  public updateClient(id: string, updates: Partial<Client>): Client {
    const index = this.data.clients.findIndex((c) => c.id_client === id);
    if (index === -1) throw new Error('Client introuvable');
    this.data.clients[index] = { ...this.data.clients[index], ...updates };
    this.persist();
    return this.data.clients[index];
  }

  public deleteClient(id: string): boolean {
    const hasVehicles = this.data.vehicules.some((v) => v.id_client === id);
    if (hasVehicles) {
      throw new Error('Impossible de supprimer ce client car il possède des véhicules enregistrés.');
    }
    const initialLength = this.data.clients.length;
    this.data.clients = this.data.clients.filter((c) => c.id_client !== id);
    this.persist();
    return this.data.clients.length < initialLength;
  }

  // --- VEHICLES ---

  public getVehicules(): Vehicule[] {
    return this.data.vehicules.map((v) => {
      const client = this.data.clients.find((c) => c.id_client === v.id_client);
      return {
        ...v,
        client_nom: client ? client.nom : 'Inconnu',
        client_type: client ? client.type_client : 'Normal',
      };
    });
  }

  public getVehiculeById(id: string): Vehicule | undefined {
    const v = this.data.vehicules.find((item) => item.id_vehicule === id);
    if (!v) return undefined;
    const client = this.data.clients.find((c) => c.id_client === v.id_client);
    return {
      ...v,
      client_nom: client ? client.nom : 'Inconnu',
      client_type: client ? client.type_client : 'Normal',
    };
  }

  public getVehiculeByImmatriculation(immat: string): Vehicule | undefined {
    const clean = immat.trim().toUpperCase();
    const v = this.data.vehicules.find(
      (item) => item.immatriculation.trim().toUpperCase() === clean
    );
    if (!v) return undefined;
    const client = this.data.clients.find((c) => c.id_client === v.id_client);
    return {
      ...v,
      client_nom: client ? client.nom : 'Inconnu',
      client_type: client ? client.type_client : 'Normal',
    };
  }

  public createVehicule(vehiculeData: Omit<Vehicule, 'id_vehicule'>): Vehicule {
    const cleanImmat = vehiculeData.immatriculation.trim().toUpperCase();
    if (!cleanImmat) {
      throw new Error("L'immatriculation est obligatoire");
    }

    const existing = this.data.vehicules.find(
      (v) => v.immatriculation.trim().toUpperCase() === cleanImmat
    );
    if (existing) {
      throw new Error(`Un véhicule avec l'immatriculation "${cleanImmat}" existe déjà.`);
    }

    const nextNum = this.data.vehicules.length + 1;
    const id_vehicule = `VEH-${String(nextNum).padStart(3, '0')}`;

    const newVehicule: Vehicule = {
      ...vehiculeData,
      id_vehicule,
      immatriculation: cleanImmat,
      date_creation: vehiculeData.date_creation || new Date().toISOString().split('T')[0],
    };

    this.data.vehicules.push(newVehicule);
    this.persist();
    return this.getVehiculeById(id_vehicule)!;
  }

  public updateVehicule(id: string, updates: Partial<Vehicule>): Vehicule {
    const index = this.data.vehicules.findIndex((v) => v.id_vehicule === id);
    if (index === -1) throw new Error('Véhicule introuvable');

    if (updates.immatriculation) {
      const cleanImmat = updates.immatriculation.trim().toUpperCase();
      const duplicate = this.data.vehicules.find(
        (v) => v.id_vehicule !== id && v.immatriculation.trim().toUpperCase() === cleanImmat
      );
      if (duplicate) {
        throw new Error(`L'immatriculation "${cleanImmat}" est déjà utilisée par un autre véhicule.`);
      }
      updates.immatriculation = cleanImmat;
    }

    this.data.vehicules[index] = { ...this.data.vehicules[index], ...updates };
    this.persist();
    return this.getVehiculeById(id)!;
  }

  public deleteVehicule(id: string): boolean {
    const isPresent = this.data.stationnements.some(
      (s) => s.id_vehicule === id && s.statut === 'Présent'
    );
    if (isPresent) {
      throw new Error('Impossible de supprimer un véhicule actuellement présent dans le parking.');
    }
    const hasHistory = this.data.stationnements.some((s) => s.id_vehicule === id);
    if (hasHistory) {
      throw new Error('Impossible de supprimer un véhicule qui a un historique de stationnement.');
    }

    const initialLength = this.data.vehicules.length;
    this.data.vehicules = this.data.vehicules.filter((v) => v.id_vehicule !== id);
    this.persist();
    return this.data.vehicules.length < initialLength;
  }

  // --- PLACES ---

  public getPlaces(): Place[] {
    return this.data.places;
  }

  public createPlace(placeData: { numero_place: string; statut?: StatutPlace; type_zone?: string; observation?: string } | string): Place {
    const numero = typeof placeData === 'string' ? placeData : placeData.numero_place;
    const cleanNum = (numero || '').trim().toUpperCase();
    if (!cleanNum) {
      throw new Error('Le numéro de place est obligatoire.');
    }
    if (this.data.places.some((p) => p.numero_place.toUpperCase() === cleanNum)) {
      throw new Error(`La place ${cleanNum} existe déjà.`);
    }
    const nextNum = this.data.places.length + 1;
    const newPlace: Place = {
      id_place: `PLC-${String(nextNum).padStart(3, '0')}`,
      numero_place: cleanNum,
      statut: typeof placeData === 'object' && placeData.statut ? placeData.statut : 'Libre',
      type_zone: typeof placeData === 'object' ? placeData.type_zone || 'Standard' : 'Standard',
      observation: typeof placeData === 'object' ? placeData.observation || '' : '',
      id_stationnement_actuel: null,
      immatriculation_actuelle: null,
    };
    this.data.places.push(newPlace);
    this.persist();
    return newPlace;
  }

  public updatePlace(id: string, updates: Partial<Place>): Place {
    const index = this.data.places.findIndex((p) => p.id_place === id);
    if (index === -1) throw new Error('Place introuvable');

    if (updates.numero_place) {
      const cleanNum = updates.numero_place.trim().toUpperCase();
      const duplicate = this.data.places.find(
        (p) => p.id_place !== id && p.numero_place.toUpperCase() === cleanNum
      );
      if (duplicate) {
        throw new Error(`Le numéro de place ${cleanNum} est déjà utilisé.`);
      }
      updates.numero_place = cleanNum;
    }

    this.data.places[index] = { ...this.data.places[index], ...updates };
    this.persist();
    return this.data.places[index];
  }

  public deletePlace(id: string): boolean {
    const place = this.data.places.find((p) => p.id_place === id);
    if (!place) throw new Error('Place introuvable');

    const isOccupied = this.data.stationnements.some(
      (s) => s.id_place === id && s.statut === 'Présent'
    );
    if (isOccupied || place.statut === 'Occupée') {
      throw new Error('Impossible de supprimer une place actuellement occupée.');
    }

    this.data.places = this.data.places.filter((p) => p.id_place !== id);
    this.persist();
    return true;
  }

  public getRapportStats(options?: { periode?: string; date_debut?: string; date_fin?: string }): any {
    let stationnements = this.getStationnements();
    let paiements = this.getPaiements();
    let portefeuille = this.getPortefeuille();

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (options?.date_debut) {
      stationnements = stationnements.filter((s) => s.date_entree >= options.date_debut!);
      paiements = paiements.filter((p) => p.date_paiement >= options.date_debut!);
      portefeuille = portefeuille.filter((m) => m.date >= options.date_debut!);
    } else if (options?.periode === 'aujourdhui') {
      stationnements = stationnements.filter((s) => s.date_entree === today);
      paiements = paiements.filter((p) => p.date_paiement.startsWith(today));
      portefeuille = portefeuille.filter((m) => m.date.startsWith(today));
    } else if (options?.periode === 'mois') {
      const monthPrefix = today.slice(0, 7);
      stationnements = stationnements.filter((s) => s.date_entree.startsWith(monthPrefix));
      paiements = paiements.filter((p) => p.date_paiement.startsWith(monthPrefix));
      portefeuille = portefeuille.filter((m) => m.date.startsWith(monthPrefix));
    } else if (options?.periode === 'annee') {
      const yearPrefix = today.slice(0, 4);
      stationnements = stationnements.filter((s) => s.date_entree.startsWith(yearPrefix));
      paiements = paiements.filter((p) => p.date_paiement.startsWith(yearPrefix));
      portefeuille = portefeuille.filter((m) => m.date.startsWith(yearPrefix));
    }

    if (options?.date_fin) {
      stationnements = stationnements.filter((s) => s.date_entree <= options.date_fin!);
      paiements = paiements.filter((p) => p.date_paiement <= options.date_fin! + ' 23:59:59');
      portefeuille = portefeuille.filter((m) => m.date <= options.date_fin! + ' 23:59:59');
    }

    const total_entrees = stationnements.length;
    const total_sorties = stationnements.filter((s) => s.statut === 'Sorti').length;
    const nombre_reparations = stationnements.filter((s) => s.reparation).length;
    const total_montant_du = stationnements.reduce((sum, s) => sum + s.montant_du, 0);
    const total_montant_paye = paiements.reduce((sum, p) => sum + Number(p.montant || 0), 0);
    const total_impayes = stationnements.reduce((sum, s) => sum + (s.reste_a_payer || 0), 0);
    const total_depenses = portefeuille.reduce((sum, m) => sum + Number(m.sortie || 0), 0);
    const solde_net = total_montant_paye - total_depenses;

    const par_categorie: Record<string, number> = {};
    stationnements.forEach((s) => {
      const cat = s.categorie || 'Véhicule léger';
      par_categorie[cat] = (par_categorie[cat] || 0) + 1;
    });

    const par_client: Record<string, number> = {
      'Client Normal': 0,
      'Garage Kospam': 0,
    };
    stationnements.forEach((s) => {
      if (s.client_type === 'Kospam') {
        par_client['Garage Kospam'] += 1;
      } else {
        par_client['Client Normal'] += 1;
      }
    });

    const par_mode_paiement: Record<string, number> = {};
    paiements.forEach((p) => {
      const mode = p.mode_paiement || 'Espèces';
      par_mode_paiement[mode] = (par_mode_paiement[mode] || 0) + Number(p.montant || 0);
    });

    return {
      periode: options?.periode || 'mois',
      total_entrees,
      total_sorties,
      nombre_reparations,
      total_montant_du,
      total_montant_paye,
      total_impayes,
      total_depenses_portefeuille: total_depenses,
      solde_net,
      par_categorie,
      par_client,
      par_mode_paiement,
    };
  }

  // --- STATIONNEMENTS ---

  public getStationnements(): Stationnement[] {
    return this.data.stationnements.map((s) => this.enrichStationnement(s));
  }

  public getStationnementById(id: string): Stationnement | undefined {
    const st = this.data.stationnements.find((s) => s.id_stationnement === id);
    if (!st) return undefined;
    return this.enrichStationnement(st);
  }

  private enrichStationnement(s: Stationnement): Stationnement {
    const vehicule = this.data.vehicules.find((v) => v.id_vehicule === s.id_vehicule);
    const client = vehicule
      ? this.data.clients.find((c) => c.id_client === vehicule.id_client)
      : undefined;
    const place = s.id_place
      ? this.data.places.find((p) => p.id_place === s.id_place)
      : undefined;

    // Calculate total payments made for this stationnement
    const totalPaye = this.data.paiements
      .filter((p) => p.id_stationnement === s.id_stationnement)
      .reduce((sum, p) => sum + Number(p.montant || 0), 0);

    const { montant_du, montant_paye, reste_a_payer, statut_paiement } =
      calculerStatutPaiement(s.montant_du, totalPaye);

    return {
      ...s,
      montant_du,
      montant_paye,
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

  /**
   * ENTRÉE D'UN VÉHICULE
   */
  public enregistrerEntree(data: {
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
    date_entree?: string;
    heure_entree?: string;
  }): Stationnement {
    // 1. Resolve or create client
    let finalClientId = data.id_client;
    if (!finalClientId && data.client_data) {
      const createdClient = this.createClient({
        nom: data.client_data.nom,
        type_client: data.client_data.type_client,
        telephone: data.client_data.telephone || '',
        adresse: data.client_data.adresse || '',
        email: data.client_data.email || '',
        observation: '',
      });
      finalClientId = createdClient.id_client;
    }
    if (!finalClientId) {
      throw new Error('Un client valide est obligatoire.');
    }
    const client = this.getClientById(finalClientId);
    if (!client) throw new Error('Client introuvable.');

    // 2. Resolve or create vehicule
    let finalVehiculeId = data.id_vehicule;
    if (!finalVehiculeId && data.vehicule_data) {
      const cleanImmat = data.vehicule_data.immatriculation.trim().toUpperCase();
      const existing = this.getVehiculeByImmatriculation(cleanImmat);
      if (existing) {
        finalVehiculeId = existing.id_vehicule;
        // update client if changed
        if (existing.id_client !== finalClientId) {
          this.updateVehicule(existing.id_vehicule, { id_client: finalClientId });
        }
      } else {
        const createdVeh = this.createVehicule({
          immatriculation: cleanImmat,
          marque: data.vehicule_data.marque,
          modele: data.vehicule_data.modele,
          categorie: data.vehicule_data.categorie,
          id_client: finalClientId,
        });
        finalVehiculeId = createdVeh.id_vehicule;
      }
    }
    if (!finalVehiculeId) {
      throw new Error('Un véhicule valide est obligatoire.');
    }
    const vehicule = this.getVehiculeById(finalVehiculeId);
    if (!vehicule) throw new Error('Véhicule introuvable.');

    // 3. Validation: Prevent two active entries for the same vehicle
    const alreadyPresent = this.data.stationnements.find(
      (s) => s.id_vehicule === finalVehiculeId && s.statut === 'Présent'
    );
    if (alreadyPresent) {
      throw new Error(
        `Le véhicule ${vehicule.immatriculation} est déjà enregistré comme présent dans le parking (Stationnement #${alreadyPresent.id_stationnement}).`
      );
    }

    // 4. Validate and occupy place if provided
    let finalPlaceId = data.id_place || null;
    if (finalPlaceId) {
      const place = this.data.places.find((p) => p.id_place === finalPlaceId);
      if (!place) throw new Error('Place sélectionnée introuvable.');
      if (place.statut === 'Occupée') {
        throw new Error(`La place ${place.numero_place} est déjà occupée.`);
      }
    }

    // 5. Automatic Pricing Calculation via Centralized Engine
    const montant_du = calculerMontant(
      client.type_client,
      vehicule.categorie,
      Boolean(data.reparation),
      this.data.parametres.tarifs
    );

    const now = new Date();
    const dateEntree =
      data.date_entree ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const heureEntree =
      data.heure_entree ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const nextStNum = this.data.stationnements.length + 1;
    const id_stationnement = `ST-${String(nextStNum).padStart(4, '0')}`;

    const newStationnement: Stationnement = {
      id_stationnement,
      id_vehicule: finalVehiculeId,
      id_place: finalPlaceId,
      date_entree: dateEntree,
      heure_entree: heureEntree,
      date_sortie: null,
      heure_sortie: null,
      reparation: Boolean(data.reparation),
      montant_du,
      montant_paye: 0,
      reste_a_payer: montant_du,
      statut: 'Présent',
      statut_paiement: 'Non payé',
      observation: data.observation || '',
    };

    this.data.stationnements.push(newStationnement);

    // If place assigned, mark as occupied
    if (finalPlaceId) {
      const pIndex = this.data.places.findIndex((p) => p.id_place === finalPlaceId);
      if (pIndex !== -1) {
        this.data.places[pIndex].statut = 'Occupée';
        this.data.places[pIndex].id_stationnement_actuel = id_stationnement;
        this.data.places[pIndex].immatriculation_actuelle = vehicule.immatriculation;
      }
    }

    this.persist();
    return this.enrichStationnement(newStationnement);
  }

  /**
   * SORTIE D'UN VÉHICULE
   */
  public enregistrerSortie(data: {
    id_stationnement: string;
    date_sortie?: string;
    heure_sortie?: string;
    paiement?: {
      montant: number;
      mode_paiement: 'Espèces' | 'Mobile Money' | 'Virement' | 'Autre';
      reference?: string;
      observation?: string;
    };
  }): Stationnement {
    const stIndex = this.data.stationnements.findIndex(
      (s) => s.id_stationnement === data.id_stationnement
    );
    if (stIndex === -1) throw new Error('Stationnement introuvable.');

    const currentSt = this.data.stationnements[stIndex];
    if (currentSt.statut === 'Sorti') {
      throw new Error('Ce véhicule est déjà sorti du parking.');
    }

    // Process payment if requested at exit
    if (data.paiement && data.paiement.montant > 0) {
      this.enregistrerPaiement({
        id_stationnement: data.id_stationnement,
        montant: data.paiement.montant,
        mode_paiement: data.paiement.mode_paiement,
        reference: data.paiement.reference || '',
        observation: data.paiement.observation || 'Règlement à la sortie',
      });
    }

    const now = new Date();
    const dateSortie =
      data.date_sortie ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const heureSortie =
      data.heure_sortie ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Free the place if occupied
    if (currentSt.id_place) {
      const pIndex = this.data.places.findIndex((p) => p.id_place === currentSt.id_place);
      if (pIndex !== -1) {
        this.data.places[pIndex].statut = 'Libre';
        this.data.places[pIndex].id_stationnement_actuel = null;
        this.data.places[pIndex].immatriculation_actuelle = null;
      }
    }

    this.data.stationnements[stIndex] = {
      ...this.data.stationnements[stIndex],
      date_sortie: dateSortie,
      heure_sortie: heureSortie,
      statut: 'Sorti',
    };

    this.persist();
    return this.enrichStationnement(this.data.stationnements[stIndex]);
  }

  /**
   * ENREGISTRER UN PAIEMENT
   * Valide les montants et alimente automatiquement le Portefeuille
   */
  public enregistrerPaiement(data: {
    id_stationnement: string;
    montant: number;
    mode_paiement: 'Espèces' | 'Mobile Money' | 'Virement' | 'Autre';
    reference?: string;
    observation?: string;
  }): Paiement {
    const amount = Number(data.montant);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Le montant du paiement doit être supérieur à zéro (aucun paiement négatif ou nul).');
    }

    const st = this.data.stationnements.find((s) => s.id_stationnement === data.id_stationnement);
    if (!st) throw new Error('Stationnement introuvable.');

    const vehicule = this.getVehiculeById(st.id_vehicule);
    const client = vehicule ? this.getClientById(vehicule.id_client) : undefined;

    const nextPayNum = this.data.paiements.length + 1;
    const id_paiement = `PAY-${String(nextPayNum).padStart(4, '0')}`;

    const now = new Date();
    const date_paiement = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newPayment: Paiement = {
      id_paiement,
      id_stationnement: data.id_stationnement,
      date_paiement,
      montant: amount,
      mode_paiement: data.mode_paiement || 'Espèces',
      reference: data.reference || `REF-${id_paiement}`,
      observation: data.observation || '',
    };

    this.data.paiements.push(newPayment);

    // RÈGLE IMPORTANTE : Mouvement automatique dans le portefeuille
    this.ajouterMouvementPortefeuille({
      type_mouvement: 'Encaissement parking',
      reference: newPayment.reference || id_paiement,
      entree: amount,
      sortie: 0,
      motif: `Encaissement Stationnement #${st.id_stationnement} (${vehicule?.immatriculation || ''} - ${client?.nom || ''})`,
      observation: `Mode: ${data.mode_paiement}${data.observation ? ` | ${data.observation}` : ''}`,
      id_paiement,
    });

    this.persist();

    return {
      ...newPayment,
      immatriculation: vehicule?.immatriculation,
      client_nom: client?.nom,
      client_type: client?.type_client,
    };
  }

  public getPaiements(): Paiement[] {
    return this.data.paiements.map((p) => {
      const st = this.data.stationnements.find((s) => s.id_stationnement === p.id_stationnement);
      const veh = st ? this.getVehiculeById(st.id_vehicule) : undefined;
      const client = veh ? this.getClientById(veh.id_client) : undefined;
      return {
        ...p,
        immatriculation: veh?.immatriculation,
        client_nom: client?.nom,
        client_type: client?.type_client,
      };
    });
  }

  public deletePaiement(id_paiement: string): boolean {
    const payment = this.data.paiements.find((p) => p.id_paiement === id_paiement);
    if (!payment) throw new Error('Paiement introuvable.');

    // Remove payment
    this.data.paiements = this.data.paiements.filter((p) => p.id_paiement !== id_paiement);

    // Add compensating wallet movement for financial audit trail
    this.ajouterMouvementPortefeuille({
      type_mouvement: 'Autre sortie',
      reference: `ANNUL-${id_paiement}`,
      entree: 0,
      sortie: payment.montant,
      motif: `Annulation du paiement #${id_paiement}`,
      observation: `Régularisation suite à suppression du paiement`,
    });

    this.persist();
    return true;
  }

  // --- PORTEFEUILLE ---

  public getPortefeuille(): MouvementPortefeuille[] {
    return this.data.portefeuille;
  }

  public ajouterMouvementPortefeuille(data: {
    type_mouvement: 'Encaissement parking' | 'Dépense' | 'Autre entrée' | 'Autre sortie';
    reference?: string;
    entree: number;
    sortie: number;
    motif: string;
    observation?: string;
    id_paiement?: string;
  }): MouvementPortefeuille {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const currentSolde = this.getSoldePortefeuille();
    const entree = Math.max(0, Number(data.entree) || 0);
    const sortie = Math.max(0, Number(data.sortie) || 0);
    const newSolde = currentSolde + entree - sortie;

    const nextMvtNum = this.data.portefeuille.length + 1;
    const id_mouvement = `MVT-${String(nextMvtNum).padStart(4, '0')}`;

    const newMvt: MouvementPortefeuille = {
      id_mouvement,
      date: dateStr,
      type_mouvement: data.type_mouvement,
      reference: data.reference || `REF-${id_mouvement}`,
      entree,
      sortie,
      solde: newSolde,
      motif: data.motif,
      observation: data.observation || '',
      id_paiement: data.id_paiement,
    };

    this.data.portefeuille.push(newMvt);
    this.persist();
    return newMvt;
  }

  public getSoldePortefeuille(): number {
    const totalEntrees = this.data.portefeuille.reduce((sum, m) => sum + (Number(m.entree) || 0), 0);
    const totalSorties = this.data.portefeuille.reduce((sum, m) => sum + (Number(m.sortie) || 0), 0);
    return totalEntrees - totalSorties;
  }

  // --- STATISTIQUES REELLES DU TABLEAU DE BORD (Non simulées) ---

  public getDashboardStats(): DashboardStats {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const allSt = this.getStationnements();
    const presents = allSt.filter((s) => s.statut === 'Présent');
    const entreesJour = allSt.filter((s) => s.date_entree === todayStr).length;
    const sortiesJour = allSt.filter(
      (s) => s.statut === 'Sorti' && (s.date_sortie === todayStr || (!s.date_sortie && s.date_entree === todayStr))
    ).length;

    const allPayments = this.data.paiements;
    const recettesJour = allPayments
      .filter((p) => p.date_paiement.startsWith(todayStr))
      .reduce((sum, p) => sum + Number(p.montant || 0), 0);

    const recettesMois = allPayments
      .filter((p) => p.date_paiement.startsWith(currentYearMonth))
      .reduce((sum, p) => sum + Number(p.montant || 0), 0);

    const nonPayes = allSt.filter((s) => s.statut_paiement === 'Non payé').length;
    const partPayes = allSt.filter((s) => s.statut_paiement === 'Partiellement payé').length;
    const totalAEncaisser = allSt.reduce((sum, s) => sum + (s.reste_a_payer || 0), 0);

    const totalEncaisse = this.data.portefeuille.reduce((sum, m) => sum + (Number(m.entree) || 0), 0);
    const totalDepense = this.data.portefeuille.reduce((sum, m) => sum + (Number(m.sortie) || 0), 0);
    const soldePortefeuille = totalEncaisse - totalDepense;

    const placesOccupees = this.data.places.filter((p) => p.statut === 'Occupée').length;
    const placesLibres = this.data.places.filter((p) => p.statut === 'Libre').length;

    // Recettes par jour (derniers 7 jours)
    const recettesParJourMap: { [date: string]: { montant: number; entrees: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      recettesParJourMap[iso] = { montant: 0, entrees: 0 };
    }
    allPayments.forEach((p) => {
      const day = p.date_paiement.split(' ')[0];
      if (recettesParJourMap[day]) {
        recettesParJourMap[day].montant += Number(p.montant || 0);
      }
    });
    allSt.forEach((s) => {
      if (recettesParJourMap[s.date_entree]) {
        recettesParJourMap[s.date_entree].entrees += 1;
      }
    });
    const recettes_par_jour = Object.keys(recettesParJourMap).map((k) => ({
      date: k,
      montant: recettesParJourMap[k].montant,
      entrees: recettesParJourMap[k].entrees,
    }));

    // Recettes par mois (sur les 6 derniers mois)
    const moisNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const recettesParMoisMap: { [key: string]: number } = {};
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      recettesParMoisMap[key] = 0;
    }
    allPayments.forEach((p) => {
      const monthPrefix = p.date_paiement.substring(0, 7);
      if (recettesParMoisMap[monthPrefix] !== undefined) {
        recettesParMoisMap[monthPrefix] += Number(p.montant || 0);
      }
    });
    const recettes_par_mois = Object.keys(recettesParMoisMap).map((k) => {
      const [year, month] = k.split('-');
      const label = `${moisNames[parseInt(month, 10) - 1]} ${year}`;
      return { mois: label, montant: recettesParMoisMap[k] };
    });

    // Véhicules par catégorie
    const catMap: { [key: string]: { count: number; total_montant: number } } = {
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

    // Répartition modes de paiement
    const modeMap: { [key: string]: { count: number; montant: number } } = {
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

    // Clients les plus fréquents
    const clientUsage: { [id_client: string]: { nom: string; type: string; passages: number; montant: number } } = {};
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
      places_occupees: placesOccupees,
      places_libres: placesLibres,
      entrees_jour: entreesJour,
      sorties_jour: sortiesJour,
      recettes_jour: recettesJour,
      recettes_mois: recettesMois,
      total_non_paye: nonPayes,
      total_partiellement_paye: partPayes,
      total_a_encaisser: totalAEncaisser,
      solde_portefeuille: soldePortefeuille,
      total_encaisse: totalEncaisse,
      total_depense: totalDepense,
      recettes_par_jour,
      recettes_par_mois,
      vehicules_par_categorie,
      repartition_modes_paiement,
      clients_frequents,
    };
  }

  // --- STATS DÉDIÉES GARAGE KOSPAM ---

  public getKospamStats(): KospamStats {
    const kospamClient = this.data.clients.find((c) => c.type_client === 'Kospam');
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

    // Group billing by month
    const periodsMap: {
      [periode: string]: {
        vehicules: Set<string>;
        stationnements: number;
        reparations: number;
        total_du: number;
        total_paye: number;
      };
    } = {};

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

  // --- EXECUTION DES 10 TESTS OBLIGATOIRES (Section 26) ---

  public executerTestsObligatoires(): TestResult[] {
    const tarifs = this.data.parametres.tarifs || TARIFS_PAR_DEFAUT;
    const results: TestResult[] = [];

    // Test 1: Normal + véhicule léger + sans réparation -> 3 000 Ar
    const t1 = calculerMontant('Normal', 'Véhicule léger', false, tarifs);
    results.push({
      id: 1,
      nom: 'Test 1',
      description: 'Client Normal + Véhicule léger + Sans réparation',
      attendu: '3 000 Ar',
      obtenu: `${t1.toLocaleString('fr-FR')} Ar`,
      succes: t1 === 3000,
    });

    // Test 2: Normal + véhicule léger + réparation -> 3 000 Ar
    const t2 = calculerMontant('Normal', 'Véhicule léger', true, tarifs);
    results.push({
      id: 2,
      nom: 'Test 2',
      description: 'Client Normal + Véhicule léger + Réparation (tarif de base sans majoration)',
      attendu: '3 000 Ar',
      obtenu: `${t2.toLocaleString('fr-FR')} Ar`,
      succes: t2 === 3000,
    });

    // Test 3: Normal + 4x4 + réparation -> 5 000 Ar
    const t3 = calculerMontant('Normal', '4x4', true, tarifs);
    results.push({
      id: 3,
      nom: 'Test 3',
      description: 'Client Normal + 4x4 + Réparation',
      attendu: '5 000 Ar',
      obtenu: `${t3.toLocaleString('fr-FR')} Ar`,
      succes: t3 === 5000,
    });

    // Test 4: Normal + camion + réparation -> 5 000 Ar
    const t4 = calculerMontant('Normal', 'Camion', true, tarifs);
    results.push({
      id: 4,
      nom: 'Test 4',
      description: 'Client Normal + Camion + Réparation',
      attendu: '5 000 Ar',
      obtenu: `${t4.toLocaleString('fr-FR')} Ar`,
      succes: t4 === 5000,
    });

    // Test 5: Kospam + véhicule léger + sans réparation -> 3 000 Ar
    const t5 = calculerMontant('Kospam', 'Véhicule léger', false, tarifs);
    results.push({
      id: 5,
      nom: 'Test 5',
      description: 'Garage Kospam + Véhicule léger + Sans réparation',
      attendu: '3 000 Ar',
      obtenu: `${t5.toLocaleString('fr-FR')} Ar`,
      succes: t5 === 3000,
    });

    // Test 6: Kospam + véhicule léger + réparation -> 5 000 Ar
    const t6 = calculerMontant('Kospam', 'Véhicule léger', true, tarifs);
    results.push({
      id: 6,
      nom: 'Test 6',
      description: 'Garage Kospam + Véhicule léger + Réparation',
      attendu: '5 000 Ar',
      obtenu: `${t6.toLocaleString('fr-FR')} Ar`,
      succes: t6 === 5000,
    });

    // Test 7: Kospam + camion + réparation -> 5 000 Ar (Règle absolue Kospam)
    const t7 = calculerMontant('Kospam', 'Camion', true, tarifs);
    results.push({
      id: 7,
      nom: 'Test 7',
      description: 'Garage Kospam + Camion + Réparation (Règle absolue Kospam)',
      attendu: '5 000 Ar',
      obtenu: `${t7.toLocaleString('fr-FR')} Ar`,
      succes: t7 === 5000,
    });

    // Test 8: Montant dû : 5 000 Ar, Paiement : 2 000 Ar -> Reste : 3 000 Ar, Statut : Partiellement payé
    const st8 = calculerStatutPaiement(5000, 2000);
    const ok8 = st8.reste_a_payer === 3000 && st8.statut_paiement === 'Partiellement payé';
    results.push({
      id: 8,
      nom: 'Test 8',
      description: 'Calcul reste et statut (Dû: 5 000 Ar, Payé: 2 000 Ar)',
      attendu: 'Reste: 3 000 Ar | Statut: Partiellement payé',
      obtenu: `Reste: ${st8.reste_a_payer.toLocaleString('fr-FR')} Ar | Statut: ${st8.statut_paiement}`,
      succes: ok8,
    });

    // Test 9: Montant dû : 5 000 Ar, Paiement : 5 000 Ar -> Reste : 0 Ar, Statut : Payé
    const st9 = calculerStatutPaiement(5000, 5000);
    const ok9 = st9.reste_a_payer === 0 && st9.statut_paiement === 'Payé';
    results.push({
      id: 9,
      nom: 'Test 9',
      description: 'Calcul reste et statut complet (Dû: 5 000 Ar, Payé: 5 000 Ar)',
      attendu: 'Reste: 0 Ar | Statut: Payé',
      obtenu: `Reste: ${st9.reste_a_payer.toLocaleString('fr-FR')} Ar | Statut: ${st9.statut_paiement}`,
      succes: ok9,
    });

    // Test 10: Paiement : 5 000 Ar -> Portefeuille augmenté de 5 000 Ar
    const soldeInitial = this.getSoldePortefeuille();
    const testMvt = this.ajouterMouvementPortefeuille({
      type_mouvement: 'Encaissement parking',
      reference: 'TEST-10-CHECK',
      entree: 5000,
      sortie: 0,
      motif: 'Test 10 : Vérification incrément portefeuille',
    });
    const soldeApres = this.getSoldePortefeuille();
    const diff = soldeApres - soldeInitial;
    // Remove the temporary test movement so we don't pollute live data
    this.data.portefeuille = this.data.portefeuille.filter((m) => m.id_mouvement !== testMvt.id_mouvement);
    this.persist();

    results.push({
      id: 10,
      nom: 'Test 10',
      description: 'Paiement 5 000 Ar -> Portefeuille augmenté de +5 000 Ar',
      attendu: '+5 000 Ar au portefeuille',
      obtenu: `+${diff.toLocaleString('fr-FR')} Ar`,
      succes: diff === 5000,
    });

    return results;
  }
}

export const db = new DatabaseManager();
