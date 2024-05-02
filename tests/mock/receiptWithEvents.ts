export const jsonReceipt = {
    transactionHash: '0x3df5876a57f0dde7527411b7ae6c3d4209c4952b28133d8405e8be2cee5e8175',
    transactionIndex: '0x44',
    blockHash: '0xd000be63d2a4c80468f83c03981f7eeabff2336327b2e9058770cdf904a99ff2',
    blockNumber: '0x3887a6',
    cumulativeGasUsed: '0x10147a5',
    gasUsed: '0x80b4',
    effectiveGasPrice: '0xa3',
    from: '0xc7296d50ddb12de4d2cd8c889a73b98538624f61',
    to: '0xd0df3e320aade6f44fc7adcb2308f90331dbd30b',
    contractAddress: null,
    logs: [
        {
            removed: false,
            logIndex: '0xbfc',
            transactionIndex: '0x44',
            transactionHash: '0x3df5876a57f0dde7527411b7ae6c3d4209c4952b28133d8405e8be2cee5e8175',
            blockHash: '0xd000be63d2a4c80468f83c03981f7eeabff2336327b2e9058770cdf904a99ff2',
            blockNumber: '0x3887a6',
            address: '0x8a59de294816a1d218fd97a4aa6dfd6a2fa65b93',
            data: '0x00000000000000000000000000000000000000000000000000000000000003e8',
            topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                '0x000000000000000000000000c7296d50ddb12de4d2cd8c889a73b98538624f61',
                '0x0000000000000000000000000000000000000000000000000000000000000000',
            ],
        },
        {
            removed: false,
            logIndex: '0xbfd',
            transactionIndex: '0x44',
            transactionHash: '0x3df5876a57f0dde7527411b7ae6c3d4209c4952b28133d8405e8be2cee5e8175',
            blockHash: '0xd000be63d2a4c80468f83c03981f7eeabff2336327b2e9058770cdf904a99ff2',
            blockNumber: '0x3887a6',
            address: '0xd0df3e320aade6f44fc7adcb2308f90331dbd30b',
            data: '0x0112aeb9f1d2e0d4ac4f8576718f4bdaa5930d61ebe8b6a788347efcea5a70c100000000000000000000000000000000000000000000000000000000000013e8',

            topics: ['0x6888ec7969c035bf2b2a4f1c3d41fd8e393fee76a9fa186e4c9405c1a01f9b72'],
        },
    ],
    logsBloom:
        '0x00000000000000000800000000000000000000000000800000000000000008000000000000000000000000000008000000000000000000000000000000000000000000000000000000000008000000000002000000000000000000000000000000000000020000000000000000000800000000000000000000000010000000000000000000000000000000000000000000000000000000000000000800000000008000200000100008000000000000000000000000000000000000000200000000800002000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000',
    status: '0x1',
    type: '0x2',
};

export const j2 = {
    transactionHash: '0x3b93c826e9a85eb2235f8e3042b80b279d642f3d02a674f11bd44b6566c7f20c',
    transactionIndex: 39,
    blockHash: '0x0360cfdd8a5b13bbf80bf67cbe0e2f4a665f0b23b3126bff4001db945a77aea9',
    blockNumber: 5197418,
    cumulativeGasUsed: '0x241f0b',
    // cumulativeGasUsed: {
    //     type: 'BigNumber',
    //     hex: '0x241f0b',
    // },
    gasUsed: {
        type: 'BigNumber',
        hex: '0x8292',
    },
    effectiveGasPrice: {
        type: 'BigNumber',
        hex: '0x019d12fc8f',
    },
    to: '0x7F4ff31BdAaC7aa72790fBbe90eC08B49BdB4250',
    from: '0xC7296D50dDB12de4d2Cd8C889A73B98538624f61',
    contractAddress: null,
    logs: [
        {
            transactionIndex: 39,
            blockNumber: 5197418,
            transactionHash: '0x3b93c826e9a85eb2235f8e3042b80b279d642f3d02a674f11bd44b6566c7f20c',
            address: '0x09353e7F5D48eB8ca4B67Bd404ba1E360f8b5eDb',
            topics: ['0x6888ec7969c035bf2b2a4f1c3d41fd8e393fee76a9fa186e4c9405c1a01f9b72'],
            data: '0x80e2761bd251e74ffa3a4925da9fcffb5d6c5f9d19d22f66df902c725598aed200000000000000000000000000000000000000000000000000038d7ea4c68000',
            logIndex: 42,
            blockHash: '0x0360cfdd8a5b13bbf80bf67cbe0e2f4a665f0b23b3126bff4001db945a77aea9',
        },
    ],
    logsBloom:
        '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000010000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000010000000000000000000000000000000000000200000000000000000000000000000000000000000000',
    status: 1,
    type: 2,
    byzantium: true,
    confirmations: 1,
};

