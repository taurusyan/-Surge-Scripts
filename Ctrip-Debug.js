/*
 * Ctrip API Debugger for Surge
 * 只记录接口结构，不记录 Cookie / Token / 请求正文
 */

try {
  const url = new URL($request.url);
  const host = url.hostname;
  const path = url.pathname;
  const method = $request.method || "UNKNOWN";

  // 排除明显的埋点/静态资源，减少日志噪音
  const ignore =
    path.includes("/bee/collect") ||
    /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)$/i.test(path);

  if (!ignore) {
    console.log(
      "[CTRIP-DEBUG] " +
      method + " " +
      host +
      path
    );

    $notification.post(
      "🔍 携程接口",
      method + " · " + host,
      path
    );
  }
} catch (e) {
  console.log("[CTRIP-DEBUG ERROR] " + String(e));
}

$done({});
