# probe2.py — полный разбор символов FxPro по группам
import MetaTrader5 as mt5
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

FXPRO_PATH = r"C:\Program Files\FxPro Markets MT5\terminal64.exe"
if not mt5.initialize(path=FXPRO_PATH):
    print("INIT FAILED:", mt5.last_error()); raise SystemExit(1)

syms = mt5.symbols_get()
print(f"Всего: {len(syms)}\n")

# Группируем по верхнему уровню path (категория)
from collections import defaultdict
groups = defaultdict(list)
for s in syms:
    top = (s.path or "").split("\\")[0] or "?"
    groups[top].append(s.name)

print("=== КАТЕГОРИИ ===")
for cat in sorted(groups):
    print(f"  {cat}: {len(groups[cat])}")

# Покажем целиком крипту и металлы
def dump(cat_keywords, title):
    print(f"\n=== {title} ===")
    for cat in sorted(groups):
        if any(k.lower() in cat.lower() for k in cat_keywords):
            for n in sorted(groups[cat]):
                info = mt5.symbol_info(n)
                desc = info.description if info else ""
                print(f"  {n:16} {desc}")

dump(["crypto","cripto"], "КРИПТО")
dump(["metal","metals","spot metal"], "МЕТАЛЛЫ")

# Поиск золота/серебра/коинбейс по описанию
print("\n=== ПОИСК Gold/Silver/Coinbase по описанию ===")
for s in syms:
    info = mt5.symbol_info(s.name)
    d = (info.description if info else "").lower()
    if any(w in d for w in ["gold","silver","coinbase"]):
        print(f"  {s.name:16} {info.description}")

mt5.shutdown()
