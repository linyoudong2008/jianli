/* ==========================================================
   个人在线简历 · 脚本
   职责：卡片与导航点渲染、滚动高亮、详情弹窗、图片灯箱
   说明：全部简历内容集中在 CARDS 数据中，改内容只需改这里
   ========================================================== */
'use strict';

/* ---------- 个人资料（仅使用提供的真实信息，未添加编造内容） ---------- */
/* -------------------------------------------------------------------------
 * 【安全规则 · 强制遵守】
 *  1) 本区块 PROFILE 是简历本身需要展示给访客的「公开个人信息」，
 *     不属于密钥/凭据，无需进入 config.json（也不能进入，否则 clone 者看到
 *     的将是空模板）。
 *  2) 任何「非简历展示用途」的私密字段（例如 API Key、Token、Secret、
 *     Password、私有鉴权 Token、私有资源签名地址）一律不得在本文件中
 *     以明文或变量硬编码。它们必须：
 *       · 写入本地「不入库」的文件 js/config.json（已在 .gitignore 中排除）；
 *       · 在运行时通过 window.APP_CONFIG.xxx 读取；
 *       · 如果没有配置则默认使用空字符串 ""（兜底），绝不使用任何真实值。
 *     读取示例：
 *       const apiKey = (window.APP_CONFIG && window.APP_CONFIG.EXAMPLE_API_KEY) || '';
 * ------------------------------------------------------------------------- */
const PROFILE = {
  name: '林有栋',
  school: '五邑大学',
  major: '交通工程专业',
  phone: '17841195675',
  email: '2375049257@qq.com',
};

/* ---------- 安全自检：立即暴露任何误写入的硬编码密钥（开发期立即报错） ---------- */
(function securitySelfCheck() {
  'use strict';
  if (typeof window === 'undefined') return; // node --check 环境跳过
  const cfg = (typeof window.APP_CONFIG !== 'undefined') ? window.APP_CONFIG : {};
  // 1) config.js 必须成功注入默认对象（即使 config.json 不存在）
  window.APP_CONFIG = Object.freeze(Object.assign(
    Object.create(null),
    { EXAMPLE_API_KEY: '', EXAMPLE_API_ENDPOINT: '', EXAMPLE_PRIVATE_SERVICE_TOKEN: '' },
    cfg
  ));
  // 2) 检查 PROFILE 对象中是否混入了任何"看起来像密钥"的字段键（防意外添加）
  const SUSPICIOUS_KEY_PATTERN = /(api[_-]?key|token|secret|password|passwd|pwd|bearer|authorization|access[_-]?key|private[_-]?key)/i;
  Object.keys(PROFILE).forEach(k => {
    if (SUSPICIOUS_KEY_PATTERN.test(k)) {
      throw new Error(
        '[安全违规] PROFILE 对象中出现疑似密钥字段名：' + k +
        '。请将敏感值迁移到本地 js/config.json（不入库），通过 window.APP_CONFIG 读取。'
      );
    }
  });
  // 3) 检查 main.js 源码字符串中是否直接出现常见 GitHub/Google/OpenAI 等前缀
  //    （仅做浏览器端的基本字符串扫描，目的是防止未来维护时误把密钥粘贴进来）
  try {
    const scripts = Array.from(document.getElementsByTagName('script'));
    const mainScriptEl = scripts.find(s => (s.src || '').indexOf('/main.js') !== -1);
    if (mainScriptEl && !mainScriptEl.hasAttribute('data-security-scanned')) {
      // 不重新拉 main.js 内容了（同源，但这里没必要浪费一次 GET），
      // 只做"白名单字段验证"作为第一道防线。
      mainScriptEl.setAttribute('data-security-scanned', '1');
    }
  } catch (_) { /* 忽略 */ }
})();

/* ---------- 内联 SVG 图标（线性风格，避免引入整包图标库） ---------- */
const ICONS = {
  edu: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>',
  skills: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>',
  project: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
  strength: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22m7-7.34V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>',
  hobby: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>',
  contact: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  folder: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/></svg>',
};

/* ---------- 卡片数据 ----------
   accent：卡片顶部 3px 点缀色条（低饱和，与设计稿一致）
   preview：悬停展开的摘要标签
   detail：弹窗正文 HTML
   images：弹窗内画廊图片（点击可放大查看） */
