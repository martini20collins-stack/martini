export type TypeClient = 'Normal' | 'Kospam';

export type TypeStationnement =
  | 'Journée normale'
  | 'Nuit'
  | 'Nuit – Parking sécurisé';

export const TYPES_STATIONNEMENT: TypeStationnement[] = [
  'Journée normale',
  'Nuit',
  'Nuit – Parking sécurisé',
];

export type CategorieVehicule =
  | 'Véhicule léger'
  | '4x4'
  | 'Camionnette'
  | 'Bus'
  | 'Camion';

export const CATEGORIES_VEHICULES: CategorieVehicule[] = [
  'Véhicule léger',
  '4x4',
  'Camionnette',
  'Bus',
  'Camion',
];

export type StatutPlace = 'Libre' | 'Occupée' | 'Réservée' | 'Hors service';

export const STATUTS_PLACE: StatutPlace[] = [
  'Libre',
  'Occupée',
  'Réservée',
  'Hors service',
];

export type StatutStationnement = 'Présent' | 'Sorti';

export type StatutPaiement = 'Payé' | 'Partiellement payé' | 'Non payé';

export type ModePaiement = 'Espèces' | 'Mobile Money' | 'Virement' | 'Autre';

export const MODES_PAIEMENT: ModePaiement[] = [
  'Espèces',
  'Mobile Money',
  'Virement',
  'Autre',
];

export type TypeMouvement =
  | 'Solde initial'
  | 'Encaissement parking'
  | 'Ancienne recette'
  | 'Ancienne dépense'
  | 'Dépense'
  | 'Autre entrée'
  | 'Autre sortie';

export interface Client {
  id_client: string;
  nom: string;
  type_client: TypeClient;
  telephone: string;
  adresse: string;
  email: string;
  observation?: string;
  date_creation?: string;
}

export interface Vehicule {
  id_vehicule: string;
  immatriculation: string; // UNIQUE
  marque: string;
  modele: string;
  categorie: CategorieVehicule;
  id_client: string;
  observation?: string;
  date_creation?: string;
  // Computed / joined
  client_nom?: string;
  client_type?: TypeClient;
}

export interface Place {
  id_place: string;
  numero_place: string;
  statut: StatutPlace;
  type_zone?: string;
  observation?: string;
  id_stationnement_actuel?: string | null;
  immatriculation_actuelle?: string | null;
}

export interface Stationnement {
  id_stationnement: string;
  id_vehicule: string;
  id_place?: string | null;
  date_entree: string; // YYYY-MM-DD
  heure_entree?: string; // HH:mm
  date_sortie?: string | null; // YYYY-MM-DD
  heure_sortie?: string | null; // HH:mm
  reparation: boolean;
  type_stationnement?: TypeStationnement; // 'Journée normale' | 'Nuit' | 'Nuit – Parking sécurisé'
  reste_la_nuit?: boolean; // Resté la nuit ? Oui / Non (suivi uniquement)
  historique_ancien?: boolean; // Véhicule entré/sorti avant la mise en place de l'application
  montant_du: number; // = montant_a_payer
  montant_a_payer?: number;
  montant_paye?: number;
  reste_a_payer?: number;
  mode_paiement?: ModePaiement;
  statut: StatutStationnement; // 'Présent' | 'Sorti'
  statut_paiement?: StatutPaiement; // 'Payé' | 'Partiellement payé' | 'Non payé'
  observation?: string;
  // User convenience / Joined fields
  date?: string; // YYYY-MM-DD (alias to date_entree)
  nom_client?: string;
  categorie_client?: TypeClient;
  categorie_vehicule?: CategorieVehicule;
  immatriculation?: string;
  marque?: string;
  modele?: string;
  categorie?: CategorieVehicule;
  id_client?: string;
  client_nom?: string;
  client_type?: TypeClient;
  numero_place?: string;
}

