import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Car,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { Client, TypeClient, Vehicule } from '../types';
import { formatDateFr } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface ClientsManagerProps {
  clients: Client[];
  vehicules: Vehicule[];
  onCreateClient: (c: Omit<Client, 'id_client'>) => Promise<Client>;
  onUpdateClient: (id: string, updates: Partial<Client>) => Promise<Client>;
  onDeleteClient: (id: string) => Promise<boolean>;
  onNavigateToVehiculesOfClient: (clientId: string) => void;
}

export const ClientsManager: React.FC<ClientsManagerProps> = ({
  clients,
  vehicules,
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
  onNavigateToVehiculesOfClient,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form fields
  const [nom, setNom] = useState<string>('');
  const [typeClient, setTypeClient] = useState<TypeClient>('Normal');
  const [telephone, setTelephone] = useState<string>('');
  const [adresse, setAdresse] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [observation, setObservation] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete modal
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      c.nom.toLowerCase().includes(term) ||
      c.telephone.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.id_client.toLowerCase().includes(term);

    const matchType = filterType === 'all' || c.type_client === filterType;
    return matchSearch && matchType;
  });

  const openCreateModal = () => {
    setEditingClient(null);
    setNom('');
    setTypeClient('Normal');
    setTelephone('');
    setAdresse('');
    setEmail('');
    setObservation('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Client) => {
    setEditingClient(c);
    setNom(c.nom);
    setTypeClient(c.type_client);
    setTelephone(c.telephone || '');
    setAdresse(c.adresse || '');
    setEmail(c.email || '');
    setObservation(c.observation || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setErrorMsg('Le nom du client est obligatoire.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      if (editingClient) {
        await onUpdateClient(editingClient.id_client, {
          nom: nom.trim(),
          type_client: typeClient,
          telephone: telephone.trim(),
          adresse: adresse.trim(),
          email: email.trim(),
          observation: observation.trim(),
        });
      } else {
        await onCreateClient({
          nom: nom.trim(),
          type_client: typeClient,
          telephone: telephone.trim(),
          adresse: adresse.trim(),
          email: email.trim(),
          observation: observation.trim(),
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde du client');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await onDeleteClient(clientToDelete.id_client);
      setClientToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
      setClientToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Gestion des Clients</h1>
            <p className="text-xs text-slate-500">
              {clients.length} client{clients.length > 1 ? 's' : ''} enregistré
              {clients.length > 1 ? 's' : ''} (Particuliers & Garage Kospam)
            </p>
          </div>
        </div>

        <button
          id="btn-nouveau-client"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-clients"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, téléphone, email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-semibold">Type :</label>
          <select
            id="select-filter-client-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="all">Tous les types ({clients.length})</option>
            <option value="Normal">
              Clients Normaux ({clients.filter((c) => c.type_client === 'Normal').length})
            </option>
            <option value="Kospam">
              Garage Kospam ({clients.filter((c) => c.type_client === 'Kospam').length})
            </option>
          </select>
        </div>
      </div>

      {/* Clients Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">ID Client</th>
                <th className="px-5 py-3.5">Nom & Type</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Véhicules</th>
                <th className="px-5 py-3.5">Observation</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => {
                const clientVehs = vehicules.filter((v) => v.id_client === client.id_client);

                return (
                  <tr key={client.id_client} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500">
                      {client.id_client}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{client.nom}</div>
                      <span
                        className={`inline-block mt-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          client.type_client === 'Kospam'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {client.type_client === 'Kospam' ? 'Garage Kospam' : 'Client Normal'}
                      </span>
                    </td>

                    <td className="px-5 py-4 space-y-1 text-xs text-slate-600">
                      {client.telephone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.telephone}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      {client.adresse && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{client.adresse}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => onNavigateToVehiculesOfClient(client.id_client)}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>
                          {clientVehs.length} véhicule{clientVehs.length > 1 ? 's' : ''}
                        </span>
                      </button>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {client.observation || '-'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`btn-edit-client-${client.id_client}`}
                          onClick={() => openEditModal(client)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-client-${client.id_client}`}
                          onClick={() => setClientToDelete(client)}
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

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    Aucun client trouvé avec ces critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT CLIENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingClient ? 'Modifier le Client' : 'Ajouter un Nouveau Client'}
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
                  Nom complet / Raison Sociale *
                </label>
                <input
                  type="text"
                  id="input-form-client-nom"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Jean Rakoto ou Garage Kospam"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type de Client *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTypeClient('Normal')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      typeClient === 'Normal'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    Normal (Particulier / Entreprise)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeClient('Kospam')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      typeClient === 'Kospam'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    Garage Kospam (Partenaire)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+261 34..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domaine.mg"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Quartier / Ville"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
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
                  placeholder="Notes complémentaires..."
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
                  {loading ? 'Enregistrement...' : 'Enregistrer le Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(clientToDelete)}
        title="Supprimer ce client ?"
        message={`Êtes-vous certain de vouloir supprimer le client "${clientToDelete?.nom}" (${clientToDelete?.id_client}) ? Cette action est irréversible.`}
        confirmLabel="Supprimer définitivement"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setClientToDelete(null)}
      />
    </div>
  );
};