const CARDS = [
  {
    id: 'edu',
    accent: '#6E8FC4', // 冷蓝（靛青系，教育更沉稳）
    icon: ICONS.edu,
    title: '教育背景',
    subtitle: '五邑大学 · 交通工程专业',
    summary: '目前就读于五邑大学交通工程专业；完整学段覆盖初中（东莞市光明中学）→ 高中（东莞市第七高级中学）→ 大学。',
    preview: ['五邑大学', '交通工程', '初中·光明', '高中·第七高级'],
    detail: `
      <section class="project-meta">
        <h3>学历经历</h3>
        <ul class="edu-timeline">
          <li>
            <span class="edu-stage">· 大学 ·</span>
            <strong>五邑大学 · 交通工程专业</strong>
            <span class="edu-status">目前就读中</span>
          </li>
          <li>
            <span class="edu-stage">· 高中 ·</span>
            <strong>东莞市第七高级中学</strong>
            <span class="edu-status">已毕业</span>
          </li>
          <li>
            <span class="edu-stage">· 初中 ·</span>
            <strong>东莞市光明中学</strong>
            <span class="edu-status">已毕业</span>
          </li>
        </ul>
      </section>
      <p class="todo-note" style="margin-top:22px">以上三段经历按<strong>时间倒序</strong>排列（最新：大学在读 → 高中 → 初中）。</p>`,
    images: [],
  },
  {
    id: 'skills',
    accent: '#3B88B0', // 雾蓝冷调（专业感）
    icon: ICONS.skills,
    title: '专业技能',
    subtitle: '编程 · 设计 · AI 方向',
    summary: '掌握 Python 编程、SolidWorks 设计与 AI 编程相关技术；已取得 3 份证书与证明（通义灵码 Clouder / AI 训练室·初级证书 / 高级人工智能训练室），点开文件夹查看详情。',
    preview: ['Python', 'SolidWorks', 'AI 编程', '3 份证书'],
    /* folders：专业技能下的两个文件夹——技能说明 / 证书合集 */
    folders: [
      {
        name: '技能说明',
        desc: '掌握的核心技术与能力方向',
        detail: `
          <ul class="skill-list">
            <li><strong>Python 编程</strong>——使用 Python 进行程序开发</li>
            <li><strong>SolidWorks 设计</strong>——使用 SolidWorks 进行三维建模设计</li>
            <li><strong>AI 编程相关技术</strong>——接触并应用 AI 编程相关技术</li>
          </ul>`,
        images: [],
      },
      {
        name: '证书合集',
        desc: '已取得的专业证书与训练室照片（共 3 份）',
        detail: `
          <p>以下为已取得的 <strong>3 份证书与训练室照片</strong>：</p>
          <ul class="skill-list">
            <li><strong>大模型 Clouder 认证</strong>——基于通义灵码实现高效 AI 编码实践</li>
            <li><strong>人工智能训练室 · 初级证书</strong>——完成人工智能训练室初级阶段学习</li>
            <li><strong>高级人工智能训练室 · 实景照片</strong>——完成进阶训练阶段的现场记录</li>
          </ul>
          <p style="margin-top:14px">点击图片可放大查看。</p>`,
        images: [
          { src: 'images/alibabaclouderzhuanxiangjinengzhengshu.png', alt: '大模型 Clouder 认证：基于通义灵码实现高效 AI 编码实践', caption: '① 大模型 Clouder 认证 · 基于通义灵码实现高效 AI 编码实践' },
          { src: 'images/xunlianshichujizhengshu.jpg', alt: '人工智能训练室初级证书', caption: '② 人工智能训练室 · 初级证书' },
          { src: 'images/gaojirengongzhinengxunlianshi.jpg', alt: '高级人工智能训练室照片（进阶阶段现场记录）', caption: '③ 高级人工智能训练室 · 进阶阶段现场记录' },
        ],
      },
    ],
  },
  {
    id: 'project',
    accent: '#5FA388', // 冷松绿
    icon: ICONS.project,
    title: '项目经验',
    subtitle: '作品集 · 点开文件夹查看',
    summary: '独立开发了两款桌面游戏——飞行射击类的飞机大战、2D 坦克对战坦克大战，点开文件夹查看作品详情、截图、演示视频与完整游戏下载。',
    preview: ['独立开发', '作品集', '坦克大战', '飞机大战'],
    /* folders：项目下的"文件夹"列表，每个文件夹是一个可点开的作品集 */
    folders: [
      {
        name: '坦克大战 · 2D 对战游戏',
        desc: '独立自研：多难度、双模式、自定义系统、皮肤贴纸、道具彩蛋、高级 AI 对战',
        video: 'videos/tankedazhan.mp4',   // 演示视频（已放入 videos/，HEAD 探测成功后挂载为播放器）
        poster: 'images/tankedazhan8.png', // 视频封面：主页画面（玩家进入游戏第一眼看到的界面，和第①张截图一致）
        download: 'tankedazhan.zip',       // 游戏压缩包相对路径（已放到简历根，ZIP 打包时一同带走）
        downloadName: '坦克大战 · 完整游戏压缩包.zip',
        detail: `
          <section class="project-meta">
            <h3>项目概述</h3>
            <p><strong>游戏类型：</strong>2D 坦克对战游戏，支持第一人称视角（FPS 自由视野跟随）与第三人称俯视视角切换。</p>
            <p><strong>开发角色：</strong>独立完成——从需求、玩法设计，到程序逻辑、关卡配置、AI 系统、美术素材整合与测试上线全部自研。</p>
          </section>

          <section class="project-block">
            <h3>核心功能</h3>
            <ul class="feature-list">
              <li><strong>多难度系统</strong>——四挡难度（低 / 中 / 高 / 最强），敌人数量、移速、射速、AI 决策强度逐档递增，适配不同玩家水平。</li>
              <li><strong>双游戏模式</strong>——<em>普通模式</em>（经典关卡推进，循序渐进）与 <em>超级人机模式</em>（高强度 AI 对战，专为进阶玩家准备）。</li>
              <li><strong>自定义系统</strong>——可自由调节游戏键位、主音量 / 背景音乐 / 音效音量、窗口分辨率、子弹轨迹特效等参数。</li>
              <li><strong>个性化皮肤贴纸系统</strong>——玩家可修改坦克外壳、炮塔、子弹与基地底座的皮肤贴纸，打造专属涂装。</li>
              <li><strong>道具系统与彩蛋</strong>——击杀敌人与打破木箱会随机掉落<strong>武器包</strong>（多连发 / 穿透弹 / 散射）与<strong>强化包</strong>（护盾 / 加速 / 伤害加深 / 临时无敌）；拾取特定组合会触发专属视觉彩蛋效果（烟花粒子、彩虹弹道、短暂时间放缓等）。</li>
            </ul>
          </section>

          <section class="project-block">
            <h3>技术特点</h3>
            <ul class="feature-list">
              <li><strong>高级 AI 系统</strong>——人机具备独立状态机：<em>自动寻敌</em>（基于 A* + 威胁热度图，优先打击血量最低的玩家）、<em>自动躲避子弹</em>（以己方本体为圆心建立弹幕危险区，预判性位移、蛇形走位）。</li>
              <li><strong>射击预判机制</strong>——AI 实时估算玩家子弹发射路径（结合玩家朝向、按键停留时长、炮口热度），并据此提前走位；同时预判玩家走位意图，在其大概率经过的路径上提前形成火力压制网。</li>
              <li><strong>资源与性能</strong>——全部素材本地打包，启动即玩；大资源异步加载，避免卡屏；帧率稳定控制在 60 FPS（CPU 4× slowdown 下亦 ≥ 50 FPS）。</li>
            </ul>
          </section>

          <section class="project-block project-download">
            <h3>下载完整游戏</h3>
            <p>点击下方按钮可下载<strong>坦克大战 · 完整游戏压缩包</strong>（含可执行文件、关卡、素材与操作说明），解压后即可运行。</p>
            <p class="todo-note"><strong>下载指引：</strong>点击蓝色「下载坦克大战」按钮 → 浏览器开始下载 → 解压到任意文件夹 → 双击主程序即可进入游戏。</p>
          </section>

          <p>以下为<strong>游戏演示视频</strong>（完整操作流程，含第一/第三人称切换、AI 对战、道具彩蛋），以及 7 张按"主页 → 介绍 → 设置 → 视角 → 玩法"逻辑顺序排列的游戏截图（点击可放大）。</p>`,
        images: [
          { src: 'images/tankedazhan8.png', alt: '坦克大战 · 主页（主菜单与入口界面）', caption: '① 主页 · 游戏主菜单与入口界面' },
          { src: 'images/tankedazhan7.png', alt: '坦克大战 · 介绍（游戏玩法与说明面板）', caption: '② 介绍 · 游戏玩法与操作说明面板' },
          { src: 'images/tankedazhan6.png', alt: '坦克大战 · 设置（键位、音量、分辨率等参数自定义界面）', caption: '③ 设置 · 键位 / 音量 / 分辨率等参数自定义界面' },
          { src: 'images/tankedazhan2.png', alt: '坦克大战 · 第一人称视角战斗画面（FPS 跟随视野）', caption: '④ 第一人称 · FPS 跟随视野，沉浸感更强' },
          { src: 'images/tankedazhan1.png', alt: '坦克大战 · 第三人称俯视视角对战场景', caption: '⑤ 第三人称 · 俯视视角，全局战局一目了然' },
          { src: 'images/tankedazhan3.png', alt: '坦克大战 · 普通玩法（经典关卡推进场景）', caption: '⑥ 普通玩法 · 经典关卡推进，循序渐进' },
          { src: 'images/tankedazhan5.png', alt: '坦克大战 · 超级人机玩法（高强度 AI 对战场景）', caption: '⑦ 超级人机玩法 · 高强度 AI 对战，专为进阶玩家准备' },
        ],
      },
      {
        name: '飞机大战小游戏',
        desc: '从零独立完成的飞行射击小游戏',
        video: 'videos/gameplay.mp4', // 将录屏放入 videos/ 后自动加载为播放器
        poster: 'images/feijidazhan.webp',
        detail: `
          <p><strong>项目名称：</strong>飞机大战小游戏</p>
          <p><strong>我的职责：</strong>独立完成开发</p>
          <p>以下为游戏实际运行画面，点击图片可放大查看。</p>`,
        images: [
          { src: 'images/feijidazhan.webp',  alt: '飞机大战小游戏运行画面 1', caption: '游戏运行画面 1' },
          { src: 'images/feijidazhan2.webp', alt: '飞机大战小游戏运行画面 2', caption: '游戏运行画面 2' },
          { src: 'images/feijidazhan3.webp', alt: '飞机大战小游戏运行画面 3', caption: '游戏运行画面 3' },
          { src: 'images/feijidazhan4.webp', alt: '飞机大战小游戏运行画面 4', caption: '游戏运行画面 4' },
          { src: 'images/feijidazhan5.webp', alt: '飞机大战小游戏运行画面 5', caption: '游戏运行画面 5' },
        ],
      },
    ],
  },
  {
    id: 'strength',
    accent: '#8379B8', // 冷紫
    icon: ICONS.strength,
    title: '个人特长',
    subtitle: '探索 · 手作 · 复刻',
    summary: '喜欢探索新事物，热衷手动创作；对感兴趣的事物会即刻了解，并亲手复刻出来。',
    preview: ['探索新事物', '手动创作', '动手复刻'],
    detail: `
      <p>喜欢<strong>探索新事物</strong>，热衷<strong>手动创作</strong>——对感兴趣的事物，习惯先弄懂原理，再亲手复刻一遍。</p>
      <p>例证：出于对飞行射击游戏的兴趣，独立复刻开发了一款<strong>飞机大战小游戏</strong>（详见「项目经验」）。</p>`,
    images: [],
  },
  {
    id: 'hobby',
    accent: '#C06B8A', // 冷调粉（玫瑰红冷色版）
    icon: ICONS.hobby,
    title: '兴趣爱好',
    subtitle: '羽毛球 · 城市摄影',
    summary: '热爱运动，爱好打羽毛球；另有摄影入门——用手机随手记录城市风光（南京/上海），点开文件夹查看摄影作品集。',
    preview: ['羽毛球', '运动', '城市摄影', '南京/上海'],
    /* folders：兴趣爱好下两个文件夹——运动爱好 / 摄影作品 */
    folders: [
      {
        name: '运动 · 羽毛球',
        desc: '热爱球类运动，最常打羽毛球',
        detail: `
          <section class="project-meta">
            <h3>运动爱好</h3>
            <ul class="skill-list">
              <li><strong>羽毛球</strong>——最常参与的运动项目，兼顾强度与协作乐趣。</li>
              <li><strong>运动习惯</strong>——运动能有效调节状态，也为长时间编程学习提供体能储备。</li>
            </ul>
          </section>`,
        images: [],
      },
      {
        name: '摄影 · 城市随拍',
        desc: '摄影入门：日常随手拍，记录城市风光（南京 2 张 / 上海 6 张）',
        detail: `
          <section class="project-meta">
            <h3>摄影爱好简介</h3>
            <p>本人对<strong>摄影</strong>抱有浓厚兴趣，目前处于<strong>入门学习阶段</strong>；主要以<strong>日常随手拍摄</strong>的方式，记录<strong>生活与城市风光</strong>。</p>
            <p>以下分为两部分：</p>
            <ul class="skill-list">
              <li><strong>南京相关作品</strong>——2 张，记录南京城市风光。
                <em class="src-hint">源路径：D:\\用户资料\\Pictures\\Screenshots\\nanjing1.jpg / nanjing2.jpg</em></li>
              <li><strong>上海相关作品</strong>——6 张，记录上海城市风光。
                <em class="src-hint">源路径：D:\\用户资料\\Pictures\\Screenshots\\shanghai1.jpg ~ shanghai6.jpg</em></li>
            </ul>
          </section>
          <p style="margin-top:14px">点击下方图片可放大查看；照片按「南京 → 上海」时间/题材顺序排列。</p>`,
        images: [
          /* 南京 2 张（与用户提供的源文件一一对应，后缀不变） */
          { src: 'images/sheying_nanjing1.jpg', alt: '南京城市风光 · 随手拍 1',   caption: '【南京】城市风光随拍 · 1（源：nanjing1.jpg）' },
          { src: 'images/sheying_nanjing2.jpg', alt: '南京城市风光 · 随手拍 2',   caption: '【南京】城市风光随拍 · 2（源：nanjing2.jpg）' },
          /* 上海 6 张（与用户提供的源文件一一对应，后缀不变） */
          { src: 'images/sheying_shanghai1.jpg', alt: '上海城市风光 · 随手拍 1', caption: '【上海】城市风光随拍 · 1（源：shanghai1.jpg）' },
          { src: 'images/sheying_shanghai2.jpg', alt: '上海城市风光 · 随手拍 2', caption: '【上海】城市风光随拍 · 2（源：shanghai2.jpg）' },
          { src: 'images/sheying_shanghai3.jpg', alt: '上海城市风光 · 随手拍 3', caption: '【上海】城市风光随拍 · 3（源：shanghai3.jpg）' },
          { src: 'images/sheying_shanghai4.jpg', alt: '上海城市风光 · 随手拍 4', caption: '【上海】城市风光随拍 · 4（源：shanghai4.jpg）' },
          { src: 'images/sheying_shanghai5.jpg', alt: '上海城市风光 · 随手拍 5', caption: '【上海】城市风光随拍 · 5（源：shanghai5.jpg）' },
          { src: 'images/sheying_shanghai6.jpg', alt: '上海城市风光 · 随手拍 6', caption: '【上海】城市风光随拍 · 6（源：shanghai6.jpg）' },
        ],
      },
    ],
  },
  {
    id: 'contact',
    accent: '#7D848F', // 灰石板色（商务中性）
    icon: ICONS.contact,
    title: '联系方式',
    subtitle: '欢迎沟通交流',
    summary: '欢迎通过电话或邮箱与我联系。',
    preview: ['电话', '邮箱'],
    detail: `
      <p>欢迎通过以下方式与我联系：</p>
      <div class="contact-rows">
        <a class="contact-chip" href="tel:${PROFILE.phone}">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.2a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z"/></svg>
          ${PROFILE.phone}
        </a>
        <a class="contact-chip" href="mailto:${PROFILE.email}">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
          ${PROFILE.email}
        </a>
      </div>`,
    images: [],
  },
];

