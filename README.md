# Torneo Ardillitas

Web del torneo de fútbol del club — desarrollo local primero, deploy en Vercel después.

## Arrancar

```bash
cd D:\Proyectos\torneo-ardillitas
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

## Fotos de fondo (coordinador del club)

Copiá las fotos en `public/backgrounds/`:

| Archivo | Uso |
|---------|-----|
| `hero.jpg` | Portada principal (**mínimo recomendado**) |
| `partidos.jpg` | Sección partidos |
| `tabla.jpg` | Tabla |
| `fotos.jpg` | Galería |
| `ubicaciones.jpg` | Ubicaciones |
| `club.jpg` | Plano del predio |
| `reglamento.jpg` | Reglamento |

Si falta una imagen, se usa un degradado verde automático.

## Configuración rápida

Editá `src/config/site.ts`:

- WhatsApp del coordinador (`whatsapp.number`)
- Link de Google Drive para fotos (`drivePhotosUrl`)
- Nombre del club / torneo

## Secciones

- `/` Inicio
- `/partidos` Fixture
- `/tabla` Posiciones
- `/fotos` Galería
- `/ubicaciones` Lugares con Google Maps
- `/club` Plano del club
- `/reglamento` Texto + PDF
- `/informacion` Contactos del torneo
- `/admin/login` Panel del coordinador (reglamento y fotos)

## Próximos pasos

1. Supabase (equipos, partidos, fotos)
2. Panel admin con login
3. Deploy Vercel + dominio del club
