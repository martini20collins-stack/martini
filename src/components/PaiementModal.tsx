import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { Stationnement, ModePaiement, MODES_PAIEMENT } from '../types';
import { formatAriary } from '../utils/formatters';

interface PaiementModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationnement: Stationnement | null;
  onSuccess: (paymentData: {
    id_stationnement: string;
    montant: number;
    mode_paiement: ModePaiement;
    reference: string;
    observation: string;
  }) => Promise<void>;
}

export const PaiementModal: React.FC<PaiementModalProps> = ({
  isOpen,
  onClose,
  stationnement,
  onSuccess,
}) => {
  if (!isOpen || !stationnement) return null;

  const reste = stationnement.reste_a_payer !== undefined ? stationnement.reste_a_payer : stationnement.montant_du;
  const [montant, setMontant] = useState<number>(reste > 0 ? reste : stationnement.montant_du);
  const [modePaiement, setModePaiement] = useState<ModePaiement>('Espèces');
  const [reference, setReference] = useState<string>('');
  const [observation, setObservation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showOverpaymentWarning, setShowOverpaymentWarning] = useState<boolean>(false);

  useEffect(() => {
    if (stationnement) {
      const remaining =
        stationnement.reste_a_payer !== undefined
          ? stationnement.reste_a_payer
          : stationnement.montant_du;
      setMontant(remaining > 0 ? remaining : stationnement.montant_du);
      setReference(`REF-${Date.now().toString().slice(-6)}`);
      setErrorMsg(null);
      setShowOverpaymentWarning(false);
    }
  }, [stationnement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const val = Number(montant);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Le montant doit être un nombre positif strictement supérieur à 0 Ar.');
      return;
    }

    // Overpayment check
    if (val > reste && !showOverpaymentWarning) {
      setShowOverpaymentWarning(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSuccess({
        id_stationnement: stationnement.id_stationnement,
        montant: val,
        mode_paiement: modePaiement,
        reference: reference.trim(),
        observation: observation.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement du paiement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="paiement-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div
        id="paiement-modal-card"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Enregistrer un Paiement</h3>
              <p className="text-xs text-slate-500">
                Stationnement #{stationnement.id_stationnement} — {stationnement.immatriculation}
              </p>
            </div>
          </div>
          <button
            id="btn-close-paiement-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Montant Dû
              </span>
              <span className="text-sm font-bold text-slate-800">
                {formatAriary(stationnement.montant_du)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block">
                Déjà Payé
              </span>
              <span className="text-sm font-bold text-emerald-700">
                {formatAriary(stationnement.montant_paye)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-rose-600 uppercase tracking-wider block">
                Reste à Payer
              </span>
              <span className="text-sm font-black text-rose-700">
                {formatAriary(stationnement.reste_a_payer)}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-lg text-sm border border-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {showOverpaymentWarning && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Attention : Montant supérieur au reste à payer</p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Le montant saisi ({formatAriary(montant)}) dépasse le reste dû (
                    {formatAriary(reste)}). Souhaitez-vous quand même enregistrer ce règlement ?
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Montant du paiement (Ariary) *
            </label>
            <div className="relative">
              <input
                id="input-montant-paiement"
                type="number"
                min="0"
                step="any"
                required
                value={montant || ''}
                onChange={(e) => {
                  setMontant(Number(e.target.value));
                  setShowOverpaymentWarning(false);
                }}
                className="w-full pl-4 pr-14 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-bold text-slate-900"
                placeholder="Ex: 5000"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm pointer-events-none">
                Ar
              </span>
            </div>
            {reste > 0 && montant !== reste && (
              <button
                type="button"
                onClick={() => {
                  setMontant(reste);
                  setShowOverpaymentWarning(false);
                }}
                className="mt-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium underline"
              >
                Payer exactement le reste dû ({formatAriary(reste)})
              </button>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mode de paiement *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MODES_PAIEMENT.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  id={`btn-mode-${mode.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setModePaiement(mode)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
                    modePaiement === mode
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Référence / N° Reçu (Optionnel)
            </label>
            <input
              id="input-reference-paiement"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              placeholder="Ex: ESP-1092 / MVola 034..."
            />
          </div>

          {/* Observation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Observation / Note
            </label>
            <input
              id="input-observation-paiement"
              type="text"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              placeholder="Ex: Acompte initial, règlement solde..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              id="btn-cancel-paiement"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              id="btn-submit-paiement"
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 ${
                showOverpaymentWarning
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? (
                <span>Enregistrement...</span>
              ) : showOverpaymentWarning ? (
                <span>Confirmer le dépassement</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Valider le Paiement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
