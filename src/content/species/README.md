# Portal de Pesca Deportiva Continental en Colombia

Contenido en Markdown para un portal web basado en la guía:

> **Fuente:** Lasso, C. A., C. R. Heinsohn, S. Jensen y M. A. Morales-Betancourt. 2019. *XVIII. La pesca deportiva continental en Colombia: guía de las especies de agua dulce*. Serie Editorial Recursos Hidrobiológicos y Pesqueros Continentales de Colombia. Instituto de Investigación de Recursos Biológicos Alexander von Humboldt. Bogotá, D. C., Colombia. 298 pp. ISBN impreso: 978-958-5418-86-8 / ISBN digital: 978-958-5418-87-5.

Todos los contenidos están **reescritos** a partir de la información factual de la obra original. Siempre debe acreditarse la fuente.

## Estructura

```
/portal-pesca
├── README.md                              (este archivo)
├── /paginas                               (secciones generales del portal)
│   ├── 01-introduccion.md                 ✅ completo
│   ├── 02-pesca-deportiva-en-colombia.md  ✅ completo
│   ├── 03-marco-normativo.md              ✅ completo
│   ├── 04-metodos-y-equipos.md            ✅ completo
│   ├── 05-zonas-de-pesca.md               ✅ completo
│   ├── 06-especies-de-interes.md          ✅ completo
│   ├── 07-catalogo-estructura.md          ✅ completo (índice maestro de las 76 especies)
│   └── 08-conservacion.md                 ⏳ pendiente (conclusiones del libro)
└── /especies                              (fichas individuales de las 63 especies principales)
    └── _plantilla.md                      ✅ plantilla estándar
                                           ⏳ 63 fichas pendientes (catálogo del libro)
```

## Convenciones

- **Front matter YAML** en cada archivo: título, slug, tags, orden, fuente, estado.
- **Slugs** en kebab-case sin acentos.
- **Fichas de especies** siguen la plantilla `_plantilla.md` con campos estandarizados (taxonomía, distribución, biología, técnicas de pesca, normativa, estado de conservación).
- **Referencias cruzadas** entre páginas usan rutas relativas tipo `/especies/payara`.
- **Citación de fuente** al pie de cada archivo.

## Progreso del proyecto

| Parte del libro | Páginas | Estado |
|---|---|---|
| Parte 1 | 1–50 | ✅ procesada |
| Parte 2 | 51–91 | ✅ procesada |
| Parte 3+ | 92–298 | ⏳ pendiente (catálogo de especies, bibliografía, índices) |

### Qué queda pendiente

1. **Las 63 fichas individuales de especies** (sección más grande del libro).
2. **Capítulo 8 – Conclusiones y recomendaciones para la conservación** (del libro).
3. Ajustes finos a las páginas generales si aparece información nueva relevante en partes posteriores.