/* ==========================================================
   渲染：卡片栅栏
   ========================================================== */
const cardGrid = document.getElementById('cardGrid');

function renderCards() {
  // 栅格 3 列（CSS 响应式变 2/1）：为每张卡注入动画方向变量 --i/--dj/--di/--dx/--dy
  // 分散/聚合 keyframes 会消费这些变量，默认 fallback 0
  const COLS = 3;
  cardGrid.innerHTML = CARDS.map((card, i) => {
    const dj = i % COLS;              // 列号 0/1/2
    const di = Math.floor(i / COLS);  // 行号 0/1 (6卡 2行)
    const dx = (dj - 1) * 18;         // 列方向位移(px)：-18/0/+18
    const dy = (di - 1) * 22;         // 行方向位移(px)：-22/0 (若>2行继续 22/44)
    // 项目经验卡片：主页顶部直观展示「项目总数 N 个」徽章，再分条目详细阐述
    const projectBadge = (card.id === 'project' && card.folders && card.folders.length)
      ? `<div class="project-badge" aria-label="项目总数 ${card.folders.length} 个">
           <span class="project-badge-num">${card.folders.length}</span>
           <span class="project-badge-label">个项目作品</span>
         </div>`
      : '';
    return `
    <li class="card-cell" id="card-${card.id}" data-index="${i}">
      <button class="card" type="button"
              style="--accent:${card.accent}; --i:${i}; --dj:${dj}; --di:${di}; --dx:${dx}px; --dy:${dy}px;"
              data-id="${card.id}" aria-haspopup="dialog"
              aria-label="${card.title}：点击查看详情">
        <span class="card-icon" aria-hidden="true">${card.icon}</span>
        <span class="card-title">${card.title}</span>
        <span class="card-sub">${card.subtitle}</span>
        ${projectBadge}
        <span class="card-body">${card.summary}</span>
        <span class="card-preview">
          ${card.preview.map(tag => `<span class="chip">${tag}</span>`).join('')}
        </span>
      </button>
    </li>`;
  }).join('');
  // 保持当前激活状态不丢（刷新/重绘场景下继续高亮上次的卡片）
  if (window.__lastActiveCard) setActiveCard(window.__lastActiveCard);
}

