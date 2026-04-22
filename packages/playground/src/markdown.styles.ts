// @fuyeor/markdown-parser-playground/src/markdown.styles.ts
import { css } from 'lit';

export const styles = css`
  :host {
    /* 品牌/意图色 */
    --color-brand: #aea4e4;
    --color-brand-deeper: #9f8dff;
    --color-warn: #d93026;
    --color-success: #28a745;
    --color-note: #ffc107;
    --color-info: var(--interact-blue-2);

    /* 固定圆角：用于卡片、输入框 */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;

    /* 地面 */
    --surface: #f7f7f8;
    --surface-hover: #edeef1;
    --surface-transparent: #ffffffd0;
    /* 浮起块 */
    --surface-raised: #fff;
    --surface-raised-hover: rgba(0, 0, 0, 0.03);
    /* 顶端 */
    --surface-top: #f5f5f6;
    --surface-top-hover: #f0f2f4;

    /* 文字颜色 */
    --text-primary: #345;
    --text-secondary: #4d5763;
    --text-tertiary: #67717d;
    /* 链接及 hover */
    --text-accent: var(--interact-blue);
    --text-on-accent: #9c1a1b;

    /* 框架边框 */
    --border-subtle: 1px solid #f0f0f1;
    --border-default: 1px solid #dee2e6;
  }

  /*表格*/
  .table-container {
    width: 100%;
    overflow-x: auto;
    /* 允许水平滚动 */
    border: var(--border-default);
    /* 给容器添加边框 */
    border-radius: var(--radius-lg);
    /* 给容器添加圆角 */
    margin: 20px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
  }

  table {
    /* 表格头部添加边框 */
    thead tr {
      border-bottom: var(--border-default);
      background: var(--surface-hover);
    }

    thead tr th:not(:first-child):not(:last-child) {
      border-left: var(--border-default);
      border-right: var(--border-default);
    }

    th,
    td,
    tr {
      min-width: 100px;
      text-align: left;
      word-wrap: break-word;
      white-space: normal;
      max-width: 400px;
      padding: 10px 4px 10px 10px;
    }

    /* 为非角落单元格添加边框 */
    tr td:not(:first-child):not(:last-child) {
      border-left: var(--border-default);
      /* 添加左侧边框 */
      border-right: var(--border-default);
      /* 添加右侧边框 */
    }

    tr:not(:first-child) td {
      border-top: var(--border-default);
      /* 添加顶部边框 */
    }
  }

  /* 内容区 markdown 富文本 */
  #preview {
    word-wrap: break-word;
    word-break: break-word;

    a {
      color: var(--text-accent);
      transition: color 0.3s;
    }

    a:hover,
    a:focus {
      color: var(--text-on-accent);
    }

    a[href*='www.fuyeor.com']:before {
      content: '';
      position: relative;
      right: 0;
      vertical-align: middle;
      margin-right: 4px;
      display: inline-block;
      width: 18px;
      height: 18px;
      background-size: 18px;
      background-repeat: no-repeat;
      background-position: 50%;
    }

    a[href*='www.fuyeor.com']:before {
      width: 20px;
      height: 20px;
      background-size: 20px;
      background-image: url('https://www.fuyeor.com/favicon.svg');
    }

    /*标题*/
    h1,
    h2,
    h3 {
      color: var(--text-secondary);
      margin: 24px 0 24px 0;
    }

    h2 {
      padding-bottom: 10px;
      border-bottom: var(--border-default);
      font-size: 23px;
    }

    pre {
      padding: 10px;
      border-radius: var(--radius-sm);
      overflow-x: auto;
      background: var(--surface-top);
    }

    code {
      margin: 0 4px;
      padding: 2px 4px;
      /* 使用等宽字体 */
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9rem;
      background: var(--surface-top);
      border-radius: 4px;
    }

    pre > code {
      background: none;
      white-space: pre;
      margin: 0;
      padding: 0;
    }

    p {
      color: var(--text-secondary);
    }

    u {
      text-decoration: none;
      border-bottom: var(--border-subtle);
    }

    hr {
      /* 先把祖传的 3D 边框全干掉！ */
      border: none;
      border-top: var(--border-subtle);
      margin: 2rem 0px;
    }

    ol,
    ul {
      margin: 0 0 0 10px;
      padding: 0;
    }

    li {
      margin: 10px 0 10px 0;
      color: var(--text-secondary);
    }

    code,
    pre,
    pre * {
      font-family: 'Google Sans Code';
    }

    .code-block-wrapper {
      margin: 0 0 20px 0;
      background: var(--surface-top);
      border: var(--border-default);
      border-radius: var(--radius-lg);
    }

    .pre-language {
      font-size: 0.85rem;
      border-bottom: var(--border-default);
      padding: 10px;
    }

    pre {
      position: relative;
      padding: 10px 20px 10px 20px;
      overflow-x: auto;
      /* 横向滚动 */
      white-space: pre;
      /* 保留空格和换行，不自动折行 */
      word-break: normal;
      /* 禁止单词内断行 */
      scrollbar-width: none;
    }

    pre > code {
      background: none;
      white-space: pre;
      /* 保留空格和换行，不自动折行 */
      word-break: normal;
      /* 禁止单词内断行 */
    }

    /* Katex 公式 */
    .math-block {
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
      scrollbar-width: none;
    }

    .math-block > .katex-display {
      white-space: normal;
      /* 防止嵌套问题 */
    }

    blockquote {
      position: relative;
      padding: 4px 12px 4px 20px;
      margin: 0 0 10px 0;
      background: var(--surface-raised);
      background-image: url(https://deliver.fuyeor.net/@fu/commons/icons/filled/quote.svg);
      background-repeat: no-repeat;
      background-position: 8px 4px;
      background-size: 32px;
      color: var(--text-primary);
      border-radius: var(--radius-sm);
      cursor: pointer;
    }

    blockquote::before {
      content: '';
      position: absolute;
      top: 0;
      left: -8px;
      width: 5px;
      height: 100%;
      background-color: var(--surface-raised-hover);
      border-radius: 4px;
    }

    img {
      max-width: 100%;
      border-radius: 6px;
    }

    .blocked-image {
      padding: 20px;
      background: var(--surface-hover);
      border-radius: 6px;
    }

    .emoji {
      margin: 0 0.05rem;
      /* 微调左右间距 */
      position: relative;
      /* 用于微调定位 */
      top: -0.1rem;
      /* 精细微调位置（按需调整） */
      vertical-align: middle;
      /* 关键：垂直居中对齐 */
      border-radius: 0;
    }

    .emoji,
    img.emoji,
    span.emoji {
      height: 1.05rem;
      /* 高度与文字保持一致 */
      width: auto;
      /* 宽度按比例自适应 */
      display: inline-block;
      /* 保持行内特性 */
    }

    /* [UX 优化] Twemoji 样式：确保 emoji 图片和它的文字回退 <span> 都保持一致的尺寸和对齐方式 
    img.emoji, span.emoji {
        margin: 0 0.05em 0 0.1rem;
        vertical-align: -0.15rem;
    }*/
    /* Youtube 播放器 */
    .youtube-facade {
      position: relative;
      width: 100%;
      /* 强制锁定 16:9 宽高比，防止页面跳动 (Layout Shift) */
      aspect-ratio: 16 / 9;
      background: #000;
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      margin: 1.5rem 0;
      border: var(--border-subtle);
      transition: 0.3s all;

      &:hover {
        .play-button {
          background: #ea333d;
        }
      }

      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        /* 裁剪模式，确保填满 */
        opacity: 0.9;
        /* 稍微暗一点，突显播放按钮 */
        transition: opacity 0.3s;
      }

      /* 纯 CSS 绘制的播放按钮 */
      .play-button {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 50px;
        height: 50px;
        transform: translate(-50%, -50%);
        background: rgba(33, 33, 33, 0.8);
        border-radius: 50%;
        z-index: 2;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        /* 绘制三角形 */
        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-style: solid;
          border-width: 10px 0 10px 18px;
          /* 三角形大小 */
          border-color: transparent transparent transparent #fff;
          /* 白色三角形 */
          margin-left: 2px;
          /* 视觉修正居中 */
        }
      }

      /* 播放状态 */
      &.is-playing {
        background: #000;
      }
    }

    .slide-container-wrapper {
      /* 作为一个容器块，上下留白 */
      margin: 1.5rem -1rem;
      /* 负 margin 让它在移动端可以贴边滑动 */
      padding: 0 1rem;
      /* 补偿 padding */
      overflow: hidden;

      /* 防止滚动条溢出容器外 */
      @media (width >= 768px) {
        /* 桌面端恢复正常边距 */
        margin: 1.5rem 0;
        padding: 0;
      }
    }

    .slide-container {
      display: flex;
      gap: 1rem;
      /* 卡片间距 */
      overflow-x: auto;
      /* 允许横向滚动 */
      scroll-snap-type: x mandatory;
      /* 隐藏滚动条 */
      scrollbar-width: none;
    }

    .slide-item {
      /* 布局核心 */
      flex: 0 0 88%;
      /* 移动端占据 88% 宽度，露出下一张的一点点 */
      scroll-snap-align: center;
      /* 停止时居中对齐 */
      border: var(--border-default);
      border-radius: var(--radius-md);
      padding: 0rem 1rem 0.5rem;
      box-sizing: border-box;

      /* 视频播放器取消边距 */
      .youtube-facade {
        margin: 0;
      }

      @media (width >= 768px) {
        /* 桌面端可以并列显示两个，或者宽度更小一点 */
        flex: 0 0 60%;
        scroll-snap-align: start;
        /* 桌面端左对齐更自然 */
      }
    }

    /* Smiles 化学结构式样式 */
    /* .smiles-block {} */

    /* 行内显示 ([smiles]) */
    .smiles-inline {
      display: inline-block;
      height: 1.5em;
      /* 高度跟随文字大小，稍微大一点点看着舒服 */
      vertical-align: middle;
      /* 与文字中线对齐 */
      margin: 0 2px;
      /* 左右留一点点呼吸空间 */
      transform: translateY(-2px);
      /* 微调视觉中心 */
      transition: filter 0.3s ease;
    }

    /* Chain (思考链/时间轴) 样式 */
    .chain-container {
      display: flex;
      flex-direction: column;
      /* 去掉 gap，让 item 紧贴，靠 padding 控制间距，这样线才好连 */
      margin: 1.5rem 0;
      padding-left: 1rem;
      font-style: italic;
    }

    .chain-item {
      position: relative;
      /* 用 padding 替代原来的 gap，给下一段留出呼吸空间 */
      padding-bottom: 1.2rem;

      /* 这是一条贯穿整个 item 的线 */
      &::before {
        content: '';
        position: absolute;
        /* 这里的 left 要和 marker 的中心对齐 */
        /* marker left 是 -18px, width 是 12px -> 中心点大概在 -12px 左右 */
        /* 我们微调一下，假设 marker 还是相对于 content 定位 */
        left: -13px;
        top: 0;
        bottom: 0;
        /* 撑满整个高度！ */
        width: 1.5px;
        background: var(--text-tertiary);
        opacity: 0.3;
        /* 稍微淡一点，不要抢了圆圈的风头，显得极简 */
        z-index: 0;
      }

      /* 处理最后一个节点：线不要拖到底，只要连到圆圈就行 */
      &:last-child {
        padding-bottom: 0;

        &::before {
          /* 让线只延伸到圆圈的位置，或者直接隐藏下半部分 */
          /* 简单的做法：把线的高度设为圆圈的 top 值 */
          bottom: auto;
          height: 6px;
        }
      }

      /* 如果第一个节点上面不需要线 */
      &:first-child::before {
        top: 6px;
        /* 从圆圈中间开始往下画 */
      }
    }

    /* 圆圈 */
    .chain-marker {
      position: absolute;
      left: -20px;
      top: 0;
      /* 调整为 0 或配合 line-height 对齐 */
      margin-top: 6px;
      /* 微调垂直对齐，视字体大小而定 */
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      /* 加上边框颜色，强调一下 */
      border: 1.5px solid var(--color-brand);
      /* 背景色遮住后面的线 */
      background: var(--surface);
      z-index: 1;
      /* 必须比线高，压住线 */
      box-sizing: border-box;
    }

    .chain-content-wrapper {
      padding-left: 1rem;
      position: relative;
    }

    .chain-title {
      font-weight: bold;
      margin-bottom: 1rem;
    }

    .chain-body {
      color: var(--text-secondary);
      font-size: 0.95em;

      p {
        margin: 0.5rem 0;
      }
    }

    .chain-item.is-completed,
    .chain-item.is-pending {
      /* 圆圈里的图片样式 */
      .chain-marker::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-48%, -48%);
        width: 14px;
        height: 14px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        z-index: 5;
      }
    }

    /* 状态：已完成 (is-completed) */
    .chain-item.is-completed {
      /* 圆圈变实心 */
      .chain-marker {
        border-color: var(--color-success);
      }

      /* 在圆圈里加个对勾 */
      .chain-marker::after {
        background-image: url('https://deliver.fuyeor.net/@fu/icons/outlined/checked.svg');
      }

      /* 标题稍微淡一点，表示已过去 */
      .chain-title {
        opacity: 0.8;
      }
    }

    /* 状态：待办 (is-pending) */
    .chain-item.is-pending {
      .chain-marker {
        border-color: var(--color-note);
      }

      .chain-marker::after {
        background-image: url('https://deliver.fuyeor.net/@fu/icons/outlined/more-horizon.svg');
      }
    }
  }
`;
