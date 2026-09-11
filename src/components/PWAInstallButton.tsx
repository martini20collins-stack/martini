import React, { useState } from 'react';
import { Download, Monitor, CheckCircle2, HelpCircle, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold"
        title="Application installée et active en mode autonome"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Installée (PWA)</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all active:scale-95"
          title="Installer l'application sur Google Chrome ou sur votre appareil pour une utilisation sans connexion"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span>Installer via Chrome</span>
        </button>

        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-700/50"
          title="Comment installer sur Chrome ou mobile ?"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {installSuccess && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl animate-fade-in text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>Application installée avec succès ! Vous pouvez l'utiliser sans connexion.</span>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Installer l'Application Parking</h3>
                  <p className="text-xs text-slate-500">Fonctionne à 100% hors-ligne sans connexion</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              {isIOS ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
                    <Smartphone className="w-4 h-4" /> Installation sur iPhone / iPad (Safari) :
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
                    <li>
                      Appuyez sur le bouton <strong>Partager</strong> <span className="text-sm">⎋</span> en bas de Safari.
                    </li>
                    <li>
                      Faites défiler vers le bas et appuyez sur <strong>Sur l'écran d'accueil</strong>.
                    </li>
                    <li>
                      Appuyez sur <strong>Ajouter</strong> en haut à droite.
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <p className="font-bold text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                      <Download className="w-4 h-4" /> Dans Google Chrome sur Ordinateur :
                    </p>
                    <ul className="space-y-1 list-disc list-inside text-slate-700 dark:text-slate-300">
                      <li>
                        Cliquez sur l'icône <strong>Installer l'application</strong> située tout à droite dans la barre d'adresse de Chrome.
                      </li>
                      <li>
                        Ou cliquez sur les <strong>3 points verticaux ⋮</strong> (menu de Chrome en haut à droite) → <strong>Installer « Gestion de Parking Privé »</strong>.
                      </li>
                      <li>
                        Une icône apparaîtra sur votre Bureau et dans la barre des tâches pour lancer l'application en plein écran comme un logiciel natif.
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" /> Sur Mobile / Tablette Android (Chrome) :
                    </p>
                    <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-300">
                      <li>Ouvrez le menu <strong>⋮</strong> de Chrome en haut à droite.</li>
                      <li>Appuyez sur <strong>Installer l'application</strong> ou <strong>Ajouter à l'écran d'accueil</strong>.</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed">
                <span className="font-bold">✨ Utilisation 100% hors-ligne :</span> Une fois installée, vous pouvez couper votre connexion Wi-Fi ou vos données mobiles. L'application continuera d'enregistrer les entrées, les sorties, les paiements et le portefeuille localement en toute sécurité !
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    setShowGuide(false);
                    await install();
                  }}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Lancer l'installation directe
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
