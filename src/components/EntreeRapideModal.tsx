import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  PlusCircle,
  Wrench,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  ShieldCheck,
  Calendar,
  DollarSign,
  Edit3,
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
  TypeStationnement,
} from '../types';
import { calculerMontant } from '../services/pricingEngine';
import { formatAriary } from '../utils/formatters';

interface EntreeRapideModalProps {
  isOpen: boolean;
  places?: Place[];
  clients: Client[];
  vehicules: Vehicule[];
  parametres: ParametresApp;
  preselectKospam?: boolean;
  stationnementToEdit?: Stationnement | null;
  onClose: () => void;
  onEnregistrerEntree: (payload: any) => Promise<Stationnement>;
  onUpdateStationnement?: (id: string, payload: any) => Promise<Stationnement>;
  onSuccess: (st: Stationnement, modePaiement?: string) => void;
}

export const EntreeRapideModal: React.FC<EntreeRapideModalProps> = ({
  isOpen,
  clients,
  vehicules,
  parametres,
  preselectKospam = false,
  stationnementToEdit = null,
  onClose,
  onEnregistrerEntree,
  onUpdateStationnement,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const isEditing = !!stationnementToEdit;

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Nom du client
  const [nomClient, setNomClient] = useState<string>('');
  // 2. Catégorie du client : Normal | Garage Kospam
  const [clientType, setClientType] = useState<TypeClient>(preselectKospam ? 'Kospam' : 'Normal');
  // 3. Immatriculation du véhicule
  const [immatriculation, setImmatriculation] = useState<string>('');
  // 4. Catégorie du véhicule
  const [categorie, setCategorie] = useState<CategorieVehicule>('Véhicule léger');
  // 5. Réparation : Oui / Non
  const [reparation, setReparation] = useState<boolean>(false);
  // 6. Type de stationnement
  const [typeStationnement, setTypeStationnement] = useState<TypeStationnement>('Journée normale');
  // 7. Date
  const [dateStationnement, setDateStationnement] = useState<string>(todayStr);
  // 8. Montant à payer (calcul automatique ou surcharge manuelle)
  const [montantAPayer, setMontantAPayer] = useState<number>(3000);
  const [isManualAmount, setIsManualAmount] = useState<boolean>(false);
  // 9. Montant payé
  const [montantPaye, setMontantPaye] = useState<number>(3000);
  // 10. Mode de paiement
  const [modePaiement, setModePaiement] = useState<ModePaiement>('Espèces');

  // Champs annexes
  const [telephoneClient, setTelephoneClient] = useState<string>('');
  const [marque, setMarque] = useState<string>('');
  const [observation, setObservation] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialisation lors de l'édition ou de l'ouverture
  useEffect(() => {
    if (stationnementToEdit) {
      setNomClient(stationnementToEdit.client_nom || stationnementToEdit.nom_client || '');
      setClientType(stationnementToEdit.client_type || stationnementToEdit.categorie_client || 'Normal');
      setImmatriculation(stationnementToEdit.immatriculation || '');
      setCategorie(stationnementToEdit.categorie || stationnementToEdit.categorie_vehicule || 'Véhicule léger');
      setReparation(Boolean(stationnementToEdit.reparation));
      setTypeStationnement(
        stationnementToEdit.type_stationnement ||
          (stationnementToEdit.reste_la_nuit ? 'Nuit' : 'Journée normale')
      );
      setDateStationnement(stationnementToEdit.date_entree?.slice(0, 10) || todayStr);
      setMontantAPayer(stationnementToEdit.montant_a_payer || stationnementToEdit.montant_du || 3000);
      setMontantPaye(
        stationnementToEdit.montant_paye !== undefined
          ? stationnementToEdit.montant_paye
          : stationnementToEdit.montant_du || 3000
      );
      setModePaiement(stationnementToEdit.mode_paiement || 'Espèces');
      setMarque(stationnementToEdit.marque || '');
      setObservation(stationnementToEdit.observation || '');
      setIsManualAmount(true);
    } else {
      // Nouvelle entrée
      setNomClient(preselectKospam ? 'Garage Kospam' : '');
      setClientType(preselectKospam ? 'Kospam' : 'Normal');
      setImmatriculation('');
      setCategorie('Véhicule léger');
      setReparation(false);
      setTypeStationnement('Journée normale');
      setDateStationnement(todayStr);
      setIsManualAmount(false);
      const autoPrice = calculerMontant(
        preselectKospam ? 'Kospam' : 'Normal',
        'Véhicule léger',
        false,
        parametres.tarifs,
        'Journée normale'
      );
      setMontantAPayer(autoPrice);
      setMontantPaye(autoPrice);
      setModePaiement('Espèces');
      setMarque('');
      setObservation('');
    }
  }, [stationnementToEdit, isOpen, preselectKospam, parametres.tarifs]);

  // Recalcul automatique lorsque les critères changent (si pas en surcharge manuelle forcée)
  useEffect(() => {
    if (!isManualAmount) {
      const autoPrice = calculerMontant(
        clientType,
        categorie,
        reparation,
        parametres.tarifs,
        typeStationnement
      );
      setMontantAPayer(autoPrice);
      setMontantPaye(autoPrice);
    }
  }, [clientType, categorie, reparation, typeStationnement, parametres.tarifs, isManualAmount]);

  // Si on tape l'immatriculation, pré-remplissage intelligent
  useEffect(() => {
    if (!isEditing && immatriculation.length >= 3) {
      const clean = immatriculation.replace(/\s+/g, '').toUpperCase();
      const found = vehicules.find((v) => v.immatriculation.replace(/\s+/g, '').toUpperCase() === clean);
      if (found) {
        if (!marque) setMarque(found.marque);
        setCategorie(found.categorie);
        const cli = clients.find((c) => c.id_client === found.id_client);
        if (cli) {
          setClientType(cli.type_client);
          if (!nomClient) setNomClient(cli.nom);
          if (!telephoneClient) setTelephoneClient(cli.telephone || '');
        }
      }
    }
  }, [immatriculation, vehicules, clients, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanImmat = immatriculation.trim().toUpperCase();
    if (!cleanImmat) {
      setErrorMsg("Veuillez saisir le numéro d'immatriculation du véhicule.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        nom_client: clientType === 'Kospam' ? (nomClient.trim() || 'Garage Kospam') : (nomClient.trim() || 'Client Normal'),
        categorie_client: clientType,
        type_client: clientType,
        immatriculation: cleanImmat,
        categorie_vehicule: categorie,
        categorie: categorie,
        marque: marque.trim() || 'Véhicule',
        telephone_client: telephoneClient.trim() || undefined,
        reparation: Boolean(reparation),
        type_stationnement: typeStationnement,
        reste_la_nuit: typeStationnement === 'Nuit' || typeStationnement === 'Nuit – Parking sécurisé',
        date: dateStationnement,
        date_entree: dateStationnement,
        montant_a_payer: Number(montantAPayer),
        montant_du: Number(montantAPayer),
        montant_paye: Number(montantPaye),
        mode_paiement: modePaiement,
        observation: observation.trim() || undefined,
        regler_maintenant: Number(montantPaye) > 0,
      };

      let result: Stationnement;
      if (isEditing && onUpdateStationnement && stationnementToEdit) {
        result = await onUpdateStationnement(stationnementToEdit.id_stationnement, payload);
      } else {
        result = await onEnregistrerEntree(payload);
      }

      onSuccess(result, Number(montantPaye) > 0 ? modePaiement : undefined);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement du stationnement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="modal-entree-rapide-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto"
    >
      <div
        id="modal-entree-rapide-content"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              {isEditing ? <Edit3 className="w-5 h-5 text-amber-400" /> : <PlusCircle className="w-6 h-6 text-emerald-400" />}
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                {isEditing ? `Modifier Stationnement #${stationnementToEdit?.id_stationnement}` : 'Enregistrer un Stationnement'}
              </h2>
              <p className="text-xs text-slate-300">
                Calcul automatique des tarifs & gestion de paiement chaque soir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
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

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* 1. NOM DU CLIENT & CATÉGORIE DU CLIENT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                1. Nom du client <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-nom-client"
                  type="text"
                  required
                  placeholder="Ex: Jean Dupont, Rakoto..."
                  value={nomClient}
                  onChange={(e) => setNomClient(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                2. Catégorie du client <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  id="btn-cat-client-normal"
                  onClick={() => {
                    setClientType('Normal');
                    setIsManualAmount(false);
                  }}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                    clientType === 'Normal'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Normal</span>
                </button>

                <button
                  type="button"
                  id="btn-cat-client-kospam"
                  onClick={() => {
                    setClientType('Kospam');
                    if (!nomClient || nomClient === 'Client Normal') setNomClient('Garage Kospam');
                    setIsManualAmount(false);
                  }}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                    clientType === 'Kospam'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Garage Kospam</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. IMMATRICULATION DU VÉHICULE & MARQUE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                3. Immatriculation <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-immatriculation"
                  type="text"
                  required
                  placeholder="Ex: 1234 TAB, 5678 WWT..."
                  value={immatriculation}
                  onChange={(e) => setImmatriculation(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 font-mono text-sm font-black bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider text-slate-900"
                />
                <Car className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Marque & Modèle (optionnel)
              </label>
              <input
                id="input-marque"
                type="text"
                placeholder="Ex: Toyota Hilux, Peugeot 206..."
                value={marque}
                onChange={(e) => setMarque(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
          </div>

          {/* 4. CATÉGORIE DU VÉHICULE */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              4. Catégorie du véhicule <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(['Véhicule léger', '4x4', 'Camionnette', 'Bus', 'Camion'] as CategorieVehicule[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategorie(cat);
                    setIsManualAmount(false);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                    categorie === cat
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'Véhicule léger' && '🚗 '}
                  {cat === '4x4' && '🚙 '}
                  {cat === 'Camionnette' && '🚐 '}
                  {cat === 'Bus' && '🚌 '}
                  {cat === 'Camion' && '🚛 '}
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. RÉPARATION : OUI / NON & 6. TYPE DE STATIONNEMENT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* RÉPARATION */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="block font-bold text-slate-800">
                5. Réparation en atelier
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setReparation(false);
                    setIsManualAmount(false);
                  }}
                  className={`py-2 px-2 rounded-lg font-bold border text-center transition-all ${
                    !reparation
                      ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Non
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReparation(true);
                    setIsManualAmount(false);
                  }}
                  className={`py-2 px-2 rounded-lg font-bold border text-center transition-all flex items-center justify-center gap-1 ${
                    reparation
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Oui (Atelier)</span>
                </button>
              </div>
            </div>

            {/* DATE */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="block font-bold text-slate-800">
                7. Date du stationnement <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-date-stationnement"
                  type="date"
                  required
                  value={dateStationnement}
                  onChange={(e) => setDateStationnement(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 6. TYPE DE STATIONNEMENT */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              6. Type de stationnement <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTypeStationnement('Journée normale');
                  setIsManualAmount(false);
                }}
                className={`p-3 rounded-xl border text-left font-bold transition-all ${
                  typeStationnement === 'Journée normale'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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
                onClick={() => {
                  setTypeStationnement('Nuit');
                  setIsManualAmount(false);
                }}
                className={`p-3 rounded-xl border text-left font-bold transition-all ${
                  typeStationnement === 'Nuit'
                    ? 'bg-purple-50 border-purple-500 text-purple-950 ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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
                onClick={() => {
                  setTypeStationnement('Nuit – Parking sécurisé');
                  setIsManualAmount(false);
                }}
                className={`p-3 rounded-xl border text-left font-bold transition-all ${
                  typeStationnement === 'Nuit – Parking sécurisé'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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

          {/* 8. MONTANT À PAYER & 9. MONTANT PAYÉ & 10. MODE DE PAIEMENT */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Calcul Financier Automatique
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                Le client paie chaque soir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* MONTANT À PAYER */}
              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  8. Montant à payer (Ar)
                </label>
                <div className="relative">
                  <input
                    id="input-montant-a-payer"
                    type="number"
                    min="0"
                    step="any"
                    value={montantAPayer}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setMontantAPayer(val);
                      setIsManualAmount(true);
                      // S'il n'y a pas eu de changement manuel du montant payé, aligner
                      setMontantPaye(val);
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-black text-lg text-emerald-400 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Ar
                  </span>
                </div>
              </div>

              {/* MONTANT PAYÉ */}
              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  9. Montant payé (Ar)
                </label>
                <div className="relative">
                  <input
                    id="input-montant-paye"
                    type="number"
                    min="0"
                    step="any"
                    value={montantPaye}
                    onChange={(e) => setMontantPaye(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-black text-lg text-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Ar
                  </span>
                </div>
              </div>
            </div>

            {/* 10. MODE DE PAIEMENT */}
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1.5">
                10. Mode de paiement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['Espèces', 'Mobile Money', 'Virement', 'Autre'] as ModePaiement[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setModePaiement(mode)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors text-center ${
                      modePaiement === mode
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* STATUT RÉCAPITULATIF DU SOIR */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
              <span className="text-slate-400">
                Reste à payer :
              </span>
              <span className={`font-black ${montantAPayer - montantPaye > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {montantAPayer - montantPaye > 0
                  ? `${formatAriary(montantAPayer - montantPaye)} (Non soldé)`
                  : 'Soldé (Totalité réglée)'}
              </span>
            </div>
          </div>

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
              id="btn-valider-entree-rapide"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {loading
                  ? 'Enregistrement...'
                  : isEditing
                  ? 'Mettre à jour le stationnement'
                  : 'Valider le stationnement'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

