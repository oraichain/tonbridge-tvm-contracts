declare global {
    type SSZUintValue = { value: number; size: number; isInf?: boolean };
}

declare module 'ton-core' {
    class Cell {
        toBLSSignature(value: string): Cell;
        toSSZRoot(value: string): Cell;
        toSSZUint(value: SSZUintValue): Cell;
        toSSZContainer():Cell;
    }
}

export { };

