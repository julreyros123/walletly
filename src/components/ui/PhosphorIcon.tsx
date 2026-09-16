/**
 * PhosphorIcon — Centralized Phosphor icon component for the Walletly app.
 *
 * Instead of importing individual Phosphor icons in every file, import this
 * single component and pass a `name` string. This keeps imports clean and
 * ensures consistent sizing/coloring across the entire app.
 *
 * Usage:
 *   import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
 *   <PhosphorIcon name="House" size={24} color="#10B981" weight="bold" />
 */
import React from 'react';
import type { IconWeight } from 'phosphor-react-native';

// ── Individual icon imports (tree-shakeable) ──────────────────────────
import {
  House,
  Wallet,
  Plus,
  ChartLineUp,
  User,
  Bell,
  List,
  X,
  ArrowClockwise,
  Power,
  CaretLeft,
  CaretRight,
  Check,
  CheckCircle,
  XCircle,
  Eye,
  EyeSlash,
  Lock,
  ShieldCheck,
  PaperPlaneTilt,
  Question,
  Pencil,
  Money,
  CreditCard,
  Trash,
  Lightbulb,
  CalendarX,
  TrendUp,
  TrendDown,
  ArrowLeft,
  ArrowRight,
  Newspaper,
  GameController,
  GraduationCap,
  SpeakerHigh,
  Vibrate,
  Fire,
  ChartBar,
  UsersThree,
  Warning,
  Waveform,
  Tag,
  Hash,
  Info,
  MinusCircle,
  PlusCircle,
  Star,
  Cpu,
  Lightning,
  Coffee,
  ShoppingCart,
  Sun,
  UserCirclePlus,
  Sparkle,
  Hourglass,
  ArrowsLeftRight,
  Briefcase,
  Car,
  AirplaneTilt,
  ForkKnife,
  ShoppingBag,
  PiggyBank,
  Laptop,
  DeviceMobile,
  FirstAid,
  CheckFat,
  HandCoins,
  Swap,
  ChartPie,
  Receipt,
  EnvelopeSimple,
  FileText,
  Coins,
  Bag,
  Rocket,
  Crown,
  Moon,
  Envelope,
  SquaresFour,
  MagnifyingGlass,
  FunnelSimple,
  ArrowsDownUp,
  Clock,
  Code,
  Heart,
  Scales,
} from 'phosphor-react-native';
import type { StyleProp, ViewStyle, ColorValue } from 'react-native';

// ── Icon registry (maps string names → components) ───────────────────
const ICON_MAP = {
  Clock,
  House,
  Wallet,
  Plus,
  ChartLineUp,
  User,
  Bell,
  List,
  X,
  ArrowClockwise,
  Power,
  CaretLeft,
  CaretRight,
  Check,
  CheckCircle,
  XCircle,
  Eye,
  EyeSlash,
  Lock,
  ShieldCheck,
  PaperPlaneTilt,
  Question,
  Pencil,
  Money,
  CreditCard,
  Trash,
  Lightbulb,
  CalendarX,
  TrendUp,
  TrendDown,
  ArrowLeft,
  ArrowRight,
  Newspaper,
  GameController,
  GraduationCap,
  SpeakerHigh,
  Vibrate,
  Fire,
  ChartBar,
  UsersThree,
  Warning,
  Waveform,
  Tag,
  Hash,
  NumberSquare: Hash,
  Info,
  MinusCircle,
  PlusCircle,
  Star,
  Cpu,
  Lightning,
  Coffee,
  ShoppingCart,
  Sun,
  UserCirclePlus,
  Sparkle,
  Hourglass,
  ArrowsLeftRight,
  Briefcase,
  Car,
  AirplaneTilt,
  ForkKnife,
  ShoppingBag,
  PiggyBank,
  Laptop,
  DeviceMobile,
  FirstAid,
  CheckFat,
  HandCoins,
  Swap,
  ChartPie,
  Receipt,
  EnvelopeSimple,
  FileText,
  Coins,
  Bag,
  Rocket,
  Banknote: Money,
  Crown,
  Moon,
  Envelope,
  SquaresFour,
  MagnifyingGlass,
  FunnelSimple,
  ArrowsDownUp,
  Code,
  Heart,
  Scales,
} as const;

export type PhosphorIconName = keyof typeof ICON_MAP;

export interface PhosphorIconProps {
  name: PhosphorIconName;
  size?: number;
  color?: ColorValue | string;
  weight?: IconWeight;
  style?: StyleProp<ViewStyle>;
  mirrored?: boolean;
}

export function PhosphorIcon({
  name,
  size = 24,
  color = '#FFFFFF',
  weight = 'regular',
  style,
  mirrored,
}: PhosphorIconProps) {
  const IconComponent = ICON_MAP[name];

  if (!IconComponent) {
    console.warn(`[PhosphorIcon] Unknown icon name: "${name}"`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color as string}
      weight={weight}
      style={style}
      mirrored={mirrored}
    />
  );
}

export default PhosphorIcon;
