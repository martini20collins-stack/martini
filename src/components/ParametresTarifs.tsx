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
  Plus,
  Minus,
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

  const [capaciteInput, setCapaciteInput] = useState<string>(
    String(parametres.capacite_totale || parametres.nombre_total_places || 30)
  );

  const handleChange = (field: keyof ParametresApp, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCapaciteChange = (valStr: string) => {
    setCapaciteInput(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setFormData((prev) => ({
        ...prev,
        capacite_totale: parsed,
        nombre_total_places: parsed,
      }));
    }
  };

  const handleAdjustCapacite = (delta: number) => {
    const current = parseInt(capaciteInput, 10) || formData.capacite_totale || 30;
    const nextVal = Math.max(1, current + delta);
    setCapaciteInput(String(nextVal));
    setFormData((prev) => ({
      ...prev,
      capacite_totale: nextVal,
      nombre_total_places: nextVal,
    }));
  };

  const handleSetExactCapacite = (exact: number) => {
    setCapaciteInput(String(exact));
    setFormData((prev) => ({
      ...prev,
      capacite_totale: exact,
      nombre_total_places: exact,
    }));
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

      const finalCap = Math.max(1, parseInt(capaciteInput, 10) || formData.capacite_totale || 30);
      const payload: ParametresApp = {
        ...formData,
        capacite_totale: finalCap,
        nombre_total_places: finalCap,
      };

      await onSaveParametres(payload);
      setCapaciteInput(String(finalCap));
      setSuccessMsg(`Paramètres mis à jour avec succès ! Capacité configurée à ${finalCap} places.`);
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
                Capacité totale du Parking (Nombre de places au choix)
              </label>
              <div className="flex items-center gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => handleAdjustCapacite(-5)}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                  title="Diminuer de 5 places"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustCapacite(-1)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  title="Diminuer de 1 place"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={capaciteInput}
                  onChange={(e) => handleCapaciteChange(e.target.value)}
                  placeholder="Ex: 50"
                  className="w-full text-center px-3 py-2 border-2 border-indigo-200 focus:border-indigo-600 rounded-lg text-base font-extrabold text-slate-900 bg-indigo-50/20"
                />
                <button
                  type="button"
                  onClick={() => handleAdjustCapacite(1)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  title="Augmenter de 1 place"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustCapacite(5)}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                  title="Augmenter de 5 places"
                >
                  +5
                </button>
              </div>

              {/* Raccourcis de capacité */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Raccourcis :</span>
                {[10, 20, 30, 50, 75, 100, 150, 200].map((nb) => (
                  <button
                    key={nb}
                    type="button"
                    onClick={() => handleSetExactCapacite(nb)}
                    className={`px-2 py-0.5 text-xs font-bold rounded-md transition-all ${
                      parseInt(capaciteInput, 10) === nb
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {nb}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Vous pouvez saisir n'importe quel chiffre au choix ou utiliser les raccourcis.
              </p>
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
