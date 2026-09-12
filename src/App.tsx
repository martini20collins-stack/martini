import React, { useEffect, useState, useCallback } from 'react';
import {
  Car,
  PlusCircle,
  ParkingSquare,
  CreditCard,
  AlertCircle,
  Wallet,
  Wrench,
  Settings,
  Menu,
  X,
  RefreshCw,
  Printer,
  Sparkles,
  History,
} from 'lucide-react';
import {
  DashboardStats,
  Client,
  Vehicule,
  Place,
  Stationnement,
  Paiement,
  MouvementPortefeuille,
  ParametresApp,
  KospamStats,
  ModePaiement,
  TypeMouvement,
} from './types';
import { api } from './services/api';
import { formatAriary } from './utils/formatters';

// Simplified & Primary Components
import { GuichetParking } from './components/GuichetParking';
import { TresorerieManager } from './components/TresorerieManager';
import { PaiementsManager } from './components/PaiementsManager';
import { GarageKospam } from './components/GarageKospam';
import { ParametresTarifs } from './components/ParametresTarifs';

// Modals
import { EntreeRapideModal } from './components/EntreeRapideModal';
import { AncienVehiculeModal } from './components/AncienVehiculeModal';
import { PaiementModal } from './components/PaiementModal';
import { TicketRecuModal } from './components/TicketRecuModal';

// PWA & Offline
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator, OfflineBanner } from './components/OfflineIndicator';

type MainSection = 'guichet' | 'tresorerie' | 'caisse' | 'kospam' | 'parametres';

