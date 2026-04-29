export interface Marcaje {
  MAR_ID: number;
  MAR_FECHA: string;
  MAR_ENTRADA: string;
  MAR_SALIDA: string | null; // Puede ser null si aún no marca salida
  EMP_ID: number;
  MAR_AUTORIZACION: number; // 0 para No, 1 para Sí 
  EMP_NOMBRE?: string;
  EMP_APELLIDO?: string;
  DIFERENCIA_HORAS?: string; // Para el cálculo hh:mm:ss [cite: 12]
}

// Interfaz para el estado del formulario simplificado
export interface MarcajeForm {
  emp_id: number;
  fecha: string; // Solo para visualización [cite: 7]
}