import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Download,
  Upload,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  FileText,
  Database,
  ArrowDownCircle,
  HelpCircle,
} from 'lucide-react';
import { BackupItem, BackupExportData } from '../types';
import { api } from '../services/api';
import { formatAriary, formatDateTimeFr } from '../utils/formatters';

interface SauvegardeManagerProps {
  onDataRestored?: () => void;
}

export const SauvegardeManager: React.FC<SauvegardeManagerProps> = ({ onDataRestored }) => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual snapshot state
  const [newBackupLabel, setNewBackupLabel] = useState<string>('');
  const [isCreatingManual, setIsCreatingManual] = useState<boolean>(false);

  // Restore file inspection
  const [previewData, setPreviewData] = useState<BackupExportData | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Point-in-time restore confirmation
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupItem | null>(null);

  // Last auto backup info
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const list = await api.listBackups();
      setBackups(list);
      if (list.length > 0) {
        setLastBackupTime(list[0].date_formatted || list[0].timestamp);
      }
    } catch (e: any) {
      console.error('Erreur chargement sauvegardes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  // 1. Export / Téléchargement JSON
  const handleExportJson = async () => {
    try {
      setActionLoading(true);
      const exportData = await api.exportDatabase();
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `sauvegarde-parking-kospam-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerSuccess('Sauvegarde complète téléchargée avec succès sur votre ordinateur.');
    } catch (e: any) {
      triggerError(e.message || 'Erreur lors du téléchargement de la sauvegarde.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Création immédiate d'une sauvegarde manuelle
  const handleCreateManualBackup = async () => {
    try {
      setActionLoading(true);
      const label = newBackupLabel.trim() || 'Sauvegarde manuelle';
      const created = await api.createBackup(label);
      setNewBackupLabel('');
      setIsCreatingManual(false);
      await loadBackups();
      triggerSuccess(`Point de sauvegarde "${created.label}" créé avec succès.`);
    } catch (e: any) {
      triggerError(e.message || 'Erreur lors de la création de la sauvegarde.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Traitement du fichier JSON importé pour prévisualisation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewError(null);
    setPreviewData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation basique
        const targetData = parsed.data ? parsed.data : parsed;
        if (
          !Array.isArray(targetData.clients) ||
          !Array.isArray(targetData.vehicules) ||
          !Array.isArray(targetData.stationnements)
        ) {
          throw new Error(
            'Ce fichier ne correspond pas au format attendu (les collections clients, véhicules ou stationnements sont manquantes).'
          );
        }

        const counts = {
          clients: targetData.clients.length,
          vehicules: targetData.vehicules.length,
          places: targetData.places?.length || 0,
          stationnements: targetData.stationnements.length,
          paiements: targetData.paiements?.length || 0,
          mouvements: targetData.portefeuille?.length || 0,
          solde_disponible: targetData.portefeuille?.reduce(
            (acc: number, m: any) => acc + (Number(m.entree) || 0) - (Number(m.sortie) || 0),
            0
          ) || 0,
        };

        setPreviewData({
          version: parsed.version || '2.0',
          app: parsed.app || 'Parking Privé',
          exported_at: parsed.exported_at || new Date().toISOString(),
          counts,
          data: targetData,
        });
      } catch (err: any) {
        setPreviewError(err.message || 'Fichier JSON invalide ou corrompu.');
      }
    };
    reader.readAsText(file);
  };

  // 4. Exécution de la restauration depuis le fichier importé
  const handleConfirmRestoreFile = async () => {
    if (!previewData) return;
    try {
      setIsRestoring(true);
      const res = await api.restoreBackup(previewData);
      setPreviewData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadBackups();
      triggerSuccess(
        `Restauration terminée avec succès : ${res.counts.stationnements} stationnements et ${res.counts.mouvements} mouvements de trésorerie récupérés.`
      );
      if (onDataRestored) onDataRestored();
    } catch (e: any) {
      triggerError(e.message || 'Échec de la restauration des données.');
    } finally {
      setIsRestoring(false);
    }
  };

  // 5. Restauration d'un point historique
  const handleConfirmRestorePoint = async () => {
    if (!selectedBackupForRestore) return;
    try {
      setActionLoading(true);
      const res = await api.restoreBackupPoint(selectedBackupForRestore.id);
      setSelectedBackupForRestore(null);
      await loadBackups();
      triggerSuccess(
        `Données restaurées à l'état du ${selectedBackupForRestore.date_formatted} (${res.counts.mouvements} mouvements récupérés).`
      );
      if (onDataRestored) onDataRestored();
    } catch (e: any) {
      triggerError(e.message || 'Erreur lors de la restauration du point de sauvegarde.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertes Success / Error */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 shadow-xs animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* 1. Carte de Statut de Sauvegarde Automatique */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">
                  Sauvegarde Automatique des Données & Mouvements
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Permanente
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Toutes vos opérations (entrées, sorties, paiements, règlements d'acomptes, solde
                initial et mouvements de caisse) sont <strong>automatiquement sécurisées</strong> en
                temps réel et sauvegardées avec points de restauration horodatés.
              </p>
              {lastBackupTime && (
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Dernier point de sauvegarde automatique enregistré :{' '}
                  <span className="font-semibold text-slate-700">{lastBackupTime}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsCreatingManual(!isCreatingManual)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Créer une sauvegarde maintenant</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              disabled={actionLoading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 shadow-xs transition-colors flex items-center gap-2"
              title="Télécharger une copie de secours sur votre ordinateur"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Exporter (Télécharger)</span>
            </button>
          </div>
        </div>

        {/* Formulaire de création de sauvegarde manuelle instantanée */}
        {isCreatingManual && (
          <div className="mt-4 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={newBackupLabel}
              onChange={(e) => setNewBackupLabel(e.target.value)}
              placeholder="Libellé facultatif (ex: Fin de journée, Avant clôture caisse...)"
              className="w-full sm:flex-1 px-3.5 py-2 text-xs border border-indigo-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCreateManualBackup}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Confirmer</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingManual(false)}
                className="px-3 py-2 bg-white text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Cartes d'Actions : Exporter et Restaurer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Carte Exporter / Sauvegarder */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                <ArrowDownCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">1. Exporter les Données (Copie JSON)</h3>
                <p className="text-[11px] text-slate-500">
                  Générer un fichier de sauvegarde externe complet pour archivage ou transfert
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <p className="leading-relaxed">
                Ce fichier contient <strong>100% de votre activité</strong> :
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li>Tous les clients et véhicules enregistrés</li>
                <li>Tous les stationnements en cours et historiques</li>
                <li>L'ensemble des encaissements et tickets de caisse</li>
                <li>
                  <strong className="text-slate-700">Tous les mouvements de trésorerie</strong> (Solde initial, recettes, dépenses, solde disponible)
                </li>
                <li>Paramètres de l'entreprise et grille tarifaire</li>
              </ul>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleExportJson}
              disabled={actionLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Télécharger le Fichier de Sauvegarde</span>
            </button>
          </div>
        </div>

        {/* Carte Importer / Restaurer un fichier */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">2. Récupérer / Restaurer depuis un Fichier</h3>
                <p className="text-[11px] text-slate-500">
                  Restaurez vos données complètes à partir d'un fichier JSON préalablement sauvegardé
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="backup-file-upload"
                className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all text-center"
              >
                <Database className="w-7 h-7 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">
                  Cliquez ici pour sélectionner votre fichier de sauvegarde
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Format supporté : .json</span>
                <input
                  id="backup-file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {previewError && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{previewError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Aperçu avant confirmation de restauration */}
          {previewData && (
            <div className="mt-4 p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-200 animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  Sauvegarde détectée :
                </span>
                <span className="text-[10px] text-slate-500">
                  Exporté le : {formatDateTimeFr(previewData.exported_at)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-indigo-100">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Clients / Véhicules</span>
                  <span className="font-extrabold text-slate-800">
                    {previewData.counts.clients} / {previewData.counts.vehicules}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-indigo-100">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Stationnements</span>
                  <span className="font-extrabold text-indigo-600">
                    {previewData.counts.stationnements}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-indigo-100">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Mouvements Caisse</span>
                  <span className="font-extrabold text-emerald-600">
                    {previewData.counts.mouvements}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-indigo-100 text-slate-600">
                <span>Solde disponible récupéré :</span>
                <span className="font-bold text-slate-900">
                  {formatAriary(previewData.counts.solde_disponible)}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmRestoreFile}
                  disabled={isRestoring}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {isRestoring ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span>Confirmer la Restauration Totale</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewData(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-3 py-2 bg-white text-slate-600 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Historique des Sauvegardes Automatiques & Points de Restauration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Historique des Points de Restauration Automatiques
              </h3>
              <p className="text-[11px] text-slate-500">
                Chaque point conserve l'historique exact des stationnements, paiements et mouvements de caisse
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadBackups}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser la liste</span>
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Chargement des points de sauvegarde...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Aucun point de sauvegarde historique trouvé pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Date & Heure</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Libellé</th>
                  <th className="py-3 px-3 text-center">Stationnements</th>
                  <th className="py-3 px-3 text-center">Mouvements Trésorerie</th>
                  <th className="py-3 px-3 text-right">Solde Caisse</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {b.date_formatted}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {b.type === 'automatique' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Automatique
                        </span>
                      ) : b.type === 'pre_restauration' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Sécurité
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Manuel
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-[200px] truncate" title={b.label}>
                      {b.label}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {b.counts.stationnements}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-indigo-600">
                      {b.counts.mouvements}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                      {formatAriary(b.counts.solde_disponible)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedBackupForRestore(b)}
                        disabled={actionLoading}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg font-bold text-[11px] border border-slate-200 transition-colors inline-flex items-center gap-1"
                        title="Restaurer les données à ce moment précis"
                      >
                        <RotateCcw className="w-3 h-3 text-indigo-600" />
                        <span>Restaurer</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmation de restauration d'un point historique */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirmer la récupération des données
                </h3>
                <p className="text-xs text-slate-500">Restauration à un point antérieur</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
              <p>
                Vous êtes sur le point de restaurer l'intégralité de vos données à l'état du :
              </p>
              <p className="font-bold text-slate-900 text-sm">
                {selectedBackupForRestore.date_formatted}
              </p>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                <span>Stationnements : <strong className="text-slate-800">{selectedBackupForRestore.counts.stationnements}</strong></span>
                <span>Mouvements : <strong className="text-indigo-600">{selectedBackupForRestore.counts.mouvements}</strong></span>
                <span>Solde : <strong className="text-slate-900">{formatAriary(selectedBackupForRestore.counts.solde_disponible)}</strong></span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Une sauvegarde de sécurité de l'état actuel sera automatiquement créée avant la
              restauration pour que vous puissiez revenir en arrière à tout instant.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmRestorePoint}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>Confirmer la Restauration</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedBackupForRestore(null)}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
