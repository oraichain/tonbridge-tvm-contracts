import {PublicKey, SecretKey, Signature, aggregatePubkeys, fastAggregateVerify, verify} from '@chainsafe/blst';
import {bls12_381 as bls} from '@noble/curves/bls12-381';
import {compile} from '@ton-community/blueprint';
import {Blockchain, SandboxContract} from '@ton-community/sandbox';
import '@ton-community/test-utils';
import {Cell, beginCell, toNano} from 'ton-core';
import {bytes} from '../evm-data/utils';
import {BlsContract} from '../wrappers/Bls';

describe('BlsContract', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('BlsContract');
    });

    let blockchain: Blockchain;
    let readerContract: SandboxContract<BlsContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        readerContract = blockchain.openContract(
            BlsContract.createFromConfig(
                {
                    id: 0,
                    counter: 0,
                },
                code
            )
        );

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await readerContract.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: readerContract.address,
            deploy: true,
            success: true,
        });
    });

    it('should emit correct hash', async () => {
        // const r = Receipt.fromJSON(jsonReceipt as unknown as IReceiptJSON);
        // const cell = r.toCell();

        // const expectedHash = BigInt('0x' + r.hash().toString('hex'));

        const increaser = await blockchain.treasury('increaser');
        const calcHashRes = await readerContract.sendVerify(increaser.getSender(), {
            value: toNano('0.5'),
            receipt: beginCell()
                .storeBuffer(
                    bytes(
                        '0xa491d1b0ecd9bb917989f0e74f0dea0422eac4a873e5e2644f368dffb9a6e20fd6e10c1b77654d067c0618f6e5a7f79a'
                    )
                )
                .storeRef(
                    beginCell()
                        .storeBuffer(
                            bytes(
                                '0xb301803f8b5ac4a1133581fc676dfedc60d891dd5fa99028805e5ea5b08d3491af75d0707adab3b70c6a6a580217bf81'
                            )
                        )
                        .storeRef(
                            beginCell()
                                .storeBuffer(
                                    bytes(
                                        '0xb53d21a4cfd562c469cc81514d4ce5a6b577d8403d32a394dc265dd190b47fa9f829fdd7963afdf972e5e77854051f6f'
                                    )
                                )

                                .storeRef(
                                    beginCell()
                                        .storeBuffer(bytes('0x3'))
                                        .storeRef(
                                            beginCell()
                                                .storeBuffer(
                                                    bytes(
                                                        '0x5656565656565656565656565656565656565656565656565656565656565656'
                                                    )
                                                )
                                                .storeRef(
                                                    beginCell()
                                                        .storeBuffer(
                                                            bytes(
                                                                '0x912c3615f69575407db9392eb21fee18fff797eeb2fbe1816366ca2a08ae574d8824dbfafb4c9eaa1cf61b63c6f9b69911f269b664c42947dd1b53ef1081926c1e82bb2a465f927124b08391a5249036146d6f3f1e17ff5f162f779746d830d1'
                                                            )
                                                        )
                                                        .endCell()
                                                )
                                                .endCell()
                                        )
                                        .endCell()
                                )

                                .endCell()
                        )
                        .endCell()
                )
                .endCell(),
        });

        // console.log(calcHashRes.transactions.map(t => t.vmLogs));

        await expect(calcHashRes.transactions).toHaveTransaction({
            from: increaser.address,
            to: readerContract.address,
            success: true,
        });

        // expect(calcHashRes.externals.length).toEqual(1);

        const externalOutBodySlice = calcHashRes.externals[0].body.asSlice();
        console.log(externalOutBodySlice);
        // const actualHash = externalOutBodySlice.loadUintBig(256);
        // expect(expectedHash).toBe(actualHash);
        // console.log(r.hash().toString('hex'))

        const res = await fastAggregateVerify(
            bytes('0x5656565656565656565656565656565656565656565656565656565656565656'),
            [
                PublicKey.fromBytes(
                    bytes(
                        '0xa491d1b0ecd9bb917989f0e74f0dea0422eac4a873e5e2644f368dffb9a6e20fd6e10c1b77654d067c0618f6e5a7f79a'
                    )
                ),
                PublicKey.fromBytes(
                    bytes(
                        '0xb301803f8b5ac4a1133581fc676dfedc60d891dd5fa99028805e5ea5b08d3491af75d0707adab3b70c6a6a580217bf81'
                    )
                ),
                PublicKey.fromBytes(
                    bytes(
                        '0xb53d21a4cfd562c469cc81514d4ce5a6b577d8403d32a394dc265dd190b47fa9f829fdd7963afdf972e5e77854051f6f'
                    )
                ),
            ],
            Signature.fromBytes(
                bytes(
                    '0x912c3615f69575407db9392eb21fee18fff797eeb2fbe1816366ca2a08ae574d8824dbfafb4c9eaa1cf61b63c6f9b69911f269b664c42947dd1b53ef1081926c1e82bb2a465f927124b08391a5249036146d6f3f1e17ff5f162f779746d830d1'
                )
            )
        );

        console.log({ isValid: res });
    });

    it('should emit correct hash 2', async () => {
        const privateKeys = [
            '18f020b98eb798752a50ed0563b079c125b0db5dd0b1060d1c1b47d4a193e1e4',
            'ed69a8c50cf8c9836be3b67c7eeff416612d45ba39a5c099d48fa668bf558c9c',
            '16ae669f3be7a2121e17d0c68c05a8f3d6bef21ec0f2315f1d7aec12484e4cf5',
        ];
        const message = '64726e3da8';
        const publicKeys = privateKeys.map(bls.getPublicKey);

        const signatures = privateKeys.map((p) => bls.sign(message, p));

        const aggPubKey = bls.aggregatePublicKeys(publicKeys);
        const aggSignature = bls.aggregateSignatures(signatures);
        const isValid = bls.verify(aggSignature, message, aggPubKey);

        console.log({ isValid });
        // publs, N, msg, sig
        const dataForBls = [
            ...publicKeys.map((p) => Buffer.from(p)),
            bytes('0x3'),
            bytes('0x' + message),
            Buffer.from(aggSignature),
        ]
            .map((item) => {
                // console.log(item);
                return beginCell().storeBuffer(item);
            })
            .reverse()
            .reduce((acc, memo) => {
                if (!acc) {
                    return memo.endCell();
                }
                return memo.storeRef(acc).endCell();
            }, null as any as Cell);

        const increaser = await blockchain.treasury('increaser');
        const calcHashRes = await readerContract.sendVerify(increaser.getSender(), {
            value: toNano('0.5'),
            receipt: dataForBls,
        });

        // console.log(calcHashRes.transactions.map(t => t.vmLogs));

        await expect(calcHashRes.transactions).toHaveTransaction({
            from: increaser.address,
            to: readerContract.address,
            success: true,
        });

        // expect(calcHashRes.externals.length).toEqual(1);

        const externalOutBodySlice = calcHashRes.externals[0].body.asSlice();
        console.log(externalOutBodySlice);

        const res0 = verify(
            bytes('0x' + message),
            aggregatePubkeys([...publicKeys.map((p) => PublicKey.fromBytes(p))]),
            Signature.fromBytes(aggSignature)
        );

        console.log({res0});

        const res = await fastAggregateVerify(
            bytes('0x' + message),
            [
                // PublicKey.fromBytes(bytes(aggPubKey))
                ...publicKeys.map((p) => PublicKey.fromBytes(Buffer.from(p))),
            ],
            Signature.fromBytes(Buffer.from(aggSignature))
        );

        console.log({ isValid: res });

        const privKey =  '18f020b98eb798752a50ed0563b079c125b0db5dd0b1060d1c1b47d4a193e1e4';
        const pubkey = bls.getPublicKey(privKey);
        const sk = SecretKey.fromBytes(bytes('0x' + privKey));
        const pub = sk.toPublicKey();

        const signature = bls.sign(message, privKey);
        const sig = sk.sign(Buffer.from(message, 'hex'));
        console.log(Buffer.from(sk.toBytes()).toString('hex'))
        console.log(pubkey, pub.toBytes());
        console.log(Buffer.from(sig.toBytes()).toString('hex'), Buffer.from(signature).toString('hex'));
    });
});
