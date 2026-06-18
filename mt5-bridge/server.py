# server.py — MT5 мост для rbhood-ai
# Отдаёт OHLCV-свечи из терминала FxPro MT5 по HTTP.
# Node-бэкенд дёргает GET /candles?symbol=BTCUSDT&tf=5m&n=200
import sys
# Принудительно UTF-8 для вывода, иначе print с кириллицей/«—» падает на Windows (cp1252)
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

import MetaTrader5 as mt5
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading

FXPRO_PATH = r"C:\Program Files\FxPro Markets MT5\terminal64.exe"
PORT = 5001

# rbhood символ -> FxPro MT5 символ
SYMBOL_MAP = {
    # Форекс + металлы
    "XAUUSD": "GOLD",   "XAGUSD": "SILVER",
    "EURUSD": "EURUSD", "GBPUSD": "GBPUSD",
    "USDJPY": "USDJPY", "AUDUSD": "AUDUSD",
    "USDCHF": "USDCHF", "NZDUSD": "NZDUSD",
    "USDCAD": "USDCAD", "AUDJPY": "AUDJPY",
    # Крипто (FxPro — полные имена)
    "BTCUSDT": "BITCOIN",     "ETHUSDT": "ETHEREUM",
    "BNBUSDT": "BINANCECOIN", "SOLUSDT": "SOLANA",
    "XRPUSDT": "XRP",         "ADAUSDT": "CARDANO",
    "DOGEUSDT": "DOGECOIN",   "AVAXUSDT": "AVALANCHE",
    "DOTUSDT": "POLKADOT",    "LINKUSDT": "CHAINLINK",
    # Акции (FxPro — суффикс .O)
    "AAPL": "AAPL.O", "TSLA": "TSLA.O", "NVDA": "NVDA.O",
    "MSFT": "MSFT.O", "AMZN": "AMZN.O", "GOOGL": "GOOGL.O",
    "META": "META.O", "AMD": "AMD.O",   "NFLX": "NFLX.O",
    "COIN": "COIN.O",
}

TF_MAP = {
    "1m": mt5.TIMEFRAME_M1,  "5m": mt5.TIMEFRAME_M5,
    "15m": mt5.TIMEFRAME_M15, "30m": mt5.TIMEFRAME_M30,
    "1h": mt5.TIMEFRAME_H1,  "4h": mt5.TIMEFRAME_H4,
    "1d": mt5.TIMEFRAME_D1,  "1w": mt5.TIMEFRAME_W1,
}

app = Flask(__name__)
CORS(app)
_lock = threading.Lock()  # MT5 API не потокобезопасен


def ensure_mt5():
    """Гарантирует живое подключение к терминалу."""
    if mt5.terminal_info() is None:
        # Сначала подключаемся к УЖЕ открытому терминалу (без пути — не виснет).
        if not mt5.initialize():
            # Запасной вариант — запустить терминал по пути (если он закрыт).
            if not mt5.initialize(path=FXPRO_PATH):
                return False, mt5.last_error()
    return True, None


@app.get("/health")
def health():
    with _lock:
        ok, err = ensure_mt5()
        acc = mt5.account_info() if ok else None
        return jsonify({
            "ok": ok,
            "error": err,
            "account": acc.login if acc else None,
            "server": acc.server if acc else None,
            "company": acc.company if acc else None,
        })


@app.get("/candles")
def candles():
    symbol = (request.args.get("symbol") or "").upper()
    tf = request.args.get("tf", "1h")
    n = int(request.args.get("n", 200))

    fx_symbol = SYMBOL_MAP.get(symbol, symbol)
    mt5_tf = TF_MAP.get(tf)
    if mt5_tf is None:
        return jsonify({"error": f"Unknown timeframe: {tf}"}), 400

    with _lock:
        ok, err = ensure_mt5()
        if not ok:
            return jsonify({"error": f"MT5 init failed: {err}"}), 503

        if not mt5.symbol_select(fx_symbol, True):
            return jsonify({"error": f"symbol_select failed for {fx_symbol}: {mt5.last_error()}"}), 404

        rates = mt5.copy_rates_from_pos(fx_symbol, mt5_tf, 0, n)
        if rates is None or len(rates) == 0:
            return jsonify({"error": f"No data for {fx_symbol}: {mt5.last_error()}"}), 404

        out = [{
            "time": int(r["time"]) * 1000,  # ms для JS
            "open": float(r["open"]),
            "high": float(r["high"]),
            "low": float(r["low"]),
            "close": float(r["close"]),
            "volume": float(r["tick_volume"]),
        } for r in rates]

    return jsonify({
        "symbol": symbol,
        "fxpro_symbol": fx_symbol,
        "tf": tf,
        "count": len(out),
        "candles": out,
    })


if __name__ == "__main__":
    ok, err = ensure_mt5()
    if ok:
        acc = mt5.account_info()
        print(f"MT5 connected: {acc.login} @ {acc.server} ({acc.company})")
    else:
        print(f"MT5 init WARNING: {err} - терминал FxPro должен быть запущен и залогинен")
    print(f"MT5 bridge listening on http://127.0.0.1:{PORT}")
    app.run(host="127.0.0.1", port=PORT, threaded=True)
