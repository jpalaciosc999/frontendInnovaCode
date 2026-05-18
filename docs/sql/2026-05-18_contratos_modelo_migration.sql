-- Migracion: corregir modelo de contratos y restricciones de nomina
-- Base de datos: Oracle
--
-- IMPORTANTE:
-- - Oracle hace COMMIT implicito antes/despues de DDL (ALTER TABLE, CREATE INDEX).
-- - Ejecuta primero la seccion 1 (DML) y valida los SELECT de control antes de continuar.
-- - Ejecuta este script en ventana de mantenimiento y con respaldo reciente.

SET SERVEROUTPUT ON;

PROMPT ============================================================
PROMPT 1. PRECHECK: EMP_ID en EMP_TIPO_CONTRATO sin relacion
PROMPT ============================================================

DECLARE
  v_has_emp_id NUMBER := 0;
  v_orphans NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO v_has_emp_id
  FROM USER_TAB_COLUMNS
  WHERE TABLE_NAME = 'EMP_TIPO_CONTRATO'
    AND COLUMN_NAME = 'EMP_ID';

  IF v_has_emp_id = 0 THEN
    DBMS_OUTPUT.PUT_LINE('EMP_TIPO_CONTRATO.EMP_ID no existe; precheck omitido.');
    RETURN;
  END IF;

  EXECUTE IMMEDIATE q'[
    SELECT COUNT(*)
    FROM EMP_TIPO_CONTRATO tic
    WHERE tic.EMP_ID IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM EMP_EMPLEADO_CONTRATO tco
        WHERE tco.EMP_ID = tic.EMP_ID
          AND tco.TIC_ID = tic.TIC_ID
      )
  ]' INTO v_orphans;

  DBMS_OUTPUT.PUT_LINE('Registros huerfanos detectados: ' || v_orphans);
END;
/

PROMPT ============================================================
PROMPT 2. DML: migrar registros huerfanos a EMP_EMPLEADO_CONTRATO
PROMPT ============================================================

DECLARE
  v_rows NUMBER := 0;
  v_orphans NUMBER := 0;
  v_has_emp_id NUMBER := 0;
  v_has_inicio_contrato NUMBER := 0;
  v_has_fin_contrato NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO v_has_emp_id
  FROM USER_TAB_COLUMNS
  WHERE TABLE_NAME = 'EMP_TIPO_CONTRATO'
    AND COLUMN_NAME = 'EMP_ID';

  IF v_has_emp_id = 0 THEN
    DBMS_OUTPUT.PUT_LINE('EMP_TIPO_CONTRATO.EMP_ID no existe; se omite migracion DML.');
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO v_has_inicio_contrato
  FROM USER_TAB_COLUMNS
  WHERE TABLE_NAME = 'EMP_EMPLEADO'
    AND COLUMN_NAME = 'EMP_FECHA_INICIO_CONTRATO';

  SELECT COUNT(*)
  INTO v_has_fin_contrato
  FROM USER_TAB_COLUMNS
  WHERE TABLE_NAME = 'EMP_EMPLEADO'
    AND COLUMN_NAME = 'EMP_FECHA_FIN_CONTRATO';

  SAVEPOINT SP_MIGRA_TIPO_CONTRATO;

  IF v_has_inicio_contrato = 1 AND v_has_fin_contrato = 1 THEN
    EXECUTE IMMEDIATE q'[
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
      )
      SELECT
        tic.EMP_ID,
        tic.TIC_ID,
        NVL(emp.EMP_FECHA_INICIO_CONTRATO, NVL(emp.EMP_FECHA_CONTRATACION, TRUNC(SYSDATE))),
        emp.EMP_FECHA_FIN_CONTRATO,
        'A',
        1,
        'Migrado desde EMP_TIPO_CONTRATO.EMP_ID',
        NVL(tic.TIC_FECHA_MODIFICACION, SYSDATE),
        SYSDATE,
        SYSDATE
      FROM EMP_TIPO_CONTRATO tic
      JOIN EMP_EMPLEADO emp
        ON emp.EMP_ID = tic.EMP_ID
      WHERE tic.EMP_ID IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM EMP_EMPLEADO_CONTRATO tco
          WHERE tco.EMP_ID = tic.EMP_ID
            AND tco.TIC_ID = tic.TIC_ID
        )
    ]';
  ELSE
    EXECUTE IMMEDIATE q'[
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
      )
      SELECT
        tic.EMP_ID,
        tic.TIC_ID,
        NVL(emp.EMP_FECHA_CONTRATACION, TRUNC(SYSDATE)),
        NULL,
        'A',
        1,
        'Migrado desde EMP_TIPO_CONTRATO.EMP_ID',
        NVL(tic.TIC_FECHA_MODIFICACION, SYSDATE),
        SYSDATE,
        SYSDATE
      FROM EMP_TIPO_CONTRATO tic
      JOIN EMP_EMPLEADO emp
        ON emp.EMP_ID = tic.EMP_ID
      WHERE tic.EMP_ID IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM EMP_EMPLEADO_CONTRATO tco
          WHERE tco.EMP_ID = tic.EMP_ID
            AND tco.TIC_ID = tic.TIC_ID
        )
    ]';
  END IF;

  v_rows := SQL%ROWCOUNT;

  EXECUTE IMMEDIATE q'[
    SELECT COUNT(*)
    FROM EMP_TIPO_CONTRATO tic
    WHERE tic.EMP_ID IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM EMP_EMPLEADO_CONTRATO tco
        WHERE tco.EMP_ID = tic.EMP_ID
          AND tco.TIC_ID = tic.TIC_ID
      )
  ]' INTO v_orphans;

  IF v_orphans > 0 THEN
    ROLLBACK TO SP_MIGRA_TIPO_CONTRATO;
    RAISE_APPLICATION_ERROR(
      -20001,
      'Quedan EMP_ID huerfanos en EMP_TIPO_CONTRATO: ' || v_orphans || '. Se hizo rollback del DML.'
    );
  END IF;

  COMMIT;
  DBMS_OUTPUT.PUT_LINE('Registros migrados a EMP_EMPLEADO_CONTRATO: ' || v_rows);