// export const burnReceipt = {
//     to: '0x7F4ff31BdAaC7aa72790fBbe90eC08B49BdB4250',
//     from: '0xC7296D50dDB12de4d2Cd8C889A73B98538624f61',
//     contractAddress: null,
//     transactionIndex: 39,
//     gasUsed: {
//         type: 'BigNumber',
//         hex: '0x8292',
//     },
//     logsBloom:
//         '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000010000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000010000000000000000000000000000000000000200000000000000000000000000000000000000000000',
//     blockHash: '0x0360cfdd8a5b13bbf80bf67cbe0e2f4a665f0b23b3126bff4001db945a77aea9',
//     transactionHash: '0x3b93c826e9a85eb2235f8e3042b80b279d642f3d02a674f11bd44b6566c7f20c',
//     logs: [
//         {
//             transactionIndex: 39,
//             blockNumber: 5197418,
//             transactionHash: '0x3b93c826e9a85eb2235f8e3042b80b279d642f3d02a674f11bd44b6566c7f20c',
//             address: '0x09353e7F5D48eB8ca4B67Bd404ba1E360f8b5eDb',
//             topics: ['0x6888ec7969c035bf2b2a4f1c3d41fd8e393fee76a9fa186e4c9405c1a01f9b72'],
//             data: '0x80e2761bd251e74ffa3a4925da9fcffb5d6c5f9d19d22f66df902c725598aed200000000000000000000000000000000000000000000000000038d7ea4c68000',
//             logIndex: 42,
//             blockHash: '0x0360cfdd8a5b13bbf80bf67cbe0e2f4a665f0b23b3126bff4001db945a77aea9',
//         },
//     ],
//     blockNumber: 5197418,
//     confirmations: 24350,
//     cumulativeGasUsed: '0x241f0b',
//     effectiveGasPrice: {
//         type: 'BigNumber',
//         hex: '0x019d12fc8f',
//     },
//     status: 1,
//     type: 2,
//     byzantium: true,
// };

export const burnReceipt = {
    to: '0x7F4ff31BdAaC7aa72790fBbe90eC08B49BdB4250',
    from: '0xC7296D50dDB12de4d2Cd8C889A73B98538624f61',
    contractAddress: null,
    transactionIndex: 31,
    gasUsed: {
        type: 'BigNumber',
        hex: '0xafc7',
    },
    logsBloom:
        '0x00000000000000000800000000000000000000000000000000000000000008000000000000000000000000000008000000000000000000000000000000000000000000000000000000000008004000000000000000000000000000000000000000020000020000000000000000000800000000000000000000000090000000000000000000000000000000000000000000000000000000000000000800000004008000000000000000000000000000000000000000000000000000000200000000000002000000000000000000000000000000000000010000000000000020000000000000000000000200000000000000000000000000000000000000000000',
    blockHash: '0xce9251074aa88f86b5c1127ca3dfffb91ff82dc3cc6ee768c9cbff960e3526ba',
    transactionHash: '0x9e8a5d6d2983ffcf265ccee0924ced8fcf5f3c86acef3aabbc69038b30e2f2f8',
    logs: [
        {
            transactionIndex: 31,
            blockNumber: 5221833,
            transactionHash: '0x9e8a5d6d2983ffcf265ccee0924ced8fcf5f3c86acef3aabbc69038b30e2f2f8',
            address: '0xA9d7b0838db8b8285dd7d1D46B53a2B2aaf0c726',
            topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                '0x000000000000000000000000c7296d50ddb12de4d2cd8c889a73b98538624f61',
                '0x0000000000000000000000000000000000000000000000000000000000000000',
            ],
            data: '0x00000000000000000000000000000000000000000000000000000000000003e8',
            logIndex: 39,
            blockHash: '0xce9251074aa88f86b5c1127ca3dfffb91ff82dc3cc6ee768c9cbff960e3526ba',
        },
        {
            transactionIndex: 31,
            blockNumber: 5221833,
            transactionHash: '0x9e8a5d6d2983ffcf265ccee0924ced8fcf5f3c86acef3aabbc69038b30e2f2f8',
            address: '0x09353e7F5D48eB8ca4B67Bd404ba1E360f8b5eDb',
            topics: ['0x09a9af46918f2e52460329a694cdd4cd6d55354ea9b336b88b4dea59914a9a83'],
            data: '0x0112aeb9f1d2e0d4ac4f8576718f4bdaa5930d61ebe8b6a788347efcea5a70c100000000000000000000000000000000000000000000000000000000000003e8',
            logIndex: 40,
            blockHash: '0xce9251074aa88f86b5c1127ca3dfffb91ff82dc3cc6ee768c9cbff960e3526ba',
        },
    ],
    blockNumber: 5221833,
    confirmations: 2,
    cumulativeGasUsed: '0x566b54',
    effectiveGasPrice: {
        type: 'BigNumber',
        hex: '0xa965f4b6',
    },
    status: 1,
    type: 2,
    byzantium: true,
};

