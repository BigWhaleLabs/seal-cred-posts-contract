import { MockContract } from 'ethereum-waffle'
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'

import type { SCPostStorage, SCPostStorage__factory } from '../typechain'

declare module 'mocha' {
  export interface Context {
    // Facoriries for contracts
    scPostStorage: SCPostStorage
    scPostStorageFactory: SCPostStorage__factory
    scLedger: MockContract
    // Signers
    accounts: SignerWithAddress[]
    owner: SignerWithAddress
    user: SignerWithAddress
  }
}
