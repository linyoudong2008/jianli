/* ==========================================================
 * 运行时安全配置加载层
 * ----------------------------------------------------------
 * 【设计目的】
 * 纯静态站点不支持 .env（浏览器无法直接读取服务器本地 dotenv 文件）。
 * 因此采用「config.json 本地私有文件」方案：
 *   1) 所有未来可能出现的 API Key / Token / 私密 URL 等敏感字段，
 *      一律写入项目根下的 js/config.json（不入库、不走 Git，
 *      已在 .gitignore 中明确排除）。
 *   2) 本仓库仅公开 js/config.example.json（占位模板），其他协作者
 *      复制一份为 config.json 并填入真实值即可运行。
 *   3) 若 config.json 不存在 / 加载失败（例如用户刚 clone 仓库后），
 *      window.APP_CONFIG 降级为空对象 {}，简历主体功能不受影响
 *      （当前版本无实际 API 调用，故降级后全功能可用）。
 *
 * 【写入规则（强制）】
 * - 禁止在 main.js / index.html / style.css 以及任何入库的 .js/.html/.css
 *   文件中以明文 / 变量硬编码出现以下字段：API Key / Token / Secret /
 *   Password / Access Key / Private Key / 私有服务鉴权地址。
 * - 任何需要运行时访问的敏感值，一律通过 window.APP_CONFIG.xxx 读取，
 *   且对应的默认值必须是 ""（空字符串），不得填入真实值作为兜底。
 *
 * 【暴露对象】window.APP_CONFIG = { ...合并自 config.json 的字段, 无则 {} }
 * ========================================================== */
(function () {
  'use strict';
  // 默认空对象，任何密钥默认值绝对不能写真实内容
  var defaultConfig = Object.freeze({
    // 预留下方占位字段，仅在本地 js/config.json 中按需填入真实值
    // 当前版本无任何外部 API 依赖，全部保留空即可
    EXAMPLE_API_KEY: '',
    EXAMPLE_API_ENDPOINT: '',
    EXAMPLE_PRIVATE_SERVICE_TOKEN: '',
  });

  // 先赋默认值（保证 main.js 读取 window.APP_CONFIG 永不为 undefined）
  window.APP_CONFIG = Object.assign({}, defaultConfig);

  // 尝试从 js/config.json（私有、本地、不入库）读取真实值并合并
  // 注意：不使用 fetch 的缓存参数 cache:'no-store'，避免私有 config 被
  // Service Worker / 浏览器磁盘缓存泄露
  try {
    var req = new XMLHttpRequest();
    // 用同步请求有卡顿风险？——config.json 体积极小（≤ 1KB），
    // 且此脚本在 main.js 之前加载，放在 <head> 末尾同步执行，
    // 加载成功后 main.js 立即可以拿到合并后的值；失败 404 则降级为空，
    // 不影响简历主流程渲染（简历所有数据在 CARDS 数组内，无外部调用）。
    req.open('GET', 'js/config.json', true);
    req.overrideMimeType && req.overrideMimeType('application/json');
    req.onload = function () {
      if (req.status >= 200 && req.status < 300) {
        try {
          var userConfig = JSON.parse(req.responseText || '{}');
          // 只合并预定义在 defaultConfig 中的字段，防止 config.json
          // 注入未知字段。这同时起到白名单过滤作用，降低误泄露风险。
          var safeKeys = Object.keys(defaultConfig);
          safeKeys.forEach(function (key) {
            if (typeof userConfig[key] !== 'undefined' && userConfig[key] !== null) {
              window.APP_CONFIG[key] = userConfig[key];
            }
          });
          // 标记：已合并来自本地私有配置文件的值
          window.APP_CONFIG.__LOADED__ = true;
          Object.freeze && Object.freeze(window.APP_CONFIG);
        } catch (parseErr) {
          // config.json JSON 解析失败，打印警告但不中断主渲染
          console && console.warn && console.warn(
            '[config.js] js/config.json 存在，但 JSON 解析失败。已跳过加载，简历仍可正常运行。'
          );
        }
      }
      // 其他状态（404 等）说明用户没有放置 config.json → 维持 defaultConfig
      // 属于正常分支，不打印任何错误，避免干扰控制台。
    };
    req.onerror = function () {
      // 网络级错误（跨域 / file:// 直打开等）——静默降级，符合预期
    };
    req.send();
  } catch (outerErr) {
    // 极端环境（不支持 XHR、Strict 模式意外）——维持默认值，静默降级
  }
})();
