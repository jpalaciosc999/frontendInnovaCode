# Backend: cambio de contrato en `PUT /empleados/:id`

Cuando el payload incluya `tic_id`, `emp_fecha_inicio_contrato` o `emp_fecha_fin_contrato`, el backend debe tratar el cambio como una operacion transaccional sobre `EMP_EMPLEADO_CONTRATO`.

## Flujo obligatorio

1. Iniciar transaccion.
2. Buscar contrato vigente:

```sql
SELECT *
FROM EMP_EMPLEADO_CONTRATO
WHERE EMP_ID = :id
  AND TCO_ES_ACTUAL = 1
FOR UPDATE;
```

3. Si existe y cambio el contrato, exigir `emp_motivo_cambio_contrato`.
4. Cerrar contrato anterior:

```sql
UPDATE EMP_EMPLEADO_CONTRATO
SET TCO_FECHA_FIN = :fecha_inicio_nuevo - 1,
    TCO_ES_ACTUAL = 0,
    TCO_MOTIVO_CAMBIO = :emp_motivo_cambio_contrato,
    TCO_FECHA_ACTUALIZACION = SYSDATE
WHERE TCO_ID = :tco_id_actual;
```

5. Insertar contrato nuevo:

```sql
INSERT INTO EMP_EMPLEADO_CONTRATO (
  EMP_ID,
  TIC_ID,
  TCO_FECHA_INICIO,
  TCO_FECHA_FIN,
  TCO_ESTADO,
  TCO_ES_ACTUAL,
  TCO_MOTIVO_CAMBIO,
  TIC_FECHA_MODIFICACION,
  TCO_FECHA_CREACION,
  TCO_FECHA_ACTUALIZACION
) VALUES (
  :id,
  :tic_id,
  :emp_fecha_inicio_contrato,
  :emp_fecha_fin_contrato,
  'A',
  1,
  :emp_motivo_cambio_contrato,
  SYSDATE,
  SYSDATE,
  SYSDATE
);
```

6. Actualizar `EMP_EMPLEADO` con los datos nuevos del empleado.
7. `COMMIT`.
8. Si cualquier paso falla, `ROLLBACK` y responder `500` con detalle.

## Validaciones

- Si se cambia contrato y no viene `emp_motivo_cambio_contrato`, responder `400`:

```json
{ "error": "Se requiere motivo de cambio de contrato" }
```

- No permitir mas de un contrato vigente por empleado. La base lo refuerza con `UX_TCO_EMPLEADO_ACTUAL`.
- No permitir periodos de contrato solapados por empleado.
- Si el tipo de contrato es indefinido, guardar `TCO_FECHA_FIN` como `NULL`.
- Si no es indefinido, exigir `emp_fecha_fin_contrato`.

## Pseudocodigo Node/oracledb

```ts
async function actualizarEmpleado(req, res) {
  const empId = Number(req.params.id);
  const payload = req.body;
  const cambioContrato =
    payload.tic_id !== undefined ||
    payload.emp_fecha_inicio_contrato !== undefined ||
    payload.emp_fecha_fin_contrato !== undefined;

  const conn = await pool.getConnection();

  try {
    if (cambioContrato) {
      const actual = await conn.execute(
        `SELECT *
         FROM EMP_EMPLEADO_CONTRATO
         WHERE EMP_ID = :empId
           AND TCO_ES_ACTUAL = 1
         FOR UPDATE`,
        { empId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const contratoActual = actual.rows?.[0];
      const cambioTic = contratoActual && Number(contratoActual.TIC_ID) !== Number(payload.tic_id);
      const cambioFechas =
        contratoActual &&
        (normalizarFecha(contratoActual.TCO_FECHA_INICIO) !== payload.emp_fecha_inicio_contrato ||
         normalizarFecha(contratoActual.TCO_FECHA_FIN) !== (payload.emp_fecha_fin_contrato || null));
      const debeCrearHistorico = !contratoActual || cambioTic || cambioFechas;

      if (contratoActual && debeCrearHistorico && !payload.emp_motivo_cambio_contrato) {
        await conn.rollback();
        return res.status(400).json({ error: 'Se requiere motivo de cambio de contrato' });
      }

      if (contratoActual && debeCrearHistorico) {
        await conn.execute(
          `UPDATE EMP_EMPLEADO_CONTRATO
           SET TCO_FECHA_FIN = TO_DATE(:inicioNuevo, 'YYYY-MM-DD') - 1,
               TCO_ES_ACTUAL = 0,
               TCO_MOTIVO_CAMBIO = :motivo,
               TCO_FECHA_ACTUALIZACION = SYSDATE
           WHERE TCO_ID = :tcoId`,
          {
            inicioNuevo: payload.emp_fecha_inicio_contrato,
            motivo: payload.emp_motivo_cambio_contrato,
            tcoId: contratoActual.TCO_ID,
          }
        );
      }

      if (debeCrearHistorico) {
        await conn.execute(
          `INSERT INTO EMP_EMPLEADO_CONTRATO (
             EMP_ID, TIC_ID, TCO_FECHA_INICIO, TCO_FECHA_FIN, TCO_ESTADO,
             TCO_ES_ACTUAL, TCO_MOTIVO_CAMBIO, TIC_FECHA_MODIFICACION,
             TCO_FECHA_CREACION, TCO_FECHA_ACTUALIZACION
           ) VALUES (
             :empId, :ticId, TO_DATE(:inicio, 'YYYY-MM-DD'),
             CASE WHEN :fin IS NULL THEN NULL ELSE TO_DATE(:fin, 'YYYY-MM-DD') END,
             'A', 1, :motivo, SYSDATE, SYSDATE, SYSDATE
           )`,
          {
            empId,
            ticId: payload.tic_id,
            inicio: payload.emp_fecha_inicio_contrato,
            fin: payload.emp_fecha_fin_contrato || null,
            motivo: payload.emp_motivo_cambio_contrato || null,
          }
        );
      }
    }

    await conn.execute(
      `UPDATE EMP_EMPLEADO
       SET TIC_ID = :ticId,
           EMP_FECHA_INICIO_CONTRATO = TO_DATE(:inicio, 'YYYY-MM-DD'),
           EMP_FECHA_FIN_CONTRATO =
             CASE WHEN :fin IS NULL THEN NULL ELSE TO_DATE(:fin, 'YYYY-MM-DD') END,
           EMP_FECHA_MODIFICACION = SYSDATE
       WHERE EMP_ID = :empId`,
      {
        empId,
        ticId: payload.tic_id,
        inicio: payload.emp_fecha_inicio_contrato,
        fin: payload.emp_fecha_fin_contrato || null,
      }
    );

    await conn.commit();
    return res.json({ ok: true });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({
      error: 'Error actualizando empleado/contrato',
      detail: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await conn.close();
  }
}
```

