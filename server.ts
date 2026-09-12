import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { calculerMontant } from './src/services/pricingEngine';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Settings & Parameters
  app.get('/api/parametres', (req: Request, res: Response) => {
    try {
      res.json(db.getParametres());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/parametres', (req: Request, res: Response) => {
    try {
      const updated = db.updateParametres(req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Centralized Pricing Calculate simulation endpoint
  app.post('/api/tarifs/calculer', (req: Request, res: Response) => {
    try {
      const { type_client, categorie, reparation } = req.body;
      const params = db.getParametres();
      const montant = calculerMontant(
        type_client || 'Normal',
        categorie || 'Véhicule léger',
        Boolean(reparation),
        params.tarifs
      );
      res.json({ montant });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Real Database Reset / Seed
  app.post('/api/db/reset', (req: Request, res: Response) => {
    try {
      const data = db.resetToDefault();
      res.json({ success: true, message: 'Base de données réinitialisée avec les données de test.', data });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stats Dashboard
  app.get('/api/stats', (req: Request, res: Response) => {
    try {
      const stats = db.getDashboardStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Garage Kospam Stats
  app.get('/api/kospam/stats', (req: Request, res: Response) => {
    try {
      const stats = db.getKospamStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Execute 10 Mandatory Tests
  app.get('/api/tests/run', (req: Request, res: Response) => {
    try {
      const results = db.executerTestsObligatoires();
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Clients
  app.get('/api/clients', (req: Request, res: Response) => {
    try {
      res.json(db.getClients());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/clients', (req: Request, res: Response) => {
    try {
      const { nom, type_client, telephone, adresse, email, observation } = req.body;
      if (!nom || !type_client) {
        return res.status(400).json({ error: 'Le nom et le type de client sont obligatoires.' });
      }
      const client = db.createClient({
        nom,
        type_client,
        telephone: telephone || '',
        adresse: adresse || '',
        email: email || '',
        observation: observation || '',
      });
      res.status(201).json(client);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put('/api/clients/:id', (req: Request, res: Response) => {
    try {
      const updated = db.updateClient(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/clients/:id', (req: Request, res: Response) => {
    try {
      const ok = db.deleteClient(req.params.id);
      res.json({ success: ok });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Vehicles
  app.get('/api/vehicules', (req: Request, res: Response) => {
    try {
      res.json(db.getVehicules());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/vehicules', (req: Request, res: Response) => {
    try {
      const { immatriculation, marque, modele, categorie, id_client, observation } = req.body;
      if (!immatriculation || !marque || !categorie || !id_client) {
        return res.status(400).json({
          error: "L'immatriculation, la marque, la catégorie et le client sont obligatoires.",
        });
      }
      const vehicule = db.createVehicule({
        immatriculation,
        marque,
        modele: modele || '',
        categorie,
        id_client,
        observation: observation || '',
      });
      res.status(201).json(vehicule);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put('/api/vehicules/:id', (req: Request, res: Response) => {
    try {
      const updated = db.updateVehicule(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/vehicules/:id', (req: Request, res: Response) => {
    try {
      const ok = db.deleteVehicule(req.params.id);
      res.json({ success: ok });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Places
  app.get('/api/places', (req: Request, res: Response) => {
    try {
      res.json(db.getPlaces());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/places', (req: Request, res: Response) => {
    try {
      const { numero_place, statut, type_zone, observation } = req.body;
      if (!numero_place) return res.status(400).json({ error: 'Le numéro de place est requis.' });
      const place = db.createPlace({ numero_place, statut, type_zone, observation });
      res.status(201).json(place);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put('/api/places/:id', (req: Request, res: Response) => {
    try {
      const updated = db.updatePlace(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/places/:id', (req: Request, res: Response) => {
    try {
      const ok = db.deletePlace(req.params.id);
      res.json({ success: ok });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Stationnements
  app.get('/api/stationnements', (req: Request, res: Response) => {
    try {
      res.json(db.getStationnements());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/stationnements', (req: Request, res: Response) => {
    try {
      const st = db.enregistrerEntree(req.body);
      res.status(201).json(st);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/stationnements/entree', (req: Request, res: Response) => {
    try {
      const st = db.enregistrerEntree(req.body);
      res.status(201).json(st);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put('/api/stationnements/:id', (req: Request, res: Response) => {
    try {
      const st = db.updateStationnement(req.params.id, req.body);
      res.json(st);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/stationnements/:id', (req: Request, res: Response) => {
    try {
      db.deleteStationnement(req.params.id);
      res.json({ success: true, message: 'Stationnement supprimé avec succès.' });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/stationnements/sortie', (req: Request, res: Response) => {
    try {
      const { id_stationnement, date_sortie, heure_sortie, paiement } = req.body;
      if (!id_stationnement) {
        return res.status(400).json({ error: "L'identifiant du stationnement est requis." });
      }
      const st = db.enregistrerSortie({
        id_stationnement,
        date_sortie,
        heure_sortie,
        paiement,
      });
      res.json(st);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Payments
  app.get('/api/paiements', (req: Request, res: Response) => {
    try {
      res.json(db.getPaiements());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/paiements', (req: Request, res: Response) => {
    try {
      const { id_stationnement, montant, mode_paiement, reference, observation } = req.body;
      if (!id_stationnement || !montant) {
        return res.status(400).json({ error: 'Le stationnement et le montant sont obligatoires.' });
      }
      const paiement = db.enregistrerPaiement({
        id_stationnement,
        montant: Number(montant),
        mode_paiement,
        reference,
        observation,
      });
      res.status(201).json(paiement);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/paiements/:id', (req: Request, res: Response) => {
    try {
      const ok = db.deletePaiement(req.params.id);
      res.json({ success: ok });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Portefeuille
  app.get('/api/portefeuille', (req: Request, res: Response) => {
    try {
      const mouvements = db.getPortefeuille();
      const solde = db.getSoldePortefeuille();
      const totalEncaisse = mouvements.reduce((sum, m) => sum + (Number(m.entree) || 0), 0);
      const totalDepense = mouvements.reduce((sum, m) => sum + (Number(m.sortie) || 0), 0);
      res.json({
        mouvements,
        solde,
        total_encaisse: totalEncaisse,
        total_depense: totalDepense,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/portefeuille/mouvement', (req: Request, res: Response) => {
    try {
      const { type_mouvement, reference, entree, sortie, motif, observation } = req.body;
      if (!type_mouvement || !motif) {
        return res.status(400).json({ error: 'Le type de mouvement et le motif sont requis.' });
      }
      const mvt = db.ajouterMouvementPortefeuille({
        type_mouvement,
        reference,
        entree: Number(entree) || 0,
        sortie: Number(sortie) || 0,
        motif,
        observation,
      });
      res.status(201).json(mvt);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Trésorerie Module APIs
  const soldeInitialPaths = [
    '/api/tresorerie/solde-initial',
    '/api/tresorerie/solde_initial',
    '/api/parametres/solde-initial',
    '/api/parametres/solde_initial',
  ];

  app.get(soldeInitialPaths, (req: Request, res: Response) => {
    try {
      const params = db.getParametres();
      res.json({
        success: true,
        solde_initial: params.solde_initial || 0,
        date_solde_initial: params.date_solde_initial || new Date().toISOString().split('T')[0],
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const handleSetSoldeInitial = (req: Request, res: Response) => {
    try {
      const { montant, date, observation } = req.body || {};
      if (montant === undefined || isNaN(Number(montant))) {
        return res.status(400).json({ error: 'Le montant du solde initial est requis.' });
      }
      const mvt = db.setSoldeInitial(Number(montant), date, observation);
      res.json({ success: true, mouvement: mvt, solde_initial: Number(montant) });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  app.post(soldeInitialPaths, handleSetSoldeInitial);
  app.put(soldeInitialPaths, handleSetSoldeInitial);

  app.get(['/api/tresorerie/resume', '/api/tresorerie/resume/'], (req: Request, res: Response) => {
    try {
      res.json(db.getTresorerieResume());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/tresorerie/mouvements', (req: Request, res: Response) => {
    try {
      const { type_mouvement, montant, date, motif, categorie, observation, reference } = req.body;
      if (!type_mouvement || !motif || montant === undefined) {
        return res.status(400).json({ error: 'Type de mouvement, motif et montant sont requis.' });
      }
      const mvt = db.ajouterMouvementTresorerie({
        type_mouvement,
        montant: Number(montant),
        date,
        motif,
        categorie,
        observation,
        reference,
      });
      res.status(201).json(mvt);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put('/api/tresorerie/mouvements/:id', (req: Request, res: Response) => {
    try {
      const mvt = db.updateMouvementTresorerie(req.params.id, req.body);
      res.json(mvt);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/tresorerie/mouvements/:id', (req: Request, res: Response) => {
    try {
      db.deleteMouvementTresorerie(req.params.id);
      res.json({ success: true, message: 'Mouvement supprimé avec succès.' });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Reports
  app.get('/api/reports', (req: Request, res: Response) => {
    try {
      const { date_debut, date_fin, type_client, categorie, mode_paiement, statut_paiement, statut_stationnement } = req.query;

      let stationnements = db.getStationnements();
      let paiements = db.getPaiements();
      let portefeuille = db.getPortefeuille();

      if (date_debut) {
        stationnements = stationnements.filter((s) => s.date_entree >= String(date_debut));
        paiements = paiements.filter((p) => p.date_paiement >= String(date_debut));
        portefeuille = portefeuille.filter((m) => m.date >= String(date_debut));
      }
      if (date_fin) {
        stationnements = stationnements.filter((s) => s.date_entree <= String(date_fin));
        paiements = paiements.filter((p) => p.date_paiement <= String(date_fin) + ' 23:59:59');
        portefeuille = portefeuille.filter((m) => m.date <= String(date_fin) + ' 23:59:59');
      }
      if (type_client) {
        stationnements = stationnements.filter((s) => s.client_type === type_client);
      }
      if (categorie) {
        stationnements = stationnements.filter((s) => s.categorie === categorie);
      }
      if (statut_paiement) {
        stationnements = stationnements.filter((s) => s.statut_paiement === statut_paiement);
      }
      if (statut_stationnement) {
        stationnements = stationnements.filter((s) => s.statut === statut_stationnement);
      }
      if (mode_paiement) {
        paiements = paiements.filter((p) => p.mode_paiement === mode_paiement);
      }

      const totalDu = stationnements.reduce((sum, s) => sum + s.montant_du, 0);
      const totalPaye = stationnements.reduce((sum, s) => sum + (s.montant_paye || 0), 0);
      const totalReste = Math.max(0, totalDu - totalPaye);
      const totalRecettesPaiements = paiements.reduce((sum, p) => sum + p.montant, 0);

      res.json({
        stationnements,
        paiements,
        portefeuille,
        summary: {
          total_vehicules: stationnements.length,
          total_reparations: stationnements.filter((s) => s.reparation).length,
          total_du: totalDu,
          total_paye: totalPaye,
          total_reste: totalReste,
          total_recettes_paiements: totalRecettesPaiements,
        },
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Comprehensive analytics rapports
  app.get('/api/rapports', (req: Request, res: Response) => {
    try {
      const stats = db.getRapportStats(req.query as any);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- VITE MIDDLEWARE (DEV) & STATIC SERVING (PROD) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur Gestion de Parking Privé démarré sur http://localhost:${PORT}`);
  });
}

startServer();
