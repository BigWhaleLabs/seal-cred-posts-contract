import { ethers, run } from 'hardhat'
import prompt from 'prompt'

const regexes = {
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
}

async function main() {
  const [deployer] = await ethers.getSigners()

  // Deploy the contract
  console.log('Deploying contracts with the account:', deployer.address)
  console.log('Account balance:', (await deployer.getBalance()).toString())

  const provider = ethers.provider
  const { chainId } = await provider.getNetwork()
  const chains = {
    1: 'mainnet',
    3: 'ropsten',
    4: 'rinkeby',
    5: 'goerli',
  } as { [chainId: number]: string }
  const chainName = chains[chainId]

  // SCEmailPosts
  const SCEmailPosts = 'SCEmailPosts'
  const SCNFTPosts = 'SCNFTPosts'
  console.log(`Deploying ${SCEmailPosts}...`)
  const SCEmailPostsFactory = await ethers.getContractFactory(SCEmailPosts)
  const SCNFTPostsFactory = await ethers.getContractFactory(SCNFTPosts)
  const {
    SCEmailLedgerAddress,
    SCERC721LedgerAddress,
    maxPostLength,
    infixLength,
  } = await prompt.get({
    properties: {
      SCEmailLedgerAddress: {
        required: true,
        pattern: regexes.ethereumAddress,
        message: `Ledger address for ${SCEmailPosts}`,
        default: '0xCd990C45d0B794Bbb47Ad31Ee3567a36c0c872e0',
      },
      SCERC721LedgerAddress: {
        required: true,
        pattern: regexes.ethereumAddress,
        message: `Ledger address for ${SCNFTPosts}`,
        default: '0xE8130c7004430E882D3A49dF497C2Acb08612EC0',
      },
      maxPostLength: {
        required: true,
        type: 'number',
        message: `Max post length for ${SCEmailPosts}`,
        default: 280,
      },
      infixLength: {
        required: true,
        type: 'number',
        message: `Infix length for ${SCEmailPosts}`,
        default: 3,
      },
    },
  })
  const SCEmailPostsContract = await SCEmailPostsFactory.deploy(
    SCEmailLedgerAddress as string,
    maxPostLength as number,
    infixLength as number
  )
  const SCNFTPostsContract = await SCNFTPostsFactory.deploy(
    SCERC721LedgerAddress as string,
    maxPostLength as number,
    infixLength as number
  )

  console.log(
    'Deploy SCEmailPosts tx gas price:',
    SCEmailPostsContract.deployTransaction.gasPrice
  )
  console.log(
    'Deploy SCEmailPosts tx gas limit:',
    SCEmailPostsContract.deployTransaction.gasLimit
  )
  console.log(
    'Deploy SCNFTPosts tx gas price:',
    SCNFTPostsContract.deployTransaction.gasPrice
  )
  console.log(
    'Deploy SCNFTPosts tx gas limit:',
    SCNFTPostsContract.deployTransaction.gasLimit
  )
  await SCEmailPostsContract.deployed()
  const SCEmailPostsContractAddress = SCEmailPostsContract.address
  await SCNFTPostsContract.deployed()
  const SCNFTPostsContractAddress = SCNFTPostsContract.address

  console.log('SCEmailPosts deployed to:', SCEmailPostsContractAddress)
  console.log('SCNFTPosts deployed to:', SCNFTPostsContractAddress)
  console.log('Wait for 1 minute to make sure blockchain is updated')
  await new Promise((resolve) => setTimeout(resolve, 60 * 1000))

  // Try to verify the contract on Etherscan
  console.log('Verifying contract on Etherscan')
  try {
    await run('verify:verify', {
      address: SCEmailPostsContractAddress,
      constructorArguments: [SCEmailLedgerAddress, maxPostLength, infixLength],
    })
    await run('verify:verify', {
      address: SCNFTPostsContractAddress,
      constructorArguments: [SCERC721LedgerAddress, maxPostLength, infixLength],
    })
  } catch (err) {
    console.log(
      'Error verifiying contract on Etherscan:',
      err instanceof Error ? err.message : err
    )
  }

  // Print out the information
  console.log(`${SCEmailPosts} deployed and verified on Etherscan!`)
  console.log('Contract address:', SCEmailPostsContractAddress)
  console.log(
    'Etherscan URL:',
    `https://${
      chainName !== 'mainnet' ? `${chainName}.` : ''
    }etherscan.io/address/${SCEmailPostsContractAddress}`
  )

  console.log(`${SCNFTPosts} deployed and verified on Etherscan!`)
  console.log('Contract address:', SCNFTPostsContractAddress)
  console.log(
    'Etherscan URL:',
    `https://${
      chainName !== 'mainnet' ? `${chainName}.` : ''
    }etherscan.io/address/${SCNFTPostsContractAddress}`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
