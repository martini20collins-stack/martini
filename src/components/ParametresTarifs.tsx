import React, { useState } from 'react';
import {
  Settings,
  DollarSign,
  Building,
  Printer,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { ParametresApp } from '../types';
import { formatAriary } from '../utils/formatters';

interface ParametresTarifsProps {
  parametres: ParametresApp;
  onSaveParametres: (params: ParametresApp) => Promise<ParametresApp>;
}

export const ParametresTarifs: React.FC<ParametresTarifsProps> = ({
  parametres,
  onSaveParametres,
}) => {
  const [formData, setFormData] = useState<ParametresApp>({ ...parametres });
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (field: keyof ParametresApp, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTarifChange = (field: keyof ParametresApp['tarifs'], value: number) => {
    setFormData((prev) => ({
      ...prev,
      tarifs: {
        ...prev.tarifs,
        [field]: Number(value),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      await onSaveParametres(formData);
      setSuccessMsg('Paramètres et grille tarifaire mis à jour avec succès !');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde des paramètres');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-3 bg-slate-100 text-slate-800 rounded-xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Paramètres & Grille Tarifaire</h1>
          <p className="text-xs text-slate-500">
            Personnalisation de l'établissement, des tickets de caisse et barèmes automatiques
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identité Établissement */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-sm">Identité du Parking & Contact</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom du Parking / Entreprise *
              </label>
              <input
                type="text"
                required
                value={formData.nom_parking}
                onChange={(e) => handleChange('nom_parking', e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Capacité totale du Parking (Places)
              </label>
              <input
                type="number"
                min="1"
                value={formData.capacite_totale}
                onChange={(e) => handleChange('capacite_totale', Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
              <input
                type="text"
                value={formData.telephone}
                onChange={(e) => handleChange('telephone', e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse</label>
              <input
                type="text"
                value={formData.adresse}
                onChange={(e) => handleChange('adresse', e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Grille Tarifaire Automatique */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-sm">Barèmes & Tarifs Applicables (Ariary)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Client Normal — Sans Réparation (Toutes catégories)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">Stationnement simple standard</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.tarifs.normal_sans_reparation}
                  onChange={(e) =>
                    handleTarifChange('normal_sans_reparation', Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                />
                <span className="text-xs font-bold text-slate-500">Ar</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Client Normal — Avec Réparation (Véhicule léger)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Voitures citadines et berlines avec intervention
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.tarifs.normal_avec_reparation_leger}
                  onChange={(e) =>
                    handleTarifChange('normal_avec_reparation_leger', Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                />
                <span className="text-xs font-bold text-slate-500">Ar</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Client Normal — Avec Réparation (Autre catégorie : 4x4, Bus, Camion...)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Gros gabarits et utilitaires avec intervention
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.tarifs.normal_avec_reparation_autre}
                  onChange={(e) =>
                    handleTarifChange('normal_avec_reparation_autre', Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                />
                <span className="text-xs font-bold text-slate-500">Ar</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200">
              <label className="block text-xs font-bold text-amber-950 mb-1">
                Garage Kospam — Sans Réparation (Toutes catégories)
              </label>
              <p className="text-[11px] text-amber-800 mb-2">Forfait Kospam sans réparation</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.tarifs.kospam_sans_reparation}
                  onChange={(e) =>
                    handleTarifChange('kospam_sans_reparation', Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900"
                />
                <span className="text-xs font-bold text-amber-900">Ar</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 sm:col-span-2">
              <label className="block text-xs font-bold text-amber-950 mb-1">
                Garage Kospam — Avec Réparation (Toutes catégories : Légers, 4x4, Camions...)
              </label>
              <p className="text-[11px] text-amber-800 mb-2">
                Règle absolue Kospam : forfait unique 5 000 Ar indépendamment de la taille du
                véhicule
              </p>
              <div className="flex items-center gap-2 max-w-xs">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.tarifs.kospam_avec_reparation}
                  onChange={(e) =>
                    handleTarifChange('kospam_avec_reparation', Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900"
                />
                <span className="text-xs font-bold text-amber-900">Ar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personnalisation Ticket Reçu */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-sm">Pied de Page du Ticket de Caisse</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Message imprimé en bas de ticket
            </label>
            <input
              type="text"
              value={formData.message_bas_ticket}
              onChange={(e) => handleChange('message_bas_ticket', e.target.value)}
              placeholder="Ex: Merci de votre visite - Gardez ce ticket pour la sortie"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Sauvegarde...' : 'Enregistrer les Modifications'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
