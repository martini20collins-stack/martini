import React, { useState, useMemo } from 'react';
import {
  Car,
  PlusCircle,
  ArrowUpRight,
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
  onOpenSortieModal: (stationnement?: Stationnement) => void;
  onOpenPaiementModal: (stationnement: Stationnement) => void;
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
  onOpenSortieModal,
  onOpenPaiementModal,
  onShowTicket,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtreType, setFiltreType] = useState<'tous' | 'normal' | 'kospam' | 'reparation' | 'impaye'>('tous');
  const [vueAffichage, setVueAffichage] = useState<'liste' | 'plan'>('liste');

  // Véhicules actuellement présents au parking
  const vehiculesPresents = useMemo(() => {
    return stationnements.filter((s) => s.statut === 'Présent');
  }, [stationnements]);

  // Places libres
  const placesLibres = useMemo(() => {
    return places.filter((p) => p.statut === 'Libre');
  }, [places]);

  // Total des impayés des véhicules présents
  const totalImpayesPresents = useMemo(() => {
    return vehiculesPresents.reduce((acc, s) => acc + (s.reste_a_payer !== undefined ? s.reste_a_payer : s.montant_du), 0);
  }, [vehiculesPresents]);

  // Filtrage des véhicules présents
  const vehiculesFiltres = useMemo(() => {
    return vehiculesPresents.filter((s) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        s.immatriculation.toLowerCase().includes(term) ||
        (s.nom_client && s.nom_client.toLowerCase().includes(term)) ||
        (s.numero_place && s.numero_place.toLowerCase().includes(term)) ||
        (s.marque && s.marque.toLowerCase().includes(term));

      if (!matchSearch) return false;

      if (filtreType === 'normal') return s.client_type === 'Normal';
      if (filtreType === 'kospam') return s.client_type === 'Kospam';
      if (filtreType === 'reparation') return s.reparation === true;
      if (filtreType === 'impaye') return (s.reste_a_payer || 0) > 0;

      return true;
    });
  }, [vehiculesPresents, searchTerm, filtreType]);

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
              Enregistrer & attribuer une place (3k / 5k Ar)
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PlusCircle className="w-7 h-7 text-white" />
          </div>
        </button>

        {/* BOUTON D'ACTION 2 : SORTIE / ENCAISSER */}
        <button
          id="btn-action-sortie-rapide"
          onClick={() => onOpenSortieModal()}
          className="group relative flex items-center justify-between p-5 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left"
        >
          <div>
            <div className="flex items-center gap-2 text-indigo-100 text-xs font-semibold uppercase tracking-wider">
              <span>Départ véhicule</span>
            </div>
            <div className="text-xl font-black mt-1 tracking-tight flex items-center gap-1.5">
              <span>Sortie & Règlement</span>
            </div>
            <p className="text-xs text-indigo-100 mt-1 opacity-90">
              Encaisser le paiement et libérer la place
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-7 h-7 text-white" />
          </div>
        </button>

        {/* COMPTEUR : PLACES DISPONIBLES */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Places Disponibles
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">
                {placesLibres.length}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                / {places.length} places
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${places.length > 0 ? (vehiculesPresents.length / places.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {vehiculesPresents.length} garés
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ParkingSquare className="w-6 h-6" />
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
              {totalImpayesPresents > 0 ? (
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {formatAriary(totalImpayesPresents)} à encaisser
                </span>
              ) : (
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Tous les présents sont payés
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
        {/* En-tête de section avec Recherche et Bascule Vue Liste / Plan */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Véhicules Présents au Parking</span>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  {vehiculesPresents.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Recherche instantanée et gestion des sorties
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Barre de recherche */}
            <div className="relative min-w-[220px]">
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

            {/* Commutateur de vue : Liste ou Plan des places */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                id="btn-vue-liste"
                onClick={() => setVueAffichage('liste')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  vueAffichage === 'liste'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Liste ({vehiculesFiltres.length})
              </button>
              <button
                id="btn-vue-plan"
                onClick={() => setVueAffichage('plan')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  vueAffichage === 'plan'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ParkingSquare className="w-3.5 h-3.5" />
                <span>Plan des Places</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtres rapides sous forme de pills */}
        <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrer :
          </span>
          <button
            onClick={() => setFiltreType('tous')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filtreType === 'tous'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tous ({vehiculesPresents.length})
          </button>
          <button
            onClick={() => setFiltreType('normal')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filtreType === 'normal'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Clients Normaux ({vehiculesPresents.filter((s) => s.client_type === 'Normal').length})
          </button>
          <button
            onClick={() => setFiltreType('kospam')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
              filtreType === 'kospam'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Wrench className="w-3 h-3" />
            Garage Kospam ({vehiculesPresents.filter((s) => s.client_type === 'Kospam').length})
          </button>
          <button
            onClick={() => setFiltreType('reparation')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filtreType === 'reparation'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            En Réparation ({vehiculesPresents.filter((s) => s.reparation).length})
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
            À Encaisser ({vehiculesPresents.filter((s) => (s.reste_a_payer || 0) > 0).length})
          </button>
        </div>

        {/* VUE 1 : LISTE DES VÉHICULES */}
        {vueAffichage === 'liste' && (
          <div className="overflow-x-auto">
            {vehiculesFiltres.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-400">
                <Car className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                <p className="text-sm font-medium text-slate-600">
                  {searchTerm || filtreType !== 'tous'
                    ? 'Aucun véhicule ne correspond à vos filtres.'
                    : 'Aucun véhicule actuellement stationné dans le parking.'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Cliquez sur « + Entrée Véhicule » pour enregistrer une arrivée.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Place</th>
                    <th className="py-3 px-4">Immatriculation & Véhicule</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Heure d'entrée</th>
                    <th className="py-3 px-4">Tarif Appliqué</th>
                    <th className="py-3 px-4">Paiement</th>
                    <th className="py-3 px-4 text-right">Actions Directes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {vehiculesFiltres.map((s) => {
                    const reste = s.reste_a_payer !== undefined ? s.reste_a_payer : s.montant_du;
                    const estPaye = reste <= 0;

                    return (
                      <tr
                        key={s.id_stationnement}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* PLACE */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs border border-indigo-200">
                            {s.numero_place || 'P-?'}
                          </span>
                        </td>

                        {/* IMMATRICULATION & VÉHICULE */}
                        <td className="py-3 px-4">
                          <div className="font-mono font-black text-slate-900 text-sm tracking-wide">
                            {s.immatriculation}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{s.marque || 'Véhicule'}</span>
                            {s.modele && <span>{s.modele}</span>}
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400">{s.categorie}</span>
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
                                {s.nom_client || 'Client Particulier'}
                              </span>
                            )}
                          </div>
                          {s.reparation && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              🔧 Réparation atelier
                            </span>
                          )}
                        </td>

                        {/* HEURE ENTRÉE */}
                        <td className="py-3 px-4 text-slate-600">
                          <div className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{s.heure_entree}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {formatDateFr(s.date_entree)}
                          </span>
                        </td>

                        {/* TARIF CALCULÉ */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {formatAriary(s.montant_du)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {s.montant_du === 3000 ? 'Tarif Standard (3 000 Ar)' : 'Tarif Majoré (5 000 Ar)'}
                          </div>
                        </td>

                        {/* STATUT PAIEMENT */}
                        <td className="py-3 px-4">
                          {estPaye ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Payé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                              <AlertCircle className="w-3 h-3" /> À payer: {formatAriary(reste)}
                            </span>
                          )}
                        </td>

                        {/* ACTIONS DIRECTES */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Bouton Encaisser (si non payé) */}
                            {!estPaye && (
                              <button
                                id={`btn-encaisser-${s.id_stationnement}`}
                                onClick={() => onOpenPaiementModal(s)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1"
                                title="Encaisser le paiement maintenant"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Encaisser</span>
                              </button>
                            )}

                            {/* Bouton Sortie */}
                            <button
                              id={`btn-sortie-${s.id_stationnement}`}
                              onClick={() => onOpenSortieModal(s)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1"
                              title="Enregistrer la sortie de ce véhicule"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Sortie</span>
                            </button>

                            {/* Bouton Ticket */}
                            <button
                              id={`btn-ticket-${s.id_stationnement}`}
                              onClick={() => onShowTicket(s)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Afficher et imprimer le ticket / reçu"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* VUE 2 : PLAN DES PLACES SIMPLE & INTERACTIF */}
        {vueAffichage === 'plan' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  Libre ({placesLibres.length})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  Occupée ({vehiculesPresents.length})
                </span>
              </div>
              <span>Total : {places.length} places configurées</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2.5">
              {places.map((place) => {
                const isOccupied = place.statut === 'Occupée';
                const stationnement = vehiculesPresents.find(
                  (s) => s.id_place === place.id_place || s.numero_place === place.numero_place
                );

                return (
                  <div
                    key={place.id_place}
                    onClick={() => {
                      if (stationnement) {
                        onOpenSortieModal(stationnement);
                      } else {
                        onOpenEntreeModal();
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col justify-between items-center text-center cursor-pointer transition-all hover:scale-105 select-none ${
                      isOccupied
                        ? 'bg-rose-50/80 border-rose-200 text-rose-950 hover:border-rose-400'
                        : 'bg-emerald-50/80 border-emerald-200 text-emerald-950 hover:border-emerald-400'
                    }`}
                  >
                    <span className="font-black text-xs">{place.numero_place}</span>
                    <div className="my-1">
                      {isOccupied ? (
                        <Car className="w-5 h-5 text-rose-600 mx-auto" />
                      ) : (
                        <ParkingSquare className="w-5 h-5 text-emerald-600 mx-auto" />
                      )}
                    </div>
                    {isOccupied && stationnement ? (
                      <div className="w-full truncate">
                        <span className="text-[10px] font-mono font-bold block truncate">
                          {stationnement.immatriculation}
                        </span>
                        <span className="text-[9px] text-rose-700 block font-semibold">
                          {formatAriary(stationnement.montant_du)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700">Libre</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. AIDE-MÉMOIRE RÈGLE TARIFAIRE SIMPLE */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-black text-white">
            Ar
          </div>
          <div>
            <span className="font-bold text-slate-100 block">
              Grille Tarifaire Simplifiée en Vigueur :
            </span>
            <span className="text-slate-400">
              Calcul automatique selon le client, la catégorie et les réparations
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 mr-1.5">Standard :</span>
            <span className="font-extrabold text-emerald-400">3 000 Ar</span>
            <span className="text-slate-400 text-[10px] ml-1">(Normal sans rép / Léger)</span>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 mr-1.5">Majoré / Kospam rép :</span>
            <span className="font-extrabold text-amber-400">5 000 Ar</span>
            <span className="text-slate-400 text-[10px] ml-1">(4x4, Bus, Camion rép & Kospam rép)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
