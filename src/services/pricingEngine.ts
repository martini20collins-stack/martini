import { CategorieVehicule, TarifsConfig, TypeClient } from '../types';

export const TARIFS_PAR_DEFAUT: TarifsConfig = {
  stationnement_base: 3000,
  majoration_reparation_normal_leger: 0,
  majoration_reparation_normal_autre: 2000,
  majoration_reparation_kospam: 2000,
};

/**
 * MOTEUR CENTRAL DE TARIFICATION
 * Règle stricte et unique utilisée partout dans l'application
 *
 * SI client = Normal :
 *   SI réparation = NON :
 *     montant = 3000
 *   SINON SI catégorie = Véhicule léger :
 *     montant = 3000
 *   SINON :
 *     montant = 5000
 *
 * SI client = Kospam :
 *   SI réparation = NON :
 *     montant = 3000
 *   SINON :
 *     montant = 5000
 */
export function calculerMontant(
  typeClient: TypeClient,
  categorie: CategorieVehicule,
  reparation: boolean,
  tarifs: TarifsConfig = TARIFS_PAR_DEFAUT
): number {
  const base = Number(tarifs.stationnement_base) || 3000;

  if (typeClient === 'Normal') {
    if (!reparation) {
      return base;
    }
    if (categorie === 'Véhicule léger') {
      return base + (Number(tarifs.majoration_reparation_normal_leger) || 0);
    }
    // 4x4, Camionnette, Bus, Camion
    return base + (Number(tarifs.majoration_reparation_normal_autre) || 2000);
  }

  if (typeClient === 'Kospam') {
    if (!reparation) {
      return base;
    }
    // RÈGLE ABSOLUE KOSPAM : toujours le même tarif quelle que soit la catégorie
    return base + (Number(tarifs.majoration_reparation_kospam) || 2000);
  }

  return base;
}

/**
 * Calcul du statut de paiement
 * Reste à payer = Montant dû - Total des paiements
 */
export function calculerStatutPaiement(
  montantDu: number,
  totalPaye: number
): {
  montant_du: number;
  montant_paye: number;
  reste_a_payer: number;
  statut_paiement: 'Payé' | 'Partiellement payé' | 'Non payé';
} {
  const du = Math.max(0, Number(montantDu) || 0);
  const paye = Math.max(0, Number(totalPaye) || 0);
  const reste = Math.max(0, du - paye);

  let statut: 'Payé' | 'Partiellement payé' | 'Non payé' = 'Non payé';
  if (paye >= du && du > 0) {
    statut = 'Payé';
  } else if (paye > 0 && paye < du) {
    statut = 'Partiellement payé';
  } else if (du === 0 && paye === 0) {
    statut = 'Payé';
  }

  return {
    montant_du: du,
    montant_paye: paye,
    reste_a_payer: reste,
    statut_paiement: statut,
  };
}
