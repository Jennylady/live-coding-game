# Network Champion — Atelier Réseaux

Mini-site React + Vite pour animer un atelier réseau en équipes, dans l'esprit de « Question pour un champion ».

## Fonctionnalités
- 2 équipes avec score persistant entre les manches
- Manche « Qui suis-je ? » avec 4 indices progressifs, buzzer clavier A/L, points 40/30/20/10
- Sprint QCM chronométré
- Finale technique avec subnetting et scénarios de dépannage
- Correction et explication immédiates
- Questions centralisées dans `src/data/questions.js`
- Responsive desktop/mobile

## Lancer
```bash
npm install
npm run dev
```

## Modifier les questions
Éditer `src/data/questions.js` :
- `championQuestions` : indices progressifs + réponses acceptées
- `sprintQuestions` : QCM rapides
- `finalQuestions` : scénarios plus difficiles

Les touches `A` et `L` servent de buzzers pour les deux équipes pendant la manche « Qui suis-je ? ».
