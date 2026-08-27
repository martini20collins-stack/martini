import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  PlusCircle,
  Wrench,
  User,
  ParkingSquare,
  CreditCard,
  Printer,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  Place,
  Client,
  Vehicule,
  CategorieVehicule,
  CATEGORIES_VEHICULES,
  TypeClient,
  ParametresApp,
  ModePaiement,
  Stationnement,
} from '../types';
import { calculerMontant } from '../services/pricingEngine';
import { formatAriary } from '../utils/formatters';

interface EntreeRapideModalProps {
  isOpen: boolean;
  places: Place[];
  clients: Client[];
  vehicules: Vehicule[];
  parametres: ParametresApp;
  preselectKospam?: boolean;
  onClose: () => void;
  onEnregistrerEntree: (payload: any) => Promise<Stationnement>;
  onSuccess: (st: Stationnement, modePaiement?: string) => void;
}

export const EntreeRapideModal: React.FC<EntreeRapideModalProps> = ({
  isOpen,
  places,
  clients,
  vehicules,
  parametres,
  preselectKospam = false,
  onClose,
  onEnregistrerEntree,
  onSuccess,
}) => {
  if (!isOpen) return null;

  // Form State
  const [immatriculation, setImmatriculation] = useState<string>('');
  const [marque, setMarque] = useState<string>('');
  const [modele, setModele] = useState<string>('');
  const [categorie, setCategorie] = useState<CategorieVehicule>('Véhicule léger');
  const [clientType, setClientType] = useState<TypeClient>(preselectKospam ? 'Kospam' : 'Normal');
  const [nomClient, setNomClient] = useState<string>('');
  const [telephoneClient, setTelephoneClient] = useState<string>('');
  const [reparation, setReparation] = useState<boolean>(false);
  const [placeId, setPlaceId] = useState<string>('');
  const [encaisserMaintenant, setEncaisserMaintenant] = useState<boolean>(false);
  const [modePaiement, setModePaiement] = useState<ModePaiement>('Espèces');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available free spots
  const placesLibres = places.filter((p) => p.statut === 'Libre');

  // Auto-select first free spot if none selected
  useEffect(() => {
    if (!placeId && placesLibres.length > 0) {
      setPlaceId(placesLibres[0].id_place);
    }
  }, [placesLibres, placeId]);

  // If typing immatriculation, try to auto-fill known vehicle or client
  useEffect(() => {
    if (immatriculation.length >= 3) {
      const found = vehicules.find(
        (v) => v.immatriculation.replace(/\s+/g, '').toUpperCase() === immatriculation.replace(/\s+/g, '').toUpperCase()
      );
      if (found) {
        if (!marque) setMarque(found.marque);
        if (!modele) setModele(found.modele);
        setCategorie(found.categorie);
        const cli = clients.find((c) => c.id_client === found.id_client);
        if (cli) {
          setClientType(cli.type_client);
          if (!nomClient) setNomClient(cli.nom);
          if (!telephoneClient) setTelephoneClient(cli.telephone);
        }
      }
    }
  }, [immatriculation, vehicules, clients]);

  // Calculate live amount
  const montantDu = calculerMontant(clientType, categorie, reparation, parametres.tarifs);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanImmat = immatriculation.trim().toUpperCase();
    if (!cleanImmat) {
      setErrorMsg("Veuillez saisir le numéro d'immatriculation.");
      return;
    }

    if (!placeId) {
      setErrorMsg('Veuillez sélectionner une place de stationnement disponible.');
      return;
    }

    setLoading(true);
    try {
      // Find or generate vehicle & client
      const payload: any = {
        immatriculation: cleanImmat,
        marque: marque.trim() || 'Véhicule',
        modele: modele.trim() || '',
        categorie,
        type_client: clientType,
        nom_client: clientType === 'Kospam' ? 'Garage Kospam' : (nomClient.trim() || 'Client de passage'),
        telephone_client: telephoneClient.trim() || '',
        reparation,
        id_place: placeId,
        regler_maintenant: encaisserMaintenant,
        mode_paiement: encaisserMaintenant ? modePaiement : undefined,
      };

      const result = await onEnregistrerEntree(payload);
      onSuccess(result, encaisserMaintenant ? modePaiement : undefined);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement de l'entrée.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="modal-entree-rapide-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="modal-entree-rapide-content"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Nouvelle Entrée Véhicule
              </h2>
              <p className="text-xs text-emerald-100 opacity-90">
                Enregistrement direct en 1 minute
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

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* 1. IMMATRICULATION */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Plaque d'Immatriculation <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-entree-immatriculation"
                type="text"
                required
                autoFocus
                placeholder="Ex: 1234 TAB, 5678 WWT..."
                value={immatriculation}
                onChange={(e) => setImmatriculation(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 font-mono text-base font-black bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase tracking-wider text-slate-900"
              />
              <Car className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* 2. CATÉGORIE DU VÉHICULE */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Catégorie de Véhicule
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {CATEGORIES_VEHICULES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategorie(cat)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                    categorie === cat
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'Véhicule léger' ? '🚗 Léger' : cat === '4x4' ? '🚙 4x4' : cat === 'Camionnette' ? '🚐 Camionnette' : cat === 'Bus' ? '🚌 Bus' : '🚛 Camion'}
                </button>
              ))}
            </div>
          </div>

          {/* 3. TYPE DE CLIENT */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setClientType('Normal');
              }}
              className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold transition-all text-left ${
                clientType === 'Normal'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="block text-xs">Client Particulier</span>
                <span className="text-[10px] font-normal text-slate-500">Tarif standard</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setClientType('Kospam');
              }}
              className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold transition-all text-left ${
                clientType === 'Kospam'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="block text-xs">Garage Kospam</span>
                <span className="text-[10px] font-normal text-slate-500">Atelier partenaire</span>
              </div>
            </button>
          </div>

          {/* 4. OPTION RÉPARATION ATELIER */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wrench className="w-4 h-4 text-amber-600" />
              <div>
                <span className="font-bold text-slate-800 block text-xs">
                  Réparation en Atelier ?
                </span>
                <span className="text-[10px] text-slate-500">
                  {clientType === 'Kospam'
                    ? 'Garage Kospam avec réparation = 5 000 Ar'
                    : categorie === 'Véhicule léger'
                    ? 'Véhicule léger avec réparation = 3 000 Ar'
                    : '4x4 / Camionnette avec réparation = 5 000 Ar'}
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reparation}
                onChange={(e) => setReparation(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
            </label>
          </div>

          {/* 5. PLACE ATTRIBUÉE */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Place de Parking Attribuée <span className="text-rose-500">*</span>
            </label>
            <select
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
            >
              {placesLibres.length === 0 ? (
                <option value="">⚠️ Aucune place libre</option>
              ) : (
                placesLibres.map((p) => (
                  <option key={p.id_place} value={p.id_place}>
                    Place {p.numero_place} (Libre)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 6. ENCADRÉ TARIF CLAIR & CALCULÉ */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Tarif Calculé Automatique
              </span>
              <span className="text-xl font-black text-emerald-400">
                {formatAriary(montantDu)}
              </span>
            </div>
            <div className="text-right text-[10px] text-slate-300">
              <span className="block font-bold">
                {clientType === 'Kospam' ? 'Garage Kospam' : 'Client Normal'}
              </span>
              <span>{reparation ? '🔧 Avec réparation' : 'Sans réparation'}</span>
            </div>
          </div>

          {/* 7. OPTION RÈGLEMENT IMMÉDIAT */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-950">
              <input
                type="checkbox"
                checked={encaisserMaintenant}
                onChange={(e) => setEncaisserMaintenant(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Encaisser maintenant ({formatAriary(montantDu)})</span>
            </label>

            {encaisserMaintenant && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500 font-medium">Mode :</span>
                {(['Espèces', 'Orange Money', 'Mvola', 'Airtel Money'] as ModePaiement[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setModePaiement(mode)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      modePaiement === mode
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BOUTONS D'ACTION */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>

            <button
              id="btn-valider-entree-rapide"
              type="submit"
              disabled={loading || placesLibres.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {loading ? 'Enregistrement...' : 'Valider & Imprimer Ticket'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
