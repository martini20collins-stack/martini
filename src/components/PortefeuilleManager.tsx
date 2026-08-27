import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';
import { MouvementPortefeuille, TypeMouvement } from '../types';
import { formatAriary, formatDateTimeFr } from '../utils/formatters';

interface PortefeuilleManagerProps {
  portefeuille: {
    mouvements: MouvementPortefeuille[];
    solde: number;
    total_encaisse: number;
    total_depense: number;
  };
  onAjouterMouvement: (payload: {
    type_mouvement: TypeMouvement;
    reference?: string;
    entree: number;
    sortie: number;
    motif: string;
    observation?: string;
  }) => Promise<MouvementPortefeuille>;
}

export const PortefeuilleManager: React.FC<PortefeuilleManagerProps> = ({
  portefeuille,
  onAjouterMouvement,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');

  // Modal manual movement state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [typeMouvement, setTypeMouvement] = useState<TypeMouvement>('Dépense');
  const [montant, setMontant] = useState<number>(0);
  const [motif, setMotif] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [observation, setObservation] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mouvements = portefeuille.mouvements || [];
  const soldeActuel = portefeuille.solde || 0;
  const totalEncaisse = portefeuille.total_encaisse || 0;
  const totalDepense = portefeuille.total_depense || 0;

  const filteredMouvements = mouvements.filter((m) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      m.motif.toLowerCase().includes(term) ||
      m.reference?.toLowerCase().includes(term) ||
      m.id_mouvement.toLowerCase().includes(term);

    const matchType = filterType === 'all' || m.type_mouvement === filterType;
    return matchSearch && matchType;
  });

  const openAddModal = (initialType: TypeMouvement = 'Dépense') => {
    setTypeMouvement(initialType);
    setMontant(0);
    setMotif('');
    setReference(`MVT-${Date.now().toString().slice(-5)}`);
    setObservation('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motif.trim()) {
      setErrorMsg('Le motif du mouvement est obligatoire.');
      return;
    }
    const val = Number(montant);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Le montant doit être un chiffre positif strictement supérieur à 0.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const isCredit =
        typeMouvement === 'Encaissement parking' || typeMouvement === 'Autre entrée';

      await onAjouterMouvement({
        type_mouvement: typeMouvement,
        reference: reference.trim(),
        entree: isCredit ? val : 0,
        sortie: isCredit ? 0 : val,
        motif: motif.trim(),
        observation: observation.trim(),
      });

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement du mouvement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Permanent Financial Highlight Cards (Section 13) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Encaissé */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Encaissé (Entrées)
            </span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              +{formatAriary(totalEncaisse)}
            </span>
            <span className="text-xs text-slate-400">Recettes & dépôts de caisse</span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Dépensé */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Dépensé (Sorties)
            </span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">
              -{formatAriary(totalDepense)}
            </span>
            <span className="text-xs text-slate-400">Charges, achats & retraits</span>
          </div>
          <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Solde Actuel du Portefeuille */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
              Solde Actuel Disponible
            </span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">
              {formatAriary(soldeActuel)}
            </span>
            <span className="text-xs text-slate-300">Solde = Entrées - Sorties</span>
          </div>
          <div className="p-3 bg-white/10 text-amber-400 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-portefeuille"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par motif, référence, n° mouvement..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="select-filter-mvt-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="all">Tous types de mouvement</option>
            <option value="Encaissement parking">Encaissements parking</option>
            <option value="Dépense">Dépenses</option>
            <option value="Autre entrée">Autres entrées</option>
            <option value="Autre sortie">Autres sorties</option>
          </select>

          <button
            id="btn-ajouter-depense"
            onClick={() => openAddModal('Dépense')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Dépense</span>
          </button>

          <button
            id="btn-ajouter-entree-caisse"
            onClick={() => openAddModal('Autre entrée')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Entrée Caisse</span>
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">ID & Date</th>
                <th className="px-5 py-3.5">Type & Réf</th>
                <th className="px-5 py-3.5">Motif & Détails</th>
                <th className="px-5 py-3.5 text-right">Entrée (+)</th>
                <th className="px-5 py-3.5 text-right">Sortie (-)</th>
                <th className="px-5 py-3.5 text-right">Solde Cumulé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMouvements.map((mvt) => {
                const isPositive = mvt.entree > 0;

                return (
                  <tr key={mvt.id_mouvement} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-slate-700 block">
                        {mvt.id_mouvement}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDateTimeFr(mvt.date)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          mvt.type_mouvement === 'Encaissement parking'
                            ? 'bg-emerald-100 text-emerald-800'
                            : mvt.type_mouvement === 'Dépense'
                            ? 'bg-rose-100 text-rose-800'
                            : mvt.type_mouvement === 'Autre entrée'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {mvt.type_mouvement}
                      </span>
                      {mvt.reference && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {mvt.reference}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{mvt.motif}</div>
                      {mvt.observation && (
                        <span className="text-xs text-slate-500">{mvt.observation}</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {mvt.entree > 0 ? (
                        <span className="font-bold text-emerald-700">
                          +{formatAriary(mvt.entree)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {mvt.sortie > 0 ? (
                        <span className="font-bold text-rose-600">
                          -{formatAriary(mvt.sortie)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatAriary(mvt.solde)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredMouvements.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    Aucun mouvement de portefeuille trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MANUAL MOVEMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                Enregistrer un Mouvement de Caisse
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type de Mouvement *
                </label>
                <select
                  value={typeMouvement}
                  onChange={(e) => setTypeMouvement(e.target.value as TypeMouvement)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800"
                >
                  <option value="Dépense">Dépense (Achat matériel, frais...)</option>
                  <option value="Autre entrée">Autre entrée (Fond de caisse, apport...)</option>
                  <option value="Autre sortie">Autre sortie (Retrait gérant...)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montant (Ariary) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  value={montant || ''}
                  onChange={(e) => setMontant(Number(e.target.value))}
                  placeholder="Ex: 10000"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motif du mouvement *
                </label>
                <input
                  type="text"
                  required
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Ex: Achat rouleaux tickets, frais électricité..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Référence / Facture
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: FACT-2026-09"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observation
                </label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  rows={2}
                  placeholder="Notes complémentaires..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {loading ? 'Enregistrement...' : 'Valider le Mouvement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
