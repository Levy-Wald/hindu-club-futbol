# Menores + Tutores — Spec de negocio

Spec para implementar en sprints futuros (7, 9). No codear hasta llegar al sprint correspondiente.

---

## Registro: orden indistinto, con reglas

- **Caso A**: Se registra primero el padre/madre/tutor → agrega al hijo → vínculo automático
- **Caso B**: Se registra primero el menor (ej: llega de padrón CSV) → después se vincula al tutor
- **Caso C**: Inscripción familiar (se registran juntos)

**Regla clave:** un menor debe tener al menos 1 tutor vinculado antes de estar "activo" en un equipo. Sin tutor → `pendiente_revision`.

---

## Perfiles y acceso

| Persona | Perfil propio | Login | Ve en /mi-perfil |
|---|---|---|---|
| Padre/Madre/Tutor | Sí (atributo `padre_tutor`) | Sí (magic link) | Su ficha + fichas hijos + vehículos + pagos |
| Menor socio/jugador | Sí (atributo `menor_de_edad` + `jugador`) | No (sin `user_id`) | — |

El tutor accede al perfil del hijo desde `/mi-perfil` (Sprint 7). Puede ver datos, equipo, horarios, documentos médicos del hijo. Puede editar datos del hijo con limitaciones.

---

## Cuotas y pagos (Sprint 9)

NO va en vínculos. Va en el módulo de cuotas.

```
personas_cuotas
├── persona_id          -- el menor (titular de la cuota)
├── responsable_pago_id -- el padre/tutor que paga
├── plan_cuota_id
├── estado              -- al_dia, mora, exento
└── ...
```

- El **titular** de la cuota es el menor (jugador)
- El **responsable de pago** es el tutor vinculado
- Un tutor puede ser responsable de pago de N hijos
- Al vincular padre→hijo, el sistema sugiere asignar al padre como responsable de pago

---

## Vehículos: herencia por vínculo

1. El padre/tutor da de alta un vehículo en SU ficha
2. Al crear vínculo padre→hijo, los vehículos del padre se auto-asignan al hijo como "vehículo familiar"
3. El hijo NO puede crear/editar vehículos (es menor)
4. Si el padre agrega un vehículo nuevo → se propaga a hijos vinculados
5. En la ficha del hijo, los vehículos se muestran como "Vehículo de [Padre]" (read-only)

Cambios necesarios en `personas_vehiculos`:
- Campo `propietario_id uuid` (quién es dueño real)
- Campo `tipo text` (`propio` | `familiar`)
- Lógica al crear vínculo padre→hijo: copiar vehículos del padre

---

## Sprints donde se implementa

| Feature | Sprint |
|---|---|
| Validación "menor necesita tutor para estar activo" | 7 |
| /mi-perfil con vista de hijos | 7 |
| Vehículos heredados por vínculo | 7 |
| Cuotas con responsable de pago | 9 |

---

**Última actualización:** 2026-05-05
