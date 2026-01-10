import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the ai package
const mockGenerateText = vi.fn();

vi.mock('ai', () => ({
  generateText: mockGenerateText,
}));

// Mock the Google provider
vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => 'mocked-model'),
}));

// Import after mocking
const { calculateAI } = await import('./ai');

describe('calculateAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful calculations', () => {
    it('parses numeric response for addition', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: '15' });

      const result = await calculateAI('add', 10, 5);

      expect(result).toEqual({ result: 15, error: null });
    });

    it('parses numeric response for subtraction', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: '5' });

      const result = await calculateAI('subtract', 10, 5);

      expect(result).toEqual({ result: 5, error: null });
    });

    it('parses numeric response for multiplication', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: '50' });

      const result = await calculateAI('multiply', 10, 5);

      expect(result).toEqual({ result: 50, error: null });
    });

    it('parses numeric response for division', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: '2' });

      const result = await calculateAI('divide', 10, 5);

      expect(result).toEqual({ result: 2, error: null });
    });

    it('handles decimal response', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: '3.333333' });

      const result = await calculateAI('divide', 10, 3);

      expect(result.result).toBeCloseTo(3.333333, 5);
      expect(result.error).toBeNull();
    });

    it('handles response with whitespace', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: '  42  \n' });

      const result = await calculateAI('add', 20, 22);

      expect(result).toEqual({ result: 42, error: null });
    });

    it('handles negative result', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: '-5' });

      const result = await calculateAI('subtract', 5, 10);

      expect(result).toEqual({ result: -5, error: null });
    });
  });

  describe('error handling', () => {
    it('handles ERROR: response format', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: 'ERROR: Division by zero' });

      const result = await calculateAI('divide', 10, 0);

      expect(result).toEqual({ result: null, error: 'Division by zero' });
    });

    it('handles ERROR: with extra spaces', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: 'ERROR:   Some error message  ' });

      const result = await calculateAI('add', 1, 1);

      expect(result).toEqual({ result: null, error: 'Some error message' });
    });

    it('handles NaN response', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: 'I cannot compute that' });

      const result = await calculateAI('add', 10, 5);

      expect(result.result).toBeNull();
      expect(result.error).toContain('AI returned invalid result');
    });

    it('handles API errors', async () => {
      mockGenerateText.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const result = await calculateAI('add', 10, 5);

      expect(result.result).toBeNull();
      expect(result.error).toContain('AI calculation failed');
      expect(result.error).toContain('API rate limit exceeded');
    });

    it('handles non-Error exceptions', async () => {
      mockGenerateText.mockRejectedValueOnce('Some string error');

      const result = await calculateAI('add', 10, 5);

      expect(result.result).toBeNull();
      expect(result.error).toContain('Unknown error');
    });
  });

  describe('prompt construction', () => {
    it('uses correct operation name in prompt', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: '15' });

      await calculateAI('add', 10, 5);

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('addition'),
        })
      );
    });

    it('includes numbers in prompt', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: '50' });

      await calculateAI('multiply', 10, 5);

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('10'),
        })
      );
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('5'),
        })
      );
    });

    it('uses the mocked model', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: '42' });

      await calculateAI('add', 20, 22);

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'mocked-model',
        })
      );
    });
  });
});
