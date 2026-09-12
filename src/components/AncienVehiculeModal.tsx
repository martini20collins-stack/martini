import React, { useState } from 'react';
import {
  X,
  History,
  Car,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  User,
  Moon,
  Wallet,
} from 'lucide-react';
import {
  CategorieVehicule,
  CATEGORIES_VEHICULES,
  TypeClient,
  ModePaiement,
  Stationnement,
  ParametresApp,
} from '../types';
import { calculerMontant } from '../services/pricingEngine';
import { formatAriary } from '../utils/formatters';

interface AncienVehiculeModalProps {
  isOpen: boolean;
  parametres: ParametresApp;
  onClose: () => void;
  onEnregistrerEntree: (payload: any) => Promise<Stationnement>;
  onSuccess: (st: Stationnement) => void;
}

export const AncienVehiculeModal: React.FC<AncienVehiculeModalProps> = ({
  isOpen,
  parametres,
  onClose,
  onEnregistrerEntree,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  // Vehicle info
  const [immatriculation, setImmatriculation] = useState<string>('');
  const [marque, setMarque] = useState<string>('');
  const [modele, setModele] = useState<string>('');
  const [categorie, setCategorie] = useState<CategorieVehicule>('Véhicule léger');
  const [clientType, setClientType] = useState<TypeClient>('Normal');
  const [nomClient, setNomClient] = useState<string>('');
  const [telephoneClient, setTelephoneClient] = useState<string>('');
  const [reparation, setReparation] = useState<boolean>(false);

  // Night tracking
  const [resteLaNuit, setResteLaNuit] = useState<boolean>(false);

  // Dates & Times
  const [dateEntree, setDateEntree] = useState<string>(today);
  const [heureEntree, setHeureEntree] = useState<string>('08:00');
  const [dejaSorti, setDejaSorti] = useState<boolean>(true);
  const [dateSortie, setDateSortie] = useState<string>(today);
  const [heureSortie, setHeureSortie] = useState<string>('18:00');

  // Pricing & Payment
  const tarifCalcule = calculerMontant(clientType, categorie, reparation, parametres.tarifs);
  const [montantDu, setMontantDu] = useState<number>(tarifCalcule);
  const [montantPaye, setMontantPaye] = useState<number>(tarifCalcule);
  const [modePaiement, setModePaiement] = useState<ModePaiement>('Espèces');
  const [comptabiliserTresorerie, setComptabiliserTresorerie] = useState<boolean>(false); // False by default because ancient vehicles are usually already part of initial balance
  const [observation, setObservation] = useState<string>('Ancien véhicule saisi rétroactivement');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanImmat = immatriculation.trim().toUpperCase();
    if (!cleanImmat) {
      setErrorMsg("Le numéro d'immatriculation est obligatoire.");
      return;
    }

    if (montantDu < 0 || isNaN(montantDu)) {
      setErrorMsg('Le montant dû doit être un nombre positif ou nul.');
      return;
    }

    if (montantPaye < 0 || isNaN(montantPaye)) {
      setErrorMsg('Le montant payé doit être un nombre positif ou nul.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        immatriculation: cleanImmat,
        marque: marque.trim() || 'Véhicule',
        modele: modele.trim() || '',
        categorie,
        type_client: clientType,
        nom_client: clientType === 'Kospam' ? 'Garage Kospam' : (nomClient.trim() || 'Client archivé'),
        telephone_client: telephoneClient.trim() || '',
        reparation,
        reste_la_nuit: resteLaNuit,
        historique_ancien: true,
        statut: dejaSorti ? 'Sorti' : 'Présent',
        date_entree: dateEntree,
        heure_entree: heureEntree,
        date_sortie: dejaSorti ? dateSortie : null,
        heure_sortie: dejaSorti ? heureSortie : null,
        montant_du: Number(montantDu),
        montant_paye: Number(montantPaye),
        regler_maintenant: montantPaye > 0,
        mode_paiement: modePaiement,
        paiement: montantPaye > 0 ? {
          montant: Number(montantPaye),
          mode_paiement: modePaiement,
          reference: `REC-ANC-${Date.now().toString().slice(-4)}`,
          observation: `Ancien véhicule ${cleanImmat}`,
        } : undefined,
        comptabiliser_tresorerie: comptabiliserTresorerie,
        observation: observation.trim(),
      };

      const result = await onEnregistrerEntree(payload);
      onSuccess(result);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement de l'ancien véhicule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="modal-ancien-vehicule-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="modal-ancien-vehicule-content"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center">
              <History className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Enregistrer un Ancien Véhicule (Historique Antérieur)
              </h2>
              <p className="text-xs text-indigo-200">
                Véhicule déjà entré et sorti avant la mise en place de l'application
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

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Immatriculation & Catégorie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Immatriculation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 1234 TAB"
                value={immatriculation}
                onChange={(e) => setImmatriculation(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Catégorie de Véhicule
              </label>
              <select
                value={categorie}
                onChange={(e) => {
                  const newCat = e.target.value as CategorieVehicule;
                  setCategorie(newCat);
                  const newM = calculerMontant(clientType, newCat, reparation, parametres.tarifs);
                  setMontantDu(newM);
                  setMontantPaye(newM);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
              >
                {CATEGORIES_VEHICULES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Marque & Modèle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Marque</label>
              <input
                type="text"
                placeholder="Ex: Toyota, Peugeot..."
                value={marque}
                onChange={(e) => setMarque(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Modèle</label>
              <input
                type="text"
                placeholder="Ex: Hilux, 206..."
                value={modele}
                onChange={(e) => setModele(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
          </div>

          {/* Client Nom & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nom du Client</label>
              <input
                type="text"
                placeholder="Ex: Client de passage, M. Paul..."
                value={nomClient}
                onChange={(e) => setNomClient(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Type de Client</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setClientType('Normal');
                    const m = calculerMontant('Normal', categorie, reparation, parametres.tarifs);
                    setMontantDu(m);
                    setMontantPaye(m);
                  }}
                  className={`flex-1 py-2 px-2 rounded-xl border font-bold ${
                    clientType === 'Normal'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClientType('Kospam');
                    const m = calculerMontant('Kospam', categorie, reparation, parametres.tarifs);
                    setMontantDu(m);
                    setMontantPaye(m);
                  }}
                  className={`flex-1 py-2 px-2 rounded-xl border font-bold ${
                    clientType === 'Kospam'
                      ? 'bg-amber-50 border-amber-500 text-amber-900'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Garage Kospam
                </button>
              </div>
            </div>
          </div>

          {/* Resté la nuit ? Oui / Non (Suivi uniquement, sans supplément) */}
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-purple-950 block text-xs">
                  Resté la nuit ?
                </span>
                <span className="text-[10px] text-purple-700">
                  Suivi uniquement (aucun supplément tarifaire automatique)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-purple-200">
              <button
                type="button"
                onClick={() => setResteLaNuit(false)}
                className={`px-3 py-1 rounded-md font-bold text-xs transition-colors ${
                  !resteLaNuit
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Non
              </button>
              <button
                type="button"
                onClick={() => setResteLaNuit(true)}
                className={`px-3 py-1 rounded-md font-bold text-xs transition-colors ${
                  resteLaNuit
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Oui 🌙
              </button>
            </div>
          </div>

          {/* Dates & Statut : Déjà sorti ou encore présent */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Statut du Véhicule</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDejaSorti(true)}
                  className={`px-3 py-1 rounded-lg font-bold ${
                    dejaSorti
                      ? 'bg-slate-800 text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  Déjà sorti
                </button>
                <button
                  type="button"
                  onClick={() => setDejaSorti(false)}
                  className={`px-3 py-1 rounded-lg font-bold ${
                    !dejaSorti
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  Encore présent
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Date & Heure d'Entrée
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={dateEntree}
                    onChange={(e) => setDateEntree(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="time"
                    value={heureEntree}
                    onChange={(e) => setHeureEntree(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {dejaSorti && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Date & Heure de Sortie
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="date"
                      value={dateSortie}
                      onChange={(e) => setDateSortie(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="time"
                      value={heureSortie}
                      onChange={(e) => setHeureSortie(e.target.value)}
                      className="w-20 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Montants Dû et Payé */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
            <div>
              <label className="block font-bold text-amber-950 mb-1">
                Montant Dû (Ariary) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={montantDu}
                onChange={(e) => setMontantDu(Number(e.target.value))}
                className="w-full px-3 py-2 font-mono font-black text-sm bg-white border border-amber-300 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-amber-950 mb-1">
                Montant Payé (Ariary) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={montantPaye}
                onChange={(e) => setMontantPaye(Number(e.target.value))}
                className="w-full px-3 py-2 font-mono font-black text-sm bg-white border border-amber-300 rounded-xl text-emerald-800"
              />
            </div>
          </div>

          {/* Mode de paiement */}
          {montantPaye > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Mode de paiement :</span>
              {(['Espèces', 'Orange Money', 'Mvola', 'Airtel Money'] as ModePaiement[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setModePaiement(mode)}
                  className={`px-2 py-1 rounded-lg font-bold text-xs border ${
                    modePaiement === mode
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}

          {/* Option Trésorerie : Comptabiliser ou déjà dans solde initial */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={comptabiliserTresorerie}
                onChange={(e) => setComptabiliserTresorerie(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-slate-800 block">
                  Comptabiliser dans la trésorerie actuelle
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {comptabiliserTresorerie
                    ? "Le montant payé sera ajouté aux encaissements de la trésorerie."
                    : "Non comptabilisé dans les nouvelles entrées (car l'argent est déjà inclus dans votre solde initial)."}
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer dans l’Historique'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
