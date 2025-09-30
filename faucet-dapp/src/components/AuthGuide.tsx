import React, { useState } from 'react';
import { useAccount } from 'wagmi';

/**
 * Componente guía que explica cómo usar la autenticación SIWE paso a paso
 */
export function AuthGuide() {
  const { isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Conectar Wallet",
      description: "Primero necesitas conectar tu wallet MetaMask o compatible",
      icon: "🔗",
      status: isConnected ? "completed" : "pending"
    },
    {
      id: 2,
      title: "Autenticación SIWE",
      description: "Firma un mensaje para autenticarte (sin costo de gas)",
      icon: "🔐",
      status: isConnected ? "active" : "disabled"
    },
    {
      id: 3,
      title: "Reclamar Tokens",
      description: "Una vez autenticado, podrás reclamar tus tokens gratuitos",
      icon: "🎁",
      status: "disabled"
    }
  ];

  return (
    <div className="auth-guide">
      <div className="guide-header">
        <h3>📋 Guía de Uso</h3>
        <p>Sigue estos pasos para usar el Faucet DApp</p>
      </div>

      <div className="steps-container">
        {steps.map((step) => (
          <div 
            key={step.id}
            className={`step-item ${step.status}`}
            onClick={() => setCurrentStep(step.id)}
          >
            <div className="step-number">
              <span className="step-icon">{step.icon}</span>
              <span className="step-index">{step.id}</span>
            </div>
            
            <div className="step-content">
              <h4>{step.title}</h4>
              <p>{step.description}</p>
              
              {step.status === "completed" && (
                <div className="step-status success">
                  <span>✅</span>
                  <span>Completado</span>
                </div>
              )}
              
              {step.status === "active" && (
                <div className="step-status active">
                  <span>⚡</span>
                  <span>Siguiente paso</span>
                </div>
              )}
              
              {step.status === "disabled" && (
                <div className="step-status disabled">
                  <span>⏳</span>
                  <span>Pendiente</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Información detallada del paso actual */}
      <div className="step-details">
        {currentStep === 1 && (
          <div className="detail-content">
            <h4>🔗 Paso 1: Conectar Wallet</h4>
            <div className="detail-info">
              <p><strong>¿Qué hacer?</strong></p>
              <ol>
                <li>Haz clic en el botón <strong>"Conectar Wallet"</strong> en la esquina superior derecha</li>
                <li>Selecciona tu wallet preferida (MetaMask recomendado)</li>
                <li>Autoriza la conexión en tu wallet</li>
                <li>Verifica que tu dirección aparezca en el header</li>
              </ol>
              
              <div className="tip-box">
                <span className="tip-icon">💡</span>
                <p><strong>Tip:</strong> Asegúrate de estar conectado a la red Sepolia Testnet</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="detail-content">
            <h4>🔐 Paso 2: Autenticación SIWE</h4>
            <div className="detail-info">
              <p><strong>¿Qué es SIWE?</strong></p>
              <p>Sign-In with Ethereum es un estándar que te permite autenticarte usando tu wallet sin costo de gas.</p>
              
              <p><strong>¿Cómo funciona?</strong></p>
              <ol>
                <li>Haz clic en <strong>"🔐 Autenticarse"</strong></li>
                <li>El sistema genera un mensaje único</li>
                <li>Tu wallet te pedirá firmar el mensaje</li>
                <li>Haz clic en <strong>"Firmar"</strong> en tu wallet</li>
                <li>¡Listo! Estarás autenticado</li>
              </ol>
              
              <div className="warning-box">
                <span className="warning-icon">⚠️</span>
                <p><strong>Importante:</strong> Firmar el mensaje NO cuesta gas ni dinero real</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="detail-content">
            <h4>🎁 Paso 3: Reclamar Tokens</h4>
            <div className="detail-info">
              <p><strong>¿Cómo reclamar?</strong></p>
              <ol>
                <li>Una vez autenticado, verás el botón <strong>"🎁 Reclamar Tokens"</strong></li>
                <li>Haz clic en el botón</li>
                <li>Espera la confirmación del backend</li>
                <li>¡Recibirás 1,000,000 FTKN tokens!</li>
              </ol>
              
              <div className="info-box">
                <span className="info-icon">ℹ️</span>
                <p><strong>Nota:</strong> Solo puedes reclamar tokens una vez por dirección</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Troubleshooting */}
      <div className="troubleshooting">
        <h4>🔧 Solución de Problemas</h4>
        <div className="faq-item">
          <strong>❓ No puedo firmar el mensaje</strong>
          <p>• Verifica que tu wallet esté desbloqueada</p>
          <p>• Asegúrate de estar en la red Sepolia</p>
          <p>• Intenta refrescar la página y reconectar</p>
        </div>
        
        <div className="faq-item">
          <strong>❓ Error "Mensaje inválido"</strong>
          <p>• Espera unos segundos e intenta nuevamente</p>
          <p>• Verifica que ambos servidores estén corriendo</p>
          <p>• Revisa la consola del navegador para más detalles</p>
        </div>
        
        <div className="faq-item">
          <strong>❓ No aparece el botón de reclamar</strong>
          <p>• Primero debes conectar tu wallet</p>
          <p>• Luego debes autenticarte con SIWE</p>
          <p>• Solo entonces aparecerá la opción de reclamar</p>
        </div>
      </div>
    </div>
  );
}

export default AuthGuide;