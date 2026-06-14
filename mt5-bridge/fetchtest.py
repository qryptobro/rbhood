# fetchtest.py — проверка получения свечей по одному символу каждого типа
import MetaTrader5 as mt5
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

FXPRO_PATH = r"C:\Program Files\FxPro Markets MT5\terminal64.exe"
if not mt5.initialize(path=FXPRO_PATH):
    print("INIT FAILED:", mt5.last_error()); raise SystemExit(1)

tests = [
    ("EURUSD",   mt5.TIMEFRAME_M5),   # форекс
    ("GOLD",     mt5.TIMEFRAME_M5),   # металл
    ("BITCOIN",  mt5.TIMEFRAME_M5),   # крипта
    ("AAPL.O",   mt5.TIMEFRAME_H1),   # акция
    ("COIN.O",   mt5.TIMEFRAME_H1),   # coinbase
]

for name, tf in tests:
    # убедимся что символ в обзоре рынка
    if not mt5.symbol_select(name, True):
        print(f"{name:10} symbol_select FAILED: {mt5.last_error()}")
        continue
    rates = mt5.copy_rates_from_pos(name, tf, 0, 200)
    if rates is None or len(rates) == 0:
        print(f"{name:10} НЕТ ДАННЫХ: {mt5.last_error()}")
        continue
    last = rates[-1]
    print(f"{name:10} OK | свечей: {len(rates)} | last close: {last['close']} | vol(tick): {last['tick_volume']}")

mt5.shutdown()
