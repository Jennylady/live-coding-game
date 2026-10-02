# Bootcamp Champion V14 — correction admin

## Correction principale

La V12 avait un bug de restauration de session : quand aucune équipe n’était enregistrée dans le navigateur, `sessionStorage.getItem(...)` retournait `null`, puis `Number(null)` devenait `0`. Le navigateur pouvait donc entrer automatiquement dans **Cookies** et empêcher l’accès normal à l’admin.

La V14 vérifie maintenant explicitement qu’un identifiant d’équipe existe avant de restaurer une session participant.

## Administrateur

- Identifiant : `admin`
- Mot de passe : `admin12`

Après connexion, l’admin reste sur l’écran d’accueil avec le badge **ADMIN**, puis clique volontairement sur **Lancer les qualifications**. La connexion et le lancement sont séparés pour rendre les erreurs plus faciles à voir.

## Participants

- Cookies
- EVH
- N4SC

Aucun mot de passe participant. Ils choisissent leur équipe et attendent le lancement.

## État

Aucun fichier persistant. Scores, phase et buzz sont gardés en mémoire du serveur jusqu’au redémarrage.

## Lancement

```bash
npm install
npm run build
npm start
```

Vérification serveur : `/api/health` doit renvoyer `version: 13`.


## Accès administrateur simplifié

Il n'y a plus d'identifiant administrateur. Le formulaire demande uniquement le mot de passe statique `admin12`. Ce mot de passe est fixé directement dans `server.js` et n'est plus lu depuis une variable d'environnement.
