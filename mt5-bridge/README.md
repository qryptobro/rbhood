# MT5 Bridge (FxPro)

Python-микросервис, который отдаёт OHLCV-свечи из терминала **FxPro MT5** в Node-бэкенд rbhood-ai.

## Зачем

Раньше данные брались из yahoo-finance2. Теперь — напрямую из FxPro MT5, поэтому цены **совпадают с FxPro-графиками** (Chart IMG `FXPRO:`), а крипто/акции/форекс берутся из одного источника.

## Требования

- **Windows** (пакет `MetaTrader5` работает только на Windows)
- Установленный терминал **FxPro Markets MT5** (`C:\Program Files\FxPro Markets MT5\terminal64.exe`)
- Терминал **запущен и залогинен** в счёт FxPro (хватает демо)
- Python 3.10+

## Установка

```bash
cd mt5-bridge
python -m pip install -r requirements.txt
```

## Запуск

1. Открой терминал FxPro MT5, залогинься.
2. Запусти мост:
```bash
python server.py
```
Слушает `http://127.0.0.1:5001`.

## API

- `GET /health` — статус подключения к терминалу
- `GET /candles?symbol=BTCUSDT&tf=5m&n=200` — свечи OHLCV

`symbol` — в формате rbhood (BTCUSDT, EURUSD, AAPL, XAUUSD…), маппинг в FxPro-символы внутри `server.py` (`SYMBOL_MAP`).
`tf` — `1m | 5m | 15m | 30m | 1h | 4h | 1d | 1w`.

## Маппинг символов FxPro

- Форекс — без изменений (EURUSD, GBPUSD…)
- Золото/серебро — `GOLD` / `SILVER`
- Крипта — полные имена: BTC→`BITCOIN`, ETH→`ETHEREUM`, BNB→`BINANCECOIN`, SOL→`SOLANA`, ADA→`CARDANO`, DOGE→`DOGECOIN`, AVAX→`AVALANCHE`, DOT→`POLKADOT`, LINK→`CHAINLINK`, XRP→`XRP`
- Акции — суффикс `.O`: AAPL→`AAPL.O`, COIN→`COIN.O`…

## Связь с Node-бэкендом

Node читает переменную `MT5_BRIDGE_URL` (по умолчанию `http://127.0.0.1:5001`).
Файл `backend/services/marketData.js` дёргает `/candles`.

## Утилиты

- `probe.py` / `probe2.py` — разведка доступных символов в терминале
- `fetchtest.py` — проверка получения свечей
