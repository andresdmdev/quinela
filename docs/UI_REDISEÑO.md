# Rediseño UI - Quiniela Mundial 2026

## Paleta de colores seleccionada: "Oro y Cielo"

Esta paleta transmite elegancia, calidez y la emoción del trofeo del Mundial.

| Rol | Color | Hex |
|-----|-------|-----|
| Primary | Dorado trofeo | `#FFB703` |
| Secondary | Naranja atardecer | `#FB8500` |
| Accent | Azul profundo noche | `#023047` |
| Background | Blanco cálido | `#FFFCF9` |
| Surface | Blanco puro | `#FFFFFF` |
| Text primary | Casi negro | `#1A1A2E` |
| Text secondary | Gris cálido | `#6B7280` |
| Success | Verde victoria | `#06D6A0` |
| Danger | Rojo corte | `#EF476F` |
| Warning | Ámbar | `#F59E0B` |

## Cambios implementados

### 1. Sistema de diseño base

- Variables CSS globales en `src/styles/global.css`
- Tipografía `Inter` con escalas más grandes para marcadores
- Border radius consistente (`rounded-2xl`, `rounded-3xl`)
- Sombras suaves con tonos dorados

### 2. Componentes UI reutilizables

- `Button`: variantes primary, secondary, ghost, danger
- `Card`: contenedor base con sombras y bordes
- `Badge`: estados de partido y fases
- `Input`: inputs numéricos para marcadores
- `Toast`: feedback de acciones
- `EmptyState`: estados vacíos con ilustraciones

### 3. Cards de partidos diferenciadas

**Fase de Grupos (`MatchCardGroup`)**
- Diseño limpio y horizontal
- Badge del grupo (A, B, C...)
- Inputs para marcador
- Indicador de pronóstico realizado

**Eliminatorias (`MatchCardKnockout`)**
- Diseño más prominente
- Gradient sutil dorado-naranja
- Indicación del equipo que avanza
- Visualización del resultado oficial

### 4. Formulario de pronósticos mejorado

- Tabs: "Próximos", "Bloqueados", "Finalizados"
- Filtro por fase: Todos, Grupos, Octavos, Cuartos, Semis, Final
- Visualización de partidos pasados (solo lectura)
- Toast de confirmación al guardar
- Indicador de "falta pronosticar"
- Fix del cache de sessionStorage con TTL check

### 5. Ranking mejorado

- Empty state cuando no hay datos
- Animación sutil al actualizar posiciones
- Línea de corte visual más clara
- Desglose de exactos y tendencias

### 6. Dashboard mejorado

- Widget de próximos partidos con countdown
- Widget de ranking rápido
- Indicadores visuales de pronósticos pendientes
- Mejor jerarquía visual

## Bugs corregidos

### Predicciones
- **Fix de cache**: `PredictionForm` ahora valida TTL de sessionStorage antes de usar datos cacheados
- **Visualización de partidos pasados**: Los partidos finalizados ahora se muestran en tab separada
- **Bloqueo consistente**: Validación de bloqueo alineada entre frontend y backend

### Ranking
- **Empty state**: Ahora muestra mensaje amigable cuando no hay datos
- **Manejo de usuarios sin puntos**: Todos los usuarios con perfil aparecen en el ranking

## Estructura de componentes

```text
src/components/react/
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Input.tsx
│   ├── Toast.tsx
│   └── EmptyState.tsx
├── MatchCard.tsx
├── MatchCardGroup.tsx
├── MatchCardKnockout.tsx
├── MatchList.tsx
├── PredictionForm.tsx
├── Leaderboard.tsx
├── UpcomingMatches.tsx
└── GroupStandings.tsx
```

## Próximas mejoras pendientes

- Animaciones de entrada en cards
- Pull-to-refresh en móvil
- Modo oscuro (si se requiere en el futuro)
- Notificaciones push para partidos próximos
