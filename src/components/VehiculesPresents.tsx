import React, { useState } from 'react';
import {
  Car,
  Search,
  CreditCard,
  ArrowUpRight,
  Printer,
  Wrench,
  ParkingSquare,
  Clock,
  User,
  Filter,
} from 'lucide-react';
import { Stationnement, ParametresApp } from '../types';
import { formatAriary, formatDateFr } from '../utils/formatters';

interface VehiculesPresentsProps {
  stationnements: Stationnement[];
  parametres: ParametresApp;
  onOpenPaiement: (st: Stationnement) => void;
  onOpenSortie: (st: Stationnement) => void;
  onShowTicket: (st: Stationnement) => void;
  onNavigateEntree: () => void;
}

export const VehiculesPresents: React.FC<VehiculesPresentsProps> = ({
  stationnements,
  parametres,
  onOpenPaiement,
  onOpenSortie,
  onShowTicket,
  onNavigateEntree,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTypeClient, setFilterTypeClient] = useState<string>('all');
  const [filterReparation, setFilterReparation] = useState<string>('all');

  const presents = stationnements.filter((s) => s.statut === 'Présent');

  const filtered = presents.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      s.immatriculation?.toLowerCase().includes(term) ||
      s.client_nom?.toLowerCase().includes(term) ||
      s.marque?.toLowerCase().includes(term) ||
      s.numero_place?.toLowerCase().includes(term);

    const matchClient =
      filterTypeClient === 'all' || s.client_type === filterTypeClient;

    const matchRep =
      filterReparation === 'all' ||
      (filterReparation === 'oui' && s.reparation) ||
      (filterReparation === 'non' && !s.reparation);

    return matchSearch && matchClient && matchRep;
  });

  return (
    <div className="space-y-6">
      {/* Header & Stats bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Véhicules Actuellement Présents</h1>
            <p className="text-xs text-slate-500">
              {presents.length} véhicule{presents.length > 1 ? 's' : ''} stationné
              {presents.length > 1 ? 's' : ''} en ce moment
            </p>
          </div>
        </div>

        <button
          id="btn-ajouter-entree-presents"
          onClick={onNavigateEntree}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <span>+ Nouvelle Entrée</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-presents"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par immatriculation, client, place, marque..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterTypeClient}
            onChange={(e) => setFilterTypeClient(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="all">Tous types clients</option>
            <option value="Normal">Clients Normaux</option>
            <option value="Kospam">Garage Kospam</option>
          </select>

          <select
            value={filterReparation}
            onChange={(e) => setFilterReparation(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="all">Toutes prestations</option>
            <option value="oui">Avec Réparation</option>
            <option value="non">Sans Réparation</option>
          </select>
        </div>
      </div>

      {/* Grid of Present Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((st) => {
          const reste = st.reste_a_payer !== undefined ? st.reste_a_payer : st.montant_du;
          const isKospam = st.client_type === 'Kospam';

          return (
            <div
              key={st.id_stationnement}
              id={`card-present-${st.id_stationnement}`}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-base font-black text-slate-950 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 tracking-wider">
                      {st.immatriculation}
                    </span>
                    <span className="text-xs font-bold text-slate-700 block mt-1.5">
                      {st.marque} {st.modele}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        st.statut_paiement === 'Payé'
                          ? 'bg-emerald-100 text-emerald-800'
                          : st.statut_paiement === 'Partiellement payé'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {st.statut_paiement || 'Non payé'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 block mt-1">
                      Place :{' '}
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">
                        {st.numero_place || 'Libre'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-3.5 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Client :</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                      {st.client_nom} {isKospam && '(Kospam)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Catégorie :</span>
                    <span className="font-medium text-slate-700">{st.categorie}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Entrée le :</span>
                    <span className="font-medium text-slate-700">
                      {formatDateFr(st.date_entree)} à {st.heure_entree}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-400">Prestation :</span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        st.reparation
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {st.reparation ? '🔧 Réparation' : '🅿️ Stationnement'}
                    </span>
                  </div>
                </div>

                {/* Financial overview */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-1.5 rounded">
                    <span className="text-[10px] text-slate-400 block">Dû</span>
                    <span className="font-bold text-slate-800">{formatAriary(st.montant_du)}</span>
                  </div>
                  <div className="bg-emerald-50 p-1.5 rounded">
                    <span className="text-[10px] text-emerald-600 block">Payé</span>
                    <span className="font-bold text-emerald-700">
                      {formatAriary(st.montant_paye)}
                    </span>
                  </div>
                  <div className="bg-rose-50 p-1.5 rounded">
                    <span className="text-[10px] text-rose-600 block">Reste</span>
                    <span className="font-extrabold text-rose-700">{formatAriary(reste)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <button
                  id={`btn-ticket-${st.id_stationnement}`}
                  onClick={() => onShowTicket(st)}
                  title="Imprimer Reçu / Ticket"
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200"
                >
                  <Printer className="w-4 h-4" />
                </button>

                {reste > 0 && (
                  <button
                    id={`btn-pay-${st.id_stationnement}`}
                    onClick={() => onOpenPaiement(st)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-lg transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Payer</span>
                  </button>
                )}

                <button
                  id={`btn-sortie-quick-${st.id_stationnement}`}
                  onClick={() => onOpenSortie(st)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Sortie</span>
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
            <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">Aucun véhicule présent trouvé</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Il n'y a actuellement aucun véhicule correspondant aux critères de recherche.
            </p>
            <button
              onClick={onNavigateEntree}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs"
            >
              Enregistrer une nouvelle entrée
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
