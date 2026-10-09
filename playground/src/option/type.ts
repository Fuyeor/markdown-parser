// @/types/options/options-menu.d.ts
import type { RouteLocationRaw } from '@fuyeor/vue-router';

// 完整的选项页面菜单数据
export type OptionMenu = {
  title: string; // 页面大标题
  description?: string; // 页面描述
  groups: MenuGroup[]; // 菜单分组
};

// 菜单组，如「身份验证」、「多因素验证」
export interface MenuGroup {
  id?: string; // 定义 #id HTML 锚点
  title: string;
  items: MenuItem[];
}

// 单个菜单项的结构
export interface MenuItem {
  icon?: string;
  title: string;
  description?: string;
  to: RouteLocationRaw;
}