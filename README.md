# 10K Hybrid Performance Tracker

Application mobile-first pour progresser d'un 10 km en ~44:00 vers moins de 40:00 tout en conservant une vraie progression de musculation et une séance de football le lundi.

## Philosophie

- 3 blocs progressifs : Base hybride → Build → Spécifique sub-40
- les séances running changent chaque semaine de façon planifiée
- les mouvements principaux de musculation restent stables pour mesurer la surcharge progressive
- une semaine de deload est intégrée régulièrement
- le foot du lundi est compté comme une séance haute intensité
- aucun reset destructif automatique

## Semaine type

- Lundi : football
- Mardi : Upper A + footing récupération optionnel
- Mercredi : séance running clé
- Jeudi : Lower body
- Vendredi : Upper B + endurance facile / strides
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

À la détection d'une nouvelle semaine ISO, l'application demande confirmation avant d'archiver l'ancienne et de créer la nouvelle. Les anciennes semaines ne sont jamais effacées par ce processus.

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