export const dataForEvm = {
    txBoc: 'b5ee9c724102100100034a0003b57fbd2679024832aac0988ad1fac319858db2e89495c827f2b8118a6d605ca482a0000111b1428b007a7e0a7ebe6dc2749a8c0deedc4b7c7604e05aafd18f30e3af388260ce7b5d6df0000111b0cf25fc765c057080005471c0f728010c0d0201e0020501b148000362e299cc05a833b3bf2d4b8c1b04a896ffe38b046c5c29e41f451156b9f677003ef499e40920caab02622b47eb0c661636cba25257209fcae04629b58172920a900bebc200062b998c000022362851600ccb80ae10c00301627362d09c000000000000000031e848080101c4ec37a4a3ce9ff474924bb53f9ff6bad8bf3a33a45ecdbf2058e4ab315da404008931e8480000000000000000000000000c7296d50ddb12de4d2cd8c889a73b98538624f6180101c4ec37a4a3ce9ff474924bb53f9ff6bad8bf3a33a45ecdbf2058e4ab315da50201dd06090101200701b16801f7a4cf204906555813115a3f586330b1b65d1292b904fe5702314dac0b94905500006c5c533980b5067677e5a97183609512dffc71608d8b853c83e8a22ad73eced01493f1c0061e55b00000223628516010cb80ae10c0080061595f07bc000000000000000031e848080101c4ec37a4a3ce9ff474924bb53f9ff6bad8bf3a33a45ecdbf2058e4ab315da50101200a019fe007de933c81241955604c4568fd618cc2c6d9744a4ae413f95c08c536b02e5241530000000000000000000000000000000000000000000000000000000000000000020000111b1428b00965c05708600b0080000000000000000000000000c7296d50ddb12de4d2cd8c889a73b98538624f6100000000000000000000000000000000000000000000000000000000001e848000827204723e7c1b65b4b40042a84d8ab26e886ae0b79c096b8a0d5b641cac0bb4fc4a53dce593af0a3e026ee82599b0fcf8251e73d60324cfaf09f8de948962ba69f102170c584900bebc20186dbb23110e0f009c4383eb0d4000000000000000008b00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006fc997ac8c4c80b900000000000004000000000004d98d66ba3e010b23a81c2acc82f867d5ba72dbf36c42cd020be5aec1f6d09338411046144c459e4f',
    boc: 'b5ee9c72410213010002d200041011ef55aafffffffd0102030428480101a06bbe07c907ab7f5ab2356c792ffc67ba90165e6252b4ac45c9eb16cf0f9148000128480101a6a4a23d8bef0511a1aeff05c59dfb2a623daef4e1c6e2b390f5c057fbf8510e0001284801014004b9fbc666ba81dd589be63f5c14ea7c6b589a8c2e4b711d6ad508aca8e2a7001a03894a33f6fd50ef8534320790df15a639db3307fbcdf1a7faa614c51d5ed09b702eff20cfb2f7fd2e5a64be82dfe576f61f2c103314b95e1eeb0c8e6467a6087c5a2c9d264b400506072848010186db33481a8810993f21551387d3c26a748178499cea5d89220f787fedcbab1a001228480101954f3651ab2fe426d3b910239ca350c7719eae137a8fbe6a58594fa43e62701700140109a019f7b712080209100cfbdb89090a28480101edd5f000fa8b578b45954a22965ca364aa28059d502e22ca1d3397e64814f9f0000e02091005f25bb90b0c28480101674f59c9eed7fa9ef2383d6c88916dd8c3dc62552b7ea2d54862f0b23ffe7530000702070fc8d8990d0e284801015d374017f40e2b5191a39647a0e8dc90e213b62c386d855cb3879fd0d535a6fc000402a3bf77a4cf204906555813115a3f586330b1b65d1292b904fe5702314dac0b94905471c0f725fbd2679024832aac0988ad1fac319858db2e89495c827f2b8118a6d605ca482aa00000088d8a1458039c703dca0f1103b57fbd2679024832aac0988ad1fac319858db2e89495c827f2b8118a6d605ca482a0000111b1428b007a7e0a7ebe6dc2749a8c0deedc4b7c7604e05aafd18f30e3af388260ce7b5d6df0000111b0cf25fc765c057080005471c0f72810111228480101aace66831a98fdd28d6d54690209a7d63caf97adabffd24ae6673beb8b6531d300042848010104880131e360607137497e2fe82949845863d1790c53db28891de28e1ad7e680000028480101c529b93f1fbdb4aaa0b49e11eaf18a08778a87cc62754bf817dbf1258ee10a4b0001aeb0be0d',
    adapter: '0x09353e7F5D48eB8ca4B67Bd404ba1E360f8b5eDb',
};

