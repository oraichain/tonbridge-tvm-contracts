import { Address, Transaction } from 'ton-core';

export const expectSuccess = (transactions: Transaction[], from: Address, to: Address, deploy: boolean = false) => {
    const isDeploy = deploy ? { deploy: true } : {};
    expect(transactions).toHaveTransaction({
        from: from,
        to: to,
        ...isDeploy,
        exitCode: 0,
        aborted: false,
    });
};

export const expectFail = (
    transactions: Transaction[],
    from: Address,
    to: Address,
    exitCode: number,
    deploy: boolean = false
) => {
    const isDeploy = deploy ? { deploy: true } : {};
    expect(transactions).toHaveTransaction({
        from: from,
        to: to,
        ...isDeploy,
        exitCode,
        aborted: true,
    });
};
