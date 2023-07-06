// import { NetworkProvider, sleep } from '@ton-community/blueprint';
// import { Address, toNano } from 'ton-core';
// import { ReaderContract } from '../wrappers/ReaderContract';

// export async function run(provider: NetworkProvider, args: string[]) {
//     const ui = provider.ui();

//     const address = Address.parse(args.length > 0 ? args[0] : await ui.input('ReaderContract address'));

//     if (!(await provider.isContractDeployed(address))) {
//         ui.write(`Error: Contract at address ${address} is not deployed!`);
//         return;
//     }

//     const readerContract = provider.open(ReaderContract.createFromAddress(address));

//     const counterBefore = await readerContract.getCounter();

//     await readerContract.sendCalcHash(provider.sender(), {
//         value: toNano('0.05'),
//     });

//     ui.write('Waiting for counter to increase...');

//     let counterAfter = await readerContract.getCounter();
//     let attempt = 1;
//     while (counterAfter === counterBefore) {
//         ui.setActionPrompt(`Attempt ${attempt}`);
//         await sleep(2000);
//         counterAfter = await readerContract.getCounter();
//         attempt++;
//     }

//     ui.clearActionPrompt();
//     ui.write('Counter increased successfully!');
// }
