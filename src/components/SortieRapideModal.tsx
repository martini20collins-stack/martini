import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpRight,
  Car,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Wrench,
  Search,
} from 'lucide-react';
import {
  Stationnement,
  ModePaiement,
  ParametresApp,
} from '../types';
import { formatAriary, formatDateFr } from '../utils/formatters';

interface SortieRapideModalProps {
  isOpen: boolean;
  stationnementPreselect?: Stationnement | null;
  stationnementsPresents: Stationnement[];
  parametres: ParametresApp;
  onClose: () => void;
  onEnregistrerSortie: (payload: {
    id_stationnement: string;
    mode_paiement?: ModePaiement;
    montant_paye?: number;
    reference?: string;
  }) => Promise<Stationnement>;
  onSuccess: (st: Stationnement) => void;
}

export const SortieRapideModal: React.FC<SortieRapideModalProps> = ({
  isOpen,
  stationnementPreselect,
  stationnementsPresents,
  parametres,
  onClose,
  onEnregistrerSortie,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [selectedStationnementId, setSelectedStationnementId] = useState<string>(
    stationnementPreselect?.id_stationnement ||
      (stationnementsPresents.length > 0 ? stationnementsPresents[0].id_stationnement : '')
  );

  const [searchImmat, setSearchImmat] = useState<string>('');
  const [modePaiement, setModePaiement] = useState<ModePaiement>('Espèces');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update selected if preselected prop changes
  useEffect(() => {
    if (stationnementPreselect) {
      setSelectedStationnementId(stationnementPreselect.id_stationnement);
    }
  }, [stationnementPreselect]);

  const activeStationnement = stationnementsPresents.find(
    (s) => s.id_stationnement === selectedStationnementId
  );

  const resteAPayer = activeStationnement
    ? activeStationnement.reste_a_payer !== undefined
      ? activeStationnement.reste_a_payer
      : activeStationnement.montant_du
    : 0;

  const dejaPaye = resteAPayer <= 0;

  const [montantRegle, setMontantRegle] = useState<number>(resteAPayer);

  useEffect(() => {
    setMontantRegle(resteAPayer);
  }, [resteAPayer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStationnement) {
      setErrorMsg('Veuillez sélectionner un véhicule présent.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await onEnregistrerSortie({
        id_stationnement: activeStationnement.id_stationnement,
        mode_paiement: montantRegle > 0 ? modePaiement : undefined,
        montant_paye: montantRegle > 0 ? montantRegle : 0,
      });

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement de la sortie.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPresents = stationnementsPresents.filter(
    (s) =>
      s.immatriculation.toLowerCase().includes(searchImmat.toLowerCase()) ||
      (s.numero_place && s.numero_place.toLowerCase().includes(searchImmat.toLowerCase())) ||
      (s.nom_client && s.nom_client.toLowerCase().includes(searchImmat.toLowerCase()))
  );

  return (
    <div
      id="modal-sortie-rapide-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="modal-sortie-rapide-content"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Sortie de Véhicule & Règlement
              </h2>
              <p className="text-xs text-indigo-100 opacity-90">
                Libération de la place et encaissement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* SÉLECTION DU VÉHICULE */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Choisir le Véhicule qui Sort :
            </label>

            {stationnementsPresents.length > 5 && (
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrer par plaque ou place..."
                  value={searchImmat}
                  onChange={(e) => setSearchImmat(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            )}

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 p-1.5 rounded-xl bg-slate-50">
              {filteredPresents.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  Aucun véhicule présent trouvé.
                </div>
              ) : (
                filteredPresents.map((s) => {
                  const isSelected = s.id_stationnement === selectedStationnementId;
                  const sReste = s.reste_a_payer !== undefined ? s.reste_a_payer : s.montant_du;

                  return (
                    <div
                      key={s.id_stationnement}
                      onClick={() => setSelectedStationnementId(s.id_stationnement)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900'
                          : 'bg-white border-slate-200 hover:bg-slate-100/80 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {s.numero_place || 'P-?'}
                        </span>
                        <div>
                          <span className="font-mono font-black text-xs block">
                            {s.immatriculation}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {s.nom_client || 'Client'} • {s.heure_entree}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-xs block">
                          {formatAriary(s.montant_du)}
                        </span>
                        {sReste > 0 ? (
                          <span className="text-[10px] text-rose-600 font-bold">
                            À payer: {formatAriary(sReste)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold">
                            ✓ Payé
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DÉTAIL DU VÉHICULE SÉLECTIONNÉ */}
          {activeStationnement && (
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Place {activeStationnement.numero_place}
                  </span>
                  <span className="font-mono font-black text-base text-slate-100">
                    {activeStationnement.immatriculation}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Tarif Total</span>
                  <span className="font-black text-sm text-emerald-400">
                    {formatAriary(activeStationnement.montant_du)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">Arrivé à :</span>
                <span className="font-semibold">
                  {activeStationnement.heure_entree} ({formatDateFr(activeStationnement.date_entree)})
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <span className="font-bold text-slate-300">Reste à Encaisser :</span>
                <span className={`font-black text-sm ${resteAPayer > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {resteAPayer > 0 ? formatAriary(resteAPayer) : '0 Ar (Déjà Payé)'}
                </span>
              </div>
            </div>
          )}

          {/* ZONE DE PAIEMENT SI RESTE À PAYER */}
          {activeStationnement && resteAPayer > 0 && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>Règlement du reste dû :</span>
                </label>
                <span className="font-black text-sm text-emerald-900">
                  {formatAriary(montantRegle)}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Mode de règlement :
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Espèces', 'Orange Money', 'Mvola', 'Airtel Money'] as ModePaiement[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setModePaiement(mode)}
                      className={`py-1.5 px-1 text-center rounded-lg font-bold text-[11px] border transition-colors ${
                        modePaiement === mode
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>

            <button
              id="btn-confirmer-sortie"
              type="submit"
              disabled={loading || !activeStationnement}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {loading ? 'Traitement...' : 'Confirmer la Sortie & Libérer'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
