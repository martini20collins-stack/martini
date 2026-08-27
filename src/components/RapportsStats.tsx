import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Car,
  Users,
  Wrench,
  Printer,
  CreditCard,
  PieChart as PieIcon,
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
} from 'recharts';
import { RapportStats, ParametresApp } from '../types';
import { formatAriary, formatDateFr } from '../utils/formatters';

interface RapportsStatsProps {
  stats: RapportStats | null;
  parametres: ParametresApp;
  onFilterChange: (periode: string, dateDebut?: string, dateFin?: string) => void;
}

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const RapportsStats: React.FC<RapportsStatsProps> = ({
  stats,
  parametres,
  onFilterChange,
}) => {
  const [periode, setPeriode] = useState<string>('mois');
  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');

  const handlePeriodeChange = (newP: string) => {
    setPeriode(newP);
    if (newP !== 'personnalise') {
      onFilterChange(newP);
    }
  };

  const handleCustomFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dateDebut && dateFin) {
      onFilterChange('personnalise', dateDebut, dateFin);
    }
  };

  const printReport = () => {
    window.print();
  };

  const catData = Object.entries(stats?.par_categorie || {}).map(([key, val]) => ({
    name: key,
    value: val,
  }));

  const clientData = Object.entries(stats?.par_client || {}).map(([key, val]) => ({
    name: key,
    value: val,
  }));

  const modeData = Object.entries(stats?.par_mode_paiement || {}).map(([key, val]) => ({
    name: key,
    value: val,
  }));

  return (
    <div className="space-y-6">
      {/* Header with Period Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Rapports & Statistiques Financières</h1>
            <p className="text-xs text-slate-500">
              Analyse des flux opérationnels, rentabilité, catégories et ventilation des paiements
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['aujourdhui', 'semaine', 'mois', 'annee', 'personnalise'].map((p) => {
            const labels: Record<string, string> = {
              aujourdhui: "Aujourd'hui",
              semaine: 'Cette Semaine',
              mois: 'Ce Mois',
              annee: 'Cette Année',
              personnalise: 'Personnalisé',
            };

            return (
              <button
                key={p}
                id={`btn-period-${p}`}
                onClick={() => handlePeriodeChange(p)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  periode === p
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}

          <button
            onClick={printReport}
            className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Imprimer le rapport"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Custom Date Range Selector */}
      {periode === 'personnalise' && (
        <form
          onSubmit={handleCustomFilterSubmit}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
            <span>Date début :</span>
            <input
              type="date"
              required
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
            <span>Date fin :</span>
            <input
              type="date"
              required
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs"
          >
            Appliquer la période
          </button>
        </form>
      )}

      {/* Financial & Activity Summary Metrics (Section 16) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Total Entrées</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {stats.total_entrees}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Sorties : {stats.total_sorties}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-amber-700 font-medium block">Réparations</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {stats.nombre_reparations}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Atelier Kospam & autres</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Total Facturé (Dû)</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {formatAriary(stats.total_montant_du)}
            </span>
            <span className="text-[11px] text-rose-600 font-bold mt-0.5 block">
              Impayés : {formatAriary(stats.total_impayes)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs bg-emerald-50/40">
            <span className="text-xs text-emerald-700 font-bold block">Total Encaissé</span>
            <span className="text-xl font-black text-emerald-800 mt-1 block">
              {formatAriary(stats.total_montant_paye)}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Dépenses : {formatAriary(stats.total_depenses_portefeuille)}
            </span>
          </div>
        </div>
      )}

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catégories de véhicules */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Répartition par Catégorie de Véhicule
            </h3>
            <p className="text-xs text-slate-400 mb-4">Volume des véhicules enregistrés</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={catData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {catData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Types de clients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Répartition par Type de Client
            </h3>
            <p className="text-xs text-slate-400 mb-4">Clients Normaux vs Garage Kospam</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Nombre" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Modes de paiement */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Répartition par Mode de Paiement
            </h3>
            <p className="text-xs text-slate-400 mb-4">Montants encaissés par canal</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {modeData.map((entry, index) => (
                    <Cell
                      key={`mode-cell-${index}`}
                      fill={COLORS[(index + 2) % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatAriary(Number(value))} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recap Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-4">
          Synthèse Financière & Bilan d'Exploitation
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block">Facturation Totale</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">
              {formatAriary(stats?.total_montant_du || 0)}
            </span>
            <span className="text-[11px] text-slate-400">Totalité des prestations engagées</span>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-xs font-semibold text-emerald-700 block">
              Recouvrement Réel (Caisse)
            </span>
            <span className="text-xl font-bold text-emerald-800 mt-1 block">
              {formatAriary(stats?.total_montant_paye || 0)}
            </span>
            <span className="text-[11px] text-emerald-600">
              Taux de recouvrement :{' '}
              {(
                ((stats?.total_montant_paye || 0) /
                  Math.max(1, stats?.total_montant_du || 1)) *
                100
              ).toFixed(1)}
              %
            </span>
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <span className="text-xs font-semibold text-indigo-700 block">
              Solde Net du Portefeuille
            </span>
            <span className="text-xl font-bold text-indigo-900 mt-1 block">
              {formatAriary(stats?.solde_net || 0)}
            </span>
            <span className="text-[11px] text-indigo-600">
              Total Encaissé - Dépenses opérationnelles
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