export const idealTx =
    'b5ee9c72410209010002340003b577bcd0c393c7705e52666ba99bf218533977a7616a0bd7505236d929dbde12319000004d289a5fcc3058e955bed85916141cef725e900a324be6f0cafee2a007d8d10a03842ff5ef5000004d2864f7ec16356788700034677436880105060201e0020300f96800f82e85118296d0c2b26d85ce7a2a8c44d4ef2804a8d5e53e66394bca20cb5c31001ef3430e4f1dc1794999aea66fc8614ce5de9d85a82f5d4148db64a76f7848c65017d7840006145860000009a5134bf984c6acf10e000000000000026979cfeb728d56c47b7a67355c41393ce7ffdc91330000000002625a00400101df0400d7e003de6861c9e3b82f293335d4cdf90c299cbbd3b0b505eba8291b6c94edef0918cb0000000000000000000000000000000000000000000000000000000000c0470ccf000004d289a5fcc4635678873ce7f5b946ab623dbd339aae209c9e73ffee48998000000001312d002000827258a7ccece5be7b4925b39a0e989c08a2a241a5505bc45ed195f503ed3b817f173453e8aed733b42c5dae85165ed4b8cd0d7bdc624ffce083abd60b40d226c0cd0217044509017d784018658bec110708009e416b8c061a8000000000000000002a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006fc987a1204c3d09000000000000020000000000036c57d0a0cbe153865ffc6d3315645eeb97fe0120c6a648122470bcb70a676b3c40501ad4f7bdcbe7';

// export const mintForEvm = {
//     txBoc: 'b5ee9c7241020b010002880003b57fbd2679024832aac0988ad1fac319858db2e89495c827f2b8118a6d605ca482a0000111d72a2ddc34a97e3fadb715dd72e39b66379265898af8a1dec92a8538e65802f4b0b40cf2a0000111b1428b00765c0cda0000346be3a4a80107080201e0020401b1680101c4ec37a4a3ce9ff474924bb53f9ff6bad8bf3a33a45ecdbf2058e4ab315da5003ef499e40920caab02622b47eb0c661636cba25257209fcae04629b58172920a903473bc000622c51e0000223ae545bb84cb819b40c0030099f0a289920000000000000000000000000000000000000000c7296d50ddb12de4d2cd8c889a73b98538624f610000000000000000000000000000000000000000000000000000000001312d00400101df05019fe007de933c81241955604c4568fd618cc2c6d9744a4ae413f95c08c536b02e5241530000000000000000000000000000000000000000000000000000000000000000010000111d72a2ddc465c0cda060060080000000000000000000000000c7296d50ddb12de4d2cd8c889a73b98538624f610000000000000000000000000000000000000000000000000000000001312d0000827253dce593af0a3e026ee82599b0fcf8251e73d60324cfaf09f8de948962ba69f1353903d9174d3bc6a00ef59916def0125526f86a0a1ccdc36f5d5fa5483e2ef1021904882f4903473bc01868cc7111090a009e4240ac0d6d8000000000000000006200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006fc98c4c704c626380000000000002000000000002c79c40a7351c28ad2451fe33faf64c1e675c02f17b4d26c9bcaf6cb1bc44d150409023d423514425',
//     boc: 'b5ee9c7241020f0100027400041011ef55aafffffffd01020304284801016f57529f3f84aabce7ddc3e54fad4ef19bc7c3d1d37a2d26f22698a15fa34edc0001284801015511133e307a8bddf6095b56f892ed42a1f050818928b6ae52f386e86fe7751b000128480101fde7997d237ace8bf2619cf93d089d2b11ffc6dc68f4f892fa35815a21228376001903894a33f6fdec7913920ae16539b9436c184d99ad99ed8deea7a7a44410072d514cddf175f9275a6dfceafb9273d42e692b2866cce0fce1d34bdad716ebab8430f420dce28840050607284801013b894c57dc698e55c8225c6d6171a20c6bc8c3b4f7c1b2acddf19169a3e6dbca000728480101e8bf877d139ebe2bcce2a36c9a86e3bd1dae28cca20284e5d4e0ce549ad3187d000801079de2ceea08020953bc59dd40090a284801012f0918f5eca993110c7dbd96f30c209503f17acaba27bfa104fa1045d89e474c000502a3bfbbd2679024832aac0988ad1fac319858db2e89495c827f2b8118a6d605ca482a35f1d252fde933c81241955604c4568fd618cc2c6d9744a4ae413f95c08c536b02e5241550000004475ca8b770cd7c74950b0d03b57fbd2679024832aac0988ad1fac319858db2e89495c827f2b8118a6d605ca482a0000111d72a2ddc34a97e3fadb715dd72e39b66379265898af8a1dec92a8538e65802f4b0b40cf2a0000111b1428b00765c0cda0000346be3a4a80c0d0e28480101337745a900304cf8d6186cf813ba3715bbec7e72fcae962a4461e60b562f43850003284801013fc804b0aea4e6f9b2fae330080de52175f83b1fdda6bd2ccf5b15e424ac409c0000284801010fcfe2780acc9cbe143850dc59ad77700018509ffbd2c3bb59b08442348556d30001587cbb8c',
//     adapter: '0x09353e7F5D48eB8ca4B67Bd404ba1E360f8b5eDb',
// };

