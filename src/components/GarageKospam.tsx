import React, { useState } from 'react';
import {
  Wrench,
  Car,
  CheckCircle,
  Clock,
  Printer,
  Calendar,
  DollarSign,
  Plus,
  Search,
  FileSpreadsheet,
  CreditCard,
} from 'lucide-react';
import { KospamStats, Stationnement, ParametresApp } from '../types';
import { formatAriary, formatDateFr } from '../utils/formatters';

interface GarageKospamProps {
  stats: KospamStats | null;
  stationnements: Stationnement[];
  parametres: ParametresApp;
  onNavigateEntreeKospam: () => void;
  onOpenPaiement: (st: Stationnement) => void;
  onShowTicket: (st: Stationnement) => void;
}

export const GarageKospam: React.FC<GarageKospamProps> = ({
  stats,
  stationnements,
  parametres,
  onNavigateEntreeKospam,
  onOpenPaiement,
  onShowTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatut, setFilterStatut] = useState<string>('all'); // all, paye, impaye

  const kospamStationnements = stationnements.filter(
    (s) => s.client_type === 'Kospam' || s.client_nom?.toLowerCase().includes('kospam')
  );

  const filtered = kospamStationnements.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      s.immatriculation?.toLowerCase().includes(term) ||
      s.marque?.toLowerCase().includes(term) ||
      s.id_stationnement.toLowerCase().includes(term);

    const reste = s.reste_a_payer !== undefined ? s.reste_a_payer : (s.montant_du - (s.montant_paye || 0));
    const matchStatut =
      filterStatut === 'all' ||
      (filterStatut === 'paye' && reste <= 0) ||
      (filterStatut === 'impaye' && reste > 0);

    return matchSearch && matchStatut;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Entry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-gradient-to-r from-white to-amber-50/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Espace Dédié — Garage Kospam</h1>
              <span className="text-xs font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                Partenaire Atelier
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Suivi exclusif des véhicules atelier, réparations et facturation périodique
            </p>
          </div>
        </div>

        <button
          id="btn-entree-kospam"
          onClick={onNavigateEntreeKospam}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Entrée Véhicule Kospam</span>
        </button>
      </div>

      {/* Notice Règle Absolue Kospam (Section 6) */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
        <div className="p-1 bg-amber-200 text-amber-900 rounded font-bold uppercase text-[10px] mt-0.5">
          Règle Absolue Kospam
        </div>
        <p className="leading-relaxed">
          Tarification forfaitaire garantie : <strong>3 000 Ar</strong> sans réparation (toutes catégories) et <strong>5 000 Ar</strong> avec réparation (toutes catégories légères, 4x4, utilitaires et camions).
        </p>
      </div>

      {/* KPI Cards for Kospam */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Total Enregistrés</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {kospamStationnements.length}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-emerald-600 font-medium block">Véhicules Réglés</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {kospamStationnements.filter((s) => (s.reste_a_payer !== undefined ? s.reste_a_payer : (s.montant_du - (s.montant_paye || 0))) <= 0).length}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-amber-700 font-medium block">En Réparation</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {stats.vehicules_en_reparation}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Total Facturé</span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              {formatAriary(stats.total_du)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-emerald-600 font-medium block">Total Réglé</span>
            <span className="text-lg font-black text-emerald-700 mt-1 block">
              {formatAriary(stats.total_paye)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/40">
            <span className="text-xs text-rose-700 font-bold block">Solde à Payer</span>
            <span className="text-lg font-black text-rose-700 mt-1 block">
              {formatAriary(stats.reste_a_payer)}
            </span>
          </div>
        </div>
      )}

      {/* Résumé de facturation par période (Section 17) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Résumé de Facturation par Période (Garage Kospam)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Calcul automatique en temps réel</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats?.periodes_facturation.map((periode, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-sm">{periode.periode}</span>
                <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                  {periode.nombre_vehicules} véhicules
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block">Stationnements:</span>
                  <span className="font-bold text-slate-800">{periode.stationnements}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Réparations:</span>
                  <span className="font-bold text-amber-700">{periode.reparations}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Dû:</span>
                  <span className="font-bold text-slate-900">{formatAriary(periode.total_du)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Payé:</span>
                  <span className="font-bold text-emerald-700">{formatAriary(periode.total_paye)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Reste à payer :</span>
                <span className="font-black text-rose-600 text-sm">
                  {formatAriary(periode.reste_a_payer)}
                </span>
              </div>
            </div>
          ))}

          {(!stats?.periodes_facturation || stats.periodes_facturation.length === 0) && (
            <p className="col-span-full py-6 text-center text-slate-400 text-xs">
              Aucune période de facturation enregistrée pour Kospam.
            </p>
          )}
        </div>
      </div>

      {/* Historique spécifique Garage Kospam */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrer immatriculation, marque..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="all">Tous ({kospamStationnements.length})</option>
              <option value="paye">Réglés uniquement</option>
              <option value="impaye">À encaisser</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Stationnement</th>
                <th className="px-5 py-3.5">Immatriculation</th>
                <th className="px-5 py-3.5">Véhicule & Catégorie</th>
                <th className="px-5 py-3.5">Date & Heure</th>
                <th className="px-5 py-3.5">Réparation</th>
                <th className="px-5 py-3.5">Montant Dû</th>
                <th className="px-5 py-3.5">Payé / Reste</th>
                <th className="px-5 py-3.5">Règlement Direct</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((st) => {
                const reste = st.reste_a_payer !== undefined ? st.reste_a_payer : st.montant_du;

                return (
                  <tr key={st.id_stationnement} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">
                      #{st.id_stationnement}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-black text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {st.immatriculation}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-800 block">
                        {st.marque} {st.modele}
                      </span>
                      <span className="text-xs text-slate-400">{st.categorie}</span>
                    </td>

                    <td className="px-5 py-4 text-xs">
                      <div>Entrée: {formatDateFr(st.date_entree)} {st.heure_entree}</div>
                      {st.date_sortie && (
                        <div className="text-slate-400">
                          Sortie: {formatDateFr(st.date_sortie)} {st.heure_sortie}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          st.reparation
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {st.reparation ? '🔧 OUI (5 000 Ar)' : 'NON (3 000 Ar)'}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-900">
                      {formatAriary(st.montant_du)}
                    </td>

                    <td className="px-5 py-4 text-xs">
                      <span className="text-emerald-700 font-bold block">
                        Payé: {formatAriary(st.montant_paye)}
                      </span>
                      {reste > 0 && (
                        <span className="text-rose-600 font-bold block">
                          Reste: {formatAriary(reste)}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                          reste <= 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {reste <= 0 ? '✅ Réglé' : '⚠️ Impayé'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onShowTicket(st)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                          title="Imprimer ticket"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {reste > 0 && (
                          <button
                            onClick={() => onOpenPaiement(st)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Encaisser"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                    Aucun stationnement Kospam trouvé.
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