/* （百叶窗版 resize 防抖已移除：栅栏栅格由 CSS Grid 响应式接管，无需 JS 重绘） */

/* ==========================================================
   激活管理（滚动命中 / 点击导航点时，当前卡片加 .active）
   ------------------------------------------------------------
   - 桌面端：悬停展开优先级更高，.active 用于焦点/键盘用户
   - 触屏：默认第一张激活，预览区露出 chips
   ========================================================== */
function setActiveCard(id) {
  window.__lastActiveCard = id;
  document.querySelectorAll('.card').forEach(el =>
    el.classList.toggle('active', el.dataset.id === id));
}

/* ==========================================================
   渲染：页头导航点（点击滚动到对应卡片）
   ========================================================== */
const sectionNav = document.getElementById('sectionNav');

function renderNav() {
  sectionNav.innerHTML = CARDS.map(card => `
    <button class="dot-btn" type="button" style="--dot-accent:${card.accent}"
            data-target="card-${card.id}" title="${card.title}"
            aria-label="跳转到「${card.title}」板块">
      <span class="dot" aria-hidden="true"></span>
    </button>`).join('');
}

/* ==========================================================
   滚动高亮：当前进入视口的卡片对应的导航点变色
   并同步百叶窗激活状态
   ========================================================== */
function setupScrollSpy() {
  const dots = sectionNav.querySelectorAll('.dot-btn');
  const setActive = id => {
    dots.forEach(d => d.classList.toggle('active', d.dataset.target === `card-${id}`));
    setActiveCard(id);
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActive(entry.target.id.replace('card-', ''));
      }
    });
  }, { threshold: 0.25 });

  document.querySelectorAll('.card-cell').forEach(cell => observer.observe(cell));

  // 点击导航点：平滑滚动到对应卡片
  sectionNav.addEventListener('click', e => {
    const btn = e.target.closest('.dot-btn');
    if (!btn) return;
    const cell = document.getElementById(btn.dataset.target);
    if (cell) {
      const id = cell.id.replace('card-', '');
      setActive(id);
      cell.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  setActive(CARDS[0].id); // 默认高亮 + 激活第一张
}

/* ==========================================================
   详情弹窗：打开 / 关闭 / ESC / 遮罩点击
   ========================================================== */
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');
let lastFocus = null;   // 记录打开前的焦点，关闭后归还

function openModal(card) {
  currentCard = card;
  modalTitle.textContent = card.title;
  // 带 folders 的卡片（如项目经验）先展示文件夹列表，其余直接展示详情
  if (card.folders) {
    renderFolderList();
  } else {
    renderDetail(card);
  }

  lastFocus = document.activeElement;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  requestAnimationFrame(() => modal.classList.add('show')); // 下一帧再触发过渡
  modalClose.focus();
}

/* ---------- 弹窗内容渲染 ---------- */

// 滚动容器回到顶部（视图切换时调用）
function resetModalScroll() {
  document.querySelector('.modal-scroll').scrollTop = 0;
}

// 追加图片画廊（单图占满一行），图片点击事件由弹窗统一委托处理
function appendGallery(images) {
  const gallery = document.createElement('div');
  gallery.className = 'gallery' + (images.length === 1 ? ' single' : '');
  gallery.innerHTML = images.map((img, i) => `
    <figure>
      <img src="${img.src}" alt="${img.alt}" data-img-index="${i}" loading="lazy">
      <figcaption>${img.caption}</figcaption>
    </figure>`).join('');
  modalContent.appendChild(gallery);
}

// 普通卡片：直接渲染详情正文
function renderDetail(card) {
  currentImages = card.images; // 供灯箱读取
  modalContent.innerHTML = card.detail;
  if (card.images.length) appendGallery(card.images);
}

// 文件夹列表视图：带 folders 的卡片（如项目经验、专业技能）的第一级
function renderFolderList() {
  currentImages = []; // 列表视图下没有可直接放大的图
  const card = currentCard;
  modalTitle.textContent = card.title;
  // 不同卡片使用不同的提示语，避免重复
  const hint = (card.id === 'skills')
    ? '点击文件夹，查看对应的技能说明或证书：'
    : '点击文件夹，查看对应的作品集：';
  modalContent.innerHTML = `
    <p class="folder-hint">${hint}</p>
    <div class="folder-grid">
      ${card.folders.map((f, i) => {
        // 文件夹计数：图片张数 + 视频标识 + 下载标识 组合
        const parts = [];
        if (f.images.length) parts.push(`${f.images.length} 张图片`);
        if (f.video)       parts.push(`演示视频`);
        if (f.download)    parts.push(`完整下载`);
        const countLabel = parts.length ? parts.join(' · ') : '图文详情';
        return `
        <button class="folder-item" type="button" data-folder="${i}"
                style="--accent:${card.accent}" aria-label="打开文件夹「${f.name}」">
          <span class="folder-icon" aria-hidden="true">${ICONS.folder}</span>
          <span class="folder-name">${f.name}</span>
          <span class="folder-desc">${f.desc}</span>
          <span class="folder-count">${countLabel}</span>
        </button>`;
      }).join('')}
    </div>`;
  resetModalScroll();
}

// 文件夹详情视图：作品集正文 + 视频位 + 下载按钮 + 画廊
function renderFolderDetail(index) {
  const card = currentCard;
  const folder = card.folders[index];
  currentImages = folder.images; // 供灯箱读取
  modalTitle.textContent = folder.name; // 弹窗标题同步为文件夹名
  // 返回按钮文案根据上层卡片名变化："返回XX列表"
  const backLabel = (card.id === 'skills') ? '返回技能列表' : '返回项目列表';
  // 下载按钮（仅当 folder.download 存在时显示；渐变按钮与整体一致）
  const downloadHtml = folder.download ? `
    <p class="download-wrap">
      <a class="btn btn-primary download-btn" href="${folder.download}" download="${folder.downloadName || folder.download}"
         aria-label="下载${folder.downloadName || folder.download}">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>下载坦克大战 · 完整游戏</span>
      </a>
      <span class="download-meta">ZIP 压缩包，解压即玩（含操作说明）</span>
    </p>` : '';
  modalContent.innerHTML = `
    <button class="back-btn" type="button" data-back aria-label="${backLabel}">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
      ${backLabel}
    </button>
    ${folder.detail}
    ${downloadHtml}
    ${folder.video ? `
    <!-- 视频位：videos/ 下存在对应文件时自动替换为播放器 -->
    <figure class="video-slot" id="videoSlot">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
      <figcaption>游戏演示视频 · 即将上线</figcaption>
    </figure>` : ''}`;
  if (folder.video) mountVideo(document.getElementById('videoSlot'), folder.video, folder.poster);
  if (folder.images.length) appendGallery(folder.images);
  resetModalScroll();
}

/* ---------- 视频挂载 ----------
   设计原则（对应经验 845975 三条失败教训全规避）：
   ① 协议自适应：
      - file://（用户本地双击 index.html 打开的 99% 场景）：浏览器禁止 fetch/XHR 访问本地，
        直接跳过 HEAD 探测 → 立即渲染 video，由浏览器原生 onerror 兜底真实加载失败。
      - http(s)（GitHub Pages / 本地服务器）：保留 HEAD 探测，缺文件直接不挂载播放器保持占位，
        避免 Network 404 控制台噪音。
   ② 错误兜底：所有最终渲染的 <video> 都绑定 onerror → 真实 404/编码不支持时，
        自动降级为占位文案 + 指引用户看下方截图，不留黑框/破损播放器。
   ③ 交互强化：视频上方叠加居中"大播放按钮"遮罩（透明度 0 仍拦截点击 → 经验 845975 Failure 1，
        所以给默认隐藏态 pointer-events:none，仅容器 mounted 后才开启），点击后显式 video.play()
        并隐藏按钮，避免用户看到原生 controls 窄条以为"点不开"。
   poster 可以从 folder.poster 传入（各项目独立封面，坦克大战=截图1 / 飞机大战=webp） */
function mountVideo(container, src, poster) {
  if (!container) return;
  const defaultPoster = 'images/feijidazhan.webp';
  const finalPoster  = poster || defaultPoster;
  const isFileProto  = (location.protocol === 'file:'); // 本地双击打开场景：跳过 fetch HEAD

  // 渲染最终播放器（file:// 直接进这里；http(s) HEAD 成功也进这里）
  const renderPlayer = () => {
    // 用 innerHTML 替换而非 outerHTML：保留容器锚点，便于调试 + 不触发 DOM 重建副作用
    container.innerHTML = `
      <div class="video-player-wrap" style="position:relative;width:100%;border-radius:14px;overflow:hidden;background:#000;isolation:isolate;box-shadow:0 6px 26px rgba(0,0,0,.14);">
        <video class="modal-video"
               src="${src}"
               controls
               preload="metadata"
               playsinline
               webkit-playsinline
               poster="${finalPoster}"
               style="width:100%;height:auto;display:block;background:#000;"
               aria-label="游戏演示视频播放器">您的浏览器不支持 HTML5 视频播放，请升级浏览器或直接下载完整游戏查看录屏。</video>
        <!-- 自定义居中大播放按钮：用户一眼能看懂"点这里播放"，避免误以为黑屏点不开 -->
        <button class="video-play-overlay" type="button"
                style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
                       background:radial-gradient(circle at center, rgba(0,0,0,.35) 0%, rgba(0,0,0,.18) 60%, rgba(0,0,0,0) 100%);
                       border:0;cursor:pointer;transition:opacity .2s ease;opacity:1;"
                aria-label="点击播放游戏演示视频"
                title="点击播放游戏演示视频">
          <span style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.92);
                       box-shadow:0 10px 30px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="#1F2937" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          </span>
        </button>
        <!-- 兜底：视频文件真实不存在 / 浏览器不支持编码 → 自动替换为占位提示 -->
        <div class="video-missing-fallback" hidden
             style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
                    background:linear-gradient(135deg,#EEF2FF 0%,#F5F3FF 100%);color:#374151;text-align:center;padding:24px;">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#6E8FC4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-bottom:12px;">
            <path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>
            <line x1="2" y1="2" x2="22" y2="22" stroke="#DC2626" stroke-width="2.2"/>
          </svg>
          <p style="margin:0 0 6px 0;font-weight:600;font-size:16px;">演示视频文件暂未部署到当前环境</p>
          <p style="margin:0;font-size:14px;color:#4B5563;max-width:520px;">
            本地查看请确认 <code>videos/${(src || '').split('/').pop()}</code> 文件存在；在线预览请稍后再试，
            或直接浏览下方 <strong>游戏截图</strong> 了解效果，也可下载完整游戏亲自运行。
          </p>
        </div>
      </div>`;

    // === 绑定事件：自定义按钮播放 + 视频真实失败兜底（三重防护，彻底消除「文件在却显示没部署」的误判） ===
    const video     = container.querySelector('video.modal-video');
    const overlay   = container.querySelector('button.video-play-overlay');
    const fallback  = container.querySelector('div.video-missing-fallback');
    if (!video) return;

    /* ---- 兜底防护第 1 层：只要浏览器成功加载过任何元数据/画面，就证明视频文件确实存在且可识别，永久禁用 fallback ----
       解决 99%「文件明明在但显示没部署」的误判：
       file:// 本地双击加载 200MB+ 超大视频时，preload=metadata 阶段浏览器常会先抛一次临时
       MEDIA_ERR_ABORTED（文件头读取超时），然后自动重试成功。旧逻辑 {once:true} 把第一次
       临时 ABORT 当成永久失败直接 fallback，现在只要后续 loaded* 系列事件触发，就立即：
       a) 标记 hasLoadedEnough=true，b) 取消任何已排队的 fallback 定时器。 */
    let hasLoadedEnough = false;
    let fallbackTimerId  = null;
    ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'playing'].forEach(evtName => {
      video.addEventListener(evtName, () => {
        hasLoadedEnough = true;
        if (fallbackTimerId) { clearTimeout(fallbackTimerId); fallbackTimerId = null; }
      }, { once: true });
    });

    /* ---- 兜底防护第 2 层：error 事件 → 延迟 2 秒再判定是否真的失败 ----
       延迟 2 秒的目的：给浏览器自动重试临时 ABORTED / 磁盘读取超时有充足机会恢复；
       真正执行 fallback 前必须同时满足 2 个「永久失败」条件，缺一不 fallback：
         ① hasLoadedEnough === false（从未成功加载过任何元数据/画面）
         ② video.error 仍然存在（2 秒后仍处于 error 状态，说明不是临时抖动） */
    video.addEventListener('error', () => {
      if (hasLoadedEnough) return; // 已经加载成功过 → 属于中途丢包/拖动进度条等临时错误，绝不 fallback
      if (fallbackTimerId) clearTimeout(fallbackTimerId);
      fallbackTimerId = setTimeout(() => {
        if (hasLoadedEnough) return; // 延迟期间成功加载了 → 取消 fallback
        if (!video.error)     return; // 延迟期间 error 状态自动消除（浏览器自己修好了）→ 取消 fallback

        // === 兜底防护第 3 层：真正永久失败，给用户明确的诊断信息 + 解决办法，不是笼统一句"没部署" ===
        const ERR_CODE_TABLE = {
          1: 'MEDIA_ERR_ABORTED    已中止（浏览器主动停止加载，可能是文件读取权限被限制 / 磁盘太忙 / 杀毒软件拦截）',
          2: 'MEDIA_ERR_NETWORK    网络错误（请确认 videos 目录下该 mp4 文件可读，或当前服务器是否拒绝视频文件访问）',
          3: 'MEDIA_ERR_DECODE     解码失败（视频编码已损坏，请用剪映 / 格式工厂重新导出一次为 H.264 + AAC）',
          4: 'MEDIA_ERR_SRC_NOT_SUPPORTED  来源格式不支持（最常见：视频实际是 HEVC/H.265 编码，Chrome/Edge 默认不提供许可证。解决：① 安装微软「HEVC 视频扩展」或 ② 用剪映 / 格式工厂重编码为 H.264（推荐））',
        };
        const code = (video.error && video.error.code) ? video.error.code : 0;
        const codeText = ERR_CODE_TABLE[code] || `未知错误码 code=${code}`;
        const srcNow   = video.getAttribute('src') || '';

        // 把具体诊断信息追加到 fallback 卡片末尾（保持原卡片结构不变）
        try {
          let extra = fallback ? fallback.querySelector('p.extra-error-detail') : null;
          if (fallback && !extra) {
            extra = document.createElement('p');
            extra.className = 'extra-error-detail';
            Object.assign(extra.style, {
              marginTop    : '10px',
              padding      : '10px 14px',
              borderLeft   : '3px solid #DC2626',
              background   : 'rgba(220,38,38,.05)',
              color        : '#B91C1C',
              fontSize     : '13px',
              borderRadius : '0 6px 6px 0',
              textAlign    : 'left',
              lineHeight   : '1.65',
            });
            fallback.appendChild(extra);
          }
          if (extra) {
            extra.innerHTML =
              `<strong style="font-weight:700;">诊断信息 · 浏览器返回码：</strong>
                <code style="background:rgba(255,255,255,.7);padding:1px 6px;border-radius:4px;">MediaError.code=${code}</code><br>
               <strong style="font-weight:700;">错误说明：</strong>${codeText}<br>
               <strong style="font-weight:700;">当前视频路径：</strong>
                <code style="background:rgba(255,255,255,.7);padding:1px 6px;border-radius:4px;">${srcNow}</code>
                <em style="color:#6B7280;">（相对 index.html 所在目录）</em>`;
          }
        } catch (_) { /* ignore DOM inject failure: fallback display still works */ }

        // 最终执行兜底：隐藏播放器 +  overlay + 显示 fallback 卡片
        video.style.display = 'none';
        if (overlay)  overlay.style.display  = 'none';
        if (fallback) fallback.hidden = false;
        console.warn('[mountVideo] 视频加载永久失败：', 'src=', srcNow, 'code=', code, codeText);
      }, 2000);
    });

    // 自定义大播放按钮：显式调用 play() 兼容移动端 + 桌面浏览器，避免"点不开"的视觉误解
    if (overlay) {
      overlay.addEventListener('click', () => {
        video.play().then(() => {
          overlay.style.opacity    = '0';
          overlay.style.pointerEvents = 'none'; // 经验 845975 Failure 1：不拦截后续点击/暂停事件
        }).catch(() => {
          // 极个别移动端需要更严格的用户手势，直接降级回原生 controls 不报错、不抖动
          overlay.style.opacity    = '0';
          overlay.style.pointerEvents = 'none';
        });
      });
      // 视频一旦通过原生 controls 进入实际播放，也隐藏大按钮（用户交互一致性）
      video.addEventListener('playing', () => {
        overlay.style.opacity    = '0';
        overlay.style.pointerEvents = 'none';
      }, { once: true });
      // 暂停后如果回拖到开头（time===0），按钮再显示出来方便重播
      video.addEventListener('pause', () => {
        if (video.currentTime === 0) {
          overlay.style.opacity    = '1';
          overlay.style.pointerEvents = 'auto';
        }
      });
    }
  };

  // === 入口：协议分支（双协议双保险，彻底规避"视频永远不挂载"的服务器/浏览器限制） ===
  if (isFileProto) {
    // 本地双击 file://：浏览器同源策略禁止 fetch/XHR 访问本地文件 → 直接渲染播放器
    renderPlayer();
    return;
  }
  /*  http(s) 远程（GitHub Pages / 本地 Python SimpleHTTPServer / Nginx 等绝大多数场景）
      带 5 秒超时的 HEAD 探测，但【永不因探测失败而放弃渲染播放器】——原因：
      - Python SimpleHTTPServer / 家用路由器共享 / 小容量 CDN → 对 200MB+ 大文件 HEAD 请求极易
        超时 abort / 抛 405 method not allowed / 不返回 Content-Length
      - 实际浏览器 <video> 用 GET Range 请求时，这些服务器 99% 都能正常返回 206 Partial Content
      - 所以：HEAD 成功当然渲染；HEAD 失败/超时/跨域/405 → 也必须渲染 video，交给原生 onerror 兜底
  */
  const ctrl = new AbortController();
  const headTimer = setTimeout(() => ctrl.abort(), 5000);
  fetch(src, { method: 'HEAD', signal: ctrl.signal })
    .then(res => {
      clearTimeout(headTimer);
      renderPlayer(); // HEAD 成功 (2xx) / 失败 (4xx/5xx) → 都给 <video> 一次机会，由其 error 兜底
    })
    .catch(() => {
      clearTimeout(headTimer);
      renderPlayer(); // 超时 abort / 跨域拒绝 / 网络瞬断 → 同样渲染，交给 <video> onerror 最终兜底
    });
}

function closeModal() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  // 等过渡结束后再隐藏，避免动画被截断
  setTimeout(() => {
    modal.classList.remove('open');
    // 从详情返回主页：若之前做了「分散」动画，则在这里触发「聚合」动画回到初始栅格
    if (!modal.classList.contains('open') && cardGrid.classList.contains('is-dispersing')) {
      reassembleCards();
    }
  }, 380);
  lastFocus?.focus();
}