export const mintForEvm = {
    txBoc: 'b5ee9c724102100100034a0003b57fbd2679024832aac0988ad1fac319858db2e89495c827f2b8118a6d605ca482a0000111d795f1c0763e49be9942128f3d4134a9fa08f1f97df9e13df3a970ca6e4cb5add2836a8a30000111d72a2ddc365c0cee30005471c0f648010c0d0201e0020501b148000362e299cc05a833b3bf2d4b8c1b04a896ffe38b046c5c29e41f451156b9f677003ef499e40920caab02622b47eb0c661636cba25257209fcae04629b58172920a900bebc200062b998c0000223af2be380ccb819dc6c00301627362d09c000000000000000031e848080101c4ec37a4a3ce9ff474924bb53f9ff6bad8bf3a33a45ecdbf2058e4ab315da404008931e8480000000000000000000000000c7296d50ddb12de4d2cd8c889a73b98538624f6180101c4ec37a4a3ce9ff474924bb53f9ff6bad8bf3a33a45ecdbf2058e4ab315da50201dd06090101200701b16801f7a4cf204906555813115a3f586330b1b65d1292b904fe5702314dac0b94905500006c5c533980b5067677e5a97183609512dffc71608d8b853c83e8a22ad73eced01493f1c0061e55b00000223af2be3810cb819dc6c0080061595f07bc000000000000000031e848080101c4ec37a4a3ce9ff474924bb53f9ff6bad8bf3a33a45ecdbf2058e4ab315da50101200a019fe007de933c81241955604c4568fd618cc2c6d9744a4ae413f95c08c536b02e5241530000000000000000000000000000000000000000000000000000000000000000020000111d795f1c0965c0cee3600b0080000000000000000000000000c7296d50ddb12de4d2cd8c889a73b98538624f6100000000000000000000000000000000000000000000000000000000001e8480008272353903d9174d3bc6a00ef59916def0125526f86a0a1ccdc36f5d5fa5483e2ef1f7b1e22eab105323948298383efe609c22e0869b5293decff30235ff8f40f8c802170c568900bebc20186dbb23110e0f009c4383eb0d4000000000000000008b00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006fc997ac8c4c80b900000000000004000000000004d98d66ba3e010b23a81c2acc82f867d5ba72dbf36c42cd020be5aec1f6d093384110461491f62c93',
    boc: 'b5ee9c72410213010002d200041011ef55aafffffffd0102030428480101d0048938089301762b7d39a529a407b9e10f48f5ba9d363eee18883b9ad1cc000001284801019f78da98326d5c9b5cf31dc8632811cdd52d15c8d419776cf8da82bdc172644e000128480101e16803079d750a4d56cfa21a0975572ceb6b65f027b5e2cc7b6cc546f3a5074b001a03894a33f6fd9da1ba0fdfe460a6f3ca9a5d8e3edbc261156f041709c7ce5bd6e94317c6e5decdf30314041a946d171e2c8c0bc7bb9d4f6076ceb0c5588e5158aede7607d8114005060728480101f44d617a8e3f8151f805fc6b2577235128de16f47e00d9499d613108dcecd10f00112848010122148951a2dabfd251b36cc89d91ea8316a3340354ec2bdd8f8e08789bfe588c00130109a019fb428a080209100cfda145090a28480101985473d6e3494b0b973053e37dc11ed4cb55bfb4c6b5b18ad93d376c8264c5b4000e02091005f32f3d0b0c28480101107731c67849fcb06b42725c906db7c6f3436412b628dd643a770124bea2a7da000702070fc9ac390d0e28480101a2ec90db1e94fe18b87434292790d11368dacd892bd25013458044b60942d253000402a3bf77a4cf204906555813115a3f586330b1b65d1292b904fe5702314dac0b94905471c0f645fbd2679024832aac0988ad1fac319858db2e89495c827f2b8118a6d605ca482aa00000088ebcaf8e039c703d920f1103b57fbd2679024832aac0988ad1fac319858db2e89495c827f2b8118a6d605ca482a0000111d795f1c0763e49be9942128f3d4134a9fa08f1f97df9e13df3a970ca6e4cb5add2836a8a30000111d72a2ddc365c0cee30005471c0f64810111228480101e54933659f93337e919b94636298dc853d18728e625884f751159ae950ff110500042848010152dc3fd5de078ccf880f1e748d4c02a30d7ee1dfd2a05915a5a511ab8e4a6ba000002848010136a84e912e073f4b8116c1c84648ca87a62675e3c216c7a26c194d169242eeeb0001bb43796c',
    adapter: '0x09353e7F5D48eB8ca4B67Bd404ba1E360f8b5eDb',
};

