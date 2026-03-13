# Evidence pour PR UI/UX

## Convention de nommage

Pour toute PR concernant l'UI/UX, des captures d'écran **avant** et **après** sont obligatoires.

### Structure des fichiers

```
docs/evidence/
└── issue-<numéro>/
    ├── before.png   # Capture avant les changements
    └── after.png    # Capture après les changements
```

### Formats acceptés

- `.png` (recommandé)
- `.webp`
- `.jpg` / `.jpeg`
- `.gif` (pour animations)

### Instructions

1. **Créer le dossier** : `docs/evidence/issue-<id>/` (ex: `docs/evidence/issue-85/`)
2. **Nommer les fichiers** : `before.<ext>` et `after.<ext>`
3. **Ajouter les chemins** dans la section Evidence de la PR :
   ```markdown
   ## Evidence
   **Before:** docs/evidence/issue-85/before.png
   **After:** docs/evidence/issue-85/after.png
   ```

### Pourquoi cette convention ?

- Permet au reviewer de voir rapidement l'impact visuel
- Archive les preuves dans le repo
- Facilite le debugging et la traçabilité
