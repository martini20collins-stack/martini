import { CategorieVehicule, TarifsConfig, TypeClient, TypeStationnement } from '../types';

export const TARIFS_PAR_DEFAUT: TarifsConfig = {
  stationnement_base: 3000,
  supplement_nuit: 5000,
  nuit_normale: 8000,
  nuit_securise: 10000,
  majoration_reparation_normal_leger: 0,
  majoration_reparation_normal_autre: 2000,
  majoration_reparation_kospam: 2000,
};

/**
 * MOTEUR CENTRAL DE TARIFICATION (Règles officielles de l'application)
 *
 * 1. Stationnement normal (Journée normale) :
 *    3 000 Ar
 *
 * 2. Stationnement avec nuit :
 *    Tarif normal (3 000 Ar) + supplément de nuit (5 000 Ar) = 8 000 Ar
 *    Donc Nuit → 8 000 Ar
 *
 * 3. Nuit dans le parking sécurisé :
 *    Nuit – Parking sécurisé → 10 000 Ar
 */
export function calculerTarifStationnement(
  typeStationnement: TypeStationnement = 'Journée normale',
  tarifs: Partial<TarifsConfig> = TARIFS_PAR_DEFAUT
): number {
  const base = Number(tarifs.stationnement_base) || 3000;
  const supplementNuit = Number(tarifs.supplement_nuit) || 5000;
  const nuitNormale = Number(tarifs.nuit_normale) || (base + supplementNuit);
  const nuitSecurise = Number(tarifs.nuit_securise) || 10000;

  switch (typeStationnement) {
    case 'Nuit – Parking sécurisé':
      return nuitSecurise;
    case 'Nuit':
      return nuitNormale;
    case 'Journée normale':
    default:
      return base;
  }
}

/**
 * Moteur complet de calcul :
 * - Stationnement normal : 3 000 Ar
 * - Nuit : + 5 000 Ar (Total = 8 000 Ar)
 * - Nuit – Parking sécurisé : 10 000 Ar
 * - Client Normal :
 *     Sans réparation : 3 000 Ar
 *     Avec réparation : Véhicule léger = 3 000 Ar, Autre catégorie = 5 000 Ar
 * - Garage Kospam :
 *     Sans réparation : 3 000 Ar
 *     Avec réparation : 5 000 Ar
 */
export function calculerMontant(
  typeClient: TypeClient = 'Normal',
  categorie: CategorieVehicule = 'Véhicule léger',
  reparation: boolean = false,
  tarifs: Partial<TarifsConfig> = TARIFS_PAR_DEFAUT,
  typeStationnement: TypeStationnement = 'Journée normale'
): number {
  if (typeStationnement === 'Nuit – Parking sécurisé') {
    return Number(tarifs.nuit_securise) || 10000;
  }

  let base = Number(tarifs.stationnement_base) || 3000;

  if (reparation) {
    if (typeClient === 'Kospam') {
      base = 5000;
    } else {
      if (categorie === 'Véhicule léger') {
        base = 3000;
      } else {
        base = 5000;
      }
    }
  } else {
    base = 3000;
  }

  if (typeStationnement === 'Nuit') {
    const suppNuit = Number(tarifs.supplement_nuit) || 5000;
    return base + suppNuit;
  }

  return base;
}

/**
 * Calcul du statut de paiement
 * Reste à payer = Montant à payer - Montant payé
 * Statuts : 'Payé' | 'Partiellement payé' | 'Non payé'
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
