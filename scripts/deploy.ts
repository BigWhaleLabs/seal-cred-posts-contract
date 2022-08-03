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
    '0x41E8088deb1f638b0626365E715f5403297587e7',
    '0x368f425c725fa8937f00f1DFAAD643F05c73b7aC',
    '0x5e1DcE4e72d381A8A0e9ceD8A6D3CDa1845aF5F7',
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
          default: '0x7A95fA73250dc53556d264522150A940d4C50238 ',
          message: `Forwarder address`,
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
