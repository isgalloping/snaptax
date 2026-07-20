# Politique de confidentialité SnapTax

**Dernière mise à jour :** juillet 2026  
**Juridictions applicables :** États-Unis (y compris CPRA Californie) & Union européenne (RGPD)

Bienvenue sur SnapTax. SnapTax et Snap1099 désignent la même application (« l'Application »). Cette Politique de confidentialité explique comment nous collectons, utilisons, traitons et protégeons vos données.

Nous aidons les contractuels, indépendants et petites entreprises à organiser leurs reçus et préparer les exports de saison fiscale. Nous ne vendons pas vos données et ne les utilisons pas pour la publicité.

## 1. Confidentialité dès la conception & propriété des données

Nous limitons la collecte au strict nécessaire pour classer les reçus professionnels et préparer les exports de saison fiscale, conformément à l'**article 13 du RGPD** et au **California Privacy Rights Act (CPRA)**.

**Vous êtes propriétaire de vos données de reçus professionnels.** Nous agissons comme processeur pour vous aider à les organiser et les exporter. Nous ne vendons pas vos données et ne les utilisons pas pour la publicité.

### Utilisation Ghost / anonyme (avant connexion Google)

Lors de votre première utilisation, nous attribuons un **identifiant Ghost** aléatoire sur votre appareil.

- **Hors ligne :** les photos de reçus et les données extraites restent **sur votre appareil** dans un stockage navigateur chiffré jusqu'à ce que vous soyez de nouveau en ligne.
- **Après téléversement :** les images sont stockées sur nos serveurs aux **États-Unis** (voir §6) ; les copies locales pleine résolution peuvent être supprimées selon notre [Politique de conservation](/data-retention).
- **En ligne :** avec une connexion réseau, nous envoyons les images à nos serveurs aux **États-Unis** et à **OpenAI** (via notre API) pour lire et classer le reçu. Les résultats s'affichent dans l'Application et sont associés à votre identifiant Ghost.
- Nous ne collectons **ni votre nom ni votre e-mail** tant que vous n'utilisez pas **Google Sign-In**.

### Après connexion Google

Lorsque vous vous connectez avec Google, nous lions votre identifiant Ghost à votre compte pour synchroniser reçus et paramètres entre appareils. Vos données restent sur la même infrastructure aux **États-Unis** décrite ci-dessous.

## 2. Données collectées

| Catégorie | Exemples | Finalité |
|-----------|----------|----------|
| Images de reçus | Photos que vous prenez | OCR / classification IA, export |
| Métadonnées de reçus | Commerçant, date, montant, catégorie | Affichage, estimations fiscales, export |
| Données de compte | E-mail Google, nom affiché (si connecté) | Identité, synchronisation, support |
| Métadonnées de paiement | Références de transaction Paddle | Droit d'export de saison fiscale |
| Journaux techniques | ID de requête, codes d'erreur (sans images) | Sécurité, fiabilité |

### Données non collectées

- Géolocalisation précise.
- Contacts, autres applications ou historique de navigation intersites.

## 3. Connexion Google

Nous utilisons Google Sign-In uniquement pour l'identité, la sécurité et la synchronisation multi-appareils.

- **Autorisations :** `profile` et `email` uniquement.
- **Aucun accès** à Gmail, Drive, Photos ou Calendar.
- Nous ne voyons ni ne stockons votre mot de passe Google.

## 4. Traitement IA

Lorsque vous êtes **en ligne**, les images de reçus (et le texte OCR local optionnel) sont envoyées à **OpenAI** via nos serveurs pour analyse.

- **Pas d'entraînement de modèle :** les données API OpenAI **ne sont pas** utilisées pour entraîner leurs modèles (selon les conditions API OpenAI).
- **Minimum nécessaire :** nous n'envoyons que ce qui est requis pour extraire commerçant, montants, catégories et champs similaires.
- **Montants fiscaux :** les économies fiscales estimées (`tax_amount`) sont calculées sur nos serveurs selon des formules documentées — **l'IA ne modifie pas de manière autonome les champs comptables ou le statut d'export.**

## 5. Sous-traitants

| Prestataire | Finalité |
|-------------|----------|
| **OpenAI** | Analyse d'images de reçus **en ligne** (y compris avant connexion) ; données API non utilisées pour l'entraînement |
| **Paddle** | Paiement pour l'export de saison fiscale |
| **Google** | Authentification OAuth |
| **Vercel / Neon / Blob** | Hébergement, base de données et stockage d'images (**États-Unis**) |

Tous les transferts utilisent **TLS 1.3**. Les sous-traitants sont liés par des clauses contractuelles de protection des données.

## 6. Stockage & transferts internationaux

Pour fournir nos Services, vos images de reçus et données associées sont transférées de manière sécurisée vers des **serveurs cloud chiffrés situés aux États-Unis**.

En utilisant l'Application et en acceptant nos Conditions et cette Politique (y compris lorsque vous photographiez un reçu en ligne), vous **reconnaissez expressément** que vos données seront traitées aux États-Unis, où les lois de protection des données peuvent différer de celles de votre pays de résidence.

Nous protégeons les transferts internationaux par un chiffrement standard (**TLS 1.3** et **AES-256** au repos lorsque pris en charge) et des mécanismes appropriés, notamment :

- la conformité de nos partenaires au **EU-U.S. Data Privacy Framework** le cas échéant, et
- les **Clauses contractuelles types (CCT/SCC)** lorsque le Framework ne s'applique pas.

## 7. Conservation des données

Nous ne conservons les données que le temps nécessaire aux finalités décrites. Consultez notre [Politique de conservation](/data-retention) pour les durées par type de données et vos options de suppression.

## 8. Aucune vente de données personnelles (CPRA)

**Nous ne vendons pas vos informations personnelles.**

- **Zéro publicité.**
- Nous **ne vendons ni ne partageons** vos données financières ou de reçus avec des annonceurs, assureurs ou courtiers pour la publicité comportementale inter-contextes.
- Les revenus proviennent uniquement de votre achat volontaire d'export de saison fiscale.

### Avis californien de collecte (12 derniers mois)

| Catégorie | Collectée | Divulguée aux prestataires | Vendue |
|-----------|-----------|---------------------------|--------|
| Identifiants (Ghost ID, e-mail si connecté) | Oui | Oui (hébergement, auth) | **Non** |
| Données financières / reçus | Oui | Oui (IA, stockage) | **Non** |
| Informations commerciales (achat export) | Oui | Oui (Paddle) | **Non** |
| Activité Internet / appareil (journaux sécurité) | Oui | Oui (hébergement) | **Non** |

## 9. Vos droits (RGPD & CPRA)

Selon votre localisation, vous pouvez :

- **Accéder** — consulter vos reçus dans l'Application ou exporter via Tax Pack.
- **Rectifier** — corriger les détails dans l'Application lorsque pris en charge, ou nous contacter.
- **Effacer** — **Supprimer le compte** dans les Paramètres (irréversible ; supprime les données serveur et locales liées).
- **Portabilité** — exporter des données structurées via Tax Pack.
- **Limiter le traitement** — nous contacter pour limiter certains traitements le cas échéant.
- **Vous opposer** — cesser d'utiliser l'Application ou supprimer votre compte.

Nous répondons aux demandes vérifiées à **legal@snap1099.com** sous **30 jours** (accusé de réception visé sous 48 heures). Nous pouvons prolonger de 60 jours lorsque la loi le permet, avec notification.

## 10. Sécurité

Nous utilisons chiffrement, contrôles d'accès et surveillance adaptés aux données de reçus financiers. Consultez notre résumé [Sécurité & réponse aux incidents](/security).

## 11. Enfants

L'Application n'est pas destinée aux enfants de moins de 13 ans. Nous ne collectons pas sciemment d'informations personnelles d'enfants.

## 12. Modifications & contact

Nous pouvons mettre à jour cette Politique. Les changements importants seront reflétés dans la date « Dernière mise à jour ». L'utilisation continue après modification vaut acceptation lorsque la loi le permet.

**Contact :** **legal@snap1099.com**
