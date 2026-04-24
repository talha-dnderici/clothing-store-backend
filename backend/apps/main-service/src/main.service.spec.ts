import { BadRequestException } from '@nestjs/common';
import { MainService } from './main.service';
import { Model } from 'mongoose';

describe('MainService BE-12 Unit Tests', () => {
  let mainService: MainService;
  let mockProductModel: any;
  let mockCategoryModel: any;
  let mockCommentModel: any;

  beforeEach(() => {
    mockProductModel = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      countDocuments: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
    };

    mockCategoryModel = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      findOne: jest.fn().mockReturnThis(),
    };

    mockCommentModel = {
      aggregate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    mainService = new MainService(
      mockProductModel as any,
      mockCategoryModel as any,
      mockCommentModel as any,
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
});
