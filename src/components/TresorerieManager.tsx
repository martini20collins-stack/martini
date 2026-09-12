import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  X,
  Calendar,
  History,
  CheckCircle2,
  FileText,
  RefreshCw,
  Pencil,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { MouvementPortefeuille, TypeMouvement, ParametresApp } from '../types';
import { formatAriary, formatDateFr, formatDateTimeFr } from '../utils/formatters';
import { api } from '../services/api';

interface TresorerieManagerProps {
  parametres: ParametresApp;
  onRefresh: () => void;
}

export const TresorerieManager: React.FC<TresorerieManagerProps> = ({
  parametres,
  onRefresh,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [resume, setResume] = useState<{
    solde_initial: number;
    recettes_parking: number;
    anciennes_recettes: number;
    autres_entrees: number;
    total_recettes_globales: number;
    anciennes_depenses: number;
    depenses_courantes: number;
    autres_sorties: number;
    total_depenses_globales: number;
    solde_disponible: number;
    mouvements: MouvementPortefeuille[];
  } | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');

  // Modal Solde Initial
  const [isSoldeInitModalOpen, setIsSoldeInitModalOpen] = useState<boolean>(false);
  const [soldeInitInput, setSoldeInitInput] = useState<string>('0');
  const [soldeInitDate, setSoldeInitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [soldeInitObs, setSoldeInitObs] = useState<string>('');
  const [submittingInit, setSubmittingInit] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Modal Nouveau Mouvement (Anciennes recettes/dépenses, dépenses courantes, entrées)
  const [isMvtModalOpen, setIsMvtModalOpen] = useState<boolean>(false);
  const [mvtType, setMvtType] = useState<TypeMouvement>('Dépense');
  const [mvtMontant, setMvtMontant] = useState<string>('');
  const [mvtDate, setMvtDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mvtMotif, setMvtMotif] = useState<string>('Dépense courante');
  const [mvtCategorie, setMvtCategorie] = useState<string>('Dépense');
  const [mvtObservation, setMvtObservation] = useState<string>('');
  const [mvtReference, setMvtReference] = useState<string>('');
  const [submittingMvt, setSubmittingMvt] = useState<boolean>(false);
  const [mvtError, setMvtError] = useState<string | null>(null);

  // Modal Modification Mouvement
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingMvt, setEditingMvt] = useState<MouvementPortefeuille | null>(null);
  const [editMontant, setEditMontant] = useState<string>('');
  const [editMotif, setEditMotif] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editCategorie, setEditCategorie] = useState<string>('');
  const [editObservation, setEditObservation] = useState<string>('');
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Confirmation suppression
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Message flash de succès
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const res = await api.getTresorerieResume();
      setResume(res);
      setSoldeInitInput(String(res.solde_initial || 0));
    } catch (e) {
      console.error('Erreur chargement trésorerie:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResume();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => {
      setSuccessBanner(null);
    }, 4000);
  };

  // 1. Enregistrement Solde Initial
  const handleSaveSoldeInitial = async (e: React.FormEvent) => {
    e.preventDefault();
    setInitError(null);

    const val = Number(soldeInitInput.replace(/\s+/g, ''));
    if (isNaN(val) || val < 0) {
      setInitError('Veuillez saisir un montant valide (0 ou supérieur).');
      return;
    }

    try {
      setSubmittingInit(true);
      await api.setSoldeInitial({
        montant: val,
        date: soldeInitDate,
        observation: soldeInitObs.trim() || 'Solde initial disponible au démarrage de l’application',
      });
      setIsSoldeInitModalOpen(false);
      await fetchResume();
      onRefresh();
      triggerSuccess(`Solde initial validé avec succès : ${formatAriary(val)}.`);
    } catch (err: any) {
      setInitError(err.message || 'Erreur lors de l’enregistrement du solde initial.');
    } finally {
      setSubmittingInit(false);
    }
  };

  // 2. Enregistrement Nouveau Mouvement
  const handleAjouterMouvement = async (e: React.FormEvent) => {
    e.preventDefault();
    setMvtError(null);

    const cleanStr = mvtMontant.toString().replace(/\s+/g, '');
    const val = Number(cleanStr);
    if (isNaN(val) || val <= 0) {
      setMvtError('Veuillez saisir un montant positif strictement supérieur à 0 Ar.');
      return;
    }
    if (!mvtMotif.trim()) {
      setMvtError('Veuillez indiquer le motif ou sélectionner une suggestion ci-dessous.');
      return;
    }

    try {
      setSubmittingMvt(true);
      await api.ajouterMouvementTresorerie({
        type_mouvement: mvtType,
        montant: val,
        date: mvtDate,
        motif: mvtMotif.trim(),
        categorie: mvtCategorie.trim() || undefined,
        observation: mvtObservation.trim() || undefined,
        reference: mvtReference.trim() || undefined,
      });

      setIsMvtModalOpen(false);
      // Reset
      setMvtMontant('');
      setMvtMotif('');
      setMvtObservation('');
      setMvtReference('');
      await fetchResume();
      onRefresh();
      triggerSuccess(`Opération de trésorerie de ${formatAriary(val)} enregistrée avec succès.`);
    } catch (err: any) {
      setMvtError(err.message || "Erreur lors de l'enregistrement du mouvement.");
    } finally {
      setSubmittingMvt(false);
    }
  };

  // 3. Modification d'un mouvement
  const handleEditMouvement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMvt) return;
    setEditError(null);

    const val = Number(editMontant.toString().replace(/\s+/g, ''));
    if (isNaN(val) || val <= 0) {
      setEditError('Veuillez saisir un montant positif supérieur à 0 Ar.');
      return;
    }
    if (!editMotif.trim()) {
      setEditError('Le motif est obligatoire.');
      return;
    }

    try {
      setSubmittingEdit(true);
      await api.updateMouvementTresorerie(editingMvt.id_mouvement, {
        montant: val,
        motif: editMotif.trim(),
        date: editDate,
        categorie: editCategorie.trim() || undefined,
        observation: editObservation.trim() || undefined,
      });

      setIsEditModalOpen(false);
      setEditingMvt(null);
      await fetchResume();
      onRefresh();
      triggerSuccess('Mouvement mis à jour avec succès.');
    } catch (err: any) {
      setEditError(err.message || 'Erreur lors de la modification.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // 4. Suppression d'un mouvement
  const handleDeleteMouvement = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette écriture de trésorerie ? Le solde sera recalculé.')) {
      return;
    }
    try {
      setDeletingId(id);
      await api.deleteMouvementTresorerie(id);
      await fetchResume();
      onRefresh();
      triggerSuccess('Écriture supprimée de la trésorerie.');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  const openAddMvt = (type: TypeMouvement) => {
    setMvtType(type);
    setMvtMontant('');
    setMvtReference(`REF-${Date.now().toString().slice(-4)}`);
    setMvtDate(new Date().toISOString().split('T')[0]);
    setMvtObservation('');
    
    // Motifs et catégories par défaut
    if (type === 'Ancienne recette') {
      setMvtMotif('Ancienne recette parking');
      setMvtCategorie('Ancienne recette');
    } else if (type === 'Ancienne dépense') {
      setMvtMotif('Ancienne dépense / charge');
      setMvtCategorie('Ancienne charge');
    } else if (type === 'Dépense') {
      setMvtMotif('Dépense courante');
      setMvtCategorie('Dépense de caisse');
    } else if (type === 'Autre entrée') {
      setMvtMotif('Apport de fonds en caisse');
      setMvtCategorie('Apport');
    } else {
      setMvtMotif('Opération de trésorerie');
      setMvtCategorie('Divers');
    }

    setMvtError(null);
    setIsMvtModalOpen(true);
  };

  const openEdit = (m: MouvementPortefeuille) => {
    setEditingMvt(m);
    const mnt = m.entree > 0 ? m.entree : m.sortie;
    setEditMontant(String(mnt));
    setEditMotif(m.motif);
    setEditDate(m.date.split(' ')[0] || new Date().toISOString().split('T')[0]);
    setEditCategorie(m.categorie || '');
    setEditObservation(m.observation || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const mouvements = resume?.mouvements || [];

  const filteredMouvements = mouvements.filter((m) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      m.motif.toLowerCase().includes(term) ||
      (m.reference && m.reference.toLowerCase().includes(term)) ||
      (m.categorie && m.categorie.toLowerCase().includes(term)) ||
      (m.observation && m.observation.toLowerCase().includes(term));

    if (!matchSearch) return false;

    if (filterType === 'solde_initial') return m.type_mouvement === 'Solde initial';
    if (filterType === 'recette_parking') return m.type_mouvement === 'Encaissement parking';
    if (filterType === 'anciennes_recettes') return m.type_mouvement === 'Ancienne recette';
    if (filterType === 'anciennes_depenses') return m.type_mouvement === 'Ancienne dépense';
    if (filterType === 'depenses') return m.type_mouvement === 'Dépense';
    if (filterType === 'toutes_entrees') return Number(m.entree || 0) > 0;
    if (filterType === 'toutes_sorties') return Number(m.sortie || 0) > 0;

    return true;
  });

  const isCurrentMvtEntree =
    mvtType === 'Solde initial' ||
    mvtType === 'Encaissement parking' ||
    mvtType === 'Ancienne recette' ||
    mvtType === 'Autre entrée';

  return (
    <div className="space-y-6">
      {/* Toast / Notification Flash */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. CARTE MAÎTRESSE : SYNTHÈSE DE TRÉSORERIE */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Module Trésorerie & Portefeuille de Caisse</span>
            </div>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                {formatAriary(resume?.solde_disponible || 0)}
              </span>
              <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Solde Net Disponible
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Calculé en temps réel : Solde Initial + Recettes Réelles (parking & anciennes) - Dépenses (courantes & anciennes).
            </p>
          </div>

          {/* BOUTONS D'ACTIONS RAPIDES DE TRÉSORERIE */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* GROS BOUTON 1 : NOUVELLE DÉPENSE OU RECETTE */}
            <button
              id="btn-ajouter-operation-tresorerie"
              onClick={() => openAddMvt('Dépense')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Saisir Opération</span>
            </button>

            {/* BOUTON 2 : SOLDE INITIAL */}
            <button
              id="btn-saisir-solde-initial"
              onClick={() => {
                setSoldeInitInput(String(resume?.solde_initial || 0));
                setSoldeInitDate(parametres.date_solde_initial || new Date().toISOString().split('T')[0]);
                setSoldeInitObs('');
                setInitError(null);
                setIsSoldeInitModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors shadow-xs"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>Solde Initial</span>
            </button>

            {/* BOUTON 3 : ANCIENNE RECETTE */}
            <button
              onClick={() => openAddMvt('Ancienne recette')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-300" />
              <span>+ Ancienne Recette</span>
            </button>

            {/* BOUTON 4 : DÉPENSE COURANTE */}
            <button
              onClick={() => openAddMvt('Dépense')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-700/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              <TrendingDown className="w-4 h-4 text-rose-300" />
              <span>- Dépense</span>
            </button>
          </div>
        </div>

        {/* 2. DÉTAILS DU SOLDE ET RUBRIQUES CLÉS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          {/* Solde Initial */}
          <div
            onClick={() => {
              setSoldeInitInput(String(resume?.solde_initial || 0));
              setIsSoldeInitModalOpen(true);
            }}
            className="bg-white/5 hover:bg-white/10 cursor-pointer transition-colors p-4 rounded-2xl border border-white/10"
            title="Cliquer pour modifier le solde initial"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1. Solde Initial
              </span>
              <History className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 mt-1">
              {formatAriary(resume?.solde_initial || 0)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Caisse de départ (cliquer pour modifier)
            </span>
          </div>

          {/* Recettes Parking Actuelles */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                2. Recettes Parking
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-300 mt-1">
              +{formatAriary(resume?.recettes_parking || 0)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Encaissements parking réels
            </span>
          </div>

          {/* Anciennes Recettes */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                3. Anciennes Recettes
              </span>
              <ArrowDownLeft className="w-4 h-4 text-teal-300" />
            </div>
            <div className="text-xl font-black text-teal-200 mt-1">
              +{formatAriary(resume?.anciennes_recettes || 0)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Recettes antérieures saisies
            </span>
          </div>

          {/* Total Dépenses (Anciennes + Courantes) */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                4. Total Dépenses
              </span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-300 mt-1">
              -{formatAriary(resume?.total_depenses_globales || 0)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Courantes: {formatAriary(resume?.depenses_courantes || 0)} • Anciennes: {formatAriary(resume?.anciennes_depenses || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. TABLEAU DU JOURNAL CHRONOLOGIQUE DES MOUVEMENTS DE TRÉSORERIE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header & Filtres */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Journal Complet de la Trésorerie</span>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                {filteredMouvements.length} écritures
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Traçabilité détaillée avec solde progressif après chaque opération
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Recherche */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher motif, réf..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
              />
            </div>

            {/* Filtre Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            >
              <option value="all">Tous les mouvements</option>
              <option value="solde_initial">Solde Initial</option>
              <option value="recette_parking">Recettes Parking</option>
              <option value="anciennes_recettes">Anciennes Recettes</option>
              <option value="anciennes_depenses">Anciennes Dépenses</option>
              <option value="depenses">Dépenses Courantes</option>
              <option value="toutes_entrees">Toutes les Entrées (+)</option>
              <option value="toutes_sorties">Toutes les Sorties (-)</option>
            </select>

            <button
              onClick={fetchResume}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl border border-slate-200"
              title="Actualiser la liste"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Motif & Catégorie</th>
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4 text-right text-emerald-700">Entrée (+)</th>
                <th className="py-3 px-4 text-right text-rose-600">Sortie (-)</th>
                <th className="py-3 px-4 text-right text-slate-900 font-extrabold">Solde Progressif</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredMouvements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Wallet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <span>Aucun mouvement de trésorerie trouvé.</span>
                  </td>
                </tr>
              ) : (
                filteredMouvements.map((m) => {
                  const isEntree = Number(m.entree || 0) > 0;
                  const isInit = m.type_mouvement === 'Solde initial';
                  const isParking = m.type_mouvement === 'Encaissement parking';

                  return (
                    <tr key={m.id_mouvement} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {m.date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isInit
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : m.type_mouvement === 'Encaissement parking'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.type_mouvement === 'Ancienne recette'
                              ? 'bg-teal-100 text-teal-800'
                              : m.type_mouvement === 'Ancienne dépense'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isInit && <History className="w-3 h-3" />}
                          {m.type_mouvement}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{m.motif}</div>
                        {(m.categorie || m.observation) && (
                          <div className="text-[10px] text-slate-500">
                            {m.categorie && <span className="font-semibold text-slate-600 mr-1.5">{m.categorie}</span>}
                            {m.observation}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {m.reference || m.id_mouvement}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700 whitespace-nowrap">
                        {m.entree > 0 ? `+${formatAriary(m.entree)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-600 whitespace-nowrap">
                        {m.sortie > 0 ? `-${formatAriary(m.sortie)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap bg-slate-50/50">
                        {formatAriary(m.solde)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isInit ? (
                          <button
                            onClick={() => {
                              setSoldeInitInput(String(m.entree));
                              setIsSoldeInitModalOpen(true);
                            }}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Modifier le solde initial"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        ) : !isParking ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEdit(m)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Modifier cette écriture"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMouvement(m.id_mouvement)}
                              disabled={deletingId === m.id_mouvement}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Supprimer cette écriture"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Paiement ticket</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1 : SOLDE INITIAL (SAISIE FACILE ET VALIDATION INSTANTANÉE) */}
      {isSoldeInitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Solde Initial de Trésorerie</h3>
                  <p className="text-[11px] text-slate-300">Fonds de caisse au démarrage</p>
                </div>
              </div>
              <button
                onClick={() => setIsSoldeInitModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {initError && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{initError}</span>
              </div>
            )}

            <form noValidate onSubmit={handleSaveSoldeInitial} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Indiquez le montant total d'argent liquide disponible dans la caisse ou le compte <strong>avant toute utilisation du logiciel</strong>.
              </p>

              {/* Champ Montant Solde Initial */}
              <div>
                <label className="block font-black text-slate-900 text-xs mb-1">
                  Montant du Solde Initial (Ariary) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 100000"
                    value={soldeInitInput}
                    onChange={(e) => {
                      setSoldeInitInput(e.target.value);
                      setInitError(null);
                    }}
                    className="w-full px-4 py-3 font-mono text-xl font-black bg-amber-50/70 border-2 border-amber-300 focus:border-amber-500 focus:bg-white rounded-2xl text-slate-900 outline-hidden transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs text-amber-700">
                    Ariary
                  </span>
                </div>

                {/* Aperçu formaté */}
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Aperçu lisible :</span>
                  <span className="font-extrabold text-amber-900">
                    {formatAriary(Number(soldeInitInput.replace(/\s+/g, '')) || 0)}
                  </span>
                </div>

                {/* Boutons rapides */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[0, 50000, 100000, 200000, 500000, 1000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSoldeInitInput(String(preset));
                        setInitError(null);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-[11px] font-bold rounded-lg border border-slate-200 transition-colors"
                    >
                      {preset === 0 ? '0 Ar' : formatAriary(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date d'effet du Solde</label>
                <input
                  type="date"
                  value={soldeInitDate}
                  onChange={(e) => setSoldeInitDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              {/* Observation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Observation / Note (optionnelle)</label>
                <input
                  type="text"
                  value={soldeInitObs}
                  onChange={(e) => setSoldeInitObs(e.target.value)}
                  placeholder="Ex: Espèces comptées en coffre..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              {/* Actions Valider */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSoldeInitModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  id="btn-valider-solde-initial"
                  type="submit"
                  disabled={submittingInit}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-xl shadow-md transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {submittingInit ? 'Validation...' : `Valider Solde (${formatAriary(Number(soldeInitInput.replace(/\s+/g, '')) || 0)})`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 : NOUVEAU MOUVEMENT DE TRÉSORERIE (ENTRÉE OU DÉPENSE) */}
      {isMvtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header modal */}
            <div className={`text-white px-6 py-4 flex items-center justify-between ${
              isCurrentMvtEntree
                ? 'bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900'
                : 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isCurrentMvtEntree ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {isCurrentMvtEntree ? <ArrowDownLeft className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-base">
                    {isCurrentMvtEntree ? 'Ajouter une Entrée / Recette' : 'Enregistrer une Dépense / Sortie'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {isCurrentMvtEntree ? 'Augmente le solde de caisse' : 'Déduit du solde de caisse'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMvtModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mvtError && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{mvtError}</span>
              </div>
            )}

            <form noValidate onSubmit={handleAjouterMouvement} className="p-6 space-y-4 text-xs">
              {/* Choix du type */}
              <div>
                <label className="block font-black text-slate-900 mb-1.5">Nature de l'opération</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMvtType('Ancienne recette');
                      setMvtMotif('Ancienne recette parking');
                      setMvtCategorie('Ancienne recette');
                      setMvtError(null);
                    }}
                    className={`p-3 rounded-2xl text-xs font-bold border transition-all text-left flex items-center gap-2.5 ${
                      mvtType === 'Ancienne recette' || mvtType === 'Autre entrée'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-black">+ Entrée / Recette</div>
                      <div className="text-[10px] text-slate-500 font-normal">Ancienne recette, apport...</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMvtType('Dépense');
                      setMvtMotif('Dépense courante');
                      setMvtCategorie('Dépense de caisse');
                      setMvtError(null);
                    }}
                    className={`p-3 rounded-2xl text-xs font-bold border transition-all text-left flex items-center gap-2.5 ${
                      mvtType === 'Dépense' || mvtType === 'Ancienne dépense'
                        ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <div className="font-black">- Dépense / Sortie</div>
                      <div className="text-[10px] text-slate-500 font-normal">Fournitures, charges, carburant...</div>
                    </div>
                  </button>
                </div>

                {/* Sous-type précis */}
                <div className="flex gap-2 mt-2">
                  {isCurrentMvtEntree ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMvtType('Ancienne recette');
                          setMvtMotif('Ancienne recette parking');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                          mvtType === 'Ancienne recette'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Ancienne Recette
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMvtType('Autre entrée');
                          setMvtMotif('Apport en caisse');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                          mvtType === 'Autre entrée'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Autre Entrée (Apport)
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMvtType('Dépense');
                          setMvtMotif('Dépense courante');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                          mvtType === 'Dépense'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Dépense Courante
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMvtType('Ancienne dépense');
                          setMvtMotif('Ancienne charge / facture');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                          mvtType === 'Ancienne dépense'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Ancienne Dépense
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Montant & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-900 mb-1">
                    Montant (Ariary) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-tresorerie-montant"
                      type="text"
                      inputMode="numeric"
                      placeholder="Ex: 50000"
                      value={mvtMontant}
                      onChange={(e) => {
                        setMvtMontant(e.target.value);
                        setMvtError(null);
                      }}
                      className="w-full px-4 py-2.5 font-mono font-black text-lg bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 outline-hidden transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                      Ar
                    </span>
                  </div>

                  {/* Aperçu lisible */}
                  <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                    <span>Aperçu :</span>
                    <span className={`font-black ${isCurrentMvtEntree ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {isCurrentMvtEntree ? '+' : '-'}
                      {formatAriary(Number(mvtMontant.replace(/\s+/g, '')) || 0)}
                    </span>
                  </div>

                  {/* Presets rapides de montant */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[5000, 10000, 20000, 50000, 100000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setMvtMontant(String(preset));
                          setMvtError(null);
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 text-[10px] font-bold rounded-md border border-slate-200"
                      >
                        +{formatAriary(preset)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Date de l'opération</label>
                  <input
                    type="date"
                    value={mvtDate}
                    onChange={(e) => setMvtDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Motif avec suggestions rapides */}
              <div>
                <label className="block font-black text-slate-900 mb-1">
                  Motif / Description <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-tresorerie-motif"
                  type="text"
                  placeholder="Ex: Achat papier tickets, Carburant, Recette d'hier..."
                  value={mvtMotif}
                  onChange={(e) => {
                    setMvtMotif(e.target.value);
                    setMvtError(null);
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 font-semibold"
                />

                {/* Suggestions en un clic */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(isCurrentMvtEntree
                    ? [
                        'Ancienne recette parking',
                        'Apport en caisse gérant',
                        'Recette antérieure',
                        'Remboursement perçu',
                      ]
                    : [
                        'Achat papier tickets',
                        'Carburant générateur / véhicule',
                        'Facture Électricité / Eau',
                        'Fournitures & matériel',
                        'Entretien & nettoyage',
                        'Avance / salaire',
                      ]
                  ).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setMvtMotif(sug);
                        setMvtError(null);
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium rounded-md transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catégorie & Référence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                  <input
                    type="text"
                    placeholder="Ex: Charges, Fournitures, Salaire..."
                    value={mvtCategorie}
                    onChange={(e) => setMvtCategorie(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Référence Pièce</label>
                  <input
                    type="text"
                    placeholder="Ex: FACT-042, RECU-12..."
                    value={mvtReference}
                    onChange={(e) => setMvtReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Observation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Observation complémentaire</label>
                <input
                  type="text"
                  placeholder="Détails complémentaires éventuels..."
                  value={mvtObservation}
                  onChange={(e) => setMvtObservation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              {/* Bouton de validation explicite et réactif */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMvtModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  id="btn-valider-mouvement-tresorerie"
                  type="submit"
                  disabled={submittingMvt}
                  className={`flex items-center gap-2 px-6 py-2.5 text-white font-black rounded-xl shadow-md transition-all active:scale-95 ${
                    isCurrentMvtEntree
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {submittingMvt
                      ? 'Validation en cours...'
                      : isCurrentMvtEntree
                      ? `Valider l'Entrée (+${formatAriary(Number(mvtMontant.replace(/\s+/g, '')) || 0)})`
                      : `Valider la Dépense (-${formatAriary(Number(mvtMontant.replace(/\s+/g, '')) || 0)})`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3 : MODIFICATION D'UN MOUVEMENT */}
      {isEditModalOpen && editingMvt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Pencil className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Modifier l'Écriture</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form noValidate onSubmit={handleEditMouvement} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-900 mb-1">
                  Montant (Ariary) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editMontant}
                  onChange={(e) => setEditMontant(e.target.value)}
                  className="w-full px-4 py-2.5 font-mono font-black text-lg bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Motif <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={editMotif}
                  onChange={(e) => setEditMotif(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={editCategorie}
                    onChange={(e) => setEditCategorie(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observation</label>
                <input
                  type="text"
                  value={editObservation}
                  onChange={(e) => setEditObservation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submittingEdit ? 'Enregistrement...' : 'Mettre à jour'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

