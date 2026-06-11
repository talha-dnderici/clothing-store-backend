import { BadRequestException } from '@nestjs/common';
import { CardService } from './card.service';

const asExec = <T>(value: T) => ({
  exec: jest.fn().mockResolvedValue(value),
});

const asSelectLeanExec = <T>(value: T) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(value),
});

describe('CardService refund workflow', () => {
  let service: CardService;
  let productModel: any;
  let orderModel: any;
  let refundRequestModel: any;

  beforeEach(() => {
    productModel = {
      updateOne: jest.fn(),
    };
    orderModel = {
      findById: jest.fn(),
    };
    refundRequestModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      updateOne: jest.fn(),
    };

    service = new CardService(
      {} as any,
      productModel,
      orderModel,
      {} as any,
      {} as any,
      refundRequestModel,
    );
  });

  it('creates a pending refund using the discounted purchase price', async () => {
    const order = {
      _id: { toString: () => 'order1' },
      customerId: 'customer1',
      paymentConfirmed: true,
      createdAt: new Date(),
      items: [
        {
          productId: 'product1',
          productName: 'Jacket',
          quantity: 2,
          unitPrice: 100,
          discountRate: 25,
        },
      ],
    };
    const createdRefund = {
      _id: { toString: () => 'refund1' },
      toObject: () => ({
        _id: { toString: () => 'refund1' },
        orderId: 'order1',
        orderItemProductId: 'product1',
        productName: 'Jacket',
        customerId: 'customer1',
        quantity: 1,
        unitPrice: 100,
        discountRate: 25,
        refundedAmount: 75,
        status: 'pending',
      }),
    };

    orderModel.findById.mockReturnValue(asExec(order));
    refundRequestModel.find.mockReturnValue(asSelectLeanExec([]));
    refundRequestModel.create.mockResolvedValue(createdRefund);

    const result = await service.createRefundRequest({
      customerId: 'customer1',
      orderId: 'order1',
      productId: 'product1',
      quantity: 1,
    });

    expect(refundRequestModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        refundedAmount: 75,
        status: 'pending',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'refund1',
        refundedAmount: 75,
      }),
    );
  });

  it('rejects refund requests after the 30 day return window', async () => {
    const createdAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);

    orderModel.findById.mockReturnValue(
      asExec({
        customerId: 'customer1',
        paymentConfirmed: true,
        createdAt,
        items: [{ productId: 'product1', quantity: 1 }],
      }),
    );

    await expect(
      service.createRefundRequest({
        customerId: 'customer1',
        orderId: 'order1',
        productId: 'product1',
        quantity: 1,
      }),
    ).rejects.toMatchObject({
      error: expect.objectContaining({
        statusCode: 400,
        message: 'Refund requests must be opened within 30 days of purchase',
      }),
    });
  });

  it('restores stock once when a refund is approved', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const refund = {
      _id: 'refund1',
      orderId: 'order1',
      orderItemProductId: 'product1',
      quantity: 2,
      status: 'pending',
      stockRestored: false,
      decisionNote: '',
      reviewedBy: '',
      save,
      toObject: () => ({
        _id: { toString: () => 'refund1' },
        orderId: 'order1',
        orderItemProductId: 'product1',
        quantity: 2,
        status: 'approved',
        stockRestored: true,
      }),
    };
    const orderSave = jest.fn().mockResolvedValue(undefined);

    refundRequestModel.findById.mockReturnValue(asExec(refund));
    refundRequestModel.updateOne.mockReturnValue(asExec({ modifiedCount: 1 }));
    productModel.updateOne.mockReturnValue(asExec({ modifiedCount: 1 }));
    orderModel.findById.mockReturnValue(
      asExec({
        items: [{ productId: 'product1', quantity: 2 }],
        status: 'delivered',
        save: orderSave,
      }),
    );
    refundRequestModel.find.mockReturnValue(
      asSelectLeanExec([{ orderItemProductId: 'product1', quantity: 2 }]),
    );

    await service.updateRefundRequestStatus({
      id: 'refund1',
      status: 'approved',
      reviewedBy: 'manager1',
    });

    expect(save).toHaveBeenCalled();
    expect(refundRequestModel.updateOne).toHaveBeenCalledWith(
      { _id: 'refund1', stockRestored: false },
      { $set: { stockRestored: true } },
    );
    expect(productModel.updateOne).toHaveBeenCalledWith(
      { _id: 'product1' },
      { $inc: { stock: 2 } },
    );
    expect(orderSave).toHaveBeenCalled();
  });
});

describe('CardService order cancellation', () => {
  let service: CardService;
  let productModel: any;
  let orderModel: any;
  let deliveryModel: any;

  const buildOrder = (overrides: Record<string, unknown> = {}) => ({
    _id: { toString: () => 'order1' },
    customerId: 'customer1',
    status: 'processing',
    items: [
      { productId: 'product1', quantity: 2 },
      { productId: 'product2', quantity: 1 },
    ],
    save: jest.fn().mockResolvedValue(undefined),
    toObject: () => ({
      _id: { toString: () => 'order1' },
      customerId: 'customer1',
      status: 'cancelled',
    }),
    ...overrides,
  });

  beforeEach(() => {
    productModel = { updateOne: jest.fn().mockReturnValue(asExec({})) };
    orderModel = { findById: jest.fn() };
    deliveryModel = { updateMany: jest.fn().mockReturnValue(asExec({})) };

    service = new CardService(
      {} as any,
      productModel,
      orderModel,
      deliveryModel,
      {} as any,
      {} as any,
    );
  });

  it('cancels a processing order and restores the stock', async () => {
    const order = buildOrder();
    orderModel.findById.mockReturnValue(asExec(order));

    const result = await service.cancelOrder({
      orderId: 'order1',
      customerId: 'customer1',
    });

    expect(order.status).toBe('cancelled');
    expect(order.save).toHaveBeenCalled();
    expect(productModel.updateOne).toHaveBeenCalledWith(
      { _id: 'product1' },
      { $inc: { stock: 2 } },
    );
    expect(productModel.updateOne).toHaveBeenCalledWith(
      { _id: 'product2' },
      { $inc: { stock: 1 } },
    );
    expect(deliveryModel.updateMany).toHaveBeenCalledWith(
      { orderId: 'order1' },
      { status: 'cancelled', completed: true },
    );
    expect((result as any).status).toBe('cancelled');
  });

  it('rejects cancelling an order that has already shipped', async () => {
    const order = buildOrder({ status: 'in-transit' });
    orderModel.findById.mockReturnValue(asExec(order));

    await expect(
      service.cancelOrder({ orderId: 'order1', customerId: 'customer1' }),
    ).rejects.toThrow('Only orders that have not been shipped yet can be cancelled');
    expect(order.save).not.toHaveBeenCalled();
    expect(productModel.updateOne).not.toHaveBeenCalled();
  });

  it('rejects cancelling an order that belongs to another customer', async () => {
    const order = buildOrder();
    orderModel.findById.mockReturnValue(asExec(order));

    await expect(
      service.cancelOrder({ orderId: 'order1', customerId: 'intruder' }),
    ).rejects.toThrow('You can only cancel your own orders');
    expect(order.save).not.toHaveBeenCalled();
  });
});
