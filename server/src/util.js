export function httpErr(res, code, msg) {
  return res.status(code).json({ error: msg });
}
