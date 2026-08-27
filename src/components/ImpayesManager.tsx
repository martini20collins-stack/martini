import React, { useState } from 'react';
import {
  AlertCircle,
  Search,
  CreditCard,
  Printer,
  Clock,
  Filter,
  DollarSign,
  User,
  Car,
} from 'lucide-react';
import { Stationnement, ParametresApp } from '../types';
import { formatAriary, formatDateFr } from '../utils/formatters';

interface ImpayesManagerProps {
  stationnements: Stationnement[];
  parametres: ParametresApp;
  onOpenPaiement: (st: Stationnement) => void;
  onShowTicket: (st: Stationnement) => void;
}

export const ImpayesManager: React.FC<ImpayesManagerProps> = ({
  stationnements,
  parametres,
  onOpenPaiement,
  onShowTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatut, setFilterStatut] = useState<string>('all'); // 'all', 'Non payé', 'Partiellement payé'
  const [filterClientType, setFilterClientType] = useState<string>('all'); // 'all', 'Normal', 'Kospam'
  const [filterDate, setFilterDate] = useState<string>('');

  // Filter only stationnements with reste_a_payer > 0
  const impayesList = stationnements.filter((s) => {
    const reste = s.reste_a_payer !== undefined ? s.reste_a_payer : s.montant_du;
    return reste > 0;
  });

  const totalCreances = impayesList.reduce(
    (sum, s) => sum + (s.reste_a_payer !== undefined ? s.reste_a_payer : s.montant_du),
    0
  );

  const filtered = impayesList.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      s.immatriculation?.toLowerCase().includes(term) ||
      s.client_nom?.toLowerCase().includes(term) ||
      s.id_stationnement.toLowerCase().includes(term);

    const matchStatut =
      filterStatut === 'all' || s.statut_paiement === filterStatut;

    const matchClient =
      filterClientType === 'all' || s.client_type === filterClientType;

    const matchDate = !filterDate || s.date_entree === filterDate;

    return matchSearch && matchStatut && matchClient && matchDate;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Financial Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Gestion des Impayés & Créances</h1>
            <p className="text-xs text-slate-500">
              {impayesList.length} dossier{impayesList.length > 1 ? 's' : ''} en attente de règlement
            </p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 px-5 py-2.5 rounded-xl text-right">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            Total restant à recouvrer
          </span>
          <span className="text-xl font-black text-rose-900">
            {formatAriary(totalCreances)}
          </span>
        </div>
      </div>

      {/* Filters Bar as specified in Section 15 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-impayes"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par immatriculation, client, stationnement..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Statut filter */}
          <select
            id="select-filter-impayes-statut"
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="all">Tous statuts d'impayé</option>
            <option value="Non payé">Non payé uniquement</option>
            <option value="Partiellement payé">Partiellement payé</option>
          </select>

          {/* Client type filter */}
          <select
            id="select-filter-impayes-client"
            value={filterClientType}
            onChange={(e) => setFilterClientType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="all">Tous types clients</option>
            <option value="Normal">Client normal</option>
            <option value="Kospam">Garage Kospam</option>
          </select>

          {/* Date filter */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-xs text-rose-600 hover:underline px-1"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Impayés Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Stationnement</th>
                <th className="px-5 py-3.5">Client & Type</th>
                <th className="px-5 py-3.5">Immatriculation & Véhicule</th>
                <th className="px-5 py-3.5">Date Entrée</th>
                <th className="px-5 py-3.5">Montant Dû</th>
                <th className="px-5 py-3.5">Montant Payé</th>
                <th className="px-5 py-3.5">Reste à Payer</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((st) => {
                const reste = st.reste_a_payer !== undefined ? st.reste_a_payer : st.montant_du;

                return (
                  <tr key={st.id_stationnement} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">
                      #{st.id_stationnement}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 block">{st.client_nom}</span>
                      <span
                        className={`inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          st.client_type === 'Kospam'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {st.client_type === 'Kospam' ? 'Garage Kospam' : 'Normal'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-black text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {st.immatriculation}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {st.marque} {st.modele} ({st.categorie})
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-700">
                      {formatDateFr(st.date_entree)} {st.heure_entree}
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-800">
                      {formatAriary(st.montant_du)}
                    </td>

                    <td className="px-5 py-4 font-bold text-emerald-700">
                      {formatAriary(st.montant_paye)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm font-black text-rose-600">
                        {formatAriary(reste)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                          st.statut_paiement === 'Partiellement payé'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {st.statut_paiement || 'Non payé'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-encaisser-impaye-${st.id_stationnement}`}
                          onClick={() => onOpenPaiement(st)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Encaisser</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                    Aucun impayé trouvé. Tous les règlements sont à jour !
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
