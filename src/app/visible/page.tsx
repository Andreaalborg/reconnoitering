export default function VisiblePage() {
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'lightblue',
      color: 'black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Synlig Test</h1>
        <p>Hvis du ser dette på blå bakgrunn, fungerer rendering!</p>
        <p style={{ fontSize: '14px', marginTop: '20px' }}>
          KaTeX-advarselen kan ignoreres - den kommer sannsynligvis fra en browser-utvidelse.
        </p>
      </div>
    </div>
  );
} 