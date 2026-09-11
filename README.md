# AMSN-PH 3-Region Structure Patch

Updates the public Network page to the current three-region structure:
- Luzon
- Visayas
- Mindanao

Logo mapping:
- 7554.jpg -> assets/region-luzon.jpg
- 7555.jpg -> assets/region-visayas.jpg
- 7556.jpg -> assets/region-mindanao.jpg
- 7537.jpg -> assets/amsn-logo.jpg (national logo)

Apply from the AMSN-PH repository root:

```bash
python apply_region_patch.py
```

Then verify:

```bash
git status --short
```

Stage the intended files:

```bash
git add network.html regional-structure.css assets/region-luzon.jpg assets/region-visayas.jpg assets/region-mindanao.jpg assets/amsn-logo.jpg
```

Commit and push:

```bash
git commit -m "Update AMSN-PH network to three regions"
git push origin main
```
