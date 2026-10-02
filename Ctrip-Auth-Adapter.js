/*
 * 携程旅行 Surge 授权捕获适配
 * 自动从携程 JSON 响应中寻找 ticket + uid
 */

function findAuth(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 12) return null;

  if (
    typeof obj.ticket === "string" &&
    obj.ticket &&
    obj.uid !== undefined &&
    obj.uid !== null
  ) {
    return {
      ticket: obj.ticket,
      uid: String(obj.uid)
    };
  }

  let ticket = null;
  let uid = null;

  for (const [k, v] of Object.entries(obj)) {
    const key = k.toLowerCase();

    if (
      !ticket &&
      (key === "ticket" ||
       key === "auth" ||
       key === "authticket") &&
      typeof v === "string" &&
      v.length > 8
    ) {
      ticket = v;
    }

    if (
      !uid &&
      (key === "uid" ||
       key === "userid" ||
       key === "user_id") &&
      (typeof v === "string" || typeof v === "number")
    ) {
      uid = String(v);
    }
  }

  if (ticket && uid) {
    return { ticket, uid };
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const result = findAuth(value, depth + 1);
      if (result) return result;
    }
  }

  return null;
}

try {
  const body = $response && $response.body
    ? $response.body
    : "";

  let json = null;

  try {
    json = JSON.parse(body);
  } catch (_) {}

  if (json) {
    const found = findAuth(json);

    if (found) {
      const key = "CTRIP_DAILY_BONUS";

      let data = {};

      try {
        data = JSON.parse(
          $persistentStore.read(key) || "{}"
        );
      } catch (_) {}

      data.account = data.account || {};

      const existed = !!data.account[found.uid];

      data.account[found.uid] = {
        auth: found.ticket
      };

      const success = $persistentStore.write(
        JSON.stringify(data),
        key
      );

      if (success) {
        $notification.post(
          "携程旅行",
          existed ? "授权已更新" : "授权获取成功",
          "账号：" +
            found.uid.slice(-6) +
            "\n现在可以测试签到。"
        );
      } else {
        $notification.post(
          "携程旅行",
          "授权保存失败",
          "无法写入 Surge 存储。"
        );
      }
    }
  }
} catch (e) {
  console.log(
    "[Ctrip Auth] " + String(e)
  );
}

$done({});
