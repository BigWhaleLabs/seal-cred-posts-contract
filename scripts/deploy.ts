import {
  GSN_FORWARDER_CONTRACT_ADDRESS,
  SC_EMAIL_LEDGER_CONTRACT_ADDRESS,
  SC_ERC721_LEDGER_CONTRACT_ADDRESS,
  SC_EXTERNAL_NFT_POSTS_CONTRACT_ADDRESS,
} from '@big-whale-labs/constants'
import { ethers, run } from 'hardhat'
import { utils } from 'ethers'
import prompt from 'prompt'

const regexes = {
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
}

async function main() {
  const [deployer] = await ethers.getSigners()

  // Deploy the contract
  console.log('Deploying contracts with the account:', deployer.address)
  console.log(
    'Account balance:',
    utils.formatEther(await deployer.getBalance())
  )

  const provider = ethers.provider
  const { chainId } = await provider.getNetwork()
  const chains = {
    1: 'mainnet',
    3: 'ropsten',
    4: 'rinkeby',
    5: 'goerli',
  } as { [chainId: number]: string }
  const chainName = chains[chainId]

  const ledgers = [
    SC_EMAIL_LEDGER_CONTRACT_ADDRESS,
    SC_ERC721_LEDGER_CONTRACT_ADDRESS,
    SC_EXTERNAL_NFT_POSTS_CONTRACT_ADDRESS,
  ]
  const contractName = 'SCPostStorage'
  for (const ledger of ledgers) {
    console.log(`Deploying ${contractName} for ${ledger}...`)
    const factory = await ethers.getContractFactory(contractName)
    const { maxPostLength, infixLength, forwarder } = await prompt.get({
      properties: {
        maxPostLength: {
          required: true,
          type: 'number',
          message: `Max post lendth`,
          default: 280,
        },
        infixLength: {
          required: true,
          type: 'number',
          message: `Infix length`,
          default: 3,
        },
        forwarder: {
          required: true,
          pattern: regexes.ethereumAddress,
          default: GSN_FORWARDER_CONTRACT_ADDRESS,
        },
      },
    })

    const constructorArguments = [
      ledger,
      maxPostLength,
      infixLength,
      forwarder,
    ] as [string, number, number, string]

    const contract = await factory.deploy(...constructorArguments)
    console.log(
      'Deploy tx gas price:',
      utils.formatEther(contract.deployTransaction.gasPrice || 0)
    )
    console.log(
      'Deploy tx gas limit:',
      utils.formatEther(contract.deployTransaction.gasLimit)
    )
    await contract.deployed()
    const address = contract.address

    console.log('Contract deployed to:', address)
    console.log('Wait for 1 minute to make sure blockchain is updated')
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000))

    // Try to verify the contract on Etherscan
    console.log('Verifying contract on Etherscan')
    try {
      await run('verify:verify', {
        address,
        constructorArguments,
      })
    } catch (err) {
      console.log(
        'Error verifiying contract on Etherscan:',
        err instanceof Error ? err.message : err
      )
    }

    // Print out the information
    console.log(`${contractName} deployed and verified on Etherscan!`)
    console.log('Contract address:', address)
    console.log(
      'Etherscan URL:',
      `https://${
        chainName !== 'mainnet' ? `${chainName}.` : ''
      }etherscan.io/address/${address}`
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
