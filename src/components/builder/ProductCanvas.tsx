"use client";

import { useRef, useCallback } from "react";
import { Stage, Layer, Image, Text, Group, Rect } from "react-konva";
import useImage from "use-image";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;

function ProductImage({ src, onLoad }: { src: string; onLoad?: () => void }) {
  const [image] = useImage(src, "anonymous");
  if (!image) return null;
  return (
    <Image
      image={image}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      listening={false}
      onLoad={onLoad}
    />
  );
}

function DraggableText({
  content,
  x,
  y,
  fontSize,
  fontFamily,
  fontStyle,
  fill,
  onDragEnd,
}: {
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
  fill: string | string[];
  onDragEnd: (e: { target: { x: () => number; y: () => number } }) => void;
}) {
  const colors = Array.isArray(fill) ? fill : [fill];
  const isMultiColor = colors.length > 1;
  const style = fontStyle || "normal";
  const charWidth = fontSize * 0.6;
  const textWidth = content.length * charWidth;
  const textHeight = fontSize * 1.2;

  const textNode = isMultiColor && content ? (
    <Group listening={false}>
      {content.split("").map((char, i) => (
        <Text
          key={i}
          text={char}
          x={i * charWidth}
          y={0}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle={style}
          fill={colors[i % colors.length]}
          listening={false}
        />
      ))}
    </Group>
  ) : (
    <Text
      text={content}
      x={0}
      y={0}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fontStyle={style}
      fill={colors[0]}
      listening={false}
    />
  );

  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragEnd={onDragEnd}
      listening
    >
      {textNode}
      <Rect
        x={0}
        y={0}
        width={Math.max(textWidth, 20)}
        height={Math.max(textHeight, 20)}
        fill="transparent"
        listening
        onMouseDown={(e) => {
          const parent = e.target.getParent();
          if (parent && "startDrag" in parent) (parent as { startDrag: (evt: unknown) => void }).startDrag(e);
        }}
      />
    </Group>
  );
}

function DraggableIcon({
  src,
  x,
  y,
  width,
  height,
  onDragEnd,
}: {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  onDragEnd: (e: { target: { x: () => number; y: () => number } }) => void;
}) {
  const [image] = useImage(src, "anonymous");
  if (!image) return null;
  return (
    <Image
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      draggable
      onDragEnd={onDragEnd}
      listening={true}
    />
  );
}

export interface CanvasElement {
  text?: {
    content: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    fontStyle?: string;
    fill: string | string[];
  };
  icons?: Array<{
    id: string;
    optionValueId: string;
    imageUrl: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

interface ProductCanvasProps {
  productImageUrl: string;
  elements: CanvasElement;
  onElementsChange: (elements: CanvasElement) => void;
  stageRef?: React.RefObject<{ toDataURL: (config?: object) => string } | null>;
}

export function ProductCanvas({
  productImageUrl,
  elements,
  onElementsChange,
  stageRef,
}: ProductCanvasProps) {
  const internalStageRef = useRef<{ toDataURL: (config?: object) => string } | null>(null);
  const ref = stageRef || internalStageRef;

  const handleTextDragEnd = useCallback(
    (e: { target: { x: () => number; y: () => number } }) => {
      if (!elements.text) return;
      onElementsChange({
        ...elements,
        text: {
          ...elements.text,
          x: e.target.x(),
          y: e.target.y(),
        },
      });
    },
    [elements, onElementsChange]
  );

  const handleIconDragEnd = useCallback(
    (id: string) => (e: { target: { x: () => number; y: () => number } }) => {
      if (!elements.icons) return;
      onElementsChange({
        ...elements,
        icons: elements.icons.map((icon) =>
          icon.id === id ? { ...icon, x: e.target.x(), y: e.target.y() } : icon
        ),
      });
    },
    [elements, onElementsChange]
  );

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
      <Stage
        ref={ref as React.RefObject<never>}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="rounded-lg overflow-hidden bg-white"
      >
        <Layer>
          <ProductImage src={productImageUrl} />
        </Layer>
        <Layer>
          {elements.text?.content && (
            <DraggableText
              content={elements.text.content}
              x={elements.text.x}
              y={elements.text.y}
              fontSize={elements.text.fontSize}
              fontFamily={elements.text.fontFamily}
              fontStyle={elements.text.fontStyle}
              fill={elements.text.fill}
              onDragEnd={handleTextDragEnd}
            />
          )}
          {elements.icons?.map((icon) => (
            <DraggableIcon
              key={icon.id}
              src={icon.imageUrl}
              x={icon.x}
              y={icon.y}
              width={icon.width}
              height={icon.height}
              onDragEnd={handleIconDragEnd(icon.id)}
            />
          ))}
        </Layer>
      </Stage>
      <p className="mt-3 text-center text-sm text-stone-500">
        Drag the text and icons to reposition them on the product.
      </p>
    </div>
  );
}

