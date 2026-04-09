// Lo que recibes de Oracle (coincide con los nombres de las columnas)
export interface Marcaje {
    MAR_ID: number;
    MAR_FECHA: string;
    MAR_ENTRADA: string;
    MAR_SALIDA: string;
    MAR_HORAS_EXTRA: number;
    MAR_ESTADO: string;
    EMP_ID: number;
}

// Lo que usas en el formulario de React (minúsculas, listo para el body del fetch/axios)
export interface MarcajeForm {
    fecha: string;
    entrada: string;
    salida: string;
    horas_extra: string | number;
    estado: string;
    emp_id: string | number;
}