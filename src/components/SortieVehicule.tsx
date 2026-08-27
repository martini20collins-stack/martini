import React, { useState } from 'react';
import {
  ArrowUpRight,
  Search,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Printer,
  Calendar,
  Clock,
  Car,
  User,
  Wrench,
  DollarSign,
} from 'lucide-react';
import {
  Stationnement,
  ModePaiement,
  MODES_PAIEMENT,
  ParametresApp,
} from '../types';
import { formatAriary, formatDateFr } from '../utils/formatters';

interface SortieVehiculeProps {
  stationnementsPresents: Stationnement[];
  parametres: ParametresApp;
  onEnregistrerSortie: (payload: {
    id_stationnement: string;
    paiement?: {
      montant: number;
      mode_paiement: ModePaiement;
      reference?: string;
      observation?: string;
    };
  }) => Promise<Stationnement>;
  onShowTicket: (st: Stationnement) => void;
  onSuccess: () => void;
}

export const SortieVehicule: React.FC<SortieVehiculeProps> = ({
  stationnementsPresents,
  parametres,
  onEnregistrerSortie,
  onShowTicket,
  onSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStId, setSelectedStId] = useState<string>('');

  // Payment at exit state
  const [encaisseASortie, setEncaisseASortie] = useState<boolean>(true);
  const [montantPaiement, setMontantPaiement] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<ModePaiement>('Espèces');
  const [refPaiement, setRefPaiement] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter present stationnements by search
  const filtered = stationnementsPresents.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      s.immatriculation?.toLowerCase().includes(term) ||
      s.client_nom?.toLowerCase().includes(term) ||
      s.numero_place?.toLowerCase().includes(term) ||
      s.id_stationnement.toLowerCase().includes(term)
    );
  });

  const selectedSt = stationnementsPresents.find(
    (s) => s.id_stationnement === selectedStId
  );

  const handleSelectSt = (st: Stationnement) => {
    setSelectedStId(st.id_stationnement);
    const reste = st.reste_a_payer !== undefined ? st.reste_a_payer : st.montant_du;
    setMontantPaiement(reste);
    setEncaisseASortie(reste > 0);
    setRefPaiement(`SORTIE-${Date.now().toString().slice(-5)}`);
    setErrorMsg(null);
  };

  const handleValiderSortie = async () => {
    if (!selectedSt) {
      setErrorMsg('Veuillez sélectionner un véhicule présent pour valider sa sortie.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const payload: any = {
        id_stationnement: selectedSt.id_stationnement,
      };

      if (encaisseASortie && montantPaiement > 0) {
        payload.paiement = {
          montant: Number(montantPaiement),
          mode_paiement: modePaiement,
          reference: refPaiement.trim(),
          observation: 'Règlement à la sortie du parking',
        };
      }

      const stFinal = await onEnregistrerSortie(payload);
      onShowTicket(stFinal);
      setSelectedStId('');
      setSearchTerm('');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la validation de sortie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Enregistrer une Sortie Véhicule</h1>
            <p className="text-xs text-slate-500">
              Règlement du solde, libération automatique de la place et édition du reçu
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Search bar */}
        <div className="mt-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Rechercher un véhicule présent (Immatriculation, Client, Place...)
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-sortie"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par immatriculation, nom du client, n° de place..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Grid of Present Vehicles to Pick */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
            <span>Sélectionner le véhicule ({filtered.length} présents)</span>
            {selectedSt && (
              <button
                onClick={() => setSelectedStId('')}
                className="text-indigo-600 hover:underline"
              >
                Désélectionner
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
            {filtered.map((st) => {
              const isSelected = st.id_stationnement === selectedStId;
              const reste = st.reste_a_payer !== undefined ? st.reste_a_payer : st.montant_du;

              return (
                <div
                  key={st.id_stationnement}
                  id={`card-sortie-${st.id_stationnement}`}
                  onClick={() => handleSelectSt(st)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-black text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {st.immatriculation}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        st.statut_paiement === 'Payé'
                          ? 'bg-emerald-100 text-emerald-800'
                          : st.statut_paiement === 'Partiellement payé'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {st.statut_paiement || 'Non payé'}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                    <p className="font-semibold text-slate-800 truncate">{st.client_nom}</p>
                    <p className="text-[11px] text-slate-500">
                      Place : {st.numero_place || 'Sans'} | Entrée : {st.heure_entree}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Reste :</span>
                    <span className="font-bold text-rose-600">{formatAriary(reste)}</span>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-slate-400">
                Aucun véhicule actuellement présent ne correspond à votre recherche.
              </div>
            )}
          </div>
        </div>

        {/* DETAILED CARD UPON SELECTION */}
        {selectedSt && (
          <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Détails du Stationnement #{selectedSt.id_stationnement}
                </h3>
              </div>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full">
                Place {selectedSt.numero_place || 'Non assignée'}
              </span>
            </div>

            {/* Complete details table as specified in Section 10 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Immatriculation</span>
                <span className="font-black text-slate-900 text-sm">
                  {selectedSt.immatriculation}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Véhicule</span>
                <span className="font-semibold text-slate-800">
                  {selectedSt.marque} {selectedSt.modele}
                </span>
                <span className="text-[10px] text-slate-500 block">({selectedSt.categorie})</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Client</span>
                <span className="font-semibold text-slate-800">{selectedSt.client_nom}</span>
                <span className="text-[10px] text-indigo-600 font-bold block">
                  {selectedSt.client_type}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Date & Heure d'entrée</span>
                <span className="font-semibold text-slate-800">
                  {formatDateFr(selectedSt.date_entree)} à {selectedSt.heure_entree}
                </span>
              </div>
            </div>

            {/* Financial Status */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Prestation</span>
                <span
                  className={`inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded ${
                    selectedSt.reparation
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {selectedSt.reparation ? '🔧 Avec Réparation' : '🅿️ Stationnement seul'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Montant Dû</span>
                <span className="text-base font-black text-slate-900">
                  {formatAriary(selectedSt.montant_du)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-emerald-600 block">Déjà Payé</span>
                <span className="text-base font-bold text-emerald-700">
                  {formatAriary(selectedSt.montant_paye)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-rose-600 block">Reste à Payer</span>
                <span className="text-lg font-black text-rose-600">
                  {formatAriary(selectedSt.reste_a_payer)}
                </span>
              </div>
            </div>

            {/* Payment Section at Exit */}
            {(selectedSt.reste_a_payer || 0) > 0 ? (
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="checkbox-encaisser-sortie"
                      checked={encaisseASortie}
                      onChange={(e) => setEncaisseASortie(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-bold text-slate-900">
                      Encaisser le règlement avant la sortie
                    </span>
                  </label>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Reste : {formatAriary(selectedSt.reste_a_payer)}
                  </span>
                </div>

                {encaisseASortie && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Montant à régler (Ar) *
                      </label>
                      <input
                        type="number"
                        id="input-montant-sortie"
                        min="1"
                        value={montantPaiement || ''}
                        onChange={(e) => setMontantPaiement(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Mode de paiement *
                      </label>
                      <select
                        id="select-mode-sortie"
                        value={modePaiement}
                        onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800"
                      >
                        {MODES_PAIEMENT.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Référence reçu
                      </label>
                      <input
                        type="text"
                        id="input-ref-sortie"
                        value={refPaiement}
                        onChange={(e) => setRefPaiement(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Ce stationnement est entièrement payé (Solde : 0 Ar). Sortie autorisée sans supplément.</span>
              </div>
            )}

            {/* Validation CTA */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="btn-valider-sortie"
                type="button"
                disabled={loading}
                onClick={handleValiderSortie}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Validation en cours...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Valider la Sortie & Libérer la Place</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