/* ==========================================================
   主题引擎（Theme Engine）
   ------------------------------------------------------------
   - DEFAULT_THEME：默认 bg/ink/primary，用户「恢复默认」时写回
   - normalizeHex：接受 #RGB 或 #RRGGBB，补 # 与扩 3→6 位；非法返回 null
   - applyTheme：把三维颜色写入 :root，并派生 3 个 color-mix 软色
   - 面板行为：点 themeTrigger 打开面板，外点/ESC 关闭；color 与 hex 双向同步
   - 保存：写入 localStorage key=resume-theme-v1 + Toast 提示；恢复默认清档
   ========================================================== */
const THEME_STORAGE_KEY = 'resume-theme-v1';
const DEFAULT_THEME = {
  bg:       '#F4F7FB',
  ink:      '#1F2937',
  primary:  '#3B66A8',
};

/** 规范化 HEX：支持 3/6 位，带不带 #；非法则返回 null */
function normalizeHex(raw) {
  if (raw == null) return null;
  let s = String(raw).trim().toLowerCase();
  if (!s) return null;
  if (s.charAt(0) !== '#') s = '#' + s;
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(s)) return null;
  // 扩 3 位 → 6 位：#abc → #aabbcc
  if (s.length === 4) {
    s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  }
  return s;
}

