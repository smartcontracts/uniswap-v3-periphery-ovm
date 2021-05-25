import { abi as FACTORY_V2_ABI, bytecode as FACTORY_V2_BYTECODE } from '@uniswap/v2-core/build/UniswapV2Factory.json'
import { Fixture } from 'ethereum-waffle'
import { ethers, network, waffle } from 'hardhat'
import { IUniswapV3Factory, IWETH9, MockTimeSwapRouter } from '../../typechain'

import WETH9 from '../contracts/WETH9.json'
import { Contract } from '@ethersproject/contracts'
import { constants } from 'ethers'
import { v3CoreFactoryFixtureSetup } from './setup'

const wethFixture: Fixture<{ weth9: IWETH9 }> = async ([wallet]) => {
  // If testing on OVM, get the pre-deployed WETH contract
  if (network.name === 'optimism') {
    const weth9 = (await ethers.getContractAt(WETH9.abi, '0x4200000000000000000000000000000000000006')) as IWETH9
    return { weth9 }
  }
  // Otherwise deploy WETH9
  const weth9 = (await waffle.deployContract(wallet, {
    bytecode: WETH9.bytecode,
    abi: WETH9.abi,
  })) as IWETH9

  return { weth9 }
}

export const v2FactoryFixture: Fixture<{ factory: Contract }> = async ([wallet]) => {
  const factory = await waffle.deployContract(
    wallet,
    {
      bytecode: FACTORY_V2_BYTECODE,
      abi: FACTORY_V2_ABI,
    },
    [constants.AddressZero]
  )

  return { factory }
}

const v3CoreFactoryFixture: Fixture<IUniswapV3Factory> = async ([wallet]) => {
  // @ts-expect-error We don't need to pass the standard fixture inputs since v3CoreFactoryFixtureSetup has defaults
  return v3CoreFactoryFixtureSetup()
}

export const v3RouterFixture: Fixture<{
  weth9: IWETH9
  factory: IUniswapV3Factory
  router: MockTimeSwapRouter
}> = async ([wallet], provider) => {
  const { weth9 } = await wethFixture([wallet], provider)
  const factory = await v3CoreFactoryFixture([wallet], provider)

  const router = (await (await ethers.getContractFactory('MockTimeSwapRouter')).deploy(
    factory.address,
    weth9.address
  )) as MockTimeSwapRouter

  return { factory, weth9, router }
}
