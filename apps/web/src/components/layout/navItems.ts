import React from 'react';
import type { NavTab } from '../../types';
import {
  LayoutDashboardIcon,
  ArrowLeftRightIcon,
  RefreshCwIcon,
  BarChartIcon,
} from '../icons';

export interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRightIcon },
  { id: 'autopay', label: 'Autopay', icon: RefreshCwIcon },
  { id: 'analytics', label: 'Analytics', icon: BarChartIcon },
];
