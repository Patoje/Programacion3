import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { useChainId } from 'wagmi'
import { CONTRACT_ADDRESSES, FAUCET_TOKEN_ABI } from '../config/wagmi'

/**
 * Hook para obtener el balance de tokens de una dirección
 */
export function useTokenBalance(address?: `0x${string}`) {
  const chainId = useChainId()
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: FAUCET_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  })
}

/**
 * Hook para verificar si una dirección ya reclamó tokens
 */
export function useHasClaimed(address?: `0x${string}`) {
  const chainId = useChainId()
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: FAUCET_TOKEN_ABI,
    functionName: 'hasAddressClaimed',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  })
}

/**
 * Hook para verificar si una dirección ya reclamó tokens (alias para compatibilidad)
 */
export function useHasAddressClaimed(address?: `0x${string}`) {
  return useHasClaimed(address)
}

/**
 * Hook para obtener el símbolo del token
 */
export function useTokenSymbol() {
  const chainId = useChainId()
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: FAUCET_TOKEN_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!contractAddress,
    },
  }) as { data: string | undefined; isLoading: boolean; error: Error | null }
}

/**
 * Hook para obtener el nombre del token
 */
export function useTokenName() {
  const chainId = useChainId()
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: FAUCET_TOKEN_ABI,
    functionName: 'name',
    query: {
      enabled: !!contractAddress,
    },
  }) as { data: string | undefined; isLoading: boolean; error: Error | null }
}

/**
 * Hook para obtener los decimales del token
 */
export function useTokenDecimals() {
  const chainId = useChainId()
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: FAUCET_TOKEN_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!contractAddress,
    },
  }) as { data: number | undefined; isLoading: boolean; error: Error | null }
}

/**
 * Hook para obtener la cantidad de tokens del faucet
 */
export function useFaucetAmount() {
  const chainId = useChainId()
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: FAUCET_TOKEN_ABI,
    functionName: 'getFaucetAmount',
    query: {
      enabled: !!contractAddress,
    },
  })
}

/**
 * Hook para reclamar tokens del faucet
 */
export function useClaimTokens() {
  const chainId = useChainId()
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
  
  const { writeContract, data: hash, error, isPending } = useWriteContract()

  const claimTokens = () => {
    if (!contractAddress) {
      throw new Error('Contract address not found for current chain')
    }
    
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: FAUCET_TOKEN_ABI,
      functionName: 'claimTokens',
    })
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    claimTokens,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  }
}

/**
 * Hook para transferir tokens
 */
export function useTransferTokens() {
  const chainId = useChainId()
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
  
  const { writeContract, data: hash, error, isPending } = useWriteContract()

  const transferTokens = (to: `0x${string}`, amount: string) => {
    if (!contractAddress) {
      throw new Error('Contract address not found for current chain')
    }
    
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: FAUCET_TOKEN_ABI,
      functionName: 'transfer',
      args: [to, parseEther(amount)],
    })
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    transferTokens,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  }
}

/**
 * Hook para aprobar tokens para gasto
 */
export function useApproveTokens() {
  const chainId = useChainId()
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
  
  const { writeContract, data: hash, error, isPending } = useWriteContract()

  const approveTokens = (spender: `0x${string}`, amount: string) => {
    if (!contractAddress) {
      throw new Error('Contract address not found for current chain')
    }
    
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: FAUCET_TOKEN_ABI,
      functionName: 'approve',
      args: [spender, parseEther(amount)],
    })
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    approveTokens,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  }
}

/**
 * Hook para verificar allowance
 */
export function useAllowance(owner?: `0x${string}`, spender?: `0x${string}`) {
  const chainId = useChainId()
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: FAUCET_TOKEN_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender && !!contractAddress,
    },
  })
}

/**
 * Hook para obtener la lista de usuarios que han interactuado con el faucet
 */
export function useFaucetUsers() {
  const chainId = useChainId()
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: FAUCET_TOKEN_ABI,
    functionName: 'getFaucetUsers',
    query: {
      enabled: !!contractAddress,
      refetchInterval: 10000, // Actualizar cada 10 segundos
    },
  }) as { data: string[] | undefined; isLoading: boolean; error: Error | null }
}

/**
 * Utility function para formatear tokens
 */
export function formatTokenAmount(amount: bigint | undefined): string {
  if (!amount) return '0'
  return formatEther(amount)
}