import { ERC721_ABI, LEDGER_ABI, emails, zeroAddress } from './utils'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

describe('SCPostStorage', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.scPostStorageFactory = await ethers.getContractFactory('SCPostStorage')
    this.txParams = {
      post: 'gm',
      original: emails[0],
    }
    this.maxPostLength = 280
    this.infixLength = 3
  })
  beforeEach(async function () {
    this.scLedger = await waffle.deployMockContract(this.owner, LEDGER_ABI)
    this.scPostStorage = await this.scPostStorageFactory.deploy(
      this.scLedger.address,
      this.maxPostLength,
      this.infixLength,
      zeroAddress
    )
    await this.scPostStorage.connect(this.owner)
    await this.scPostStorage.deployed()
    this.derivativeContract = await waffle.deployMockContract(
      this.owner,
      ERC721_ABI
    )

    await this.derivativeContract.mock.symbol.returns('ME7-d')
  })
  describe('Constructor', function () {
    beforeEach(async function () {
      this.scPostStorage = await this.scPostStorageFactory.deploy(
        this.scLedger.address,
        this.maxPostLength,
        this.infixLength,
        zeroAddress
      )

      await this.scPostStorage.deployed()
    })
    it('should deploy the SCPostStorage contract with the correct fields', async function () {
      expect(await this.scPostStorage.ledgerAddress()).to.equal(
        this.scLedger.address
      )
      expect(await this.scPostStorage.maxPostLength()).to.equal(
        this.maxPostLength
      )
      expect(await this.scPostStorage.infixLength()).to.equal(this.infixLength)
      expect(await this.scPostStorage.getTrustedForwarder()).to.equal(
        zeroAddress
      )
    })
    it('should deploy SCPostStorage, derivative and SCEmailLedgerContract contracts', async function () {
      expect(await this.scPostStorage.address).to.exist
      expect(await this.derivativeContract.address).to.exist
      expect(await this.scLedger.address).to.exist
    })
  })
  describe('Owner-only calls from non-owner', function () {
    before(function () {
      this.contractWithIncorrectOwner = this.scPostStorage.connect(this.user)
    })
    it('should have the correct owner', async function () {
      expect(await this.scPostStorage.owner()).to.equal(this.owner.address)
    })
    it('should not be able to call setMaxPostLength', async function () {
      this.contractWithIncorrectOwner = this.scPostStorage.connect(this.user)
      await expect(
        this.contractWithIncorrectOwner.setMaxPostLength(281)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
    it('should not be able to call setInfixLength', async function () {
      this.contractWithIncorrectOwner = this.scPostStorage.connect(this.user)
      await expect(
        this.contractWithIncorrectOwner.setInfixLength(4)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })
  describe('Contract', function () {
    it('should save post', async function () {
      // Setup mocks
      await this.scLedger.mock.getDerivative
        .withArgs(emails[0])
        .returns(this.derivativeContract.address)
      await this.derivativeContract.mock.balanceOf
        .withArgs(this.owner.address)
        .returns(1)

      await expect(
        this.scPostStorage.savePost(this.txParams.post, this.txParams.original)
      )
        .to.emit(this.scPostStorage, 'PostSaved')
        .withArgs(
          0,
          this.txParams.post,
          this.derivativeContract.address,
          this.owner.address,
          (
            await ethers.provider.getBlock('latest')
          ).timestamp
        )

      const savedPost = await this.scPostStorage.posts(0)
      expect({
        post: savedPost.post,
        derivativeAddress: savedPost.derivativeAddress,
      }).to.deep.eq({
        post: this.txParams.post,
        derivativeAddress: this.derivativeContract.address,
      })
    })
    it('should save post contains chars whose char length is greater than 1', async function () {
      // Setup mocks
      await this.scLedger.mock.getDerivative
        .withArgs(emails[0])
        .returns(this.derivativeContract.address)
      await this.derivativeContract.mock.balanceOf
        .withArgs(this.owner.address)
        .returns(1)

      const post =
        '恐龙是恐龍總目（學名：Dinosauria）中生物的統稱，是一類出現於中生代的多樣化陸棲動物，也是人類認知範圍內最著名的古生物。恐龍是地球歷史上在中生代最優勢、最繁盛的脊椎動物，最早出现在2亿3千万年前的三疊紀，在侏羅紀、白堊紀中曾支配全球陸地生态系统長達1亿4千万年之久，並涉足天空和海洋[2]。恐龍常被分為“非鳥恐龍”和“鳥型恐龍”兩類。所有非鸟恐龙、鳥型恐龍中的反鸟亞綱以及扇尾亞綱都在6千6百万年前所发生的白垩纪末滅絕事件（即恐龙大灭绝）中滅絕，僅剩下鸟型恐龙中的今鳥亞綱存活了下来，演化為鳥類而繁榮至今'

      await expect(this.scPostStorage.savePost(post, this.txParams.original))
        .to.emit(this.scPostStorage, 'PostSaved')
        .withArgs(
          0,
          post,
          this.derivativeContract.address,
          this.owner.address,
          (
            await ethers.provider.getBlock('latest')
          ).timestamp
        )
    })
    it('should not save post is derivative does not exist', async function () {
      // Setup mocks
      await this.scLedger.mock.getDerivative
        .withArgs(emails[0])
        .returns('0x0000000000000000000000000000000000000000')
      await this.derivativeContract.mock.balanceOf
        .withArgs(this.owner.address)
        .returns(1)
      await expect(
        this.scPostStorage.savePost(this.txParams.post, this.txParams.original)
      ).to.be.revertedWith('Derivative contract not found')
    })
    it('should not save post if post exceeds max length', async function () {
      // Setup mocks
      await this.scLedger.mock.getDerivative
        .withArgs(emails[0])
        .returns(this.derivativeContract.address)
      await this.derivativeContract.mock.balanceOf
        .withArgs(this.owner.address)
        .returns(1)

      const post = 'a'

      await expect(
        this.scPostStorage.savePost(post.repeat(281), this.txParams.original)
      ).to.be.revertedWith('Post exceeds max post length')
    })
    it('should not save post if user does not own a derivative', async function () {
      // Setup mocks
      await this.scLedger.mock.getDerivative
        .withArgs(emails[0])
        .returns(this.derivativeContract.address)
      await this.derivativeContract.mock.balanceOf
        .withArgs(this.owner.address)
        .returns(0)
      await expect(
        this.scPostStorage.savePost(this.txParams.post, this.txParams.original)
      ).to.be.revertedWith('You do not own this derivative')
    })
    it.only('should return posts by specific pagination params', async function () {
      // Setup mocks
      await this.derivativeContract.mock.balanceOf
        .withArgs(this.owner.address)
        .returns(1)
      await this.scLedger.mock.getDerivative
        .withArgs(emails[0])
        .returns(this.derivativeContract.address)
      const expectedPosts: { post: string; original: string }[] = []
      const skip = 10
      const limit = 25

      // Saving posts and seting expectedPosts array
      for (let i = 0; i < 50; i++) {
        const post = `${this.txParams.post} ${i}`

        await this.scPostStorage.savePost(post, this.txParams.original)
        if (i >= skip && i < skip + limit) {
          expectedPosts.push({
            post,
            original: this.derivativeContract.address,
          })
        }
      }

      const posts = await this.scPostStorage.getPosts(skip, limit)
      // Serializing posts array from contract call
      const serializedPosts = posts.map((post) => ({
        post: post.post,
        original: post.derivativeAddress,
      }))
      expect(serializedPosts).to.deep.eq(expectedPosts)
    })
  })
})
