# probe.py — проверка подключения к MT5 и поиск нужных символов
import MetaTrader5 as mt5

FXPRO_PATH = r"C:\Program Files\FxPro Markets MT5\terminal64.exe"

if not mt5.initialize(path=FXPRO_PATH):
    print("INIT FAILED:", mt5.last_error())
    print(">> Открой MT5-терминал и залогинься в счёт, потом запусти снова.")
    raise SystemExit(1)

acc = mt5.account_info()
term = mt5.terminal_info()
print("=== ПОДКЛЮЧЕНО ===")
if acc:
    print(f"Счёт: {acc.login} | Сервер: {acc.server} | Брокер: {acc.company} | Баланс: {acc.balance} {acc.currency}")
print(f"Терминал: {term.name if term else '?'} | путь: {term.path if term else '?'}")

all_syms = mt5.symbols_get()
print(f"\nВсего символов в терминале: {len(all_syms)}")

# Что нам нужно по группам
need = {
    "FOREX/METALS": ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCHF","NZDUSD","USDCAD","AUDJPY","XAUUSD","XAGUSD"],
    "CRYPTO":       ["BTCUSD","ETHUSD","BNBUSD","SOLUSD","XRPUSD","ADAUSD","DOGEUSD","AVAXUSD","DOTUSD","LINKUSD"],
    "STOCKS":       ["AAPL","TSLA","NVDA","MSFT","AMZN","GOOGL","META","NFLX","AMD","COIN"],
}

# Соберём имена всех символов в нижнем регистре без спецсимволов для нечёткого поиска
names = [s.name for s in all_syms]
def find(token):
    t = token.upper()
    exact = [n for n in names if n.upper() == t]
    if exact: return exact
    # частичное совпадение (брокеры добавляют суффиксы: #AAPL, AAPL.NAS, EURUSD.m и т.п.)
    return [n for n in names if t in n.upper()]

for group, tokens in need.items():
    print(f"\n--- {group} ---")
    for tok in tokens:
        matches = find(tok)
        if matches:
            print(f"  {tok:8} -> {', '.join(matches[:5])}")
        else:
            print(f"  {tok:8} -> НЕ НАЙДЕН")

mt5.shutdown()
