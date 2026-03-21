import Departamentos from './components/Departamentos';

function App() {
  return (
    <div>
      <h1 style={{
        textAlign: 'center',
        padding: '1.5rem',
        margin: 0,
        background: '#0d1117',
        backgroundClip: 'text',
        fontSize: '2rem',
        fontWeight: 700,
        color: '#4dd9d9',
        fontFamily: 'sans-serif'
      }}>
        Sistema de Nóminas
      </h1>
      <Departamentos />
    </div>
  );
}

export default App;