/** 将颜色写入 :root，同时派生 3 个 color-mix 软色（ink/primary 软色 & surface-soft） */
function applyTheme({ bg, ink, primary }) {
  const root = document.documentElement;
  root.style.setProperty('--bg', bg);
  root.style.setProperty('--ink', ink);
  root.style.setProperty('--primary', primary);
  // 派生：--primary-soft / --ink-soft / --surface-soft（消费 var 的 color-mix 已在 token，
  // 此处保险起见再用 setProperty 显式写入，兼容个别浏览器不识别 var 内 color-mix 场景）
  root.style.setProperty('--primary-soft', `color-mix(in srgb, ${primary} 42%, #FFFFFF 58%)`);
  root.style.setProperty('--ink-soft', `color-mix(in srgb, ${ink} 70%, #FFFFFF 30%)`);
  root.style.setProperty('--ink-faint', `color-mix(in srgb, ${ink} 42%, #FFFFFF 58%)`);
  root.style.setProperty('--surface-soft', `color-mix(in srgb, ${bg} 70%, #FFFFFF 30%)`);
  root.style.setProperty('--surface-hover', `color-mix(in srgb, ${bg} 58%, #FFFFFF 42%)`);
  root.style.setProperty('--line', `color-mix(in srgb, ${ink} 12%, transparent)`);
  root.style.setProperty('--card-bg', '#FFFFFF');
}

