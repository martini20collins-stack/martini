import React, { useState, useEffect } from 'react';
import {
  ArrowDownRight,
  User,
  Car,
  ParkingSquare,
  Wrench,
  FileText,
  CheckCircle2,
  Plus,
  Search,
  Sparkles,
  AlertCircle,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import {
  Client,
  Vehicule,
  Place,
  Stationnement,
  CategorieVehicule,
  CATEGORIES_VEHICULES,
  TypeClient,
  TypeStationnement,
  ParametresApp,
} from '../types';
import { calculerMontant } from '../services/pricingEngine';
import { formatAriary } from '../utils/formatters';

interface EntreeVehiculeProps {
  clients: Client[];
  vehicules: Vehicule[];
  places: Place[];
  parametres: ParametresApp;
  onEnregistrerEntree: (payload: any) => Promise<Stationnement>;
  onSuccess: (st: Stationnement) => void;
}

export const EntreeVehicule: React.FC<EntreeVehiculeProps> = ({
  clients,
  vehicules,
  places,
  parametres,
  onEnregistrerEntree,
  onSuccess,
}) => {
  // Client selection state
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isNewClient, setIsNewClient] = useState<boolean>(false);
  const [newClientNom, setNewClientNom] = useState<string>('');
  const [newClientType, setNewClientType] = useState<TypeClient>('Normal');
  const [newClientTel, setNewClientTel] = useState<string>('');
  const [newClientAdresse, setNewClientAdresse] = useState<string>('');
  const [newClientEmail, setNewClientEmail] = useState<string>('');

  // Vehicle selection state
  const [searchImmat, setSearchImmat] = useState<string>('');
  const [selectedVehiculeId, setSelectedVehiculeId] = useState<string>('');
  const [isNewVehicule, setIsNewVehicule] = useState<boolean>(false);
  const [vehiculeMarque, setVehiculeMarque] = useState<string>('');
  const [vehiculeModele, setVehiculeModele] = useState<string>('');
  const [vehiculeCategorie, setVehiculeCategorie] = useState<CategorieVehicule>('Véhicule léger');

  // Operation details
  const [reparation, setReparation] = useState<boolean>(false);
  const [typeStationnement, setTypeStationnement] = useState<TypeStationnement>('Journée normale');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [observation, setObservation] = useState<string>('');

  // Status & calculated price
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available free spots
  const placesLibres = places.filter((p) => p.statut === 'Libre');

  // Determine current active client type for pricing calculation
  const currentClientType: TypeClient = isNewClient
    ? newClientType
    : clients.find((c) => c.id_client === selectedClientId)?.type_client || 'Normal';

  // Live Price Calculation via central pricing engine
  const montantCalcule = calculerMontant(
    currentClientType,
    vehiculeCategorie,
    reparation,
    parametres.tarifs,
    typeStationnement
  );

  // Filter vehicles when searching immatriculation
  const filteredVehicules = vehicules.filter((v) =>
    v.immatriculation.toLowerCase().includes(searchImmat.toLowerCase().trim())
  );

  // Auto-select or prefill when search matches or vehicle selected
  const handleSelectVehicule = (v: Vehicule) => {
    setSelectedVehiculeId(v.id_vehicule);
    setSearchImmat(v.immatriculation);
    setVehiculeMarque(v.marque);
    setVehiculeModele(v.modele);
    setVehiculeCategorie(v.categorie);
    setIsNewVehicule(false);

    // Auto-select owner client if not already set
    if (v.id_client) {
      setSelectedClientId(v.id_client);
      setIsNewClient(false);
    }
  };

  const handleImmatInputChange = (val: string) => {
    setSearchImmat(val);
    const exact = vehicules.find(
      (v) => v.immatriculation.trim().toUpperCase() === val.trim().toUpperCase()
    );
    if (exact) {
      handleSelectVehicule(exact);
    } else {
      setSelectedVehiculeId('');
      setIsNewVehicule(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedClientId && (!isNewClient || !newClientNom.trim())) {
      setErrorMsg('Veuillez sélectionner ou créer un client.');
      return;
    }

    if (!searchImmat.trim()) {
      setErrorMsg("L'immatriculation du véhicule est obligatoire.");
      return;
    }

    if (isNewVehicule && !vehiculeMarque.trim()) {
      setErrorMsg('Veuillez renseigner la marque du véhicule.');
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        reparation,
        type_stationnement: typeStationnement,
        reste_la_nuit: typeStationnement === 'Nuit' || typeStationnement === 'Nuit – Parking sécurisé',
        id_place: selectedPlaceId || undefined,
        observation: observation.trim(),
      };

      if (isNewClient) {
        payload.client_data = {
          nom: newClientNom.trim(),
          type_client: newClientType,
          telephone: newClientTel.trim(),
          adresse: newClientAdresse.trim(),
          email: newClientEmail.trim(),
        };
      } else {
        payload.id_client = selectedClientId;
      }

      if (selectedVehiculeId && !isNewVehicule) {
        payload.id_vehicule = selectedVehiculeId;
      } else {
        payload.vehicule_data = {
          immatriculation: searchImmat.trim().toUpperCase(),
          marque: vehiculeMarque.trim(),
          modele: vehiculeModele.trim(),
          categorie: vehiculeCategorie,
        };
      }

      const st = await onEnregistrerEntree(payload);
      onSuccess(st);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement de l'entrée");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Enregistrer une Entrée Véhicule</h1>
            <p className="text-xs text-slate-500">
              Parcours fluide d'admission avec calcul automatique du tarif
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* STEP 1: CLIENT SELECTION / CREATION */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span>1. Client Propriétaire</span>
              </label>

              <button
                type="button"
                id="btn-toggle-new-client"
                onClick={() => {
                  setIsNewClient(!isNewClient);
                  setSelectedClientId('');
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {isNewClient ? 'Choisir un client existant' : '+ Créer un nouveau client'}
              </button>
            </div>

            {!isNewClient ? (
              <div>
                <select
                  id="select-client"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  required={!isNewClient}
                >
                  <option value="">-- Sélectionnez un client --</option>
                  {clients.map((c) => (
                    <option key={c.id_client} value={c.id_client}>
                      {c.nom} ({c.type_client === 'Kospam' ? 'Garage Kospam' : 'Client Normal'}) —{' '}
                      {c.telephone || 'Sans tél'}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-white p-4 rounded-lg border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    id="input-new-client-nom"
                    required
                    value={newClientNom}
                    onChange={(e) => setNewClientNom(e.target.value)}
                    placeholder="Ex: Jean Rakoto ou Garage Kospam"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Type de client *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      id="btn-client-type-normal"
                      onClick={() => setNewClientType('Normal')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                        newClientType === 'Normal'
                          ? 'bg-blue-50 border-blue-600 text-blue-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      id="btn-client-type-kospam"
                      onClick={() => setNewClientType('Kospam')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                        newClientType === 'Kospam'
                          ? 'bg-amber-50 border-amber-600 text-amber-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Garage Kospam
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    id="input-new-client-tel"
                    value={newClientTel}
                    onChange={(e) => setNewClientTel(e.target.value)}
                    placeholder="+261 34 00 000 00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    id="input-new-client-adresse"
                    value={newClientAdresse}
                    onChange={(e) => setNewClientAdresse(e.target.value)}
                    placeholder="Ville / Quartier"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="input-new-client-email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="client@mail.mg"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: VEHICLE SELECTION & DETAILS */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-indigo-600" />
              <span>2. Véhicule & Immatriculation</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Immatriculation Search / Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Immatriculation *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="input-immatriculation-entree"
                    required
                    value={searchImmat}
                    onChange={(e) => handleImmatInputChange(e.target.value)}
                    placeholder="Ex: 1234 TAB"
                    className="w-full px-3.5 py-2.5 uppercase font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 tracking-wider"
                  />
                </div>
                {searchImmat && filteredVehicules.length > 0 && !selectedVehiculeId && (
                  <div className="mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto divide-y divide-slate-100">
                    {filteredVehicules.map((v) => (
                      <div
                        key={v.id_vehicule}
                        onClick={() => handleSelectVehicule(v)}
                        className="p-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center text-xs"
                      >
                        <span className="font-bold text-slate-900">{v.immatriculation}</span>
                        <span className="text-slate-500">
                          {v.marque} {v.modele} ({v.categorie})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Catégorie du véhicule */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catégorie du véhicule *
                </label>
                <select
                  id="select-categorie-entree"
                  value={vehiculeCategorie}
                  onChange={(e) => setVehiculeCategorie(e.target.value as CategorieVehicule)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES_VEHICULES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marque */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marque *</label>
                <input
                  type="text"
                  id="input-marque-entree"
                  required
                  value={vehiculeMarque}
                  onChange={(e) => setVehiculeMarque(e.target.value)}
                  placeholder="Ex: Toyota, Renault, Mercedes..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>

              {/* Modèle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modèle</label>
                <input
                  type="text"
                  id="input-modele-entree"
                  value={vehiculeModele}
                  onChange={(e) => setVehiculeModele(e.target.value)}
                  placeholder="Ex: Hilux, Corolla, Master..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: TYPE DE STATIONNEMENT & PRESTATION & PLACE */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4 text-indigo-600" />
              <span>3. Type de Stationnement</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTypeStationnement('Journée normale')}
                className={`p-3 rounded-xl border text-left font-bold transition-all ${
                  typeStationnement === 'Journée normale'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Sun className="w-4 h-4" />
                  <span>Journée normale</span>
                </div>
                <span className="text-xs font-black text-slate-900 mt-1 block">3 000 Ar</span>
                <span className="text-[10px] text-slate-500 font-normal">Tarif standard de jour</span>
              </button>

              <button
                type="button"
                onClick={() => setTypeStationnement('Nuit')}
                className={`p-3 rounded-xl border text-left font-bold transition-all ${
                  typeStationnement === 'Nuit'
                    ? 'bg-purple-50 border-purple-500 text-purple-950 ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 text-purple-700">
                  <Moon className="w-4 h-4" />
                  <span>Nuit</span>
                </div>
                <span className="text-xs font-black text-slate-900 mt-1 block">8 000 Ar</span>
                <span className="text-[10px] text-purple-700 font-medium">3 000 + 5 000 Ar suppl.</span>
              </button>

              <button
                type="button"
                onClick={() => setTypeStationnement('Nuit – Parking sécurisé')}
                className={`p-3 rounded-xl border text-left font-bold transition-all ${
                  typeStationnement === 'Nuit – Parking sécurisé'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 text-indigo-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Nuit – Sécurisé</span>
                </div>
                <span className="text-xs font-black text-slate-900 mt-1 block">10 000 Ar</span>
                <span className="text-[10px] text-indigo-700 font-medium">Parking haute sécurité</span>
              </button>
            </div>
          </div>

          {/* STEP 4: PRESTATION & PLACE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Réparation Oui / Non */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
                <span>4. Prestation Réparation</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  id="btn-reparation-non"
                  onClick={() => setReparation(false)}
                  className={`flex-1 py-3 px-3 rounded-xl border text-xs font-bold transition-all ${
                    !reparation
                      ? 'bg-white border-slate-400 text-slate-800 shadow-xs ring-2 ring-slate-400/20'
                      : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-white'
                  }`}
                >
                  NON (Stationnement seul)
                </button>
                <button
                  type="button"
                  id="btn-reparation-oui"
                  onClick={() => setReparation(true)}
                  className={`flex-1 py-3 px-3 rounded-xl border text-xs font-bold transition-all ${
                    reparation
                      ? 'bg-amber-500 border-amber-600 text-white shadow-xs ring-2 ring-amber-400/30'
                      : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-white'
                  }`}
                >
                  OUI (Avec Réparation)
                </button>
              </div>
            </div>

            {/* Place de stationnement */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ParkingSquare className="w-4 h-4 text-indigo-600" />
                  <span>4. Place attribuée (Optionnel)</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {placesLibres.length} places libres
                </span>
              </div>
              <select
                id="select-place-entree"
                value={selectedPlaceId}
                onChange={(e) => setSelectedPlaceId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Sans place attitrée (Automatique / Libre) --</option>
                {places.map((p) => (
                  <option
                    key={p.id_place}
                    value={p.id_place}
                    disabled={p.statut === 'Occupée'}
                  >
                    Place {p.numero_place} {p.statut === 'Occupée' ? '⛔ (Occupée)' : '✅ (Libre)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observation / Motif d'entrée
            </label>
            <input
              type="text"
              id="input-observation-entree"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: Client pressé, révision frein avant..."
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* DYNAMIC PRICING CALCULATION BANNER */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-indigo-200 font-medium uppercase tracking-wider block">
                Tarif calculé automatiquement (Moteur Central)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-amber-400">
                  {formatAriary(montantCalcule)}
                </span>
                <span className="text-xs text-slate-300">
                  ({currentClientType === 'Kospam' ? 'Tarif Partenaire Kospam' : 'Tarif Client Normal'}
                  {reparation ? ' + Réparation' : ' standard'})
                </span>
              </div>
            </div>

            <button
              id="btn-valider-entree"
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Enregistrement...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Valider l'Entrée du Véhicule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
