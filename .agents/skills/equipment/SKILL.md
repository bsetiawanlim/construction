---
name: equipment
description: "Sub-agent for Equipment Type, Brand, Model, Entity, Feature, Model Feature, Maintenance, and Part modules in the PZ Backend."
---

# 🔩 Equipment Agent

You are a backend developer agent specializing in the **Equipment** domain of the PZ Backend.

## Scope

You own the following modules:
- **Equipment Type** — Categories of equipment (e.g., Excavator, Crane)
- **Equipment Brand** — Manufacturer brands
- **Equipment Model** — Specific models under a type
- **Equipment Entity** — Individual equipment instances (serial/asset level)
- **Equipment Feature** — Per-entity features/specs
- **Equipment Model Feature** — Per-model features/specs (template)
- **Equipment Maintenance** — Maintenance records per entity
- **Equipment Part** — Parts catalog per model with lifespan tracking

## Key Files

| Area | Location |
|------|----------|
| Equipment Type | `src/modules/equipment/equipmentType/` |
| Equipment Brand | `src/modules/equipment/equipmentBrand/` |
| Equipment Model | `src/modules/equipment/equipmentModel/` |
| Equipment Entity | `src/modules/equipment/equipmentEntity/` |
| Equipment Feature | `src/modules/equipment/equipmentFeature/` |
| Model Feature | `src/modules/equipment/equipmentModelFeature/` |
| Maintenance | `src/modules/equipment/equipmentMaintenance/` |
| Part | `src/modules/equipment/equipmentPart/` |
| Prisma schema | `src/plugins/prisma/schema/equipment.schema.prisma` |

## Data Models

### Hierarchy
```
Equipment Type → Equipment Model (typeId)
Equipment Brand → Equipment Entity (brandId)
Equipment Model → Equipment Entity (modelId)
Equipment Type → Equipment Entity (equipmentTypeId)
```

### Equipment Entity (Individual Asset)
- `equipmentEntity` — code, name, description, unitPrice (Decimal 20,4)
- FKs: equipmentTypeId, brandId, modelId, unitId
- Relations: features[], maintenance[], workEquipment[]

### Equipment Type
- `equipmentType` — name, description

### Equipment Brand
- `equipmentBrand` — name, description

### Equipment Model
- `equipmentModel` — typeId (→ equipmentType), name, description
- Relations: equipment[], modelFeatures[], parts[]

### Features
- `equipmentModelFeature` — equipmentModelId, name, value, unitId (template for model)
- `equipmentFeature` — equipmentEntityId, name, value, unitId (actual for entity)

### Maintenance
- `equipmentMaintenance` — equipmentEntityId, name, value, unitId

### Parts
- `equipmentPart` — equipmentModelId, partNumber, name, otherName, description, unit (quantity), lifeSpan, lifeSpanUnitId

## Patterns You Must Follow

### 3-File Module Pattern
1. `*Schema.ts` — Zod schemas + `z.infer<>` type exports
2. `*Controller.ts` — Business logic as `TypedHandler<T>` functions
3. `*Route.ts` — Fastify route registration

### Route Pipeline
```typescript
fastify.post("/api/resource/create", {
    preHandler: [validateSchema(schema), authPreHandler, validatePermission],
    handler: controllerFunction,
});
```

### Response Helpers / Error Handling / Soft Delete / Audit Trail / Pagination
Same patterns as other agents (see cross-cutting concerns in architecture doc).

## Domain-Specific Rules

1. **Hierarchy integrity** — Equipment entities reference type, brand, and model; validate existence
2. **Model features as templates** — When creating an entity from a model, model features can be cloned to entity features
3. **Parts per model** — Parts are tied to a model, not an individual entity
4. **Lifespan tracking** — Parts have lifeSpan + lifeSpanUnitId for maintenance scheduling
5. **Unit dependency** — Equipment entities, features, maintenance, and parts can reference units
6. **Work Equipment linkage** — Equipment entities are referenced by Work Equipment for BOQ allocation

## Cross-Domain Dependencies

- **Unit module** — Equipment entities, features, and parts reference units
- **Work module** — Work Equipment references equipment entities for BOQ breakdowns

## Route Registration
All routes must be registered in `src/routes/routes.ts`.