END;
/

PROMPT Validacion posterior: debe devolver 0 filas
DECLARE
  v_has_emp_id NUMBER := 0;
  v_orphans NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO v_has_emp_id
  FROM USER_TAB_COLUMNS
  WHERE TABLE_NAME = 'EMP_TIPO_CONTRATO'
    AND COLUMN_NAME = 'EMP_ID';

  IF v_has_emp_id = 0 THEN
    DBMS_OUTPUT.PUT_LINE('EMP_TIPO_CONTRATO.EMP_ID no existe; validacion posterior omitida.');
    RETURN;
  END IF;

  EXECUTE IMMEDIATE q'[
    SELECT COUNT(*)
    FROM EMP_TIPO_CONTRATO tic
    WHERE tic.EMP_ID IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM EMP_EMPLEADO_CONTRATO tco
        WHERE tco.EMP_ID = tic.EMP_ID
          AND tco.TIC_ID = tic.TIC_ID
      )
  ]' INTO v_orphans;

  DBMS_OUTPUT.PUT_LINE('Registros huerfanos despues de migrar: ' || v_orphans);
END;
/

PROMPT ============================================================
PROMPT 3. DDL: eliminar EMP_ID de EMP_TIPO_CONTRATO
PROMPT ============================================================

DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM USER_TAB_COLUMNS
  WHERE TABLE_NAME = 'EMP_TIPO_CONTRATO'
    AND COLUMN_NAME = 'EMP_ID';

  IF v_count = 1 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE EMP_TIPO_CONTRATO DROP COLUMN EMP_ID';
    DBMS_OUTPUT.PUT_LINE('Columna EMP_TIPO_CONTRATO.EMP_ID eliminada.');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Columna EMP_TIPO_CONTRATO.EMP_ID no existe; se omite.');
  END IF;
END;
/

PROMPT ============================================================
PROMPT 4. Indice unico: un contrato vigente por empleado
PROMPT ============================================================

DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM USER_INDEXES
  WHERE INDEX_NAME = 'UX_TCO_EMPLEADO_ACTUAL';

  IF v_count = 0 THEN
    BEGIN
      EXECUTE IMMEDIATE q'[
        CREATE UNIQUE INDEX UX_TCO_EMPLEADO_ACTUAL
        ON EMP_EMPLEADO_CONTRATO (
          CASE WHEN TCO_ES_ACTUAL = 1 THEN EMP_ID END
        )
      ]';
      DBMS_OUTPUT.PUT_LINE('Indice UX_TCO_EMPLEADO_ACTUAL creado.');
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE = -1408 THEN
          DBMS_OUTPUT.PUT_LINE('Ya existe un indice equivalente para contrato vigente; se omite.');
        ELSE
          RAISE;
        END IF;
    END;
  ELSE
    DBMS_OUTPUT.PUT_LINE('Indice UX_TCO_EMPLEADO_ACTUAL ya existe; se omite.');
  END IF;
END;
/

PROMPT ============================================================
PROMPT 5. Indice unico: concepto activo por periodo/empleado
PROMPT ============================================================

DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM USER_INDEXES
  WHERE INDEX_NAME = 'UX_NAS_PER_EMP_CONCEPTO';

  IF v_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE UNIQUE INDEX UX_NAS_PER_EMP_CONCEPTO
      ON EMP_NOMINA_ASIGNACION (
        PER_ID,
        EMP_ID,
        NAS_TIPO,
        NVL(TIS_ID, -1),
        NVL(TDS_ID, -1),
        CASE WHEN NAS_ESTADO = 'A' THEN 1 END
      )
    ]';
    DBMS_OUTPUT.PUT_LINE('Indice UX_NAS_PER_EMP_CONCEPTO creado.');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Indice UX_NAS_PER_EMP_CONCEPTO ya existe; se omite.');
  END IF;
END;
/

PROMPT ============================================================
PROMPT 6. Campos faltantes: EMP_CUENTA_BANCARIA
PROMPT ============================================================

DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM USER_TAB_COLUMNS
  WHERE TABLE_NAME = 'EMP_CUENTA_BANCARIA'
    AND COLUMN_NAME = 'CUE_ES_PRINCIPAL';

  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE EMP_CUENTA_BANCARIA ADD CUE_ES_PRINCIPAL NUMBER(1) DEFAULT 1';
    DBMS_OUTPUT.PUT_LINE('Columna CUE_ES_PRINCIPAL agregada.');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Columna CUE_ES_PRINCIPAL ya existe; se omite.');
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM USER_TAB_COLUMNS
  WHERE TABLE_NAME = 'EMP_CUENTA_BANCARIA'
    AND COLUMN_NAME = 'CUE_ESTADO';

  IF v_count = 0 THEN
    EXECUTE IMMEDIATE q'[ALTER TABLE EMP_CUENTA_BANCARIA ADD CUE_ESTADO CHAR(1) DEFAULT 'A']';
    DBMS_OUTPUT.PUT_LINE('Columna CUE_ESTADO agregada.');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Columna CUE_ESTADO ya existe; se omite.');
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM USER_CONSTRAINTS
  WHERE TABLE_NAME = 'EMP_CUENTA_BANCARIA'
    AND CONSTRAINT_NAME = 'CK_CUE_ESTADO';

  IF v_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE EMP_CUENTA_BANCARIA
      ADD CONSTRAINT CK_CUE_ESTADO CHECK (CUE_ESTADO IN ('A','I'))
    ]';
    DBMS_OUTPUT.PUT_LINE('Constraint CK_CUE_ESTADO creada.');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Constraint CK_CUE_ESTADO ya existe; se omite.');
  END IF;
END;
/

PROMPT ============================================================
PROMPT 7. Campos faltantes: EMP_KPI_RESULTADO.EMP_ID
PROMPT ============================================================

DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM USER_TAB_COLUMNS
  WHERE TABLE_NAME = 'EMP_KPI_RESULTADO'
    AND COLUMN_NAME = 'EMP_ID';

  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE EMP_KPI_RESULTADO ADD EMP_ID NUMBER';
    DBMS_OUTPUT.PUT_LINE('Columna EMP_KPI_RESULTADO.EMP_ID agregada.');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Columna EMP_KPI_RESULTADO.EMP_ID ya existe; se omite.');
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM USER_CONSTRAINTS
  WHERE TABLE_NAME = 'EMP_KPI_RESULTADO'
    AND CONSTRAINT_NAME = 'FK_KRE_EMP';

  IF v_count = 0 THEN
    BEGIN
      EXECUTE IMMEDIATE q'[
        ALTER TABLE EMP_KPI_RESULTADO
        ADD CONSTRAINT FK_KRE_EMP FOREIGN KEY (EMP_ID) REFERENCES EMP_EMPLEADO(EMP_ID)
      ]';
      DBMS_OUTPUT.PUT_LINE('Constraint FK_KRE_EMP creada.');
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE = -2275 THEN
          DBMS_OUTPUT.PUT_LINE('Ya existe una FK equivalente para EMP_KPI_RESULTADO.EMP_ID; se omite.');
        ELSE
          RAISE;
        END IF;
    END;
  ELSE
    DBMS_OUTPUT.PUT_LINE('Constraint FK_KRE_EMP ya existe; se omite.');
  END IF;
END;
/

PROMPT ============================================================
PROMPT 8. EMP_NOMINA: permitir estado R (Rechazada)
PROMPT ============================================================

DECLARE
  v_constraint_name USER_CONSTRAINTS.CONSTRAINT_NAME%TYPE;
  v_count NUMBER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM USER_CONSTRAINTS
  WHERE TABLE_NAME = 'EMP_NOMINA'
    AND CONSTRAINT_NAME = 'CK_NOM_ESTADO';

  IF v_count = 1 THEN
    SELECT CONSTRAINT_NAME
    INTO v_constraint_name
    FROM USER_CONSTRAINTS
    WHERE TABLE_NAME = 'EMP_NOMINA'
      AND CONSTRAINT_NAME = 'CK_NOM_ESTADO';

    EXECUTE IMMEDIATE 'ALTER TABLE EMP_NOMINA DROP CONSTRAINT ' || v_constraint_name;
    DBMS_OUTPUT.PUT_LINE('Constraint CK_NOM_ESTADO anterior eliminada.');
  ELSE
    BEGIN
      SELECT CONSTRAINT_NAME
      INTO v_constraint_name
      FROM USER_CONSTRAINTS
      WHERE TABLE_NAME = 'EMP_NOMINA'
        AND CONSTRAINT_TYPE = 'C'
        AND SEARCH_CONDITION_VC LIKE '%NOM_ESTADO%'
        AND ROWNUM = 1;

      EXECUTE IMMEDIATE 'ALTER TABLE EMP_NOMINA DROP CONSTRAINT ' || v_constraint_name;
      DBMS_OUTPUT.PUT_LINE('Constraint de NOM_ESTADO eliminada: ' || v_constraint_name);
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('No se encontro constraint previa de NOM_ESTADO.');
    END;
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM USER_CONSTRAINTS
  WHERE TABLE_NAME = 'EMP_NOMINA'
    AND CONSTRAINT_NAME = 'CK_NOM_ESTADO';

  IF v_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE EMP_NOMINA
      ADD CONSTRAINT CK_NOM_ESTADO CHECK (NOM_ESTADO IN ('B','P','A','R','I'))
    ]';
    DBMS_OUTPUT.PUT_LINE('Constraint CK_NOM_ESTADO creada con estado R.');
  END IF;
END;
/

PROMPT ============================================================
PROMPT 9. Validaciones finales recomendadas
PROMPT ============================================================

PROMPT Empleados con mas de un contrato vigente: debe devolver 0 filas
SELECT EMP_ID, COUNT(*) AS CONTRATOS_ACTUALES
FROM EMP_EMPLEADO_CONTRATO
WHERE TCO_ES_ACTUAL = 1
GROUP BY EMP_ID
HAVING COUNT(*) > 1;

PROMPT Conceptos activos duplicados: debe devolver 0 filas
SELECT
  PER_ID,
  EMP_ID,
  NAS_TIPO,
  NVL(TIS_ID, -1) AS TIS_KEY,
  NVL(TDS_ID, -1) AS TDS_KEY,
  COUNT(*) AS TOTAL
FROM EMP_NOMINA_ASIGNACION
WHERE NAS_ESTADO = 'A'
GROUP BY
  PER_ID,
  EMP_ID,
  NAS_TIPO,
  NVL(TIS_ID, -1),
  NVL(TDS_ID, -1)
HAVING COUNT(*) > 1;
