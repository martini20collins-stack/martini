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
  DollarSign,
  History,
  CheckCircle2,
  FileText,
  Clock,
  RefreshCw,
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
  const [soldeInitInput, setSoldeInitInput] = useState<number>(0);
  const [soldeInitDate, setSoldeInitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [soldeInitObs, setSoldeInitObs] = useState<string>('');
  const [submittingInit, setSubmittingInit] = useState<boolean>(false);

  // Modal Nouveau Mouvement (Anciennes recettes/dépenses, dépenses courantes)
  const [isMvtModalOpen, setIsMvtModalOpen] = useState<boolean>(false);
  const [mvtType, setMvtType] = useState<TypeMouvement>('Ancienne recette');
  const [mvtMontant, setMvtMontant] = useState<number>(0);
  const [mvtDate, setMvtDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mvtMotif, setMvtMotif] = useState<string>('');
  const [mvtCategorie, setMvtCategorie] = useState<string>('');
  const [mvtObservation, setMvtObservation] = useState<string>('');
  const [mvtReference, setMvtReference] = useState<string>('');
  const [submittingMvt, setSubmittingMvt] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const res = await api.getTresorerieResume();
      setResume(res);
      setSoldeInitInput(res.solde_initial || 0);
    } catch (e) {
      console.error('Erreur chargement trésorerie:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResume();
  }, []);

  const handleSaveSoldeInitial = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      setSubmittingInit(true);
      await api.setSoldeInitial({
        montant: Number(soldeInitInput) || 0,
        date: soldeInitDate,
        observation: soldeInitObs.trim() || 'Solde initial disponible au lancement de l’application',
      });
      setIsSoldeInitModalOpen(false);
      await fetchResume();
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l’enregistrement du solde initial.');
    } finally {
      setSubmittingInit(false);
    }
  };

  const handleAjouterMouvement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const val = Number(mvtMontant);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Veuillez saisir un montant positif strictement supérieur à 0.');
      return;
    }
    if (!mvtMotif.trim()) {
      setErrorMsg('Veuillez indiquer le motif du mouvement.');
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
      setMvtMontant(0);
      setMvtMotif('');
      setMvtObservation('');
      setMvtReference('');
      await fetchResume();
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement du mouvement.");
    } finally {
      setSubmittingMvt(false);
    }
  };

  const openAddMvt = (type: TypeMouvement) => {
    setMvtType(type);
    setMvtMontant(0);
    setMvtMotif('');
    setMvtReference(`REF-${Date.now().toString().slice(-4)}`);
    setMvtObservation('');
    setMvtCategorie(
      type === 'Ancienne recette'
        ? 'Ancienne recette parking'
        : type === 'Ancienne dépense'
        ? 'Ancienne charge'
        : type === 'Dépense'
        ? 'Dépense courante'
        : 'Recette'
    );
    setErrorMsg(null);
    setIsMvtModalOpen(true);
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

  return (
    <div className="space-y-6">
      {/* 1. CARTE MAÎTRESSE : SYNTHÈSE DE TRÉSORERIE */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Module Trésorerie & Fonds Disponibles</span>
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

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setSoldeInitInput(resume?.solde_initial || 0);
                setIsSoldeInitModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors shadow-xs"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>Saisir / Modifier Solde Initial</span>
            </button>

            <button
              onClick={() => openAddMvt('Ancienne recette')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Ancienne Recette</span>
            </button>

            <button
              onClick={() => openAddMvt('Ancienne dépense')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>- Ancienne Dépense</span>
            </button>

            <button
              onClick={() => openAddMvt('Dépense')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors shadow-xs"
            >
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>- Dépense Courante</span>
            </button>
          </div>
        </div>

        {/* 2. DÉTAILS DU SOLDE ET RUBRIQUES CLÉS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          {/* Solde Initial */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
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
              Argent disponible avant l’app
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
              Paiements tickets & abonnés
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
              Recettes antérieures ajoutées
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
              Anciennes: {formatAriary(resume?.anciennes_depenses || 0)} • Courantes: {formatAriary(resume?.depenses_courantes || 0)}
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
                {filteredMouvements.length} mouvements
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
              title="Rafraîchir"
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
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Type de Mouvement</th>
                <th className="py-3 px-4">Motif & Catégorie</th>
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4 text-right text-emerald-700">Entrée (+)</th>
                <th className="py-3 px-4 text-right text-rose-600">Sortie (-)</th>
                <th className="py-3 px-4 text-right text-slate-900 font-extrabold">Solde Progressif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredMouvements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Wallet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <span>Aucun mouvement de trésorerie trouvé.</span>
                  </td>
                </tr>
              ) : (
                filteredMouvements.map((m) => {
                  const isEntree = Number(m.entree || 0) > 0;
                  const isInit = m.type_mouvement === 'Solde initial';
                  const isAncien = m.type_mouvement === 'Ancienne recette' || m.type_mouvement === 'Ancienne dépense';

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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1 : SOLDE INITIAL */}
      {isSoldeInitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Solde Initial de Trésorerie</h3>
              </div>
              <button
                onClick={() => setIsSoldeInitModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSoldeInitial} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Saisissez ici le montant d'argent liquide ou disponible dans votre caisse <strong>avant l’utilisation de cette application</strong>.
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Montant du Solde Initial (Ariary) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={soldeInitInput}
                  onChange={(e) => setSoldeInitInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 font-mono text-lg font-black bg-amber-50/60 border border-amber-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date du Solde</label>
                <input
                  type="date"
                  value={soldeInitDate}
                  onChange={(e) => setSoldeInitDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observation / Note</label>
                <textarea
                  rows={2}
                  value={soldeInitObs}
                  onChange={(e) => setSoldeInitObs(e.target.value)}
                  placeholder="Ex: Espèces en caisse comptées au démarrage..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSoldeInitModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingInit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submittingInit ? 'Enregistrement...' : 'Valider Solde Initial'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 : AJOUT MOUVEMENT (ANCIENNE RECETTE / ANCIENNE DÉPENSE / DÉPENSE COURANTE) */}
      {isMvtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Ajouter une Opération de Trésorerie</h3>
              </div>
              <button
                onClick={() => setIsMvtModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAjouterMouvement} className="p-6 space-y-4 text-xs">
              {/* Type selector */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Type d'Opération</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Ancienne recette', label: '+ Ancienne Recette', color: 'emerald' },
                    { id: 'Ancienne dépense', label: '- Ancienne Dépense', color: 'purple' },
                    { id: 'Dépense', label: '- Dépense Courante', color: 'rose' },
                    { id: 'Autre entrée', label: '+ Autre Entrée', color: 'teal' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMvtType(item.id as TypeMouvement)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        mvtType === item.id
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Montant & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Montant (Ariary) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="500"
                    placeholder="Ex: 50000"
                    value={mvtMontant || ''}
                    onChange={(e) => setMvtMontant(Number(e.target.value))}
                    className="w-full px-3.5 py-2 font-mono font-black text-base bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={mvtDate}
                    onChange={(e) => setMvtDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              {/* Motif */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Motif / Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ancienne recette parking d'hier, Achat ampoules, Facture électricité..."
                  value={mvtMotif}
                  onChange={(e) => setMvtMotif(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              {/* Catégorie & Référence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catégorie</label>
                  <input
                    type="text"
                    placeholder="Ex: Charges, Recette parking, Salaire..."
                    value={mvtCategorie}
                    onChange={(e) => setMvtCategorie(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Référence Pièce</label>
                  <input
                    type="text"
                    placeholder="Ex: FACT-042, RECU-12..."
                    value={mvtReference}
                    onChange={(e) => setMvtReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              {/* Observation */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observation</label>
                <input
                  type="text"
                  placeholder="Note complémentaire éventuelle..."
                  value={mvtObservation}
                  onChange={(e) => setMvtObservation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMvtModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingMvt}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submittingMvt ? 'Enregistrement...' : 'Ajouter à la Trésorerie'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