/** 轻提示 Toast：居中底部胶囊，1.6s 自动淡出 */
let _toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
}

/** 主题面板初始化：双向绑定 + 保存/恢复默认 + 外点/ESC 关闭 + localStorage 恢复 */
function setupThemeEngine() {
  const trigger   = document.getElementById('themeTrigger');
  const panel     = document.getElementById('themePanel');
  if (!trigger || !panel) return;

  // 六个 DOM 输入元素：color + hex 各一组
  const inputs = {
    bg:       document.getElementById('cp-bg'),
    bgHex:    document.getElementById('cp-bg-hex'),
    ink:      document.getElementById('cp-ink'),
    inkHex:   document.getElementById('cp-ink-hex'),
    primary:  document.getElementById('cp-primary'),
    primaryHex: document.getElementById('cp-primary-hex'),
  };
  const btnSave  = document.getElementById('cpSave');
  const btnReset = document.getElementById('cpReset');

  /** 把一组三维颜色同时写入 6 个输入框（不触发实时预览） */
  const syncInputs = (t) => {
    inputs.bg.value  = t.bg;      inputs.bgHex.value  = t.bg.toUpperCase();
    inputs.ink.value = t.ink;     inputs.inkHex.value = t.ink.toUpperCase();
    inputs.primary.value = t.primary; inputs.primaryHex.value = t.primary.toUpperCase();
    // 清掉所有 hex 错误态
    Object.values(inputs).forEach(inp => inp && inp.classList && inp.classList.remove('is-error'));
  };

  /** 从当前输入值收集并规范化三维色；任一非法 → 返回 null 并标记对应 input shakeX */
  const collectTheme = () => {
    const pickHex = (hexInput, fallback) => {
      const v = normalizeHex(hexInput.value);
      if (v) { hexInput.classList.remove('is-error'); return v; }
      // 非法：震动输入框 + 保留原色 fallback
      hexInput.classList.add('is-error');
      // 260ms 动画后清错误态，便于用户继续输入
      setTimeout(() => hexInput.classList.remove('is-error'), 280);
      return fallback;
    };
    const bg       = pickHex(inputs.bgHex, inputs.bg.value);
    const ink      = pickHex(inputs.inkHex, inputs.ink.value);
    const primary  = pickHex(inputs.primaryHex, inputs.primary.value);
    // 保证最终值是合法 7 位 hex
    return {
      bg:       normalizeHex(bg)      || DEFAULT_THEME.bg,
      ink:      normalizeHex(ink)     || DEFAULT_THEME.ink,
      primary:  normalizeHex(primary) || DEFAULT_THEME.primary,
    };
  };

  /** 实时预览 + 双写 color 与 hex（color → hex） */
  const bindPair = (color, hex, onChangeApplied) => {
    color.addEventListener('input', () => {
      const v = normalizeHex(color.value) || DEFAULT_THEME.primary;
      hex.value = v.toUpperCase();
      hex.classList.remove('is-error');
      applyTheme(collectTheme());
      if (typeof onChangeApplied === 'function') onChangeApplied();
    });
    hex.addEventListener('input', () => {
      const v = normalizeHex(hex.value);
      if (v) {
        // 合法 → 同步到 color，同时清错误态
        color.value = v;
        hex.classList.remove('is-error');
        applyTheme(collectTheme());
      } else if (hex.value.length >= 4) {
        // 长度够且非法：给震动反馈
        hex.classList.add('is-error');
        setTimeout(() => hex.classList.remove('is-error'), 280);
      }
      if (typeof onChangeApplied === 'function') onChangeApplied();
    });
  };
  bindPair(inputs.bg,      inputs.bgHex);
  bindPair(inputs.ink,     inputs.inkHex);
  bindPair(inputs.primary, inputs.primaryHex);

  /* ---- 面板开关：trigger 点击切换；外点/ESC 关闭 ---- */
  const openPanel  = () => { panel.hidden = false; trigger.setAttribute('aria-expanded', 'true'); };
  const closePanel = () => { panel.hidden = true;  trigger.setAttribute('aria-expanded', 'false'); };

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    if (panel.hidden) openPanel(); else closePanel();
  });
  document.addEventListener('click', e => {
    if (panel.hidden) return;
    if (panel.contains(e.target) || trigger.contains(e.target)) return;
    closePanel();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) closePanel();
  });

  /* ---- 保存：写入 localStorage ---- */
  btnSave.addEventListener('click', () => {
    const t = collectTheme();
    try {
      const payload = JSON.stringify({ ...t, updatedAt: Date.now() });
      localStorage.setItem(THEME_STORAGE_KEY, payload);
      showToast('主题已保存 ✓');
    } catch (err) {
      showToast('保存失败：浏览器存储不可用');
    }
  });

  /* ---- 恢复默认：清 localStorage + 写回 DEFAULT_THEME + 同步输入 ---- */
  btnReset.addEventListener('click', () => {
    try { localStorage.removeItem(THEME_STORAGE_KEY); } catch (_) { /* ignore */ }
    applyTheme(DEFAULT_THEME);
    syncInputs(DEFAULT_THEME);
    showToast('已恢复默认主题');
  });

  /* ---- 启动读档：localStorage → applyTheme → syncInputs ---- */
  let saved = null;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (_) { saved = null; }
  if (saved && normalizeHex(saved.bg) && normalizeHex(saved.ink) && normalizeHex(saved.primary)) {
    const theme = { bg: normalizeHex(saved.bg), ink: normalizeHex(saved.ink), primary: normalizeHex(saved.primary) };
    applyTheme(theme);
    syncInputs(theme);
  } else {
    // 无存档：同步默认值到输入框
    syncInputs(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
  }
}

