import { useEffect, useState } from 'react';
import api from '../api/axios';

function PruebaAxios() {
  const [datos, setDatos]       = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get('empleados')
      .then(response => {
        setDatos(response.data);
        setCargando(false);
      })
      .catch(err => {
        setError('Error: ' + err.message);
        setCargando(false);
      });
  }, []);

  if (cargando) return <p>Cargando...</p>;
  if (error)    return <p style={{color:'red'}}>{error}</p>;

  return (
    <div>
      <h2>Empleados: {datos.length}</h2>
      <pre>{JSON.stringify(datos, null, 2)}</pre>
    </div>
  );
}

export default PruebaAxios;