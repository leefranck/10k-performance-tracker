# 10K Hybrid Performance Tracker

Application mobile-first pour progresser d'un 10 km en ~44:00 vers moins de 40:00 tout en conservant une vraie progression de musculation et du football optionnel le lundi et le vendredi.

## Philosophie

- 3 blocs progressifs : Base hybride → Build → Spécifique sub-40
- les séances running changent chaque semaine de façon planifiée
- les mouvements principaux de musculation restent stables pour mesurer la surcharge progressive
- une semaine de deload est intégrée régulièrement
- le foot, lorsqu’il est choisi le lundi ou le vendredi, est la seule activité du jour
- aucun reset destructif automatique

## Semaine type

- Lundi : foot optionnel ; sinon course facile ou repos
- Mardi : Upper A, sans cardio
- Mercredi : séance running clé
- Jeudi : Lower body
- Vendredi : foot optionnel ; sinon course facile ou repos
- Samedi : repos
- Dimanche : sortie longue

## UX tapis / running

- bascule Dehors / Tapis directement dans la séance
- conversion allure → km/h
- chrono guidé avec gros contrôles tactiles
- démarrage toujours manuel
- enchaînement effort/récupération automatique optionnel
- vibration au changement de phase si le navigateur le permet

## Sauvegarde hebdomadaire

Les données sont stockées dans `localStorage` sous la clé :

```text
tenk-hybrid-performance-v2
```

Structure principale :

```text
settings
activeWeekKey
weeks {
  2026-W38: {
    program,
    data,
    recovery,
    pbSnapshot,
    status
  }
}
```

Le changement de semaine reste manuel via le bilan : progresser ou répéter. Chaque nouvelle semaine redemande les choix de foot. Les anciennes semaines conservent leur planning et leurs données.

Le bouton **Exporter mes données** crée en plus une sauvegarde JSON locale.

## Progression des blocs

Le changement de semaine est validé par l'utilisateur. Une fois la dernière semaine d'un bloc atteinte, l'app propose le bloc suivant mais le passage reste manuel.

## Lancer

Aucune dépendance et aucun backend :

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080`.

## Fichiers

```text
index.html
styles.css
app.js
skills/ux/SKILL.md
skills/design/SKILL.md
README.md
```


## Règle non négociable — préservation des données

Toute évolution de l'application doit préserver intégralement les données déjà saisies par l'utilisateur.

Cela inclut notamment :
- charges et poids saisis ;
- répétitions ;
- séries validées ;
- journées confirmées ;
- ressenti ;
- récupération ;
- PB / réglages ;
- historique des semaines ;
- progression de bloc et semaine active.

Interdictions :
- ne jamais changer de clé `localStorage` sans migration explicite ;
- ne jamais réinitialiser `tenk-hybrid-performance-v2` lors d'une mise à jour ;
- ne jamais recréer la semaine active si des données existent déjà ;
- ne jamais supprimer ou remplacer une structure de données existante sans migration rétrocompatible ;
- une mise à jour PWA / service worker / cache ne doit jamais toucher aux données utilisateur.

Si le modèle de données doit évoluer, une migration rétrocompatible doit être exécutée avant le nouveau comportement, et les données existantes doivent rester lisibles après migration.



## Planning adaptatif et nouveauté

Lundi et vendredi proposent foot, WOD cardio, musculation, course facile ou repos. Le planning réorganise les jours à venir ; une séance commencée est figée avec ses exercices et ses clés de sauvegarde. Les anciennes semaines gardent leur planning. Deux efforts cardio intenses remplacent la course clé, et le dimanche est réduit après un vendredi intense.

Les trois familles muscu (haut A, bas, haut B) disposent de quatre variations. Chaque nouveau cycle, même répété, avance d’une variation ; les mêmes exercices reviennent après quatre cycles. Les références de charges sont recherchées par nom d’exercice, pas par position dans une liste.

Le WOD est une séance cardio unique avec chrono guidé, échauffement et retour au calme. Durée habituelle du foot et effort global 6–8/10 servent de repères ; une récupération basse allège le WOD. La comparaison durée × effort ressenti ne prétend pas reproduire les sollicitations physiologiques du football. Référence : https://pubmed.ncbi.nlm.nih.gov/28463642/.

Validation du moteur sans dépendance : `node tests/adaptive-plan.test.cjs` (792 combinaisons de semaines et 3 888 changements après début de séance).

## Chrono de repos musculation

Disponible dans les séances de musculation, visible pendant le défilement. Préréglages 60/90/120/180 secondes, ajustement ±15 secondes, démarrage manuel, pause/reprise et remise à zéro. Valider une série actualise le nom de l’exercice sans lancer ou réinitialiser le chrono. Le délai repose sur une échéance absolue, conservée dans sessionStorage pour survivre au rechargement ; le réglage préféré est enregistré avec les autres réglages. Fin de repos signalée à l’écran, avec son/vibration lorsque le navigateur le permet. Aucun historique de séance n’est modifié par le chrono.