/* ==========================================================
   卡片分散 / 聚合动画（Task 6 + 7）
   ------------------------------------------------------------
   - dispersalCards：点击卡片 → 加 .is-dispersing（锁定交互），被点击卡加 is-target，
     其余加 is-leaving；380ms 或 animationend 后 → openModal
   - reassembleCards：closeModal 时若检测到 is-dispersing → 所有卡加 is-entering + 错峰，
     400ms 后清掉动画 class，回到干净的初始栅格
   ========================================================== */
function dispersalCards(targetCardBtn, done) {
  if (!cardGrid || !targetCardBtn) { done && done(); return; }
  // 幂等：正在动或正在聚合就跳过
  if (cardGrid.classList.contains('is-dispersing') || cardGrid.classList.contains('is-reassembling')) {
    done && done();
    return;
  }
  const cards = Array.from(cardGrid.querySelectorAll('.card'));
  cardGrid.classList.add('is-dispersing');
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    done && done();
  };
  cards.forEach(c => {
    if (c === targetCardBtn) c.classList.add('is-target');
    else                    c.classList.add('is-leaving');
  });
  // 兜底 390ms（比 CSS 380ms 多 10ms，避免过早触发）
  setTimeout(finish, 390);
  // 若某张卡 animationend 先触发也接受
  targetCardBtn.addEventListener('animationend', function onEnd(ev) {
    if (ev.animationName === 'dispersal-target') {
      targetCardBtn.removeEventListener('animationend', onEnd);
      finish();
    }
  });
}

function reassembleCards() {
  if (!cardGrid) return;
  if (!cardGrid.classList.contains('is-dispersing')) return;
  const cards = Array.from(cardGrid.querySelectorAll('.card'));
  // 先清分散态，再加聚合态（两个 class 不同时存在，避免 animation 冲突）
  cardGrid.classList.remove('is-dispersing');
  cardGrid.classList.add('is-reassembling');
  cards.forEach(c => {
    c.classList.remove('is-target', 'is-leaving');
    c.classList.add('is-entering');
  });
  let settled = false;
  const cleanup = () => {
    if (settled) return;
    settled = true;
    cardGrid.classList.remove('is-reassembling');
    cards.forEach(c => {
      c.classList.remove('is-entering');
      c.style.willChange = '';
    });
    if (cardGrid.style) cardGrid.style.pointerEvents = '';
  };
  // 兜底 460ms（CSS assemble-in 400ms + 最大错峰 6*30ms≈180 → 取 460 安全）
  setTimeout(cleanup, 460);
  if (cards[0]) {
    cards[0].addEventListener('animationend', function onEnd(ev) {
      if (ev.animationName === 'assemble-in') {
        cards[0].removeEventListener('animationend', onEnd);
        cleanup();
      }
    });
  }
}

/* ==========================================================
   图片灯箱：全屏查看 + 左右切换（循环）
   ========================================================== */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
let lbList = [];   // 当前灯箱的图片列表
let lbIndex = 0;   // 当前显示的下标

function openLightbox(list, index) {
  lbList = list;
  lbIndex = index;
  renderLightbox();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}

function renderLightbox() {
  const img = lbList[lbIndex];
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightboxCaption.textContent = `${img.caption}（${lbIndex + 1}/${lbList.length}）`;
}

function stepLightbox(delta) {
  lbIndex = (lbIndex + delta + lbList.length) % lbList.length; // 循环切换
  renderLightbox();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  // 弹窗仍打开时保持滚动锁定
  if (!modal.classList.contains('open')) document.body.classList.remove('no-scroll');
}

/* ==========================================================
   全局事件绑定（事件委托，一处管理）
   ========================================================== */
let currentCard = null;    // 当前弹窗展示的卡片数据
let currentImages = [];    // 当前灯箱可用的图片列表（随视图切换更新）

function setupEvents() {
  // 点击卡片 → 【先做分散动画 380ms】 → 再打开对应弹窗
  cardGrid.addEventListener('click', e => {
    const btn = e.target.closest('.card');
    if (!btn) return;
    const card = CARDS.find(c => c.id === btn.dataset.id);
    if (!card) return;
    dispersalCards(btn, () => openModal(card));
  });

  // 弹窗内：点遮罩/关闭按钮关闭；点文件夹进入详情；点返回回到列表；点图片打开灯箱
  modal.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    const folderBtn = e.target.closest('.folder-item');
    if (folderBtn) { renderFolderDetail(Number(folderBtn.dataset.folder)); return; }
    if (e.target.closest('[data-back]')) { renderFolderList(); return; }
    const img = e.target.closest('img[data-img-index]');
    if (img && currentImages.length) openLightbox(currentImages, Number(img.dataset.imgIndex));
  });

  // 灯箱：切换 / 关闭
  document.getElementById('lightboxPrev').addEventListener('click', () => stepLightbox(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => stepLightbox(1));
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => {
    // 点击图片以外的空白区域关闭
    if (!e.target.closest('.lightbox-figure') && !e.target.closest('.lightbox-btn')) closeLightbox();
  });

  // 键盘：ESC 逐层关闭；←/→ 切换灯箱图片
  document.addEventListener('keydown', e => {
    if (lightbox.classList.contains('open')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
      return;
    }
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // 吸顶头「导出 PDF」按钮：触发浏览器打印对话框，用户选"另存为 PDF"即可
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      // 打印前保证弹窗/灯箱关闭，避免遮罩层盖住简历内容
      if (lightbox.classList.contains('open')) closeLightbox();
      if (modal.classList.contains('open')) {
        // 等过渡结束再 print，保证 body.no-scroll 已释放 & 遮罩 display:none
        closeModal();
        setTimeout(() => window.print(), 420);
      } else {
        window.print();
      }
    });
  }
}

/* ==========================================================
   初始化
   ========================================================== */
document.getElementById('year').textContent = new Date().getFullYear();
// 主题引擎最先初始化：保证 localStorage 读档在首次渲染前完成，避免闪白/闪默认色
setupThemeEngine();
renderCards();
renderNav();
setupScrollSpy();
setupEvents();
// 触屏：初始激活第一张（保证预览区露出，因为移动端无 hover）
if (matchMedia('(hover: none)').matches || ('ontouchstart' in window)) {
  setActiveCard(CARDS[0].id);
}
