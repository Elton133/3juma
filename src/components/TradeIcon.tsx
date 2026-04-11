import { HugeiconsIcon } from '@hugeicons/react';
import type { IconSvgElement } from '@hugeicons/react';
import {
  Wrench01Icon,
  ZapIcon,
  ConstructionIcon,
  ToolsIcon,
  Fire02Icon,
  PaintBrush01Icon,
  Grid02Icon,
  Fan01Icon,
  House04Icon,
  Car01Icon,
} from '@hugeicons/core-free-icons';
import { TRADES } from '@/data/constants';

const TRADE_ICONS: Record<string, IconSvgElement> = {
  plumber: Wrench01Icon as IconSvgElement,
  electrician: ZapIcon as IconSvgElement,
  mason: ConstructionIcon as IconSvgElement,
  carpenter: ToolsIcon as IconSvgElement,
  welder: Fire02Icon as IconSvgElement,
  painter: PaintBrush01Icon as IconSvgElement,
  tiler: Grid02Icon as IconSvgElement,
  ac_tech: Fan01Icon as IconSvgElement,
  roofer: House04Icon as IconSvgElement,
  auto_mechanic: Car01Icon as IconSvgElement,
};

export type TradeIconProps = {
  tradeId: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export function TradeIcon({ tradeId, size = 24, className, strokeWidth = 1.5 }: TradeIconProps) {
  const svgIcon = TRADE_ICONS[tradeId];
  const fallback = TRADES.find((t) => t.id === tradeId)?.iconFallback ?? '🔧';

  if (!svgIcon) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 leading-none ${className ?? ''}`}
        style={{ fontSize: Math.max(12, size * 0.85) }}
        aria-hidden
      >
        {fallback}
      </span>
    );
  }

  return (
    <HugeiconsIcon
      icon={svgIcon}
      size={size}
      strokeWidth={strokeWidth}
      className={`shrink-0 ${className ?? ''}`}
    />
  );
}
