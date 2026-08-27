import React, { useState } from 'react';
import {
  Car,
  Search,
  Plus,
  Edit2,
  Trash2,
  History,
  User,
  AlertCircle,
  X,
  Calendar,
  Wrench,
  CheckCircle,
} from 'lucide-react';
import {
  Vehicule,
  Client,
  Stationnement,
  CategorieVehicule,
  CATEGORIES_VEHICULES,
} from '../types';
import { formatAriary, formatDateFr } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface VehiculesManagerProps {
  vehicules: Vehicule[];
  clients: Client[];
  stationnements: Stationnement[];
  selectedClientIdFilter?: string;
  onCreateVehicule: (v: Omit<Vehicule, 'id_vehicule'>) => Promise<Vehicule>;
  onUpdateVehicule: (id: string, updates: Partial<Vehicule>) => Promise<Vehicule>;
  onDeleteVehicule: (id: string) => Promise<boolean>;
}

export const VehiculesManager: React.FC<VehiculesManagerProps> = ({
  vehicules,
  clients,
  stationnements,
  selectedClientIdFilter,
  onCreateVehicule,
  onUpdateVehicule,
  onDeleteVehicule,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategorie, setFilterCategorie] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>(selectedClientIdFilter || 'all');

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVehicule, setEditingVehicule] = useState<Vehicule | null>(null);

  // Vehicle History modal
  const [historyVehicule, setHistoryVehicule] = useState<Vehicule | null>(null);

  // Form fields
  const [immatriculation, setImmatriculation] = useState<string>('');
  const [marque, setMarque] = useState<string>('');
  const [modele, setModele] = useState<string>('');
  const [categorie, setCategorie] = useState<CategorieVehicule>('Véhicule léger');
  const [idClient, setIdClient] = useState<string>('');
  const [observation, setObservation] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete modal
  const [vehiculeToDelete, setVehiculeToDelete] = useState<Vehicule | null>(null);

  const filteredVehicules = vehicules.filter((v) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      v.immatriculation.toLowerCase().includes(term) ||
      v.marque.toLowerCase().includes(term) ||
      v.modele.toLowerCase().includes(term) ||
      v.client_nom?.toLowerCase().includes(term);

    const matchCat = filterCategorie === 'all' || v.categorie === filterCategorie;
    const matchCli = filterClient === 'all' || v.id_client === filterClient;

    return matchSearch && matchCat && matchCli;
  });

  const openCreateModal = () => {
    setEditingVehicule(null);
    setImmatriculation('');
    setMarque('');
    setModele('');
    setCategorie('Véhicule léger');
    setIdClient(clients[0]?.id_client || '');
    setObservation('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vehicule) => {
    setEditingVehicule(v);
    setImmatriculation(v.immatriculation);
    setMarque(v.marque);
    setModele(v.modele);
    setCategorie(v.categorie);
    setIdClient(v.id_client);
    setObservation(v.observation || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!immatriculation.trim()) {
      setErrorMsg("L'immatriculation est obligatoire.");
      return;
    }
    if (!marque.trim()) {
      setErrorMsg('La marque du véhicule est obligatoire.');
      return;
    }
    if (!idClient) {
      setErrorMsg('Le client propriétaire est obligatoire.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      if (editingVehicule) {
        await onUpdateVehicule(editingVehicule.id_vehicule, {
          immatriculation: immatriculation.trim().toUpperCase(),
          marque: marque.trim(),
          modele: modele.trim(),
          categorie,
          id_client: idClient,
          observation: observation.trim(),
        });
      } else {
        await onCreateVehicule({
          immatriculation: immatriculation.trim().toUpperCase(),
          marque: marque.trim(),
          modele: modele.trim(),
          categorie,
          id_client: idClient,
          observation: observation.trim(),
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde du véhicule');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!vehiculeToDelete) return;
    try {
      await onDeleteVehicule(vehiculeToDelete.id_vehicule);
      setVehiculeToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
      setVehiculeToDelete(null);
    }
  };

  const vehiculeHistory = historyVehicule
    ? stationnements.filter((s) => s.id_vehicule === historyVehicule.id_vehicule)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Gestion des Véhicules</h1>
            <p className="text-xs text-slate-500">
              {vehicules.length} véhicule{vehicules.length > 1 ? 's' : ''} enregistré
              {vehicules.length > 1 ? 's' : ''} avec immatriculations uniques
            </p>
          </div>
        </div>

        <button
          id="btn-nouveau-vehicule"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Véhicule</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-vehicules"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par immatriculation, marque, modèle, client..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Categorie Filter */}
          <select
            id="select-filter-categorie"
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="all">Toutes catégories</option>
            {CATEGORIES_VEHICULES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Client Filter */}
          <select
            id="select-filter-client"
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 max-w-[200px]"
          >
            <option value="all">Tous les clients ({clients.length})</option>
            {clients.map((c) => (
              <option key={c.id_client} value={c.id_client}>
                {c.nom} ({c.type_client})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Immatriculation</th>
                <th className="px-5 py-3.5">Marque & Modèle</th>
                <th className="px-5 py-3.5">Catégorie</th>
                <th className="px-5 py-3.5">Propriétaire</th>
                <th className="px-5 py-3.5">Historique</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicules.map((vehicule) => {
                const passages = stationnements.filter(
                  (s) => s.id_vehicule === vehicule.id_vehicule
                );
                const isCurrentlyPresent = passages.some((s) => s.statut === 'Présent');

                return (
                  <tr key={vehicule.id_vehicule} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 tracking-wider">
                          {vehicule.immatriculation}
                        </span>
                        {isCurrentlyPresent && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Présent
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900">
                        {vehicule.marque} {vehicule.modele}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md">
                        {vehicule.categorie}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{vehicule.client_nom}</div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {vehicule.client_type === 'Kospam' ? 'Garage Kospam' : 'Client Normal'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => setHistoryVehicule(vehicule)}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>
                          {passages.length} passage{passages.length > 1 ? 's' : ''}
                        </span>
                      </button>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`btn-edit-veh-${vehicule.id_vehicule}`}
                          onClick={() => openEditModal(vehicule)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-veh-${vehicule.id_vehicule}`}
                          onClick={() => setVehiculeToDelete(vehicule)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredVehicules.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    Aucun véhicule trouvé avec ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT VEHICLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingVehicule ? 'Modifier le Véhicule' : 'Ajouter un Nouveau Véhicule'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Immatriculation (Unique) *
                </label>
                <input
                  type="text"
                  id="input-form-immatriculation"
                  required
                  value={immatriculation}
                  onChange={(e) => setImmatriculation(e.target.value.toUpperCase())}
                  placeholder="Ex: 1234 TAB"
                  className="w-full px-3.5 py-2 uppercase font-bold text-slate-900 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marque *
                  </label>
                  <input
                    type="text"
                    required
                    value={marque}
                    onChange={(e) => setMarque(e.target.value)}
                    placeholder="Ex: Toyota"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Modèle</label>
                  <input
                    type="text"
                    value={modele}
                    onChange={(e) => setModele(e.target.value)}
                    placeholder="Ex: Corolla"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catégorie du Véhicule *
                </label>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value as CategorieVehicule)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800"
                >
                  {CATEGORIES_VEHICULES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Propriétaire *
                </label>
                <select
                  value={idClient}
                  onChange={(e) => setIdClient(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800"
                  required
                >
                  <option value="">-- Sélectionnez le client --</option>
                  {clients.map((c) => (
                    <option key={c.id_client} value={c.id_client}>
                      {c.nom} ({c.type_client})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observation
                </label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  rows={2}
                  placeholder="Notes spécifiques..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer le Véhicule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VEHICLE HISTORY MODAL */}
      {historyVehicule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Historique des Passages — {historyVehicule.immatriculation}
                </h3>
                <p className="text-xs text-slate-500">
                  {historyVehicule.marque} {historyVehicule.modele} ({historyVehicule.categorie}) —{' '}
                  {historyVehicule.client_nom}
                </p>
              </div>
              <button
                onClick={() => setHistoryVehicule(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto divide-y divide-slate-100 space-y-3">
              {vehiculeHistory.map((st) => (
                <div key={st.id_stationnement} className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">
                      Stationnement #{st.id_stationnement}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        st.statut === 'Présent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {st.statut}
                    </span>
                  </div>

                  <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Entrée</span>
                      <span className="font-medium">
                        {formatDateFr(st.date_entree)} {st.heure_entree}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sortie</span>
                      <span className="font-medium">
                        {st.date_sortie ? `${formatDateFr(st.date_sortie)} ${st.heure_sortie}` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Prestation</span>
                      <span className="font-medium">
                        {st.reparation ? '🔧 Réparation' : '🅿️ Stationnement'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Montant / Statut</span>
                      <span className="font-bold text-slate-900">
                        {formatAriary(st.montant_du)} ({st.statut_paiement})
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {vehiculeHistory.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8">
                  Aucun passage enregistré pour ce véhicule.
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryVehicule(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium text-xs rounded-lg hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(vehiculeToDelete)}
        title="Supprimer ce véhicule ?"
        message={`Êtes-vous certain de vouloir supprimer le véhicule ${vehiculeToDelete?.immatriculation} (${vehiculeToDelete?.marque} ${vehiculeToDelete?.modele}) ?`}
        confirmLabel="Supprimer définitivement"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setVehiculeToDelete(null)}
      />
    </div>
  );
};
