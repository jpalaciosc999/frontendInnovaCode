export interface Sede {
    SED_ID: number;
    SED_NOMBRE: string;
    SED_TELEFONO: number;
    SED_DEPARTAMENTO: string;
    SED_MUNICIPIO: string;
    SED_ZONA: string;
}

export interface SedeForm {
    sed_nombre: string;
    sed_telefono: string | number;
    sed_departamento: string;
    sed_municipio: string;
    sed_zona: string;
}