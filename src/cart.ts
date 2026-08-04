export type CartLine = Readonly<{
  unitPrice: number;
  quantity: number;
}>;

export function cartTotal(lines: readonly CartLine[]): number {
  return lines.reduce((total, line) => {
    if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) {
      throw new RangeError("unitPrice must be a non-negative number");
    }

    if (!Number.isInteger(line.quantity) || line.quantity < 0) {
      throw new RangeError("quantity must be a non-negative integer");
    }

    return total + line.unitPrice * line.quantity;
  }, 0);
}

