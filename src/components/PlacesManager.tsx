import React, { useState } from 'react';
import {
  ParkingSquare,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Car,
  CheckCircle2,
  Layers,
  Wrench,
} from 'lucide-react';
import { Place, StatutPlace, STATUTS_PLACE, Stationnement } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface PlacesManagerProps {
  places: Place[];
  stationnementsPresents: Stationnement[];
  onCreatePlace: (p: Omit<Place, 'id_place'>) => Promise<Place>;
  onUpdatePlace: (id: string, updates: Partial<Place>) => Promise<Place>;
  onDeletePlace: (id: string) => Promise<boolean>;
  onOpenSortie: (st: Stationnement) => void;
}

export const PlacesManager: React.FC<PlacesManagerProps> = ({
  places,
  stationnementsPresents,
  onCreatePlace,
  onUpdatePlace,
  onDeletePlace,
  onOpenSortie,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  // Form fields
  const [numeroPlace, setNumeroPlace] = useState<string>('');
  const [statut, setStatut] = useState<StatutPlace>('Libre');
  const [typeZone, setTypeZone] = useState<string>('Standard');
  const [observation, setObservation] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete modal
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);

  const zones = Array.from(
    new Set(places.map((p) => p.type_zone || 'Standard').filter(Boolean))
  );

  const placesLibres = places.filter((p) => p.statut === 'Libre').length;
  const placesOccupees = places.filter((p) => p.statut === 'Occupée').length;
  const placesReservees = places.filter((p) => p.statut === 'Réservée').length;
  const placesHorsService = places.filter((p) => p.statut === 'Hors service').length;

  const filteredPlaces = places.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      p.numero_place.toLowerCase().includes(term) ||
      p.type_zone?.toLowerCase().includes(term) ||
      p.observation?.toLowerCase().includes(term);

    const matchStatut = filterStatut === 'all' || p.statut === filterStatut;
    const matchZone = filterZone === 'all' || (p.type_zone || 'Standard') === filterZone;

    return matchSearch && matchStatut && matchZone;
  });

  const openCreateModal = () => {
    setEditingPlace(null);
    setNumeroPlace(`P-${(places.length + 1).toString().padStart(2, '0')}`);
    setStatut('Libre');
    setTypeZone('Standard');
    setObservation('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Place) => {
    setEditingPlace(p);
    setNumeroPlace(p.numero_place);
    setStatut(p.statut);
    setTypeZone(p.type_zone || 'Standard');
    setObservation(p.observation || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroPlace.trim()) {
      setErrorMsg('Le numéro de la place est obligatoire.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      if (editingPlace) {
        await onUpdatePlace(editingPlace.id_place, {
          numero_place: numeroPlace.trim().toUpperCase(),
          statut,
          type_zone: typeZone.trim(),
          observation: observation.trim(),
        });
      } else {
        await onCreatePlace({
          numero_place: numeroPlace.trim().toUpperCase(),
          statut,
          type_zone: typeZone.trim(),
          observation: observation.trim(),
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde de la place');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!placeToDelete) return;
    try {
      await onDeletePlace(placeToDelete.id_place);
      setPlaceToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
      setPlaceToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
            <ParkingSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Plan & Gestion des Places</h1>
            <p className="text-xs text-slate-500">
              Visualisation en temps réel de l'occupation du parking ({places.length} places au total)
            </p>
          </div>
        </div>

        <button
          id="btn-nouvelle-place"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une Place</span>
        </button>
      </div>

      {/* Spot Status Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase block">Places Libres</span>
            <span className="text-2xl font-black text-emerald-900 mt-0.5 block">
              {placesLibres}
            </span>
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-200" />
        </div>

        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-800 uppercase block">Occupées</span>
            <span className="text-2xl font-black text-rose-900 mt-0.5 block">
              {placesOccupees}
            </span>
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-200" />
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase block">Réservées</span>
            <span className="text-2xl font-black text-amber-900 mt-0.5 block">
              {placesReservees}
            </span>
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-200" />
        </div>

        <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase block">Hors Service</span>
            <span className="text-2xl font-black text-slate-800 mt-0.5 block">
              {placesHorsService}
            </span>
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-slate-400 ring-4 ring-slate-200" />
        </div>
      </div>

      {/* Interactive Visual Parking Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              Grille Visuelle du Parking (Disposition Spatiale)
            </h2>
          </div>
          <span className="text-xs text-slate-400">Cliquez sur une place pour la gérer</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {places.map((place) => {
            const occupant = stationnementsPresents.find((s) => s.id_place === place.id_place);
            const isOccupee = place.statut === 'Occupée' || Boolean(occupant);

            return (
              <div
                key={place.id_place}
                id={`parking-spot-${place.id_place}`}
                onClick={() => {
                  if (occupant) {
                    onOpenSortie(occupant);
                  } else {
                    openEditModal(place);
                  }
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[110px] relative overflow-hidden ${
                  isOccupee
                    ? 'bg-rose-50/70 border-rose-300 hover:border-rose-500'
                    : place.statut === 'Réservée'
                    ? 'bg-amber-50/70 border-amber-300 hover:border-amber-500'
                    : place.statut === 'Hors service'
                    ? 'bg-slate-100 border-slate-300 opacity-60'
                    : 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-slate-900">
                    {place.numero_place}
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOccupee
                        ? 'bg-rose-500'
                        : place.statut === 'Réservée'
                        ? 'bg-amber-500'
                        : place.statut === 'Hors service'
                        ? 'bg-slate-400'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>

                <div className="my-1.5">
                  {occupant ? (
                    <div>
                      <span className="text-xs font-black text-slate-950 bg-white px-1.5 py-0.5 rounded border border-rose-200 block truncate">
                        {occupant.immatriculation}
                      </span>
                      <span className="text-[10px] text-slate-600 block mt-0.5 truncate">
                        {occupant.client_nom}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] font-semibold text-slate-500">
                      {place.type_zone || 'Standard'}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/60 pt-1">
                  <span>{place.statut}</span>
                  {occupant && <span className="text-rose-600 font-bold">Sortie &rarr;</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Places List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher place, zone..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="all">Tous statuts ({places.length})</option>
              {STATUTS_PLACE.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Numéro Place</th>
                <th className="px-5 py-3.5">Zone / Type</th>
                <th className="px-5 py-3.5">Statut Actuel</th>
                <th className="px-5 py-3.5">Véhicule Occupant</th>
                <th className="px-5 py-3.5">Observation</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlaces.map((place) => {
                const occupant = stationnementsPresents.find((s) => s.id_place === place.id_place);

                return (
                  <tr key={place.id_place} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {place.numero_place}
                    </td>

                    <td className="px-5 py-4 text-xs font-medium text-slate-700">
                      {place.type_zone || 'Standard'}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          place.statut === 'Libre'
                            ? 'bg-emerald-100 text-emerald-800'
                            : place.statut === 'Occupée'
                            ? 'bg-rose-100 text-rose-800'
                            : place.statut === 'Réservée'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {place.statut}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {occupant ? (
                        <div>
                          <span className="font-black text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                            {occupant.immatriculation}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {occupant.client_nom}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Aucun occupant</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {place.observation || '-'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`btn-edit-place-${place.id_place}`}
                          onClick={() => openEditModal(place)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-place-${place.id_place}`}
                          onClick={() => setPlaceToDelete(place)}
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

              {filteredPlaces.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    Aucune place trouvée avec ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingPlace ? 'Modifier la Place' : 'Ajouter une Nouvelle Place'}
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
                  Numéro de Place (Unique) *
                </label>
                <input
                  type="text"
                  required
                  value={numeroPlace}
                  onChange={(e) => setNumeroPlace(e.target.value.toUpperCase())}
                  placeholder="Ex: P-01, P-02, VIP-1..."
                  className="w-full px-3.5 py-2 uppercase font-bold text-slate-900 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statut de la Place *
                </label>
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as StatutPlace)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800"
                >
                  {STATUTS_PLACE.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zone / Type
                </label>
                <input
                  type="text"
                  value={typeZone}
                  onChange={(e) => setTypeZone(e.target.value)}
                  placeholder="Ex: Standard, Couvert, VIP, Gros gabarit..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observation
                </label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  rows={2}
                  placeholder="Notes sur l'emplacement..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
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
                  {loading ? 'Enregistrement...' : 'Enregistrer la Place'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(placeToDelete)}
        title="Supprimer cette place ?"
        message={`Êtes-vous certain de vouloir supprimer l'emplacement ${placeToDelete?.numero_place} ?`}
        confirmLabel="Supprimer définitivement"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setPlaceToDelete(null)}
      />
    </div>
  );
};
