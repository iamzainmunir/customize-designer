export interface CustomizationState {
  categoryId: string;
  productVariantId: string;
  productImageUrl: string;
  selectedOptions: Record<string, string | string[]>;
  canvasElements: {
    text?: {
      content: string;
      x: number;
      y: number;
      fontSize: number;
      fontFamily: string;
      fill: string | string[];
      scaleX?: number;
      scaleY?: number;
    };
    icons?: Array<{
      id: string;
      optionValueId?: string;
      imageUrl: string;
      x: number;
      y: number;
      width: number;
      height: number;
      scale?: number;
    }>;
  };
}