export function App() {
  const [activeSection, setActiveSection] = useState<MainSection>('guichet');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // State data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [stationnements, setStationnements] = useState<Stationnement[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [portefeuille, setPortefeuille] = useState<{
    mouvements: MouvementPortefeuille[];
    solde: number;
    total_encaisse: number;
    total_depense: number;
  }>({ mouvements: [], solde: 0, total_encaisse: 0, total_depense: 0 });
  const [kospamStats, setKospamStats] = useState<KospamStats | null>(null);
  const [parametres, setParametres] = useState<ParametresApp>({
    nom_parking: 'Gestion de Parking Privé',
    capacite_totale: 30,
    nombre_total_places: 30,
    devise: 'Ariary',
    symbole_devise: 'Ar',
    telephone: '+261 34 00 000 00',
    telephone_parking: '+261 34 00 000 00',
    adresse: 'Antananarivo, Madagascar',
    adresse_parking: 'Antananarivo, Madagascar',
    email: 'contact@parking-prive.mg',
    message_bas_ticket: 'Merci de votre visite - Parking Privé Sécurisé',
    tarifs: {
      tarif_base_normal: 3000,
      tarif_base_kospam: 3000,
      majoration_reparation_normal_leger: 0,
      majoration_reparation_normal_autre: 2000,
      majoration_reparation_kospam: 2000,
      normal_sans_reparation: 3000,
      normal_avec_reparation_leger: 3000,
      normal_avec_reparation_autre: 5000,
      kospam_sans_reparation: 3000,
      kospam_avec_reparation: 5000,
    },
  });

  // Modal states
  const [isEntreeModalOpen, setIsEntreeModalOpen] = useState<boolean>(false);
  const [isAncienModalOpen, setIsAncienModalOpen] = useState<boolean>(false);
  const [paiementModalSt, setPaiementModalSt] = useState<Stationnement | null>(null);
  const [ticketModalData, setTicketModalData] = useState<{
    stationnement: Stationnement;
    modePaiement?: string;
  } | null>(null);
  const [kospamPreselect, setKospamPreselect] = useState<boolean>(false);

  // Fetch all core data
  const loadAllData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [
        dashStats,
        clientsData,
        vehiculesData,
        placesData,
        stationnementsData,
        paiementsData,
        portefeuilleData,
        kospamData,
        paramsData,
      ] = await Promise.all([
        api.getStats(),
        api.getClients(),
        api.getVehicules(),
        api.getPlaces(),
        api.getStationnements(),
        api.getPaiements(),
        api.getPortefeuille(),
        api.getKospamStats(),
        api.getParametres(),
      ]);

      setStats(dashStats);
      setClients(clientsData);
      setVehicules(vehiculesData);
      setPlaces(placesData);
      setStationnements(stationnementsData);
      setPaiements(paiementsData);
      setPortefeuille(portefeuilleData);
      setKospamStats(kospamData);
      setParametres(paramsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Actions
  const handleEnregistrerEntree = async (payload: any) => {
    const res = await api.enregistrerEntree(payload);
    await loadAllData();
    return res;
  };

  const handleEnregistrerPaiement = async (payload: {
    id_stationnement: string;
    montant: number;
    mode_paiement: ModePaiement;
    reference?: string;
    observation?: string;
  }) => {
    const res = await api.enregistrerPaiement(payload);
    await loadAllData();
    return res;
  };

  const handleDeletePaiement = async (id_paiement: string) => {
    const res = await api.deletePaiement(id_paiement);
    await loadAllData();
    return res;
  };

  const handleSaveParametres = async (params: ParametresApp) => {
    const res = await api.updateParametres(params);
    setParametres(res);
    await loadAllData();
    return res;
  };

  // Helper counters
  const presentsCount = stationnements.filter((s) => s.statut === 'Présent').length;
  const placesLibresCount = places.filter((p) => p.statut === 'Libre').length;
  const kospamPresentsCount = stationnements.filter(
    (s) => s.statut === 'Présent' && s.client_type === 'Kospam'
  ).length;

  const vehiculesNuitCount = stationnements.filter(
    (s) => s.statut === 'Présent' && s.reste_la_nuit === true
  ).length;

  const navSections = [
    {
      id: 'guichet' as MainSection,
      label: 'Guichet Parking',
      icon: Car,
      badge: presentsCount,
      desc: 'Enregistrements & véhicules au parking',
    },
    {
      id: 'tresorerie' as MainSection,
      label: 'Trésorerie',
      icon: Wallet,
      desc: 'Solde initial, anciennes recettes & dépenses',
    },
    {
      id: 'caisse' as MainSection,
      label: 'Caisse & Règlements',
      icon: CreditCard,
      desc: 'Journal de caisse & impayés',
    },
    {
      id: 'kospam' as MainSection,
      label: 'Garage Kospam',
      icon: Wrench,
      badge: kospamPresentsCount > 0 ? kospamPresentsCount : undefined,
      kospamBadge: true,
      desc: 'Véhicules atelier partenaire',
    },
    {
      id: 'parametres' as MainSection,
      label: 'Paramètres & Tarifs',
      icon: Settings,
      desc: 'Tarification 3k / 5k Ar & configuration',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* 1. TOPBAR SIMPLIFIÉE */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveSection('guichet')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Car className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-slate-900 block leading-tight">
                {parametres.nom_parking}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider">
                Capacité Illimitée • {presentsCount} Garé{presentsCount > 1 ? 's' : ''}
                {vehiculesNuitCount > 0 ? ` (${vehiculesNuitCount} nuit)` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Offline & Connection Indicator */}
          <OfflineIndicator onSyncComplete={loadAllData} />

          {/* PWA Install Button for Chrome */}
          <PWAInstallButton />

          {/* Live Portefeuille Solde Pill */}
          <div
            onClick={() => setActiveSection('tresorerie')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors"
            title="Cliquer pour gérer la trésorerie"
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <div className="text-xs">
              <span className="text-slate-400 font-medium mr-1">Trésorerie:</span>
              <span className="font-black text-slate-900">
                {formatAriary(portefeuille.solde)}
              </span>
            </div>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={loadAllData}
            disabled={refreshing}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* GROS BOUTON 1 : + NOUVELLE ENTRÉE */}
          <button
            id="btn-topbar-nouvelle-entree"
            onClick={() => {
              setKospamPreselect(false);
              setIsEntreeModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden md:inline">+ Entrée Véhicule</span>
          </button>

          {/* BOUTON 2 : + RÉTROACTIF (ANCIEN VÉHICULE) */}
          <button
            id="btn-topbar-ancien-vehicule"
            onClick={() => setIsAncienModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            title="Enregistrer un véhicule antérieur ou historique"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">+ Rétroactif</span>
          </button>
        </div>
      </header>

      {/* Bannière Hors Ligne si déconnecté */}
      <OfflineBanner />

      {/* 2. BARRE D'ONGLETS PRINCIPALE (4 ONGLETS CLAIRS) */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar">
          <nav className="flex space-x-2 py-2">
            {navSections.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? item.id === 'kospam'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                        : item.id === 'kospam'
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 3. CONTENU PRINCIPAL */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium">Chargement des données du parking...</p>
          </div>
        ) : (
          <>
            {/* ONGLET 1 : GUICHET PRINCIPAL */}
            {activeSection === 'guichet' && (
              <GuichetParking
                stats={stats}
                stationnements={stationnements}
                places={places}
                clients={clients}
                vehicules={vehicules}
                parametres={parametres}
                onOpenEntreeModal={() => {
                  setKospamPreselect(false);
                  setIsEntreeModalOpen(true);
                }}
                onOpenPaiementModal={(st) => setPaiementModalSt(st)}
                onOpenAncienModal={() => setIsAncienModalOpen(true)}
                onShowTicket={(st) => setTicketModalData({ stationnement: st })}
                onRefresh={loadAllData}
              />
            )}

            {/* ONGLET 2 : TRÉSORERIE GLOBALE */}
            {activeSection === 'tresorerie' && (
              <TresorerieManager
                parametres={parametres}
                onRefresh={loadAllData}
              />
            )}

            {/* ONGLET 3 : CAISSE & RÈGLEMENTS */}
            {activeSection === 'caisse' && (
              <PaiementsManager
                paiements={paiements}
                stationnements={stationnements}
                parametres={parametres}
                onOpenNouveauPaiement={() => {
                  const premierImpaye = stationnements.find(
                    (s) => (s.reste_a_payer !== undefined ? s.reste_a_payer : s.montant_du) > 0
                  );
                  if (premierImpaye) setPaiementModalSt(premierImpaye);
                }}
                onDeletePaiement={handleDeletePaiement}
                onShowTicket={(st, mode) =>
                  setTicketModalData({ stationnement: st, modePaiement: mode })
                }
              />
            )}

            {/* ONGLET 4 : GARAGE KOSPAM */}
            {activeSection === 'kospam' && (
              <GarageKospam
                stats={kospamStats}
                stationnements={stationnements}
                parametres={parametres}
                onNavigateEntreeKospam={() => {
                  setKospamPreselect(true);
                  setIsEntreeModalOpen(true);
                }}
                onOpenPaiement={(st) => setPaiementModalSt(st)}
                onShowTicket={(st) => setTicketModalData({ stationnement: st })}
              />
            )}

            {/* ONGLET 5 : PARAMÈTRES & TARIFS */}
            {activeSection === 'parametres' && (
              <ParametresTarifs
                parametres={parametres}
                onSaveParametres={handleSaveParametres}
              />
            )}
          </>
        )}
      </main>

      {/* 4. MODALES D'ACTION EXPRESS */}

      {/* Entrée Rapide Modal */}
      {isEntreeModalOpen && (
        <EntreeRapideModal
          isOpen={isEntreeModalOpen}
          places={places}
          clients={clients}
          vehicules={vehicules}
          parametres={parametres}
          preselectKospam={kospamPreselect}
          onClose={() => {
            setIsEntreeModalOpen(false);
            setKospamPreselect(false);
          }}
          onEnregistrerEntree={handleEnregistrerEntree}
          onSuccess={(st, mode) => {
            setTicketModalData({ stationnement: st, modePaiement: mode });
          }}
        />
      )}

      {/* Ancien Véhicule (Historique / Rétroactif) Modal */}
      {isAncienModalOpen && (
        <AncienVehiculeModal
          isOpen={isAncienModalOpen}
          parametres={parametres}
          onClose={() => setIsAncienModalOpen(false)}
          onEnregistrerEntree={handleEnregistrerEntree}
          onSuccess={async (st) => {
            await loadAllData();
            setTicketModalData({ stationnement: st });
          }}
        />
      )}

      {/* Paiement Direct Modal */}
      {paiementModalSt && (
        <PaiementModal
          isOpen={Boolean(paiementModalSt)}
          stationnement={paiementModalSt}
          onClose={() => setPaiementModalSt(null)}
          onValiderPaiement={handleEnregistrerPaiement}
          onSuccess={(stUpdated, mode) => {
            setTicketModalData({ stationnement: stUpdated, modePaiement: mode });
          }}
        />
      )}

      {/* Ticket / Reçu Modal */}
      {ticketModalData && (
        <TicketRecuModal
          isOpen={Boolean(ticketModalData)}
          stationnement={ticketModalData.stationnement}
          parametres={parametres}
          modePaiementUtilise={ticketModalData.modePaiement}
          onClose={() => setTicketModalData(null)}
        />
      )}
    </div>
  );
}

export default App;
