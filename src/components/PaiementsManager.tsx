import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  Trash2,
  Printer,
  Calendar,
  DollarSign,
  Filter,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Paiement, Stationnement, ModePaiement, MODES_PAIEMENT, ParametresApp } from '../types';
import { formatAriary, formatDateTimeFr } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface PaiementsManagerProps {
  paiements: Paiement[];
  stationnements: Stationnement[];
  parametres: ParametresApp;
  onOpenNouveauPaiement: () => void;
  onDeletePaiement: (id_paiement: string) => Promise<boolean>;
  onShowTicket: (st: Stationnement, modePaiement: string) => void;
}

export const PaiementsManager: React.FC<PaiementsManagerProps> = ({
  paiements,
  stationnements,
  parametres,
  onOpenNouveauPaiement,
  onDeletePaiement,
  onShowTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  const [paiementToDelete, setPaiementToDelete] = useState<Paiement | null>(null);

  const totalEncaisse = paiements.reduce((sum, p) => sum + Number(p.montant || 0), 0);

  const filteredPaiements = paiements.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      p.id_paiement.toLowerCase().includes(term) ||
      p.id_stationnement.toLowerCase().includes(term) ||
      p.immatriculation?.toLowerCase().includes(term) ||
      p.client_nom?.toLowerCase().includes(term) ||
      p.reference?.toLowerCase().includes(term);

    const matchMode = filterMode === 'all' || p.mode_paiement === filterMode;
    const matchDate = !filterDate || p.date_paiement.startsWith(filterDate);

    return matchSearch && matchMode && matchDate;
  });

  const confirmDelete = async () => {
    if (!paiementToDelete) return;
    try {
      await onDeletePaiement(paiementToDelete.id_paiement);
      setPaiementToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression du paiement');
      setPaiementToDelete(null);
    }
  };

  const handlePrintReceipt = (p: Paiement) => {
    const st = stationnements.find((s) => s.id_stationnement === p.id_stationnement);
    if (st) {
      onShowTicket(st, p.mode_paiement);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Total Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Journal des Règlements & Paiements</h1>
            <p className="text-xs text-slate-500">
              Historique complet des encaissements multi-tranches et modes de règlement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">
              Total Encaissé
            </span>
            <span className="text-lg font-black text-emerald-800">
              {formatAriary(totalEncaisse)}
            </span>
          </div>

          <button
            id="btn-ajouter-paiement-header"
            onClick={onOpenNouveauPaiement}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Encaisser un Reste</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-paiements"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par n° paiement, stationnement, immatriculation, client, référence..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            id="select-filter-mode-paiement"
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="all">Tous modes de paiement</option>
            {MODES_PAIEMENT.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>

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
              Effacer date
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">N° Paiement</th>
                <th className="px-5 py-3.5">Date & Heure</th>
                <th className="px-5 py-3.5">Stationnement & Véhicule</th>
                <th className="px-5 py-3.5">Client</th>
                <th className="px-5 py-3.5">Mode & Réf</th>
                <th className="px-5 py-3.5 text-right">Montant Encaissé</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPaiements.map((p) => (
                <tr key={p.id_paiement} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">
                    {p.id_paiement}
                  </td>

                  <td className="px-5 py-4 text-xs font-medium text-slate-800">
                    {formatDateTimeFr(p.date_paiement)}
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-black bg-amber-50 text-slate-900 px-2 py-0.5 rounded border border-amber-200">
                      {p.immatriculation || 'Non assigné'}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Stat. #{p.id_stationnement}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-800 block">{p.client_nom}</span>
                    <span className="text-[10px] font-bold text-indigo-600">
                      {p.client_type || 'Normal'}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                      {p.mode_paiement}
                    </span>
                    {p.reference && (
                      <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-xs">
                        Réf: {p.reference}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span className="text-base font-black text-emerald-700">
                      +{formatAriary(p.montant)}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        id={`btn-print-recu-${p.id_paiement}`}
                        onClick={() => handlePrintReceipt(p)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Imprimer le reçu"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        id={`btn-delete-paiement-${p.id_paiement}`}
                        onClick={() => setPaiementToDelete(p)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Annuler / Supprimer ce paiement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPaiements.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    Aucun paiement trouvé avec ces critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE PAYMENT CONFIRMATION */}
      <ConfirmModal
        isOpen={Boolean(paiementToDelete)}
        title="Annuler ce paiement ?"
        message={`Êtes-vous certain de vouloir annuler le paiement #${paiementToDelete?.id_paiement} de ${formatAriary(paiementToDelete?.montant)} ? Une écriture de contrepassation sera automatiquement passée dans le portefeuille.`}
        confirmLabel="Confirmer l'annulation"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setPaiementToDelete(null)}
      />
    </div>
  );
};
