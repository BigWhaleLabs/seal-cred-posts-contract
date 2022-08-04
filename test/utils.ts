export const zeroAddress = '0x0000000000000000000000000000000000000000'
export const emails = ['one@example.com', 'two@example2.com']

export const ERC721_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export const LEDGER_ABI = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'original',
        type: 'string',
      },
    ],
    name: 'getDerivative',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
