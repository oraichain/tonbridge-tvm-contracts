import { NetworkProvider, compile } from '@ton-community/blueprint';
import { toNano } from 'ton-core';
import { LightClient } from '../wrappers/LightClient';

export async function run(provider: NetworkProvider) {
    const lightClient = provider.open(LightClient.createFromConfig({}, await compile('LightClient')));

    await lightClient.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(lightClient.address);

    // run methods on `lightClient`
    console.log('Light Client addr:', lightClient.address.toString({urlSafe: true}))
}


// export async function run(provider: NetworkProvider) {
//     const lightClient = provider.open(LightClient.createFromAddress(Address.parse('EQCjakBrK8mCSOkC4aUt_OWibGEH-l-3IYd8drJhqZoWtmfh')));

//     const secondUpdateBeacon = {
//         slot: 4332576,
//         proposerIndex: 439,
//         parentRoot:
//           "0x00c4f2062883b2bab0c8d9ab4e3908bdabda50016066c31de1afae6f0dbf72fe",
//         stateRoot:
//           "0xf911140bdf71cd55f9a23a1269730b60349c8c51057b8bf79f19cd1f46466fee",
//         bodyRoot:
//           "0x105109efd5676f1e91d4838c723b9e61204d95d60bb7a5016fa50bfc8beb0b64",
//         selfHash:
//           "0xf15f8da67b5fe0660319c05ebc9cc85cfc92de41f6bebf778bf661817f6da5fb",
//       };

//     const beaconContainerCell = getSSZContainer(
//         SSZUintToCell(
//             { value: +secondUpdateBeacon.slot, size: 8, isInf: true },
//             SSZUintToCell(
//                 { value: +secondUpdateBeacon.proposerIndex, size: 8, isInf: false },
//                 SSZRootToCell(
//                     secondUpdateBeacon.parentRoot,
//                     SSZRootToCell(secondUpdateBeacon.stateRoot, SSZRootToCell(secondUpdateBeacon.bodyRoot))
//                 )
//             )
//         )
//     );

//     console.log(beaconContainerCell);

//     const initResult = await lightClient.sendInitOptimisticUpdate(provider.sender(), {
//         value: toNano('0.07'),
//         beacon: beaconContainerCell,
//     });


//     // await lightClient.sendDeploy(provider.sender(), toNano('0.05'));

//     // await provider.waitForDeploy(lightClient.address);

//     // run methods on `lightClient`
//     // console.log('Light Client addr:', lightClient.address.toString({urlSafe: true}))
// }
