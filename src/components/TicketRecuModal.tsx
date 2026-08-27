import React from 'react';
import { X, Printer, CheckCircle, Car, ShieldCheck } from 'lucide-react';
import { Stationnement, ParametresApp } from '../types';
import { formatAriary, formatDateFr } from '../utils/formatters';

interface TicketRecuModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationnement: Stationnement | null;
  modePaiement?: string;
  parametres: ParametresApp;
}

export const TicketRecuModal: React.FC<TicketRecuModalProps> = ({
  isOpen,
  onClose,
  stationnement,
  modePaiement = 'Espèces',
  parametres,
}) => {
  if (!isOpen || !stationnement) return null;

  const handlePrint = () => {
    window.print();
  };

  const isKospam = stationnement.client_type === 'Kospam';
  const now = new Date();
  const dateEmission = formatDateFr(stationnement.date_entree);
  const heureEmission = stationnement.heure_entree;

  return (
    <div
      id="ticket-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Printer className="w-5 h-5 text-indigo-600" />
            <span>Reçu / Ticket de Stationnement</span>
          </div>
          <button
            id="btn-close-ticket"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Receipt Area */}
        <div
          id="printable-ticket"
          className="p-6 bg-white text-slate-800 text-sm font-mono print:p-0 print:m-0"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Car className="w-6 h-6 text-slate-900" />
              <h2 className="font-extrabold text-lg tracking-wider text-slate-900 uppercase">
                {parametres.nom_parking}
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-sans">{parametres.adresse_parking}</p>
            <p className="text-xs text-slate-600 font-sans">Tél : {parametres.telephone_parking}</p>
            <div className="mt-2 inline-block bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-slate-300">
              TICKET N° {stationnement.id_stationnement}
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-2 text-xs border-b-2 border-dashed border-slate-300 pb-4 mb-4">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 font-sans">Date & Heure Entrée:</span>
              <span className="font-semibold text-slate-900">
                {dateEmission} à {heureEmission}
              </span>
            </div>
            {stationnement.date_sortie && (
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500 font-sans">Date & Heure Sortie:</span>
                <span className="font-semibold text-slate-900">
                  {formatDateFr(stationnement.date_sortie)} à {stationnement.heure_sortie}
                </span>
              </div>
            )}
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 font-sans">Place assignée:</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {stationnement.numero_place || 'Non assignée'}
              </span>
            </div>

            <div className="my-2 border-t border-slate-200" />

            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 font-sans">Client:</span>
              <span className="font-bold text-slate-900">
                {stationnement.client_nom} {isKospam && '(Kospam)'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 font-sans">Immatriculation:</span>
              <span className="font-black text-slate-950 text-sm tracking-wide bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {stationnement.immatriculation}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 font-sans">Véhicule:</span>
              <span className="font-semibold text-slate-800">
                {stationnement.marque} {stationnement.modele}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 font-sans">Catégorie:</span>
              <span className="font-semibold text-slate-800">{stationnement.categorie}</span>
            </div>
            <div className="flex justify-between py-0.5 items-center">
              <span className="text-slate-500 font-sans">Prestation Réparation:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${
                  stationnement.reparation
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {stationnement.reparation ? 'OUI (Effectuée)' : 'NON (Stationnement seul)'}
              </span>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-1.5 text-xs border-b-2 border-dashed border-slate-300 pb-4 mb-4">
            <div className="flex justify-between text-sm">
              <span className="font-sans font-medium text-slate-600">Montant total dû:</span>
              <span className="font-black text-slate-950 text-base">
                {formatAriary(stationnement.montant_du)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span className="font-sans">Montant déjà payé:</span>
              <span>{formatAriary(stationnement.montant_paye)}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-bold text-sm">
              <span className="font-sans">Reste à payer:</span>
              <span>{formatAriary(stationnement.reste_a_payer)}</span>
            </div>
            <div className="flex justify-between pt-1 text-slate-600">
              <span className="font-sans">Mode de règlement:</span>
              <span className="font-medium text-slate-800">{modePaiement}</span>
            </div>
            <div className="flex justify-between pt-0.5 text-slate-600">
              <span className="font-sans">Statut règlement:</span>
              <span
                className={`font-bold uppercase text-[11px] ${
                  stationnement.statut_paiement === 'Payé'
                    ? 'text-emerald-600'
                    : stationnement.statut_paiement === 'Partiellement payé'
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {stationnement.statut_paiement || 'Non payé'}
              </span>
            </div>
          </div>

          {/* Barcode & Footer */}
          <div className="text-center space-y-2">
            <div className="flex justify-center items-center gap-1 font-mono tracking-widest text-xs text-slate-500">
              ||| | ||||| || |||||| | |||| ||| |||||||
            </div>
            <p className="text-[10px] text-slate-500 font-sans">
              Merci de votre visite et bonne route !
            </p>
            <p className="text-[9px] text-slate-400 font-sans">
              Conservez ce ticket pour toute réclamation ou sortie.
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 print:hidden">
          <button
            id="btn-close-ticket-secondary"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Fermer
          </button>
          <button
            id="btn-print-ticket"
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer le Reçu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