// x{7FBD2679024832AAC0988AD1FAC319858DB2E89495C827F2B8118A6D605CA482A0000111B1428B007A7E0A7EBE6DC2749A8C0DEEDC4B7C7604E05AAFD18F30E3AF388260CE7B5D6DF0000111B0CF25FC765C057080005471C0F72}
//        x{E_}
//         x{48000362E299CC05A833B3BF2D4B8C1B04A896FFE38B046C5C29E41F451156B9F677003EF499E40920CAAB02622B47EB0C661636CBA25257209FCAE04629B58172920A900BEBC200062B998C000022362851600CCB80AE10C_}
//          x{7362D09C000000000000000031E848080101C4EC37A4A3CE9FF474924BB53F9FF6BAD8BF3A33A45ECDBF2058E4AB315DA4}
//           x{31E8480000000000000000000000000C7296D50DDB12DE4D2CD8C889A73B98538624F6180101C4EC37A4A3CE9FF474924BB53F9FF6BAD8BF3A33A45ECDBF2058E4AB315DA5_}
//         x{DD_}
//          x{2_}
//           x{6801F7A4CF204906555813115A3F586330B1B65D1292B904FE5702314DAC0B94905500006C5C533980B5067677E5A97183609512DFFC71608D8B853C83E8A22AD73ECED01493F1C0061E55B00000223628516010CB80AE10C_}
//            x{595F07BC000000000000000031E848080101C4EC37A4A3CE9FF474924BB53F9FF6BAD8BF3A33A45ECDBF2058E4AB315DA5_}
//          x{2_}
//           x{E007DE933C81241955604C4568FD618CC2C6D9744A4AE413F95C08C536B02E5241530000000000000000000000000000000000000000000000000000000000000000020000111B1428B00965C057086_}
//            x{000000000000000000000000C7296D50DDB12DE4D2CD8C889A73B98538624F6100000000000000000000000000000000000000000000000000000000001E8480}
//        x{7204723E7C1B65B4B40042A84D8AB26E886AE0B79C096B8A0D5B641CAC0BB4FC4A53DCE593AF0A3E026EE82599B0FCF8251E73D60324CFAF09F8DE948962BA69F1}
//        x{0C584900BEBC20186DBB2311_}
//         x{4383EB0D4000000000000000008B00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000}
//         x{C997AC8C4C80B900000000000004000000000004D98D66BA3E010B23A81C2ACC82F867D5BA72DBF36C42CD020BE5AEC1F6D0933841104614_}