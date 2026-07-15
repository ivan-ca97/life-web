# Asistente de IA — Endpoints para el frontend

Guía de integración de la feature de estimación de comidas por IA y de la gestión
de cuotas/tiers. Todos los paths cuelgan de `/api/v1` y requieren sesión
autenticada (mismo esquema que el resto de la API).

- **Auth**: header/cookie de sesión, igual que los demás endpoints protegidos.
- **Endpoints de admin** (`/ai/admin/...`): requieren rol admin → `403` si no.
- **`{userId}`**: el id del usuario dueño de los datos (como en el resto de rutas
  bajo `/users/{userId}`). Usá el del usuario logueado.

---

## 1. Estimar una comida (el core)

```
POST /api/v1/users/{userId}/ai/meals/estimate
```

Toma fotos y/o texto y devuelve un **borrador** para que el usuario revise. No
persiste nada: el guardado se hace después con los endpoints existentes de
`meals`/`foods`.

### Request

```jsonc
{
  "photo_urls": ["https://<r2-public-url>/meals/abc.jpg"], // 0..4 fotos YA subidas a R2
  "instructions": "El arroz es integral, ~200g",           // opcional
  "assume_only_visible": true,                              // "asumí todo lo de la foto"
  "corrections": [                                          // opcional: re-estimación
    { "item": "Arroz", "correction": "Es integral, fueron 250g" }
  ]
}
```

- Debe venir **al menos una foto o `instructions`** (si no → `400`).
- Máx **4 fotos** (si no → `400`).
- **Re-estimar** = volver a llamar con `corrections` (los ajustes del usuario a los
  supuestos). Es stateless, no hay sesión de chat.

### Response `200`

```jsonc
{
  "matched_items": [                    // alimentos que matchearon con el catálogo
    {
      "food_id": "uuid",                // usar este id al guardar la comida
      "food_name": "Pechuga de pollo a la plancha",
      "estimated_quantity": 200,
      "unit": "g",
      "confidence": "high",             // low | medium | high
      "assumption": "Asumí sin aceite",
      "sanity_warnings": []             // p.ej. ["Los macros guardados parecen bajos"]
    }
  ],
  "new_food_suggestions": [             // no estaban en el catálogo → sugerir crear
    {
      "name": "Pollo frito",
      "estimated_quantity": 50,
      "unit": "g",
      "confidence": "low",
      "assumption": "No estaba en tu base",
      "create_params": {                // listo para POST /foods (ver §2)
        "measurement_type": "mass",     // mass | volume | unit
        "base_unit": "g",
        "base_quantity": 100,
        "default_calories": 290,
        "default_protein_grams": 18,
        "default_carbs_grams": 9,
        "default_fat_grams": 20,
        "default_fiber_grams": 0
      }
    }
  ],
  "totals": { "calories": 565, "protein_grams": 66, "carbs_grams": 42, "fat_grams": 12, "fiber_grams": 0 },
  "assumptions": ["Asumí porciones estándar"],
  "needs_clarification": false,
  "clarification_question": "",         // presente solo si needs_clarification=true
  "usage": { "model": "gpt-4o", "input_tokens": 2555, "output_tokens": 418, "cost_usd": 0.0106 }
}
```

### Errores

| Código | Motivo |
|--------|--------|
| `400` | Sin foto ni instrucciones / más de 4 fotos / body inválido |
| `429` | El usuario alcanzó su límite mensual de IA (cuota) — ver §3 |
| `500` | Falla del proveedor de IA (p.ej. sin crédito en OpenAI) |
| `403` | El actor no puede operar sobre ese `userId` |

> Si el endpoint no existe (`404`), es que el backend arrancó sin `OPENAI_API_KEY`
> (la feature se desactiva sola). La gestión de cuotas (§3) sí está siempre.

---

## 2. Flujo completo en el frontend

