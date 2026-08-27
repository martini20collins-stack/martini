import React from 'react';
import {
  Car,
  ParkingSquare,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Wallet,
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Users,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import { DashboardStats, ParametresApp } from '../types';
import { formatAriary, formatDateFr } from '../utils/formatters';

interface TableauDeBordProps {
  stats: DashboardStats | null;
  parametres: ParametresApp;
  onNavigate: (view: string) => void;
  onRefresh: () => void;
}

const COLORS_PIE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const COLORS_MODES = ['#10b981', '#3b82f6', '#6366f1', '#f97316'];

export const TableauDeBord: React.FC<TableauDeBordProps> = ({
  stats,
  parametres,
  onNavigate,
  onRefresh,
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
        <span>Chargement des statistiques réelles du parking...</span>
      </div>
    );
  }

  const tauxOccupation =
    parametres.nombre_total_places > 0
      ? Math.min(100, Math.round((stats.places_occupees / parametres.nombre_total_places) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Tableau de Bord</span>
            <span className="text-xs font-normal bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Temps Réel
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Supervision opérationnelle et financière du parking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-dash-entree"
            onClick={() => onNavigate('entree')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Nouvelle Entrée</span>
          </button>

          <button
            id="btn-dash-sortie"
            onClick={() => onNavigate('sortie')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Sortie Véhicule</span>
          </button>
        </div>
      </div>

      {/* Grid of Statistical KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
        {/* Véhicules présents */}
        <div
          onClick={() => onNavigate('presents')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Présents</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{stats.vehicules_presents}</span>
            <span className="text-xs text-slate-500">véhicules</span>
          </div>
          <span className="text-[11px] text-blue-600 font-medium hover:underline mt-1 block">
            Voir la liste →
          </span>
        </div>

        {/* Places Occupées / Libres */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Occupation</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <ParkingSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold text-slate-900">{stats.places_occupees}</span>
              <span className="text-xs text-slate-400">/{parametres.nombre_total_places}</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {stats.places_libres} libres
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${tauxOccupation}%` }}
            />
          </div>
        </div>

        {/* Mouvements Jour */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Flux Aujourd'hui</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-center">
            <div className="bg-emerald-50/70 p-1.5 rounded-lg">
              <span className="text-[10px] text-emerald-700 block font-semibold">Entrées</span>
              <span className="text-base font-extrabold text-emerald-800">
                +{stats.entrees_jour}
              </span>
            </div>
            <div className="bg-indigo-50/70 p-1.5 rounded-lg">
              <span className="text-[10px] text-indigo-700 block font-semibold">Sorties</span>
              <span className="text-base font-extrabold text-indigo-800">
                -{stats.sorties_jour}
              </span>
            </div>
          </div>
        </div>

        {/* Recettes Jour */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Recettes Jour</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-emerald-700 block">
              {formatAriary(stats.recettes_jour)}
            </span>
            <span className="text-[11px] text-slate-500">Encaissements du jour</span>
          </div>
        </div>

        {/* Recettes Mois */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Recettes Mois</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-indigo-700 block">
              {formatAriary(stats.recettes_mois)}
            </span>
            <span className="text-[11px] text-slate-500">Mois en cours</span>
          </div>
        </div>

        {/* Solde Portefeuille */}
        <div
          onClick={() => onNavigate('portefeuille')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Solde Portefeuille</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-slate-900 block">
              {formatAriary(stats.solde_portefeuille)}
            </span>
            <span className="text-[11px] text-amber-700 font-medium hover:underline">
              Voir trésorerie →
            </span>
          </div>
        </div>
      </div>

      {/* Financial Health & Impayés Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Non payés */}
        <div
          onClick={() => onNavigate('impayes')}
          className="bg-rose-50/50 border border-rose-200 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-rose-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">
                Total Non Payé
              </span>
              <span className="text-xl font-black text-rose-900">
                {stats.total_non_paye} stationnements
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-rose-700 underline">Gérer →</span>
        </div>

        {/* Partiellement payés */}
        <div
          onClick={() => onNavigate('impayes')}
          className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-amber-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
                Partiellement Payé
              </span>
              <span className="text-xl font-black text-amber-900">
                {stats.total_partiellement_paye} stationnements
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-700 underline">Gérer →</span>
        </div>

        {/* Total à encaisser (Créances) */}
        <div
          onClick={() => onNavigate('impayes')}
          className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-xs cursor-pointer hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 text-amber-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wider block">
                Total restant à encaisser
              </span>
              <span className="text-xl font-black text-amber-400">
                {formatAriary(stats.total_a_encaisser)}
              </span>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-300">Détails →</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recettes par jour */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Recettes par jour (7 derniers jours)</span>
            </h3>
            <span className="text-xs text-slate-400">Ariary</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.recettes_par_jour}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => formatDateFr(val).slice(0, 5)}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [formatAriary(val), 'Recette']}
                  labelFormatter={(label) => formatDateFr(String(label))}
                />
                <Bar dataKey="montant" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Véhicules par catégorie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Car className="w-4 h-4 text-indigo-600" />
              <span>Fréquentation par Catégorie</span>
            </h3>
            <span className="text-xs text-slate-400">Total passages</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.vehicules_par_categorie}
                  dataKey="count"
                  nameKey="categorie"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {stats.vehicules_par_categorie.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS_PIE[index % COLORS_PIE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val} véhicules`, 'Passages']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition Modes de Paiement */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>Répartition des Modes de Paiement</span>
            </h3>
            <span className="text-xs text-slate-400">Montants encaissés</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.repartition_modes_paiement}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="mode" type="category" tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip formatter={(val: any) => [formatAriary(val), 'Montant']} />
                <Bar dataKey="montant" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Clients les plus fréquents */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Clients les Plus Fréquents</span>
              </h3>
              <span className="text-xs text-slate-400">Fréquentation</span>
            </div>

            <div className="space-y-3">
              {stats.clients_frequents.map((client, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{client.nom}</span>
                      <span className="text-xs text-slate-500">
                        Type :{' '}
                        <span className="font-medium text-indigo-600">{client.type}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block">
                      {client.passages} passages
                    </span>
                    <span className="text-xs text-emerald-600 font-medium">
                      {formatAriary(client.montant)}
                    </span>
                  </div>
                </div>
              ))}
              {stats.clients_frequents.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-6">
                  Aucun historique client disponible
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onNavigate('clients')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Gérer tous les clients →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
