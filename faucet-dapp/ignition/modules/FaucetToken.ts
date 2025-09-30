import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Módulo de despliegue para el contrato FaucetToken
 * Despliega un token ERC20 con funcionalidad de faucet
 */
const FaucetTokenModule = buildModule("FaucetTokenModule", (m) => {
  // Parámetros del token
  const tokenName = m.getParameter("tokenName", "FaucetToken");
  const tokenSymbol = m.getParameter("tokenSymbol", "FAUCET");

  // Desplegar el contrato FaucetToken
  const faucetToken = m.contract("FaucetToken", [tokenName, tokenSymbol]);

  return { faucetToken };
});

export default FaucetTokenModule;