```
1. Usuario saca/sube fotos
   → subir a R2 con el flujo de media existente (presigned PUT) → obtener las URLs

2. POST /ai/meals/estimate  con photo_urls + instructions
   → recibir el borrador

3. Mostrar el borrador editable:
   - matched_items: precargados con food_id + cantidad (editables)
   - new_food_suggestions: card "¿Crear este alimento?"
   - assumptions: chips corregibles → si el usuario corrige, volver a llamar
     el endpoint con "corrections" (re-estimación)

4. Si el usuario aprueba una sugerencia de alimento nuevo:
   POST /api/v1/users/{userId}/foods   (endpoint EXISTENTE)
   body = new_food_suggestions[i].create_params + name
   → devuelve el food creado con su food_id

5. Guardar la comida:
   POST /api/v1/users/{userId}/meals   (endpoint EXISTENTE)
   - items: cada uno con food_id (de matched_items o del food recién creado),
     quantity, unit, y measurement_method = "photo_estimate"
     (o "visual_estimate" si fue solo texto sin foto)
   - opcionalmente los macros a nivel de comida desde "totals"
```

Puntos clave:
- El endpoint de IA **solo estima**; crear alimentos y guardar la comida usa los
  endpoints que ya existen.
- Marcar los ítems como `photo_estimate` para que el nivel de confianza del
  registro sea correcto (el usuario luego puede "ascenderlo" pesando).

---

## 3. Cuota y límites del usuario

### Mi consumo del mes

```
GET /api/v1/ai/me/usage
```

```jsonc
{
  "period_start": "2026-06-01",
  "requests": 12,
  "input_tokens": 30000,
  "output_tokens": 5000,
  "cost_usd": 0.15,
  "effective_limit_usd": 5.0,   // null = sin tope
  "tier_name": "standard"
}
```

Útil para mostrar "llevás $0.15 de $5.00 este mes".

### Auto-límite del usuario

```
PUT /api/v1/ai/me/self-limit
```

```jsonc
{ "self_limit_usd": 10.0 }   // null quita el auto-límite
```

Devuelve el `usage` actualizado. El tope efectivo es el **menor** entre el límite
del tier y este auto-límite (permite que un usuario "unlimited" se autolimite).

---

## 4. Administración de tiers (solo admin)

```
GET   /api/v1/ai/admin/tiers                     # listar
POST  /api/v1/ai/admin/tiers                     # crear
PATCH /api/v1/ai/admin/tiers/{tierId}            # editar
PUT   /api/v1/ai/admin/users/{userId}/tier       # asignar tier a un usuario
GET   /api/v1/ai/admin/users/{userId}/usage      # ver consumo de un usuario
```

**Tier** (respuesta):
```jsonc
{ "id": "uuid", "name": "standard", "monthly_limit_usd": 5.0, "is_default": true, "enabled": true }
```

**Crear** (`POST /ai/admin/tiers`) → `201`:
```jsonc
{ "name": "pro", "monthly_limit_usd": 20.0, "enabled": true }   // monthly_limit_usd null = ilimitado
```

**Editar** (`PATCH /ai/admin/tiers/{tierId}`) — todos los campos opcionales:
```jsonc
{ "name": "pro", "monthly_limit_usd": 25.0, "enabled": true }
{ "unlimited": true }   // para quitar el tope (dejarlo ilimitado)
```

**Asignar tier** (`PUT /ai/admin/users/{userId}/tier`) → `204`:
```jsonc
{ "tier_id": "uuid" }
```

Tiers por defecto (seed): `unlimited` (sin tope), `standard` (default, USD 5/mes),
`disabled` (0). Un usuario sin tier asignado cae en el default (`standard`).

---

## Notas para el frontend

- **Precios/costo**: `usage.cost_usd` es un estimado (los precios de OpenAI pueden
  cambiar); sirve para mostrar consumo, no para facturar.
- **Confianza** (`confidence`): útil para colorear ítems (verde/amarillo/rojo) y
  avisar que la estimación por foto es orientativa (~35-40% de error; ver
  docs/ai-estimacion-calorias.md).
- **Privacidad**: las fotos se envían a OpenAI para el análisis. Conviene un aviso
  en la UI.
