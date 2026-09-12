import React, { useState, useMemo } from 'react';
import {
  Car,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  CreditCard,
  ParkingSquare,
  Wrench,
  User,
  Filter,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Moon,
  Sun,
  History,
  ShieldCheck,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  Stationnement,
  Place,
  Client,
  Vehicule,
  ParametresApp,
  DashboardStats,
  CategorieVehicule,
  TypeClient,
} from '../types';
import { formatAriary, formatDateFr } from '../utils/formatters';
import { calculerMontant } from '../services/pricingEngine';

interface GuichetParkingProps {
  stats: DashboardStats | null;
  stationnements: Stationnement[];
  places: Place[];
  clients: Client[];
  vehicules: Vehicule[];
  parametres: ParametresApp;
  onOpenEntreeModal: () => void;
  onEditStationnement?: (stationnement: Stationnement) => void;
  onDeleteStationnement?: (id: string) => Promise<void>;
  onOpenPaiementModal: (stationnement: Stationnement) => void;
  onOpenAncienModal?: () => void;
  onShowTicket: (stationnement: Stationnement) => void;
  onRefresh: () => void;
}

export const GuichetParking: React.FC<GuichetParkingProps> = ({
  stats,
  stationnements,
  places,
  clients,
  vehicules,
  parametres,
  onOpenEntreeModal,
  onEditStationnement,
  onDeleteStationnement,
  onOpenPaiementModal,
  onOpenAncienModal,
  onShowTicket,
  onRefresh,
}) => {
  const [vueMode, setVueMode] = useState<'aujourdhui' | 'tous'>('tous');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtreType, setFiltreType] = useState<
    'tous' | 'normal' | 'kospam' | 'reparation' | 'impaye' | 'nuit' | 'jour' | 'securise'
  >('tous');
  const [stationnementToDelete, setStationnementToDelete] = useState<Stationnement | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Véhicules enregistrés aujourd'hui
  const vehiculesAujourdhui = useMemo(() => {
    return stationnements.filter((s) => (s.date_entree || s.date || '').startsWith(todayStr));
  }, [stationnements, todayStr]);

  // Véhicules restés la nuit
  const vehiculesNuitPresents = useMemo(() => {
    return stationnements.filter((s) => s.reste_la_nuit === true || s.type_stationnement?.includes('Nuit'));
  }, [stationnements]);

  // Total des impayés
  const totalImpayes = useMemo(() => {
    return stationnements.reduce((acc, s) => {
      const reste = s.reste_a_payer !== undefined ? s.reste_a_payer : (s.montant_du - (s.montant_paye || 0));
      return acc + Math.max(0, reste);
    }, 0);
  }, [stationnements]);

  // Ensemble de base selon le mode de vue (Aujourd'hui vs Tous)
  const baseListe = useMemo(() => {
    return vueMode === 'aujourdhui' ? vehiculesAujourdhui : stationnements;
  }, [vueMode, vehiculesAujourdhui, stationnements]);

  // Filtrage des véhicules
  const vehiculesFiltres = useMemo(() => {
    return baseListe.filter((s) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        s.immatriculation.toLowerCase().includes(term) ||
        (s.nom_client && s.nom_client.toLowerCase().includes(term)) ||
        (s.client_nom && s.client_nom.toLowerCase().includes(term)) ||
        (s.numero_place && s.numero_place.toLowerCase().includes(term)) ||
        (s.marque && s.marque.toLowerCase().includes(term));

      if (!matchSearch) return false;

      if (filtreType === 'normal') return s.client_type === 'Normal';
      if (filtreType === 'kospam') return s.client_type === 'Kospam';
      if (filtreType === 'reparation') return s.reparation === true;
      if (filtreType === 'impaye') return (s.reste_a_payer !== undefined ? s.reste_a_payer : (s.montant_du - (s.montant_paye || 0))) > 0;
      if (filtreType === 'jour') return s.type_stationnement === 'Journée normale' || (!s.reste_la_nuit && !s.type_stationnement);
      if (filtreType === 'nuit') return s.type_stationnement === 'Nuit' || (s.reste_la_nuit && s.type_stationnement !== 'Nuit – Parking sécurisé');
      if (filtreType === 'securise') return s.type_stationnement === 'Nuit – Parking sécurisé';

      return true;
    });
  }, [baseListe, searchTerm, filtreType]);

  const handleConfirmerSuppression = async () => {
    if (!stationnementToDelete || !onDeleteStationnement) return;
    try {
      setIsDeleting(true);
      await onDeleteStationnement(stationnementToDelete.id_stationnement);
      setStationnementToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. GRANDES ACTIONS RAPIDES ET COMPTEURS PRINCIPAUX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BOUTON D'ACTION 1 : NOUVELLE ENTRÉE */}
        <button
          id="btn-action-entree-rapide"
          onClick={onOpenEntreeModal}
          className="group relative flex items-center justify-between p-5 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left"
        >
          <div>
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-semibold uppercase tracking-wider">
              <span>Arrivée véhicule</span>
            </div>
            <div className="text-xl font-black mt-1 tracking-tight flex items-center gap-1.5">
              <span>+ Entrée Véhicule</span>
            </div>
            <p className="text-xs text-emerald-100 mt-1 opacity-90">
              Règlement direct • Places illimitées
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PlusCircle className="w-7 h-7 text-white" />
          </div>
        </button>

        {/* BOUTON D'ACTION 2 : SAISIE RÉTROACTIVE / ANCIEN VÉHICULE */}
        <button
          id="btn-action-ancien-rapide"
          onClick={onOpenAncienModal}
          className="group relative flex items-center justify-between p-5 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left"
        >
          <div>
            <div className="flex items-center gap-2 text-indigo-100 text-xs font-semibold uppercase tracking-wider">
              <span>Enregistrement Rétroactif</span>
            </div>
            <div className="text-xl font-black mt-1 tracking-tight flex items-center gap-1.5">
              <span>+ Ancien Véhicule</span>
            </div>
            <p className="text-xs text-indigo-100 mt-1 opacity-90">
              Historique avec date & règlement direct
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
            <History className="w-7 h-7 text-white" />
          </div>
        </button>

        {/* COMPTEUR : SUIVI RESTÉ LA NUIT & SÉCURISÉ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700">
              <Moon className="w-3.5 h-3.5" />
              <span>Nuit & Sécurisé</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">
                {vehiculesNuitPresents.length}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                / {stationnements.length} total
              </span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tarifs 8k Ar & 10k Ar</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Moon className="w-6 h-6" />
          </div>
        </div>

        {/* COMPTEUR : RECETTES DU JOUR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Recette du Jour
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatAriary(stats?.recette_aujourdhui || 0)}
            </div>
            <div className="mt-2 text-[11px] font-semibold flex items-center gap-1.5">
              {totalImpayes > 0 ? (
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {formatAriary(totalImpayes)} à encaisser
                </span>
              ) : (
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Tous les montants sont réglés
                </span>
              )}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. SECTION PRINCIPALE : VÉHICULES AU PARKING & RECHERCHE RAPIDE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* En-tête de section avec Recherche et Bascule Vue Présents / Historique */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {/* TABS DE VUE : AUJOURD'HUI VS TOUS */}
                <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setVueMode('aujourdhui')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      vueMode === 'aujourdhui'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Aujourd'hui ({vehiculesAujourdhui.length})
                  </button>
                  <button
                    onClick={() => setVueMode('tous')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      vueMode === 'tous'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tous les enregistrements ({stationnements.length})
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {vueMode === 'aujourdhui'
                  ? "Véhicules enregistrés aujourd'hui avec règlement direct"
                  : 'Historique complet des stationnements enregistrés'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bouton Enregistrer Ancien Véhicule */}
            {onOpenAncienModal && (
              <button
                id="btn-ouvrir-ancien-vehicule"
                onClick={onOpenAncienModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 transition-colors shadow-xs"
              >
                <History className="w-3.5 h-3.5 text-indigo-600" />
                <span>+ Rétroactif</span>
              </button>
            )}

            {/* Barre de recherche */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-recherche-rapide"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher immat, client..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtres rapides sous forme de pills */}
        <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtres :
          </span>
          <button
            onClick={() => setFiltreType('tous')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filtreType === 'tous'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tous ({baseListe.length})
          </button>
          <button
            onClick={() => setFiltreType('jour')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
              filtreType === 'jour'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-3 h-3 text-emerald-500" />
            Journée normale (3 000 Ar)
          </button>
          <button
            onClick={() => setFiltreType('nuit')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
              filtreType === 'nuit'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <Moon className="w-3 h-3 text-purple-600" />
            Nuit (8 000 Ar)
          </button>
          <button
            onClick={() => setFiltreType('securise')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
              filtreType === 'securise'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-indigo-600" />
            Nuit Sécurisé (10 000 Ar)
          </button>
          <button
            onClick={() => setFiltreType('reparation')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
              filtreType === 'reparation'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-3 h-3" />
            Avec Réparation
          </button>
          <button
            onClick={() => setFiltreType('kospam')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
              filtreType === 'kospam'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Garage Kospam
          </button>
          <button
            onClick={() => setFiltreType('impaye')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
              filtreType === 'impaye'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            À Encaisser
          </button>
        </div>

        {/* VUE : LISTE DES VÉHICULES */}
        <div className="overflow-x-auto">
          {vehiculesFiltres.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              <Car className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-sm font-medium text-slate-600">
                {searchTerm || filtreType !== 'tous'
                  ? 'Aucun véhicule ne correspond à vos filtres.'
                  : 'Aucun enregistrement trouvé dans cette vue.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Cliquez sur « + Entrée Véhicule » pour enregistrer une arrivée.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Type Stationnement</th>
                  <th className="py-3 px-4">Immatriculation & Catégorie</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Réparation</th>
                  <th className="py-3 px-4">Montants & Règlement</th>
                  <th className="py-3 px-4">Règlement Direct</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vehiculesFiltres.map((s) => {
                  const reste = s.reste_a_payer !== undefined ? s.reste_a_payer : (s.montant_du - (s.montant_paye || 0));
                  const estPaye = reste <= 0;
                  const typeNom = s.type_stationnement || (s.reste_la_nuit ? 'Nuit' : 'Journée normale');

                  return (
                    <tr
                      key={s.id_stationnement}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* DATE & HEURE */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {formatDateFr(s.date_entree || s.date || '')}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{s.heure_entree || '--:--'}</span>
                        </div>
                      </td>

                      {/* TYPE DE STATIONNEMENT */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {typeNom === 'Nuit – Parking sécurisé' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 font-bold text-[11px] border border-indigo-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Nuit Sécurisé (10 000 Ar)</span>
                          </span>
                        ) : typeNom === 'Nuit' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 font-bold text-[11px] border border-purple-200">
                            <Moon className="w-3.5 h-3.5 text-purple-600" />
                            <span>Nuit (8 000 Ar)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200">
                            <Sun className="w-3 h-3 text-emerald-600" />
                            <span>Journée normale (3 000 Ar)</span>
                          </span>
                        )}
                      </td>

                      {/* IMMATRICULATION & VÉHICULE */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-black text-slate-900 text-sm tracking-wide">
                          {s.immatriculation}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-slate-700">{s.categorie || 'Véhicule léger'}</span>
                          {s.marque && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400">{s.marque}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* CLIENT */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {s.client_type === 'Kospam' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                              <Wrench className="w-3 h-3" /> Garage Kospam
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-800">
                              {s.nom_client || s.client_nom || 'Client Normal'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Catégorie : {s.client_type || 'Normal'}
                        </span>
                      </td>

                      {/* RÉPARATION OUI / NON */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {s.reparation ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                            <Wrench className="w-3 h-3 text-amber-700" />
                            <span>OUI</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium text-[11px]">
                            NON
                          </span>
                        )}
                      </td>

                      {/* MONTANTS & RÈGLEMENT */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-slate-900 text-xs">
                            {formatAriary(s.montant_du)}
                          </span>
                          {estPaye ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Payé
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                              Reste: {formatAriary(reste)}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Payé : {formatAriary(s.montant_paye || 0)} {s.mode_paiement ? `• ${s.mode_paiement}` : ''}
                        </div>
                      </td>

                      {/* RÈGLEMENT DIRECT */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] ${
                            estPaye
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {estPaye ? '✅ Réglé' : '⚠️ Impayé'}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Modifier (Crayon) */}
                          {onEditStationnement && (
                            <button
                              id={`btn-edit-${s.id_stationnement}`}
                              onClick={() => onEditStationnement(s)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Modifier ce stationnement"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Encaisser si impayé */}
                          {!estPaye && (
                            <button
                              id={`btn-encaisser-${s.id_stationnement}`}
                              onClick={() => onOpenPaiementModal(s)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors flex items-center gap-1"
                              title="Encaisser le paiement maintenant"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Encaisser</span>
                            </button>
                          )}

                          {/* Reçu / Ticket */}
                          <button
                            id={`btn-ticket-${s.id_stationnement}`}
                            onClick={() => onShowTicket(s)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Imprimer le ticket / reçu"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Supprimer (Poubelle) */}
                          {onDeleteStationnement && (
                            <button
                              id={`btn-delete-${s.id_stationnement}`}
                              onClick={() => setStationnementToDelete(s)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Supprimer ce stationnement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMATION DE SUPPRESSION */}
      {stationnementToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              Confirmer la suppression
            </h3>
            <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
              Voulez-vous vraiment supprimer le stationnement du véhicule{' '}
              <strong className="text-slate-900 font-mono">
                {stationnementToDelete.immatriculation}
              </strong>{' '}
              ({stationnementToDelete.nom_client || stationnementToDelete.client_nom || 'Client'}) ? Cette action mettra à jour les totaux et est irréversible.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStationnementToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmerSuppression}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. AIDE-MÉMOIRE RÈGLE TARIFAIRE SIMPLE */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-black text-white">
            Ar
          </div>
          <div>
            <span className="font-bold text-slate-100 block">
              Grille Tarifaire en Vigueur :
            </span>
            <span className="text-slate-400">
              Paiement réglé chaque soir • Journée normale 3 000 Ar • Nuit 8 000 Ar • Nuit Sécurisé 10 000 Ar
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 mr-1.5">Jour :</span>
            <span className="font-extrabold text-emerald-400">3 000 Ar</span>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 mr-1.5">Nuit :</span>
            <span className="font-extrabold text-purple-400">8 000 Ar</span>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 mr-1.5">Nuit Sécurisé :</span>
            <span className="font-extrabold text-indigo-400">10 000 Ar</span>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 mr-1.5">Réparation :</span>
            <span className="font-extrabold text-amber-400">3 000 / 5 000 Ar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