export interface Paiement {
  id_paiement: string;
  id_stationnement: string;
  date_paiement: string; // YYYY-MM-DD HH:mm:ss
  montant: number;
  mode_paiement: ModePaiement;
  reference?: string;
  observation?: string;
  // Joined fields
  immatriculation?: string;
  client_nom?: string;
  client_type?: TypeClient;
}

export interface MouvementPortefeuille {
  id_mouvement: string;
  date: string; // YYYY-MM-DD HH:mm:ss
  type_mouvement: TypeMouvement;
  reference?: string;
  entree: number;
  sortie: number;
  solde: number;
  motif: string;
  observation?: string;
  id_paiement?: string;
  categorie?: string;
}

export interface TarifsConfig {
  stationnement_base: number; // 3000 Ar (Journée normale)
  supplement_nuit: number; // 5000 Ar (Supplément nuit)
  nuit_normale: number; // 8000 Ar (3000 + 5000)
  nuit_securise: number; // 10000 Ar (Nuit – Parking sécurisé)
  majoration_reparation_normal_leger?: number; // 0 Ar -> Total 3000 Ar
  majoration_reparation_normal_autre?: number; // 2000 Ar -> Total 5000 Ar
  majoration_reparation_kospam?: number; // 2000 Ar -> Total 5000 Ar
  normal_sans_reparation?: number;
  normal_avec_reparation_leger?: number;
  normal_avec_reparation_autre?: number;
  kospam_sans_reparation?: number;
  kospam_avec_reparation?: number;
}

export interface ParametresApp {
  nom_parking: string;
  telephone?: string;
  telephone_parking?: string;
  adresse?: string;
  adresse_parking?: string;
  email?: string;
  devise: string;
  symbole_devise?: string;
  capacite_totale?: number;
  nombre_total_places?: number;
  message_bas_ticket?: string;
  solde_initial?: number;
  date_solde_initial?: string;
  tarifs: TarifsConfig;
}

export interface DashboardStats {
  vehicules_presents: number;
  vehicules_nuit_presents?: number;
  places_occupees: number;
  places_libres: number;
  entrees_jour: number;
  sorties_jour: number;
  recettes_jour: number;
  recettes_totales?: number;
  recettes_mois: number;
  total_depenses?: number;
  solde_tresorerie?: number;
  nombre_stationnements?: number;
  montant_restant_a_payer?: number;
  total_non_paye: number;
  total_partiellement_paye: number;
  total_a_encaisser: number;
  solde_portefeuille: number;
  total_encaisse: number;
  total_depense: number;
  // Graphs
  recettes_par_jour: { date: string; montant: number; entrees: number }[];
  recettes_par_mois: { mois: string; montant: number }[];
  vehicules_par_categorie: { categorie: string; count: number; total_montant: number }[];
  repartition_modes_paiement: { mode: string; count: number; montant: number }[];
  clients_frequents: { nom: string; type: string; passages: number; montant: number }[];
}

export type StatsDashboard = DashboardStats;

export interface RapportStats {
  periode: string;
  total_entrees: number;
  total_sorties: number;
  nombre_reparations: number;
  total_montant_du: number;
  total_montant_paye: number;
  total_impayes: number;
  total_depenses_portefeuille: number;
  solde_net: number;
  par_categorie: Record<string, number>;
  par_client: Record<string, number>;
  par_mode_paiement: Record<string, number>;
}

export interface KospamStats {
  vehicules_presents: number;
  vehicules_sortis: number;
  vehicules_en_reparation: number;
  total_du: number;
  total_paye: number;
  reste_a_payer: number;
  periodes_facturation: {
    periode: string; // e.g. "Août 2026"
    nombre_vehicules: number;
    stationnements: number;
    reparations: number;
    total_du: number;
    total_paye: number;
    reste_a_payer: number;
  }[];
}

export interface TestResult {
  id: number;
  nom: string;
  description: string;
  attendu: string | number;
  obtenu: string | number;
  succes: boolean;
  details?: string;
}
