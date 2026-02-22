# Missing Client Logos

Clients that have testimonials in the database but no logo file in `/public/images/clients/`.
These will show a text badge fallback in the testimonials scroller until logos are added.

Once you have a logo, drop it in `/public/images/clients/` and run the SQL below to wire it up.

---

## Needed (14 clients)

| Client | Testimonials | Suggested filename |
|---|---|---|
| Tilt 5 | 3 | `tilt-5.png` |
| Tidbyt | 2 | `tidbyt.png` |
| Breadwinner | 1 | `breadwinner.png` |
| CMYK Games | 1 | `cmyk-games.png` |
| Dabby | 1 | `dabby.png` |
| Etcher Laser | 1 | `etcher-laser.png` |
| Joué Music Instruments | 1 | `joue-music.png` |
| Lightfoot Scooters | 1 | `lightfoot-scooters.png` |
| Negative | 1 | `negative.png` |
| Next Thing Co. | 1 | `next-thing-co.png` |
| Seco Tools | 1 | `seco-tools.png` |
| Seismic | 1 | `seismic.png` |
| TaloBrush | 1 | `talobrush.png` |
| Wild Clean | 1 | `wild-clean.png` |

---

## How to add a logo

1. Drop the image (PNG, transparent bg, ideally SVG or 2x PNG) into `/public/images/clients/`
2. Run the SQL below in the Supabase dashboard (or via MCP), substituting the client name and path:

```sql
UPDATE clients
SET logo_url = '/images/clients/<filename>'
WHERE name = '<Client Name>';
```

Example:
```sql
UPDATE clients
SET logo_url = '/images/clients/tilt-5.png'
WHERE name = 'Tilt 5';
```

---

## Already have logos (7 with testimonials)

| Client | Logo file | Testimonials |
|---|---|---|
| Crave | `crave.png` | 2 |
| Lumen | `lumen.png` | 2 |
| Lumos | `lumos.png` | 2 |
| Erie | `eri-logo.png` | 1 |
| Keyboard.io | `key-logo.png` | 1 |
| Light Pong | `light-pong.png` | 1 |
| Nine Arches | `nine-arches.png` | 1 |

---

## Logo-wall clients with no testimonials (no action needed)

Cal Water, Couples Institute, Daily Grill, Dell, Designer Pages, Epson, Lynx,
Monterey Bay Aquarium, New Holland, Octopus Camera, Omega Events,
Planned Parenthood, Samsung
