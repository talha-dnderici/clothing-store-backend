import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MainService } from './main.service';
import { Model } from 'mongoose';

describe('MainService BE-12 Unit Tests', () => {
  let mainService: MainService;
  let mockProductModel: any;
  let mockCategoryModel: any;
  let mockCommentModel: any;
  let mockWishlistModel: any;
  let mockNotificationModel: any;

  beforeEach(() => {
    mockProductModel = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      countDocuments: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      updateMany: jest.fn().mockReturnThis(),
    };

    mockCategoryModel = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      findOne: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn().mockReturnThis(),
    };

    mockCommentModel = {
      aggregate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    mockWishlistModel = {};
    mockNotificationModel = {};

    mainService = new MainService(
      mockProductModel as any,
      mockCategoryModel as any,
      mockCommentModel as any,
      mockWishlistModel as any,
      mockNotificationModel as any,
    );
  });

  describe('Search Algorithms', () => {
    it('1. should construct correct regex query for name and description when q is provided', async () => {
      // Mock findAllProducts dependencies
      mockProductModel.exec
        .mockResolvedValueOnce([]) // for products
        .mockResolvedValueOnce(0); // for total
      mockCategoryModel.exec.mockResolvedValueOnce([]); // for category mapping
      mockCommentModel.exec.mockResolvedValueOnce([]); // for comment metadata

      await mainService.findAllProducts({ q: 'shirt' });

      expect(mockProductModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'shirt', $options: 'i' } },
          { description: { $regex: 'shirt', $options: 'i' } },
        ],
      });
    });

    it('2. should append categoryIds to the filter if category is provided and found', async () => {
      // Mock findCategoryIdByFilter
      mockCategoryModel.exec.mockResolvedValueOnce({ _id: 'cat123' });
      // Mock findAllProducts dependencies
      mockProductModel.exec.mockResolvedValueOnce([]).mockResolvedValueOnce(0);
      mockCategoryModel.exec.mockResolvedValueOnce([]);
      mockCommentModel.exec.mockResolvedValueOnce([]);

      await mainService.findAllProducts({ category: 'pants' });

      expect(mockProductModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryIds: 'cat123',
        })
      );
    });

    it('3. should build correct sorting filters based on input payload', async () => {
      mockProductModel.exec.mockResolvedValueOnce([]).mockResolvedValueOnce(0);
      mockCategoryModel.exec.mockResolvedValueOnce([]);
      mockCommentModel.exec.mockResolvedValueOnce([]);

      await mainService.findAllProducts({ sort: 'price_asc' });

      expect(mockProductModel.sort).toHaveBeenCalledWith({
         price: 1, createdAt: -1 
      });
    });
  });

  describe('Stock Deduction Math', () => {
    it('4. should correctly apply a absolute stock value replacement', async () => {
      const mockProduct = {
        save: jest.fn(),
        toObject: () => ({ _id: 'prod1', price: 10, categoryIds: [] }),
        stock: 5,
      };
      mockProductModel.exec.mockResolvedValue(mockProduct);

      await mainService.updateStock('prod1', { stock: 15 });
      expect(mockProduct.stock).toBe(15);
      expect(mockProduct.save).toHaveBeenCalled();
    });

    it('5. should correctly apply positive or negative stock adjustments', async () => {
      const mockProduct = {
        save: jest.fn(),
        toObject: () => ({ _id: 'prod1', price: 10, categoryIds: [] }),
        stock: 5,
      };
      mockProductModel.exec.mockResolvedValue(mockProduct);

      // Testing negative adjustment (purchase/deduction)
      await mainService.updateStock('prod1', { adjustment: -2 });
      expect(mockProduct.stock).toBe(3);

      // Testing positive adjustment (restock)
      await mainService.updateStock('prod1', { adjustment: 4 });
      expect(mockProduct.stock).toBe(7);
    });

    it('6. should throw BadRequestException if stock deduction drops total below 0', async () => {
       const mockProduct = {
        save: jest.fn(),
        toObject: () => ({ _id: 'prod1', price: 10 }),
        stock: 5,
      };
      mockProductModel.exec.mockResolvedValue(mockProduct);

      // We expect the direct inner throw, but due to handleServiceError it passes through unmodified
      await expect(mainService.updateStock('prod1', { adjustment: -10 }))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('deleteCategory', () => {
    it('7. should unlink linked products before deleting the category', async () => {
      mockCategoryModel.exec
        .mockResolvedValueOnce({ _id: 'cat1', name: 'Demo Collection' })
        .mockResolvedValueOnce({});
      mockProductModel.exec.mockResolvedValueOnce({ modifiedCount: 2 });

      const result = await mainService.deleteCategory('cat1');

      expect(mockProductModel.updateMany).toHaveBeenCalledWith(
        { categoryIds: 'cat1' },
        { $pull: { categoryIds: 'cat1' } },
      );
      expect(mockCategoryModel.findByIdAndDelete).toHaveBeenCalledWith('cat1');
      expect(result).toEqual({
        id: 'cat1',
        deleted: true,
        unlinkedProducts: 2,
      });
    });

    it('8. should throw NotFoundException when the category does not exist', async () => {
      mockCategoryModel.exec.mockResolvedValueOnce(null);

      await expect(mainService.deleteCategory('missing-cat')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createComment', () => {
    it('9. should throw BadRequestException when comment content is empty', async () => {
      await expect(
        mainService.createComment({
          productId: 'prod1',
          customerId: 'customer1',
          customerName: 'Test User',
          content: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createRating', () => {
    it('10. should immediately approve a rating with no comment text', async () => {
      const mockComment = {
        _id: { toString: () => 'rating1' },
        productId: 'prod1',
        customerId: 'customer1',
        customerName: 'Test User',
        content: '',
        rating: 4,
        approvalStatus: 'approved',
        toObject: () => ({
          _id: { toString: () => 'rating1' },
          productId: 'prod1',
          customerId: 'customer1',
          customerName: 'Test User',
          content: '',
          rating: 4,
          approvalStatus: 'approved',
          createdAt: new Date(),
        }),
      };
      // ensureProductExists: findById().select().lean().exec()
      mockProductModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: 'prod1' }),
      });
      mockCommentModel.create = jest.fn().mockResolvedValue(mockComment);

      const result = await mainService.createRating({
        productId: 'prod1',
        customerId: 'customer1',
        customerName: 'Test User',
        rating: 4,
      });

      expect(result?.commentStatus).toBe('approved');
      expect(result?.ratingPublished).toBe(true);
    });

    it('11. should leave a rating with comment text as pending for manager review', async () => {
      const mockComment = {
        _id: { toString: () => 'rating2' },
        productId: 'prod1',
        customerId: 'customer1',
        customerName: 'Test User',
        content: 'Great product!',
        rating: 5,
        approvalStatus: 'pending',
        toObject: () => ({
          _id: { toString: () => 'rating2' },
          productId: 'prod1',
          customerId: 'customer1',
          customerName: 'Test User',
          content: 'Great product!',
          rating: 5,
          approvalStatus: 'pending',
          createdAt: new Date(),
        }),
      };
      // ensureProductExists: findById().select().lean().exec()
      mockProductModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: 'prod1' }),
      });
      mockCommentModel.create = jest.fn().mockResolvedValue(mockComment);

      const result = await mainService.createRating({
        productId: 'prod1',
        customerId: 'customer1',
        customerName: 'Test User',
        rating: 5,
        content: 'Great product!',
      });

      expect(result?.commentStatus).toBe('pending');
      expect(result?.ratingPublished).toBe(true);
    });
  });

  describe('reviewComment', () => {
    it('12. should persist approval status and reviewedBy when manager approves a comment', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const mockComment = {
        _id: { toString: () => 'comment1' },
        content: 'Nice hoodie!',
        approvalStatus: 'pending',
        reviewedBy: '',
        reviewNote: '',
        reviewedAt: null,
        save,
        toObject: () => ({
          _id: { toString: () => 'comment1' },
          productId: 'prod1',
          customerId: 'customer1',
          customerName: 'Test User',
          content: 'Nice hoodie!',
          approvalStatus: 'approved',
          createdAt: new Date(),
        }),
      };
      mockCommentModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockComment) });

      await mainService.reviewComment('comment1', {
        approvalStatus: 'approved',
        reviewedBy: 'manager1',
      });

      expect(mockComment.approvalStatus).toBe('approved');
      expect(mockComment.reviewedBy).toBe('manager1');
      expect(save).toHaveBeenCalled();
    });

    it('13. should throw NotFoundException when the comment does not exist', async () => {
      mockCommentModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(
        mainService.reviewComment('nonexistent', { approvalStatus: 'rejected', reviewedBy: 'manager1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLowStockProducts', () => {
    it('14. should query products with stock at or below the given threshold', async () => {
      mockProductModel.find = jest.fn().mockReturnThis();
      mockProductModel.sort = jest.fn().mockReturnThis();
      mockProductModel.exec = jest.fn().mockResolvedValue([
        {
          toObject: () => ({ _id: { toString: () => 'p1' }, name: 'Jeans', price: 50, stock: 2, categoryIds: [] }),
          stock: 2,
        },
      ]);

      const result = await mainService.findLowStockProducts(5);

      expect(mockProductModel.find).toHaveBeenCalledWith({ stock: { $lte: 5 } });
      expect(mockProductModel.sort).toHaveBeenCalledWith({ stock: 1 });
      expect(result).toHaveLength(1);
    });
  });

  describe('updateProductPricing', () => {
    it('15. should throw BadRequestException when no pricing fields are provided', async () => {
      await expect(
        mainService.updateProductPricing('prod1', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
