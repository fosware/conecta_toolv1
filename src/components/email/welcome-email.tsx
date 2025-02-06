import * as React from 'react';

interface WelcomeEmailProps {
  name: string;
  username: string;
  password: string;
}

export const WelcomeEmail: React.FC<Readonly<WelcomeEmailProps>> = ({
  name,
  username,
  password,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <h2 style={{ color: '#2563eb' }}>¡Bienvenido a Conecta Tool!</h2>
    
    <p>Hola {name},</p>
    
    <p>Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales de acceso:</p>
    
    <div style={{ 
      backgroundColor: '#f5f5f5', 
      padding: '20px', 
      borderRadius: '5px', 
      margin: '20px 0',
      border: '1px solid #e5e7eb'
    }}>
      <p><strong>Usuario:</strong> {username}</p>
      <p><strong>Contraseña temporal:</strong> {password}</p>
    </div>
    
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontWeight: 'bold', color: '#dc2626' }}>Importante:</p>
      <ul style={{ paddingLeft: '20px' }}>
        <li>Por seguridad, deberás cambiar tu contraseña en tu primer inicio de sesión.</li>
        <li>Esta contraseña temporal es válida por un tiempo limitado.</li>
        <li>Si tienes problemas para acceder, contacta a tu administrador.</li>
      </ul>
    </div>
    
    <p>
      Puedes acceder al sistema en:{' '}
      <a 
        href="https://conectatool.com" 
        style={{ color: '#2563eb', textDecoration: 'none' }}
      >
        https://conectatool.com
      </a>
    </p>
    
    <p style={{ marginTop: '30px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
      ¡Gracias por usar Conecta Tool!
    </p>
  </div>
);
